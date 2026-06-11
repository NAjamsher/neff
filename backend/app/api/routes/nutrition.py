from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
from app.core.database import get_database
from app.api.deps import get_current_user
from app.api.routes.ai import call_llama

router = APIRouter(prefix="/nutrition", tags=["Nutrition"])


# ── Common Indian + International Foods Database ──────────────
FOOD_DATABASE = {
    # Indian foods
    "rice": {"calories": 130, "protein": 2.7, "carbs": 28, "fats": 0.3, "per": "100g"},
    "chapati": {"calories": 104, "protein": 3.1, "carbs": 18, "fats": 2.5, "per": "1 piece"},
    "dal": {"calories": 116, "protein": 9, "carbs": 20, "fats": 0.4, "per": "100g"},
    "paneer": {"calories": 265, "protein": 18, "carbs": 1.2, "fats": 20, "per": "100g"},
    "chicken breast": {"calories": 165, "protein": 31, "carbs": 0, "fats": 3.6, "per": "100g"},
    "eggs": {"calories": 155, "protein": 13, "carbs": 1.1, "fats": 11, "per": "100g"},
    "milk": {"calories": 61, "protein": 3.2, "carbs": 4.8, "fats": 3.3, "per": "100ml"},
    "curd": {"calories": 98, "protein": 11, "carbs": 3.4, "fats": 4.3, "per": "100g"},
    "banana": {"calories": 89, "protein": 1.1, "carbs": 23, "fats": 0.3, "per": "1 medium"},
    "apple": {"calories": 52, "protein": 0.3, "carbs": 14, "fats": 0.2, "per": "1 medium"},
    "oats": {"calories": 389, "protein": 17, "carbs": 66, "fats": 7, "per": "100g"},
    "peanut butter": {"calories": 588, "protein": 25, "carbs": 20, "fats": 50, "per": "100g"},
    "sweet potato": {"calories": 86, "protein": 1.6, "carbs": 20, "fats": 0.1, "per": "100g"},
    "brown rice": {"calories": 216, "protein": 5, "carbs": 45, "fats": 1.8, "per": "100g"},
    "whey protein": {"calories": 120, "protein": 24, "carbs": 3, "fats": 2, "per": "1 scoop"},
    "almonds": {"calories": 579, "protein": 21, "carbs": 22, "fats": 50, "per": "100g"},
    "tuna": {"calories": 132, "protein": 29, "carbs": 0, "fats": 1, "per": "100g"},
    "idli": {"calories": 39, "protein": 2, "carbs": 8, "fats": 0.4, "per": "1 piece"},
    "dosa": {"calories": 168, "protein": 3.8, "carbs": 27, "fats": 5, "per": "1 medium"},
    "sambar": {"calories": 97, "protein": 5, "carbs": 16, "fats": 2, "per": "100g"},
}


class FoodEntry(BaseModel):
    food_name: str
    quantity: float
    unit: str = "g"
    meal_type: str = "lunch"  # breakfast, lunch, dinner, snack


class NutritionQuery(BaseModel):
    query: str


@router.get("/foods/search/{query}")
async def search_food(query: str):
    """Search for a food in the database."""
    query_lower = query.lower()
    results = []

    for food_name, nutrients in FOOD_DATABASE.items():
        if query_lower in food_name:
            results.append({
                "name": food_name,
                **nutrients
            })

    if not results:
        return {"results": [], "message": "Food not found in database"}

    return {"results": results}


