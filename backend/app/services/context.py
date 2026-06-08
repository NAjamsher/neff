from datetime import datetime, timedelta
from bson import ObjectId


async def build_user_context(user_id: str, db) -> dict:
    """
    Builds a complete picture of the user.
    This is what the AI reads before making any decision.
    Every feature feeds into this one function.
    """

    # ── 1. Basic Profile ──────────────────────────────────────
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    profile = user.get("profile", {})

    # ── 2. Recent Workouts (last 7 days) ──────────────────────
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    cursor = db["workout_logs"].find({
        "user_id": user_id,
        "logged_at": {"$gte": seven_days_ago}
    }).sort("logged_at", -1)

    recent_workouts = []
    async for log in cursor:
        recent_workouts.append({
            "day": log["workout_day_name"],
            "exercises": len(log.get("exercises", [])),
            "date": log["logged_at"].strftime("%d %b"),
        })

    # ── 3. Recovery Data (last 7 days) ────────────────────────
    cursor = db["recovery_logs"].find({
        "user_id": user_id,
        "logged_at": {"$gte": seven_days_ago}
    }).sort("logged_at", -1)

    recovery_logs = []
    async for log in cursor:
        recovery_logs.append({
            "date": log["logged_at"].strftime("%d %b"),
            "score": log["recovery_score"],
            "status": log["recovery_status"],
            "sleep": log["sleep_hours"],
            "energy": log["energy_level"],
            "soreness": log["soreness_level"],
        })

    avg_recovery = round(
        sum(r["score"] for r in recovery_logs) / len(recovery_logs)
    ) if recovery_logs else None

    today_recovery = recovery_logs[0] if recovery_logs else None

    # ── 4. Streak Calculation ─────────────────────────────────
    all_logs_cursor = db["workout_logs"].find(
        {"user_id": user_id}
    ).sort("logged_at", -1)

    all_dates = []
    async for log in all_logs_cursor:
        all_dates.append(log["logged_at"].date())

    unique_dates = sorted(set(all_dates), reverse=True)

    current_streak = 0
    longest_streak = 0

    if unique_dates:
        current_streak = 1
        temp = 1

        for i in range(1, len(unique_dates)):
            diff = (unique_dates[i-1] - unique_dates[i]).days
            if diff == 1:
                current_streak += 1
                temp += 1
                longest_streak = max(longest_streak, temp)
            else:
                break

        longest_streak = max(longest_streak, current_streak)

    # ── 5. Personal Records ───────────────────────────────────
    records_cursor = db["workout_logs"].find({"user_id": user_id})
    personal_records = {}

    async for log in records_cursor:
        for exercise in log.get("exercises", []):
            ex_name = exercise["exercise_name"]
            sets = exercise.get("sets", [])
            if not sets:
                continue
            max_weight = max(s["weight_kg"] for s in sets)
            if ex_name not in personal_records or max_weight > personal_records[ex_name]:
                personal_records[ex_name] = max_weight

    # ── 6. Total Stats ────────────────────────────────────────
    total_workouts = await db["workout_logs"].count_documents(
        {"user_id": user_id}
    )

    workouts_this_week = await db["workout_logs"].count_documents({
        "user_id": user_id,
        "logged_at": {"$gte": seven_days_ago}
    })

    # ── 7. Active Workout Plan ────────────────────────────────
    plan = await db["workout_plans"].find_one({
        "user_id": user_id,
        "is_active": True
    })

    plan_name = plan.get("plan_name") if plan else None
    planned_days = plan.get("days_per_week") if plan else None

    # ── 8. Plateau Detection ──────────────────────────────────
    plateau_exercises = []

    if plan:
        for day in plan.get("workout_days", []):
            for exercise in day.get("exercises", []):
                ex_name = exercise["name"]

                ex_cursor = db["workout_logs"].find(
                    {"user_id": user_id,
                     "exercises.exercise_name": ex_name}
                ).sort("logged_at", -1).limit(4)

                weights = []
                async for log in ex_cursor:
                    for ex_log in log.get("exercises", []):
                        if ex_log["exercise_name"] == ex_name:
                            sets = ex_log.get("sets", [])
                            if sets:
                                avg_w = sum(
                                    s["weight_kg"] for s in sets
                                ) / len(sets)
                                weights.append(avg_w)

                if len(weights) >= 3 and len(set(weights)) == 1:
                    plateau_exercises.append(ex_name)

    # ── 9. Build Final Context ────────────────────────────────
    context = {
        "name": user.get("name"),
        "goal": profile.get("goal", "general fitness"),
        "experience": profile.get("experience_level", "beginner"),
        "equipment": profile.get("equipment", "full_gym"),
        "planned_days_per_week": planned_days,
        "goal_calories": profile.get("goal_calories"),
        "protein_target_g": profile.get("protein_target_g"),

        "current_plan": plan_name,
        "total_workouts": total_workouts,
        "workouts_this_week": workouts_this_week,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "recent_workouts": recent_workouts,

        "today_recovery": today_recovery,
        "avg_recovery_score": avg_recovery,
        "recovery_trend": recovery_logs,

        "personal_records": personal_records,
        "total_prs": len(personal_records),

        "plateau_exercises": plateau_exercises,
        "has_plateaus": len(plateau_exercises) > 0,
    }

    return context


def format_context_for_ai(context: dict) -> str:
    """
    Converts context into readable string for the AI.
    The AI reads this before answering any question.
    """
    lines = [
        f"User: {context['name']}",
        f"Goal: {context['goal'].replace('_', ' ')}",
        f"Experience: {context['experience']}",
        f"Current Plan: {context['current_plan'] or 'None'}",
        f"Total Workouts Completed: {context['total_workouts']}",
        f"Workouts This Week: {context['workouts_this_week']} / {context['planned_days_per_week'] or '?'}",
        f"Current Streak: {context['current_streak']} days",
        f"Longest Streak Ever: {context['longest_streak']} days",
    ]

    if context['today_recovery']:
        r = context['today_recovery']
        lines.append(
            f"Today's Recovery: {r['score']}/100 ({r['status']}) "
            f"— Sleep: {r['sleep']}hrs, "
            f"Energy: {r['energy']}/10, "
            f"Soreness: {r['soreness']}/10"
        )
    else:
        lines.append("Today's Recovery: Not logged yet")

    if context['avg_recovery_score']:
        lines.append(
            f"Average Recovery (7 days): {context['avg_recovery_score']}/100"
        )

    if context['recent_workouts']:
        workouts_str = ", ".join(
            [w['day'] for w in context['recent_workouts']]
        )
        lines.append(f"Recent Workouts: {workouts_str}")

    if context['personal_records']:
        top_prs = sorted(
            context['personal_records'].items(),
            key=lambda x: x[1],
            reverse=True
        )[:3]
        pr_str = ", ".join(
            [f"{name}: {weight}kg" for name, weight in top_prs]
        )
        lines.append(f"Top Personal Records: {pr_str}")

    if context['has_plateaus']:
        lines.append(
            f"Plateau Detected: {', '.join(context['plateau_exercises'])}"
        )

    if context['goal_calories']:
        lines.append(f"Daily Calorie Target: {context['goal_calories']} kcal")

    if context['protein_target_g']:
        lines.append(
            f"Daily Protein Target: {context['protein_target_g']}g"
        )

    return "\n".join(lines)