from fastapi import APIRouter, HTTPException, Query, Request
from telegram import Bot
from telegram.error import TelegramError

from app.core.config import settings
from app.services.telegram_service import send_message

router = APIRouter()


def _get_message(update: dict[str, object]) -> dict[str, object] | None:
    message = update.get("message")
    return message if isinstance(message, dict) else None


def _get_chat_id(message: dict[str, object]) -> int | None:
    chat = message.get("chat")
    if not isinstance(chat, dict):
        return None

    chat_id = chat.get("id")
    return int(chat_id) if chat_id is not None else None


@router.post("/api/telegram/webhook")
async def telegram_webhook(request: Request) -> dict[str, bool]:
    if not settings.TELEGRAM_BOT_TOKEN:
        return {"ok": True}

    secret_token = request.headers.get("X-Telegram-Bot-Api-Secret-Token")
    if secret_token != settings.TELEGRAM_BOT_TOKEN:
        return {"ok": True}

    update: dict[str, object] = await request.json()
    message = _get_message(update)

    if not message:
        return {"ok": True}

    text = message.get("text")
    chat_id = _get_chat_id(message)

    if text == "/start" and chat_id is not None:
        await send_message(
            chat_id,
            (
                "👋 Welcome to LexiFlow Bot!\n\n"
                f"Your Chat ID is: <b>{chat_id}</b>\n\n"
                "Copy this ID and paste it in LexiFlow Settings "
                "to connect your account."
            ),
        )

    return {"ok": True}


@router.get("/api/telegram/setup-webhook")
async def setup_telegram_webhook(
    url: str = Query(..., alias="url"),
) -> dict[str, bool | str]:
    if not settings.TELEGRAM_BOT_TOKEN:
        raise HTTPException(status_code=503, detail="Telegram bot token is not configured")

    webhook_url = f"{url.rstrip('/')}/api/telegram/webhook"

    try:
        async with Bot(token=settings.TELEGRAM_BOT_TOKEN) as bot:
            result = await bot.set_webhook(
                url=webhook_url,
                secret_token=settings.TELEGRAM_BOT_TOKEN,
            )
    except TelegramError as exc:
        raise HTTPException(status_code=502, detail="Telegram webhook setup failed") from exc

    return {"ok": bool(result), "webhook_url": webhook_url}
