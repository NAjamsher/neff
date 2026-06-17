# NEFF — No Excuse For Fitness

> **AI-Powered Personal Fitness Coaching Platform**  
> Your AI Coach. Your Plan. Your Progress.

<br>

## What is NEFF?

NEFF is a full-stack AI fitness coaching platform that replaces expensive personal trainers with an intelligent coaching system. It doesn't just track your workouts — it understands you, analyzes your performance, and tells you exactly what to do next.

Built as a real product with production-grade architecture, not a tutorial project.

---

## Live Demo

> Register → Complete Onboarding → Get AI-Generated Plan → Train → Get Coached

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        NEFF System                          │
├─────────────────┬───────────────────┬───────────────────────┤
│   React Frontend│   FastAPI Backend  │     AI Layer          │
│   (Vite + TW)   │   (Python 3.13)   │   (Llama 3.1 + RAG)  │
├─────────────────┼───────────────────┼───────────────────────┤
│  • Dashboard    │  • JWT Auth       │  • Groq API           │
│  • Workout Log  │  • REST API       │  • FAISS Vector DB    │
│  • Progress     │  • MongoDB Motor  │  • Sentence Transformers│
│  • Recovery     │  • Async/Await    │  • Knowledge Base     │
│  • Nutrition    │  • Pydantic v2    │  • Context Engine     │
│  • AI Coach     │  • CORS           │  • RAG Pipeline       │
└─────────────────┴───────────────────┴───────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + Vite | Fast dev server, modern React |
| Styling | Tailwind CSS | Utility-first, rapid UI development |
| State | Zustand | Lightweight, no boilerplate |
| Charts | Recharts | React-native charting |
| Backend | FastAPI (Python) | Async, auto-docs, production-grade |
| Database | MongoDB + Motor | Flexible schema for evolving fitness data |
| Auth | JWT (python-jose) | Stateless, scalable authentication |
| AI Model | Llama 3.1 via Groq | Free, fast (< 2s), production quality |
| Vector Search | FAISS (Meta AI) | Industry-standard semantic search |
| Embeddings | Sentence Transformers | Local embeddings, no API cost |
| Password | bcrypt | Industry standard hashing |

---

## Core AI Features

### 1. AI Workout Plan Generation
- Reads user profile (goal, experience, equipment, schedule)
- Builds a structured prompt with coaching rules
- Llama 3.1 generates a personalized training split in JSON
- Plan saved to MongoDB and immediately available

### 2. User Context Engine
Every AI feature reads from a central context object built from:
```
Profile + Recent Workouts + Recovery Scores + 
Personal Records + Streak + Plateaus + Nutrition
```
This ensures every AI response is personalized — not generic.

### 3. RAG-Powered AI Coach (FAISS)
```
User Question
      ↓
Sentence Transformer converts question → 384-dim vector
      ↓
FAISS searches knowledge base for nearest vectors
      ↓
Top 3 relevant research chunks retrieved
      ↓
Injected into prompt with user context
      ↓
Llama 3.1 generates science-backed answer
```
Knowledge base covers: progressive overload science, hypertrophy research, nutrition science, recovery protocols, Indian food database.

### 4. Progressive Overload Engine
Pure algorithmic logic — no AI needed:
```
If avg_reps >= max_rep_target → Increase weight
If avg_reps >= min_rep_target → Maintain weight  
If avg_reps < min_rep_target → Retry same weight
```
Weight increments are muscle-group specific (upper body: 2.5kg, legs: 5kg, isolation: 1kg).

### 5. Pre-Workout AI Briefing
Before every session, AI reads:
- Today's recovery score
- Last performance on this exact workout
- Current streak and plateau status
- Generates a 3-5 sentence personalized briefing

### 6. Weekly AI Review
Every week, AI generates a structured review:
- Week Summary
- Wins (with specific numbers)
- Areas to Improve
- Next Week's 3 Focus Points

---

## Project Structure

