from fastapi import APIRouter, Depends
from app.models.user import OnboardingData
from app.core.database import get_database
from app.api.deps import get_current_user
from datetime import datetime

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
async def get_profile(current_user=Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "name": current_user["name"],
        "email": current_user["email"],
        "is_onboarded": current_user.get("is_onboarded", False),
        "profile": current_user.get("profile"),
    }


@router.post("/onboarding")
async def complete_onboarding(
    data: OnboardingData,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    weight = data.weight_kg
    height_m = data.height_cm / 100
    bmi = round(weight / (height_m ** 2), 1)

    if data.gender.value == "male":
        bmr = 10 * weight + 6.25 * data.height_cm - 5 * data.age + 5
    else:
        bmr = 10 * weight + 6.25 * data.height_cm - 5 * data.age - 161

    activity_map = {2: 1.375, 3: 1.375, 4: 1.55, 5: 1.55, 6: 1.725}
    maintenance_calories = round(bmr * activity_map.get(data.training_days_per_week, 1.55))

    goal_calories_map = {
        "lose_fat": maintenance_calories - 400,
        "build_muscle": maintenance_calories + 300,
        "recomposition": maintenance_calories,
        "general_fitness": maintenance_calories,
        "strength": maintenance_calories + 200,
    }
    goal_calories = goal_calories_map.get(data.goal.value, maintenance_calories)
    protein_g = round(weight * 2.0)

    profile = {
        **data.model_dump(),
        "bmi": bmi,
        "maintenance_calories": maintenance_calories,
        "goal_calories": goal_calories,
        "protein_target_g": protein_g,
        "onboarded_at": datetime.utcnow(),
    }

    await db["users"].update_one(
        {"_id": current_user["_id"]},
        {"$set": {"profile": profile, "is_onboarded": True}},
    )

    return {
        "message": "Onboarding complete",
        "bmi": bmi,
        "goal_calories": goal_calories,
        "protein_target_g": protein_g,
    }