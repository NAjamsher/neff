from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime, timedelta
from app.core.database import get_database
from app.api.deps import get_current_user

router = APIRouter(prefix="/recovery", tags=["Recovery"])


class RecoveryLog(BaseModel):
    sleep_hours: float
    soreness_level: int   # 1-10
    energy_level: int     # 1-10
    stress_level: int     # 1-10
    notes: str = ""


def calculate_recovery_score(sleep: float, soreness: int, energy: int, stress: int) -> int:
    """
    Calculate a recovery score from 0-100.
    Higher = better recovered = ready to train hard.
    """
    # Sleep score — 8 hours is ideal
    sleep_score = min(100, (sleep / 8) * 100)

    # Soreness score — lower soreness = better
    soreness_score = ((10 - soreness) / 9) * 100

    # Energy score — higher energy = better
    energy_score = (energy / 10) * 100

    # Stress score — lower stress = better
    stress_score = ((10 - stress) / 9) * 100

    # Weighted average
    final = (
        sleep_score * 0.35 +
        soreness_score * 0.25 +
        energy_score * 0.25 +
        stress_score * 0.15
    )

    return round(final)


def get_recovery_status(score: int) -> str:
    if score >= 80:
        return "excellent"
    elif score >= 60:
        return "good"
    elif score >= 40:
        return "moderate"
    else:
        return "poor"


def get_training_recommendation(score: int) -> str:
    if score >= 80:
        return "You are fully recovered. Train at full intensity today."
    elif score >= 60:
        return "Good recovery. Train normally but listen to your body."
    elif score >= 40:
        return "Moderate recovery. Consider reducing intensity by 20%."
    else:
        return "Poor recovery. Focus on light movement or rest today."


@router.post("/log")
async def log_recovery(
    data: RecoveryLog,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    score = calculate_recovery_score(
        data.sleep_hours,
        data.soreness_level,
        data.energy_level,
        data.stress_level,
    )

    status = get_recovery_status(score)
    recommendation = get_training_recommendation(score)

    log = {
        "user_id": str(current_user["_id"]),
        "sleep_hours": data.sleep_hours,
        "soreness_level": data.soreness_level,
        "energy_level": data.energy_level,
        "stress_level": data.stress_level,
        "notes": data.notes,
        "recovery_score": score,
        "recovery_status": status,
        "recommendation": recommendation,
        "logged_at": datetime.utcnow(),
    }

    await db["recovery_logs"].insert_one(log)

    return {
        "recovery_score": score,
        "status": status,
        "recommendation": recommendation,
    }


@router.get("/today")
async def get_today_recovery(
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    today = datetime.utcnow().replace(hour=0, minute=0, second=0)

    log = await db["recovery_logs"].find_one(
        {
            "user_id": str(current_user["_id"]),
            "logged_at": {"$gte": today}
        },
        sort=[("logged_at", -1)]
    )

    if not log:
        return {"logged_today": False}

    return {
        "logged_today": True,
        "recovery_score": log["recovery_score"],
        "status": log["recovery_status"],
        "recommendation": log["recommendation"],
        "sleep_hours": log["sleep_hours"],
        "energy_level": log["energy_level"],
        "soreness_level": log["soreness_level"],
    }


@router.get("/history")
async def get_recovery_history(
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    seven_days_ago = datetime.utcnow() - timedelta(days=7)

    cursor = db["recovery_logs"].find(
        {
            "user_id": str(current_user["_id"]),
            "logged_at": {"$gte": seven_days_ago}
        }
    ).sort("logged_at", -1)

    logs = []
    async for log in cursor:
        logs.append({
            "date": log["logged_at"].strftime("%d %b"),
            "recovery_score": log["recovery_score"],
            "status": log["recovery_status"],
            "sleep_hours": log["sleep_hours"],
            "energy_level": log["energy_level"],
            "soreness_level": log["soreness_level"],
            "recommendation": log["recommendation"],
        })

    avg_score = round(sum(l["recovery_score"] for l in logs) / len(logs)) if logs else 0

    return {
        "logs": logs,
        "average_score": avg_score,
        "days_logged": len(logs),
    }