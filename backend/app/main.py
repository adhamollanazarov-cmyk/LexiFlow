import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="SocraticAI Backend")

allowed_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "SocraticAI backend",
    }
