# NEFF — Dev Log

---

## Day 1 — 03 Jun 2026

### What I Built
- FastAPI server running on port 8000
- MongoDB connected locally
- Auth system — register and login with JWT
- User onboarding — 4 step form
- AI workout plan generation using Llama 3.1 via Groq
- React frontend with dashboard, workout, and AI coach pages

### What I Learned
- FastAPI is async — handles multiple requests without blocking
- JWT token works like a wristband — prove identity once, use everywhere
- CORS must be enabled for frontend to talk to backend
- MongoDB stores data as JSON documents — flexible unlike SQL tables
- Virtual environment isolates project dependencies

### Problems I Faced
- pydantic-core failed on Python 3.13 — fixed by upgrading version
- MongoDB PATH not set — fixed by adding to system environment variables
- CORS blocking registration — fixed by adding CORSMiddleware to main.py
- bcrypt bug on Python 3.13 — fixed by installing bcrypt==4.0.1

### Tech Used Today
- Python, FastAPI, MongoDB, React, Tailwind, Groq, Llama 3.1

### Tomorrow
- Polish the UI
- Test workout logging
- Add progress tracking page

---

## Day 2 — (date)

...

## Day 2 — 04 Jun 2026

### What I Built
- Progressive Overload Engine — pure logic, no AI needed
- Backend service that compares performance vs target
- Automatic weight recommendations after every workout
- Frontend shows Today vs Next Session for each exercise
- Session rating system — excellent, good, needs work

### What I Learned
- Services folder separates business logic from routes
- Progressive overload is pure math — no AI needed for this
- Good engineering means using AI only when necessary
- Simple logic can create powerful coaching features

### Problems I Faced
- Circular import error — had include_router inside route file instead of main.py
- Services folder missing — had to create it first

### Tomorrow
- Add progress tracking page with charts
- Set up Git
- Deploy online