```
neff/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.py          # JWT register/login
│   │   │   │   ├── users.py         # Profile + onboarding
│   │   │   │   ├── workouts.py      # Plan + logging + stats
│   │   │   │   ├── ai.py            # Plan generation + coach + briefing
│   │   │   │   ├── overload.py      # Progressive overload engine
│   │   │   │   ├── recovery.py      # Recovery tracking + scoring
│   │   │   │   ├── nutrition.py     # Meal tracking + AI nutrition coach
│   │   │   │   ├── records.py       # Personal records
│   │   │   │   ├── review.py        # Weekly AI review
│   │   │   │   └── deps.py          # Auth dependency injection
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic settings
│   │   │   ├── database.py          # MongoDB connection
│   │   │   └── security.py          # JWT + bcrypt
│   │   ├── models/
│   │   │   ├── user.py              # User + onboarding schemas
│   │   │   └── workout.py           # Workout + logging schemas
│   │   ├── services/
│   │   │   ├── context.py           # User context engine
│   │   │   ├── overload.py          # Overload calculation logic
│   │   │   └── rag.py               # FAISS RAG pipeline
│   │   ├── knowledge/               # Fitness research documents
│   │   │   ├── progressive_overload.txt
│   │   │   ├── hypertrophy_research.txt
│   │   │   ├── nutrition_science.txt
│   │   │   ├── recovery_science.txt
│   │   │   └── indian_nutrition.txt
│   │   └── main.py                  # FastAPI app + startup
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── OnboardingPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── WorkoutPage.jsx
│   │   │   ├── ProgressPage.jsx
│   │   │   ├── RecoveryPage.jsx
│   │   │   ├── NutritionPage.jsx
│   │   │   ├── WeeklyReviewPage.jsx
│   │   │   └── CoachPage.jsx
│   │   ├── components/
│   │   │   └── layout/AppLayout.jsx
│   │   ├── services/
│   │   │   └── api.js               # Axios + interceptors
│   │   └── store/
│   │       └── authStore.js         # Zustand auth state
│   └── package.json
│
└── package.json                     # Concurrently dev script
```

---

## Key Engineering Decisions

**Why FastAPI over Flask?**
FastAPI is async — handles multiple AI requests simultaneously without blocking. Flask would freeze while Llama 3.1 generates a response.

**Why MongoDB over SQLite/PostgreSQL?**
User fitness profiles have deeply nested, variable structure (workout plans with days → exercises → sets). MongoDB stores this naturally as JSON. A relational DB would require 5+ tables with complex joins.

**Why Groq over Hugging Face?**
Groq's LPU hardware runs Llama 3.1 in under 2 seconds. HuggingFace free tier takes 30-40 seconds and goes to sleep between requests. Speed matters for user experience.

**Why FAISS over ChromaDB?**
FAISS is built by Meta AI Research and is the industry standard for vector similarity search at scale. ChromaDB is simpler but FAISS demonstrates deeper ML engineering knowledge.

**Why Llama 3.1 over GPT-4?**
Llama 3.1 is open source, runs free via Groq, and is powerful enough for fitness coaching. Using GPT-4 would cost money and not demonstrate understanding of open-source LLM deployment.

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB (local or Atlas)
- Groq API key (free at console.groq.com)

### Setup

```bash
# Clone the repo
git clone https://github.com/NAjamsher/neff.git
cd neff

# Backend setup
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Create .env from example
cp .env.example .env
# Fill in your GROQ_API_KEY and MongoDB URL

# Run both servers with one command
cd ..
npm install
npm run dev
```

Open `http://localhost:5173`

---

## API Documentation

FastAPI generates interactive docs automatically.

After starting the server:
```
http://localhost:8000/docs
```

All 25+ endpoints are documented and testable from the browser.

---

## Features

| Feature | Description |
|---|---|
| Auth | JWT register/login with bcrypt password hashing |
| Onboarding | 4-step form with BMI/calorie/protein calculations |
| AI Plan Generation | Llama 3.1 generates personalized training splits |
| Workout Logging | Log sets, reps, weight per exercise |
| Progressive Overload | Algorithm auto-calculates next session weights |
| Recovery Tracking | Daily score from sleep, soreness, energy, stress |
| Personal Records | Tracks heaviest weight ever lifted per exercise |
| Streak System | Consecutive training day tracking |
| User Context Engine | Aggregates all user data for personalized AI |
| RAG AI Coach | FAISS-powered coach with fitness research knowledge |
| Pre-Workout Briefing | AI reads your data and briefs you before training |
| Nutrition Tracking | Meal-wise macro tracking with Indian food database |
| AI Nutrition Coach | Suggests meals based on remaining daily macros |
| Weekly AI Review | Structured weekly performance analysis |
| Plateau Detection | Identifies stalled exercises across sessions |

---

## What I Learned Building This

- **Prompt engineering matters more than model choice** — the same Llama 3.1 gives completely different quality answers depending on how context is structured
- **RAG is about retrieval quality** — the embedding model and chunking strategy matter as much as the vector search
- **Async is non-negotiable for AI apps** — synchronous AI calls would block the entire server
- **User context is the hardest part** — aggregating data from 6 different collections into one coherent AI prompt took the most engineering thinking
- **MongoDB schema design for AI** — flexible documents make AI context building much easier than relational schemas

---

## Author

**Jamsher N A**  
Aspiring GenAI Engineer  
GitHub: [@NAjamsher](https://github.com/NAjamsher)

---

*Built to demonstrate real-world GenAI engineering — not just API calls.*