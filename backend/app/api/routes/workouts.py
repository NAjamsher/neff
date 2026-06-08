from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_database
from app.api.deps import get_current_user
from app.models.workout import WorkoutLogRequest
from datetime import datetime, timedelta

router = APIRouter(prefix="/workouts", tags=["Workouts"])


@router.get("/plan")
async def get_active_plan(
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    plan = await db["workout_plans"].find_one(
        {"user_id": str(current_user["_id"]), "is_active": True}
    )
    if not plan:
        raise HTTPException(status_code=404, detail="No active workout plan found")

    plan["id"] = str(plan["_id"])
    del plan["_id"]
    return plan


@router.post("/log")
async def log_workout(
    data: WorkoutLogRequest,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    log = {
        "user_id": str(current_user["_id"]),
        "workout_day_name": data.workout_day_name,
        "exercises": [e.model_dump() for e in data.exercises],
        "duration_minutes": data.duration_minutes,
        "notes": data.notes,
        "logged_at": datetime.utcnow(),
    }

    result = await db["workout_logs"].insert_one(log)

    return {
        "message": "Workout logged successfully",
        "log_id": str(result.inserted_id),
    }


@router.get("/logs")
async def get_workout_logs(
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    cursor = db["workout_logs"].find(
        {"user_id": str(current_user["_id"])}
    ).sort("logged_at", -1).limit(10)

    logs = []
    async for log in cursor:
        log["id"] = str(log["_id"])
        del log["_id"]
        logs.append(log)

    return {"logs": logs, "count": len(logs)}


@router.get("/stats")
async def get_stats(
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    user_id = str(current_user["_id"])
    total = await db["workout_logs"].count_documents({"user_id": user_id})
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    weekly = await db["workout_logs"].count_documents({
        "user_id": user_id,
        "logged_at": {"$gte": seven_days_ago}
    })

    return {
        "total_workouts": total,
        "workouts_this_week": weekly,
    }


@router.get("/streak")
async def get_streak(
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """
    Calculate current workout streak.
    A streak is consecutive days with at least one workout logged.
    """
    user_id = str(current_user["_id"])

    cursor = db["workout_logs"].find(
        {"user_id": user_id}
    ).sort("logged_at", -1)

    logs = []
    async for log in cursor:
        logs.append(log["logged_at"].date())

    if not logs:
        return {"current_streak": 0, "longest_streak": 0}

    # Remove duplicate dates
    unique_dates = sorted(set(logs), reverse=True)

    # Calculate current streak
    current_streak = 1
    for i in range(1, len(unique_dates)):
        diff = (unique_dates[i-1] - unique_dates[i]).days
        if diff == 1:
            current_streak += 1
        else:
            break

    # Calculate longest streak ever
    longest_streak = 1
    temp = 1
    for i in range(1, len(unique_dates)):
        diff = (unique_dates[i-1] - unique_dates[i]).days
        if diff == 1:
            temp += 1
            longest_streak = max(longest_streak, temp)
        else:
            temp = 1

    return {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "total_workout_days": len(unique_dates),
    }