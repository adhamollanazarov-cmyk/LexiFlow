# SocraticAI

SocraticAI is a responsible AI tutor for beginner programming students. It keeps the final answer locked and helps students improve reasoning through one guiding question, one small hint, weak concept detection, reasoning feedback, a reasoning score, and a next step.

Team: MVPandas  
Hackathon category: Build for Students & University Life

## Locked MVP Scope

- Two-screen demo: Student Coach and Teacher Report
- Beginner coding logic only
- No authentication
- No database
- No classroom management
- No payments
- No code execution sandbox
- No final answer reveal in the main flow
- Phase 1 includes project structure, placeholders, and backend health check only

## Project Structure

```text
backend/
  app/
    __init__.py
    main.py
  .env.example
  requirements.txt
frontend/
  app/
    globals.css
    layout.tsx
    page.tsx
  .env.example
  next-env.d.ts
  next.config.mjs
  package.json
  postcss.config.mjs
  tailwind.config.ts
  tsconfig.json
README.md
```

## Run Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The backend runs at:

```text
http://localhost:8000
```

## Test Backend Health

Open this URL:

```text
http://localhost:8000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "SocraticAI backend"
}
```

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:3000
```

## Environment Variables

Backend:

```text
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Frontend:

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Ready For Phase 2

Phase 2 can add the first real API contract for `POST /api/coach`, connect the Student Coach form to FastAPI, and keep the Teacher Report limited to the latest in-memory reasoning report.
