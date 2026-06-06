from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime
from bson import ObjectId
from app.core.security import hash_password, verify_password, create_access_token
from app.core.database import get_database

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── What data we expect from the user ──────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ── Routes ─────────────────────────────────────────────────────

@router.post("/register")
async def register(data: RegisterRequest, db=Depends(get_database)):
    # Check if email already exists
    existing = await db["users"].find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user document
    user = {
        "name": data.name,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "is_onboarded": False,
        "created_at": datetime.utcnow(),
    }

    result = await db["users"].insert_one(user)

    token = create_access_token(data={"sub": str(result.inserted_id)})

    return {
        "message": "Account created successfully",
        "access_token": token,
        "user": {
            "id": str(result.inserted_id),
            "name": data.name,
            "email": data.email,
        }
    }


@router.post("/login")
async def login(data: LoginRequest, db=Depends(get_database)):
    # Find user by email
    user = await db["users"].find_one({"email": data.email})

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(data={"sub": str(user["_id"])})

    return {
        "message": "Login successful",
        "access_token": token,
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
        }
    }