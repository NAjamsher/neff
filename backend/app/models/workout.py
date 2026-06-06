from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


class MuscleGroup(str, Enum):
    CHEST = "chest"
    BACK = "back"
    SHOULDERS = "shoulders"
    BICEPS = "biceps"
    TRICEPS = "triceps"
    LEGS = "legs"
    CORE = "core"
    FULL_BODY = "full_body"


class Exercise(BaseModel):
    name: str
    muscle_group: MuscleGroup
    sets: int
    reps: str
    weight_kg: Optional[float] = None
    rest_seconds: int = 90
    notes: Optional[str] = None


class WorkoutDay(BaseModel):
    day_name: str
    day_number: int
    exercises: List[Exercise]


class SetLog(BaseModel):
    set_number: int
    weight_kg: float
    reps_completed: int


class ExerciseLog(BaseModel):
    exercise_name: str
    muscle_group: MuscleGroup
    sets: List[SetLog]
    notes: Optional[str] = None


class WorkoutLogRequest(BaseModel):
    workout_day_name: str
    exercises: List[ExerciseLog]
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None