from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta
from app.core.database import get_database
from app.api.deps import get_current_user
from app.services.context import build_user_context, format_context_for_ai
from app.api.routes.ai import call_llama

router = APIRouter(prefix="/review", tags=["Weekly Review"])


@router.get("/weekly")
async def get_weekly_review(
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """
    Generate a weekly AI review of the user's performance.
    Covers workouts, recovery, consistency and next week's focus.
    """

    user_id = str(current_user["_id"])

    # Get full user context
    context = await build_user_context(user_id, db)
    context_str = format_context_for_ai(context)

    # Get this week's detailed workout logs
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    cursor = db["workout_logs"].find({
        "user_id": user_id,
        "logged_at": {"$gte": seven_days_ago}
    }).sort("logged_at", -1)

    workout_details = []
    async for log in cursor:
        total_sets = sum(
            len(ex.get("sets", []))
            for ex in log.get("exercises", [])
        )
        workout_details.append(
            f"{log['workout_day_name']} — "
            f"{len(log.get('exercises', []))} exercises, "
            f"{total_sets} sets"
        )

    workouts_str = "\n".join(workout_details) if workout_details else "No workouts logged"

    # Get recovery summary
    recovery_cursor = db["recovery_logs"].find({
        "user_id": user_id,
        "logged_at": {"$gte": seven_days_ago}
    })

    recovery_scores = []
    async for log in recovery_cursor:
        recovery_scores.append(log["recovery_score"])

    avg_recovery = round(
        sum(recovery_scores) / len(recovery_scores)
    ) if recovery_scores else None

    messages = [
        {
            "role": "system",
            "content": """You are NEFF, a personal AI fitness coach.
Generate a weekly performance review. Be specific, honest and motivating.
Structure your response in exactly 4 parts:

1. WEEK SUMMARY — What happened this week in 2 sentences
2. WINS — What went well (be specific with numbers)
3. AREAS TO IMPROVE — What needs work next week
4. NEXT WEEK FOCUS — 3 specific actionable goals for next week

Keep the entire response under 200 words. Be direct and personal."""
        },
        {
            "role": "user",
            "content": f"""Generate my weekly review.

My Data:
{context_str}

This Week's Workouts:
{workouts_str}

Average Recovery Score: {avg_recovery or 'Not logged'}/100

Planned workouts per week: {context['planned_days_per_week']}
Completed workouts: {context['workouts_this_week']}"""
        }
    ]

    review = await call_llama(messages)

    # Save review to database
    review_doc = {
        "user_id": user_id,
        "review": review,
        "week_start": seven_days_ago.strftime("%d %b %Y"),
        "week_end": datetime.utcnow().strftime("%d %b %Y"),
        "workouts_completed": context['workouts_this_week'],
        "avg_recovery": avg_recovery,
        "generated_at": datetime.utcnow(),
    }

    await db["weekly_reviews"].insert_one(review_doc)

    return {
        "review": review,
        "week_start": review_doc["week_start"],
        "week_end": review_doc["week_end"],
        "workouts_completed": context['workouts_this_week'],
        "planned_workouts": context['planned_days_per_week'],
        "avg_recovery": avg_recovery,
    }


@router.get("/history")
async def get_review_history(
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Get past weekly reviews."""
    cursor = db["weekly_reviews"].find(
        {"user_id": str(current_user["_id"])}
    ).sort("generated_at", -1).limit(4)

    reviews = []
    async for review in cursor:
        reviews.append({
            "review": review["review"],
            "week_start": review["week_start"],
            "week_end": review["week_end"],
            "workouts_completed": review.get("workouts_completed", 0),
            "avg_recovery": review.get("avg_recovery"),
            "generated_at": review["generated_at"].strftime("%d %b %Y"),
        })

    return {"reviews": reviews}