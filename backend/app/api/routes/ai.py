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
    Send messages to Llama 3.3 via Groq and get response.
    messages = list of {role, content} dicts
    """
    client = get_groq_client()

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
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
    from app.services.rag import search_knowledge_base, is_knowledge_base_loaded

    # Build complete user context
    context = await build_user_context(str(current_user["_id"]), db)
    context_str = format_context_for_ai(context)

    # Search knowledge base for relevant fitness research
    # This is the RAG part — retrieve relevant documents
    knowledge_context = ""
    if is_knowledge_base_loaded():
        relevant_docs = search_knowledge_base(data.message, top_k=3)
        if relevant_docs:
            knowledge_context = f"""
Relevant fitness research and science:
{relevant_docs}
"""

    messages = [
        {
            "role": "system",
            "content": f"""You are NEFF, a personal AI fitness coach backed by fitness science.
You have access to the user's complete data AND relevant fitness research.

USER DATA:
{context_str}

{knowledge_context}

Rules:
- Use the fitness research to give science-backed answers
- Always relate advice to the user's actual data
- If recovery is poor recommend reducing intensity
- If there is a plateau suggest specific solutions
- Reference the research naturally — don't just quote it
- Keep answers under 6 sentences
- Be direct, motivating and specific"""
        },
        {
            "role": "user",
            "content": data.message
        }
    ]

    reply = await call_llama(messages)
    return {"reply": reply.strip()}
@router.get("/pre-workout-briefing/{workout_day_name}")
async def get_pre_workout_briefing(
    workout_day_name: str,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """
    Generate a personalized pre-workout briefing.
    Reads recovery, last session performance, and goals.
    """
    from app.services.context import build_user_context, format_context_for_ai

    user_id = str(current_user["_id"])

    # Get full user context
    context = await build_user_context(user_id, db)

    # Get last time user did this exact workout day
    last_session = await db["workout_logs"].find_one(
        {
            "user_id": user_id,
            "workout_day_name": workout_day_name
        },
        sort=[("logged_at", -1)]
    )

    # Build last session summary
    last_session_str = "No previous session found for this workout."
    if last_session:
        exercise_summaries = []
        for ex in last_session.get("exercises", []):
            sets = ex.get("sets", [])
            if sets:
                best_weight = max(s["weight_kg"] for s in sets)
                best_reps = max(s["reps_completed"] for s in sets)
                exercise_summaries.append(
                    f"{ex['exercise_name']}: {best_weight}kg × {best_reps} reps"
                )
        if exercise_summaries:
            from datetime import datetime
            days_ago = (datetime.utcnow() - last_session["logged_at"]).days
            last_session_str = (
                f"Last {workout_day_name} was {days_ago} days ago.\n"
                f"Performance: {', '.join(exercise_summaries)}"
            )

    # Get today's recovery
    recovery_str = "Recovery not logged today."
    if context.get("today_recovery"):
        r = context["today_recovery"]
        recovery_str = (
            f"Recovery score: {r['score']}/100 ({r['status']}) — "
            f"Sleep: {r['sleep']}hrs, "
            f"Energy: {r['energy']}/10, "
            f"Soreness: {r['soreness']}/10"
        )

    messages = [
        {
            "role": "system",
            "content": """You are NEFF, a personal AI fitness coach giving a pre-workout briefing.
Be direct, specific, and motivating. Like a coach talking to an athlete before they train.
Keep it under 5 sentences total. No bullet points. Just talk to them naturally."""
        },
        {
            "role": "user",
            "content": f"""Give me a pre-workout briefing for {workout_day_name}.

My data:
- Goal: {context['goal']}
- Current streak: {context['current_streak']} days
- {recovery_str}
- {last_session_str}
- Plateaus detected: {', '.join(context['plateau_exercises']) if context['has_plateaus'] else 'None'}

Tell me:
1. How hard I should train today based on recovery
2. What to aim for based on last session
3. One specific focus point for this session"""
        }
    ]

    briefing = await call_llama(messages)

    return {
        "workout_day_name": workout_day_name,
        "briefing": briefing.strip(),
        "recovery_score": context.get("today_recovery", {}).get("score") if context.get("today_recovery") else None,
        "recovery_status": context.get("today_recovery", {}).get("status") if context.get("today_recovery") else None,
        "current_streak": context["current_streak"],
    }