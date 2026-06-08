import json
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime
from groq import Groq
from app.core.database import get_database
from app.core.config import settings
from app.api.deps import get_current_user

router = APIRouter(prefix="/ai", tags=["AI"])


def get_groq_client():
    return Groq(api_key=settings.GROQ_API_KEY)


async def call_llama(messages: list) -> str:
    """
    Send messages to Llama 3.1 via Groq and get response.
    messages = list of {role, content} dicts
    """
    client = get_groq_client()

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages,
        temperature=0.7,
        max_tokens=2000,
    )

    return response.choices[0].message.content


class CoachMessage(BaseModel):
    message: str


@router.post("/generate-plan")
async def generate_workout_plan(
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    if not current_user.get("is_onboarded"):
        raise HTTPException(status_code=400, detail="Complete onboarding first")

    profile = current_user.get("profile")

    messages = [
        {
            "role": "system",
            "content": "You are an expert fitness coach. You only respond with valid JSON. No explanation. No markdown. Just raw JSON."
        },
        {
            "role": "user",
            "content": f"""Generate a {profile['training_days_per_week']}-day workout plan for this user:

Goal: {profile['goal']}
Experience: {profile['experience_level']}
Equipment: {profile['equipment']}
Age: {profile['age']}
Gender: {profile['gender']}

Return ONLY this JSON format:
{{
  "plan_name": "Push Pull Legs",
  "workout_days": [
    {{
      "day_name": "Push Day",
      "day_number": 1,
      "exercises": [
        {{
          "name": "Bench Press",
          "muscle_group": "chest",
          "sets": 4,
          "reps": "6-8",
          "weight_kg": 60,
          "rest_seconds": 90,
          "notes": "Keep elbows at 45 degrees"
        }}
      ]
    }}
  ]
}}"""
        }
    ]

    raw = await call_llama(messages)

    try:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        plan_data = json.loads(raw[start:end])
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="AI returned invalid response. Try again."
        )

    # Deactivate old plans
    await db["workout_plans"].update_many(
        {"user_id": str(current_user["_id"])},
        {"$set": {"is_active": False}}
    )

    # Save new plan
    plan_doc = {
        "user_id": str(current_user["_id"]),
        "plan_name": plan_data["plan_name"],
        "days_per_week": profile["training_days_per_week"],
        "workout_days": plan_data["workout_days"],
        "is_active": True,
        "created_at": datetime.utcnow(),
    }

    result = await db["workout_plans"].insert_one(plan_doc)

    return {
        "message": "Workout plan generated",
        "plan_id": str(result.inserted_id),
        "plan": plan_data,
    }


@router.post("/coach")
async def ask_coach(
    data: CoachMessage,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    from app.services.context import build_user_context, format_context_for_ai

    # Build complete user context — everything the AI needs
    context = await build_user_context(str(current_user["_id"]), db)
    context_str = format_context_for_ai(context)

    messages = [
        {
            "role": "system",
            "content": f"""You are NEFF, a personal AI fitness coach.
You have complete knowledge about this user. Use it to give specific personalized advice.

{context_str}

Rules:
- Always reference the user's actual data in your answer
- If recovery is poor recommend reducing intensity
- If there is a plateau suggest specific solutions
- If streak is high acknowledge and motivate
- Keep answers under 5 sentences
- Be direct motivating and specific"""
        },
        {
            "role": "user",
            "content": data.message
        }
    ]

    reply = await call_llama(messages)
    return {"reply": reply.strip()}