@router.post("/log")
async def log_food(
    data: FoodEntry,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Log a food item to today's nutrition."""

    food_name = data.food_name.lower()
    food = FOOD_DATABASE.get(food_name)

    if not food:
        raise HTTPException(
            status_code=404,
            detail=f"Food '{data.food_name}' not found. Try searching first."
        )

    # Scale nutrition by quantity
    scale = data.quantity / 100

    nutrition_entry = {
        "user_id": str(current_user["_id"]),
        "food_name": food_name,
        "quantity": data.quantity,
        "unit": data.unit,
        "meal_type": data.meal_type,
        "calories": round(food["calories"] * scale, 1),
        "protein_g": round(food["protein"] * scale, 1),
        "carbs_g": round(food["carbs"] * scale, 1),
        "fats_g": round(food["fats"] * scale, 1),
        "logged_at": datetime.utcnow(),
    }

    await db["nutrition_logs"].insert_one(nutrition_entry)

    return {
        "message": f"Logged {data.quantity}{data.unit} of {food_name}",
        "nutrition": {
            "calories": nutrition_entry["calories"],
            "protein_g": nutrition_entry["protein_g"],
            "carbs_g": nutrition_entry["carbs_g"],
            "fats_g": nutrition_entry["fats_g"],
        }
    }


@router.get("/today")
async def get_today_nutrition(
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Get today's nutrition grouped by meal type."""
    today = datetime.utcnow().replace(hour=0, minute=0, second=0)

    cursor = db["nutrition_logs"].find({
        "user_id": str(current_user["_id"]),
        "logged_at": {"$gte": today}
    })

    # Group entries by meal type
    meals = {
        "breakfast": {"entries": [], "calories": 0, "protein_g": 0, "carbs_g": 0, "fats_g": 0},
        "lunch": {"entries": [], "calories": 0, "protein_g": 0, "carbs_g": 0, "fats_g": 0},
        "evening_snack": {"entries": [], "calories": 0, "protein_g": 0, "carbs_g": 0, "fats_g": 0},
        "dinner": {"entries": [], "calories": 0, "protein_g": 0, "carbs_g": 0, "fats_g": 0},
    }

    daily_totals = {"calories": 0, "protein_g": 0, "carbs_g": 0, "fats_g": 0}

    async for log in cursor:
        meal_type = log.get("meal_type", "lunch")
        if meal_type not in meals:
            meal_type = "lunch"

        entry = {
            "food_name": log["food_name"],
            "quantity": log["quantity"],
            "meal_type": meal_type,
            "calories": log["calories"],
            "protein_g": log["protein_g"],
            "carbs_g": log["carbs_g"],
            "fats_g": log["fats_g"],
        }

        meals[meal_type]["entries"].append(entry)
        meals[meal_type]["calories"] += log["calories"]
        meals[meal_type]["protein_g"] += log["protein_g"]
        meals[meal_type]["carbs_g"] += log["carbs_g"]
        meals[meal_type]["fats_g"] += log["fats_g"]

        daily_totals["calories"] += log["calories"]
        daily_totals["protein_g"] += log["protein_g"]
        daily_totals["carbs_g"] += log["carbs_g"]
        daily_totals["fats_g"] += log["fats_g"]

    # Round all values
    for meal in meals.values():
        for key in ["calories", "protein_g", "carbs_g", "fats_g"]:
            meal[key] = round(meal[key], 1)

    daily_totals = {k: round(v, 1) for k, v in daily_totals.items()}

    # Get user targets
    user = await db["users"].find_one({"_id": current_user["_id"]})
    profile = user.get("profile", {})
    goal_calories = profile.get("goal_calories", 2000)
    protein_target = profile.get("protein_target_g", 150)

    # Flat entries list for backward compatibility
    all_entries = []
    for meal_data in meals.values():
        all_entries.extend(meal_data["entries"])

    return {
        "entries": all_entries,
        "meals": meals,
        "totals": daily_totals,
        "targets": {
            "calories": goal_calories,
            "protein_g": protein_target,
            "meal_targets": {
                "breakfast": round(goal_calories * 0.25),
                "lunch": round(goal_calories * 0.35),
                "evening_snack": round(goal_calories * 0.10),
                "dinner": round(goal_calories * 0.30),
            }
        },
    }

@router.post("/ai-suggest")
async def ai_nutrition_suggestion(
    data: NutritionQuery,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Ask AI for nutrition advice — understands which meal you're asking about."""

    today = datetime.utcnow().replace(hour=0, minute=0, second=0)
    cursor = db["nutrition_logs"].find({
        "user_id": str(current_user["_id"]),
        "logged_at": {"$gte": today}
    })

    # Group by meal
    meals = {
        "breakfast": [],
        "lunch": [],
        "evening_snack": [],
        "dinner": []
    }

    daily_totals = {"calories": 0, "protein_g": 0}

    async for log in cursor:
        meal_type = log.get("meal_type", "lunch")
        if meal_type not in meals:
            meal_type = "lunch"

        meals[meal_type].append({
            "food": log["food_name"],
            "quantity": log["quantity"],
            "calories": log["calories"],
            "protein_g": log["protein_g"],
            "carbs_g": log["carbs_g"],
            "fats_g": log["fats_g"],
        })

        daily_totals["calories"] += log["calories"]
        daily_totals["protein_g"] += log["protein_g"]

    # Build meal summary strings
    def meal_summary(meal_name, entries):
        if not entries:
            return f"{meal_name}: Nothing logged yet"
        total_cal = sum(e["calories"] for e in entries)
        total_p = sum(e["protein_g"] for e in entries)
        total_c = sum(e["carbs_g"] for e in entries)
        total_f = sum(e["fats_g"] for e in entries)
        foods = ", ".join([f"{e['food']} ({e['quantity']}g)" for e in entries])
        return (
            f"{meal_name}: {foods}\n"
            f"  → {round(total_cal)} kcal | "
            f"P:{round(total_p)}g | "
            f"C:{round(total_c)}g | "
            f"F:{round(total_f)}g"
        )

    user = await db["users"].find_one({"_id": current_user["_id"]})
    profile = user.get("profile", {})
    goal_calories = profile.get("goal_calories", 2000)
    protein_target = profile.get("protein_target_g", 150)

    meal_targets = {
        "breakfast": round(goal_calories * 0.25),
        "lunch": round(goal_calories * 0.35),
        "evening_snack": round(goal_calories * 0.10),
        "dinner": round(goal_calories * 0.30),
    }

    full_log = "\n".join([
        meal_summary("Breakfast", meals["breakfast"]),
        meal_summary("Lunch", meals["lunch"]),
        meal_summary("Evening Snack", meals["evening_snack"]),
        meal_summary("Dinner", meals["dinner"]),
    ])

    messages = [
        {
            "role": "system",
            "content": f"""You are NEFF nutrition coach. You have the user's complete meal-by-meal food log.

User Goal: {profile.get('goal', 'general fitness')}
Daily Calorie Target: {goal_calories} kcal
Daily Protein Target: {protein_target}g

Meal Targets:
- Breakfast: {meal_targets['breakfast']} kcal (25% of daily)
- Lunch: {meal_targets['lunch']} kcal (35% of daily)
- Evening Snack: {meal_targets['evening_snack']} kcal (10% of daily)
- Dinner: {meal_targets['dinner']} kcal (30% of daily)

Today's Food Log (grouped by meal):
{full_log}

Daily Totals So Far:
- Calories: {round(daily_totals['calories'])} / {goal_calories} kcal
- Protein: {round(daily_totals['protein_g'])} / {protein_target}g
- Remaining calories: {goal_calories - round(daily_totals['calories'])} kcal
- Remaining protein: {protein_target - round(daily_totals['protein_g'])}g

IMPORTANT RULES:
- When asked about a specific meal (breakfast/lunch/dinner) — only analyze THAT meal
- Compare that meal's actual calories against its target
- Never mix meals together
- Suggest Indian foods with specific quantities
- Keep response under 5 sentences"""
        },
        {
            "role": "user",
            "content": data.query
        }
    ]

    reply = await call_llama(messages)
    return {"suggestion": reply.strip()}