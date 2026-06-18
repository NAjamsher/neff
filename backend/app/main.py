from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import connect_db, close_db
from app.api.routes import auth, users, workouts, ai, overload, recovery, records, review, nutrition

app = FastAPI(
    title="NEFF",
    description="No Excuse For Fitness — AI Coaching Platform",
    version="1.0.0"
)

# Updated CORS middleware to allow your local environment and Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://neff-frontend.vercel.app",
        "*"  # The ultimate backup to ensure Vercel can make API calls flawlessly
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await connect_db()
    # Load FAISS knowledge base into memory
    from app.services.rag import load_knowledge_base
    load_knowledge_base()

@app.on_event("shutdown")
async def shutdown():
    await close_db()

app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(workouts.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(overload.router, prefix="/api/v1")
app.include_router(recovery.router, prefix="/api/v1")
app.include_router(records.router, prefix="/api/v1")
app.include_router(review.router, prefix="/api/v1")
app.include_router(nutrition.router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "app": "NEFF",
        "message": "No Excuse For Fitness 💪",
        "status": "running"
    }