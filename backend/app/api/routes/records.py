from fastapi import APIRouter, Depends
from app.core.database import get_database
from app.api.deps import get_current_user

router = APIRouter(prefix="/records", tags=["Personal Records"])


@router.get("/")
async def get_personal_records(
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """
    Find the heaviest weight ever lifted for each exercise.
    This is the user's personal record (PR) for each movement.
    """
    user_id = str(current_user["_id"])

    cursor = db["workout_logs"].find({"user_id": user_id})

    # Build PR dictionary
    records = {}

    async for log in cursor:
        for exercise in log.get("exercises", []):
            ex_name = exercise["exercise_name"]
            sets = exercise.get("sets", [])

            if not sets:
                continue

            max_weight = max(s["weight_kg"] for s in sets)
            max_reps = max(s["reps_completed"] for s in sets)
            date = log["logged_at"].strftime("%d %b %Y")

            if ex_name not in records:
                records[ex_name] = {
                    "exercise": ex_name,
                    "best_weight_kg": max_weight,
                    "best_reps": max_reps,
                    "achieved_on": date,
                }
            else:
                if max_weight > records[ex_name]["best_weight_kg"]:
                    records[ex_name]["best_weight_kg"] = max_weight
                    records[ex_name]["best_reps"] = max_reps
                    records[ex_name]["achieved_on"] = date

    # Sort by best weight descending
    sorted_records = sorted(
        records.values(),
        key=lambda x: x["best_weight_kg"],
        reverse=True
    )

    return {
        "records": sorted_records,
        "total_exercises_tracked": len(sorted_records),
    }


@router.get("/summary")
async def get_records_summary(
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """
    Returns top 5 personal records for dashboard display.
    """
    user_id = str(current_user["_id"])
    cursor = db["workout_logs"].find({"user_id": user_id})

    records = {}
    async for log in cursor:
        for exercise in log.get("exercises", []):
            ex_name = exercise["exercise_name"]
            sets = exercise.get("sets", [])
            if not sets:
                continue
            max_weight = max(s["weight_kg"] for s in sets)
            if ex_name not in records or max_weight > records[ex_name]:
                records[ex_name] = max_weight

    top5 = sorted(records.items(), key=lambda x: x[1], reverse=True)[:5]

    return {
        "top_records": [
            {"exercise": name, "best_weight_kg": weight}
            for name, weight in top5
        ]
    }