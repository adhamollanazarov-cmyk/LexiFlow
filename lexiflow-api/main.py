import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import explain, telegram, telegram_webhook, translate, user, vocabulary
from app.services.telegram_service import shutdown_scheduler, start_scheduler

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    try:
        yield
    finally:
        shutdown_scheduler()


app = FastAPI(title="LexiFlow API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(translate.router)
app.include_router(explain.router)
app.include_router(vocabulary.router)
app.include_router(user.router)
app.include_router(telegram.router)
app.include_router(telegram_webhook.router)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "lexiflow-api"}
