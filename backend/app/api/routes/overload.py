from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_database
from app.api.deps import get_current_user
from app.services.overload import analyze_workout

router = APIRouter(prefix="/overload", tags=["Progressive Overload"])


@router.get("/analyze/{log_id}")
async def analyze_last_workout(
    log_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """
    Analyze a workout log and return progressive overload recommendations.
    Tells user exactly what weight to use next session.
    """
    from bson import ObjectId

    # Get the workout log
    log = await db["workout_logs"].find_one({
        "_id": ObjectId(log_id),
        "user_id": str(current_user["_id"])
    })

    if not log:
        raise HTTPException(status_code=404, detail="Workout log not found")

    # Get the active workout plan
    plan = await db["workout_plans"].find_one({
        "user_id": str(current_user["_id"]),
        "is_active": True
    })

    if not plan:
        raise HTTPException(status_code=404, detail="No active plan found")

    # Find matching workout day from plan
    plan_day = None
    for day in plan.get("workout_days", []):
        if day["day_name"] == log["workout_day_name"]:
            plan_day = day
            break

    if not plan_day:
        raise HTTPException(status_code=404, detail="Workout day not found in plan")

    # Run the analysis
    analysis = analyze_workout(log, plan_day)

    return analysis


@router.get("/latest")
async def analyze_latest_workout(
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """
    Automatically analyze the most recent workout.
    No need to provide a log ID.
    """
    # Get most recent workout log
    log = await db["workout_logs"].find_one(
        {"user_id": str(current_user["_id"])},
        sort=[("logged_at", -1)]
    )

    if not log:
        raise HTTPException(
            status_code=404,
            detail="No workouts logged yet. Complete a workout first."
        )

    # Get active plan
    plan = await db["workout_plans"].find_one({
        "user_id": str(current_user["_id"]),
        "is_active": True
    })

    if not plan:
        raise HTTPException(status_code=404, detail="No active plan found")

    # Find matching day
    plan_day = None
    for day in plan.get("workout_days", []):
        if day["day_name"] == log["workout_day_name"]:
            plan_day = day
            break

    if not plan_day:
        plan_day = plan["workout_days"][0]

    analysis = analyze_workout(log, plan_day)

    return analysis