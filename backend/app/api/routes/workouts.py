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