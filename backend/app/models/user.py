from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum


class FitnessGoal(str, Enum):
    BUILD_MUSCLE = "build_muscle"
    LOSE_FAT = "lose_fat"
    RECOMPOSITION = "recomposition"
    GENERAL_FITNESS = "general_fitness"
    STRENGTH = "strength"


class ExperienceLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class EquipmentAccess(str, Enum):
    FULL_GYM = "full_gym"
    HOME_GYM = "home_gym"
    DUMBBELLS_ONLY = "dumbbells_only"
    BODYWEIGHT = "bodyweight"


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class OnboardingData(BaseModel):
    age: int
    gender: Gender
    height_cm: float
    weight_kg: float
    goal: FitnessGoal
    experience_level: ExperienceLevel
    equipment: EquipmentAccess
    training_days_per_week: int
    sleep_hours: Optional[float] = 7.0
    injuries: Optional[str] = None