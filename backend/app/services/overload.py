from datetime import datetime


def calculate_average_reps(sets: list) -> float:
    """Calculate average reps completed across all sets."""
    if not sets:
        return 0
    total = sum(s["reps_completed"] for s in sets)
    return total / len(sets)


def calculate_average_weight(sets: list) -> float:
    """Calculate average weight used across all sets."""
    if not sets:
        return 0
    total = sum(s["weight_kg"] for s in sets)
    return total / len(sets)


def get_target_reps(reps_str: str) -> tuple:
    """
    Parse reps string into min and max.
    '6-8' → (6, 8)
    '10' → (10, 10)
    """
    if "-" in str(reps_str):
        parts = reps_str.split("-")
        return int(parts[0]), int(parts[1])
    return int(reps_str), int(reps_str)


def calculate_next_weight(current_weight: float, muscle_group: str) -> float:
    """
    Calculate weight increase based on muscle group.
    Upper body increases slower than lower body.
    """
    increments = {
        "chest": 2.5,
        "back": 2.5,
        "shoulders": 2.0,
        "biceps": 1.0,
        "triceps": 1.0,
        "legs": 5.0,
        "core": 1.0,
        "full_body": 2.5,
    }
    increment = increments.get(muscle_group, 2.5)
    return round(current_weight + increment, 1)


def analyze_exercise(exercise_log: dict, target_exercise: dict) -> dict:
    """
    Compare what user did vs what was planned.
    Returns recommendation for next session.
    """
    sets = exercise_log.get("sets", [])
    muscle_group = exercise_log.get("muscle_group", "chest")

    avg_reps = calculate_average_reps(sets)
    avg_weight = calculate_average_weight(sets)

    # Get target rep range from plan
    reps_str = target_exercise.get("reps", "8-10")
    min_reps, max_reps = get_target_reps(reps_str)
    target_weight = target_exercise.get("weight_kg", avg_weight)

    # Decision logic
    if avg_reps >= max_reps:
        # User exceeded top of rep range — increase weight
        next_weight = calculate_next_weight(avg_weight, muscle_group)
        status = "increase"
        message = f"Great job! Increase weight to {next_weight}kg next session."
    elif avg_reps >= min_reps:
        # User hit the target range — maintain
        next_weight = avg_weight
        status = "maintain"
        message = f"Good work! Keep {avg_weight}kg and aim for {max_reps} reps."
    else:
        # User failed to hit minimum — reduce or maintain
        next_weight = avg_weight
        status = "retry"
        message = f"Keep {avg_weight}kg and focus on form. Target {min_reps} reps minimum."

    return {
        "exercise_name": exercise_log.get("exercise_name"),
        "muscle_group": muscle_group,
        "avg_reps_completed": round(avg_reps, 1),
        "avg_weight_used": avg_weight,
        "target_reps": reps_str,
        "target_weight": target_weight,
        "status": status,
        "next_weight_kg": next_weight,
        "recommendation": message,
    }


def analyze_workout(workout_log: dict, workout_plan_day: dict) -> dict:
    """
    Analyze entire workout session.
    Compare each exercise against the plan.
    """
    recommendations = []

    # Build a lookup of planned exercises
    planned = {
        ex["name"]: ex
        for ex in workout_plan_day.get("exercises", [])
    }

    for exercise_log in workout_log.get("exercises", []):
        name = exercise_log.get("exercise_name")
        target = planned.get(name, {})
        result = analyze_exercise(exercise_log, target)
        recommendations.append(result)

    # Count statuses
    total = len(recommendations)
    increases = sum(1 for r in recommendations if r["status"] == "increase")
    retries = sum(1 for r in recommendations if r["status"] == "retry")

    # Overall session rating
    if total == 0:
        rating = "no data"
    elif increases >= total * 0.5:
        rating = "excellent"
    elif retries >= total * 0.5:
        rating = "needs work"
    else:
        rating = "good"

    return {
        "session_rating": rating,
        "total_exercises": total,
        "exercises_to_increase": increases,
        "exercises_to_retry": retries,
        "recommendations": recommendations,
        "analyzed_at": datetime.utcnow().isoformat(),
    }