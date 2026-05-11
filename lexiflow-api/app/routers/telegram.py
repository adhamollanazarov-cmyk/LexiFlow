import asyncio

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.middleware.auth import get_current_user
from app.services.supabase_service import get_user_stats, supabase
from app.services.telegram_service import send_daily_words_to_user, send_message

router = APIRouter()


class TelegramConnectRequest(BaseModel):
    chat_id: int


def _get_user_telegram_chat_id(user_id: str) -> int | None:
    response = (
        supabase.table("users")
        .select("telegram_chat_id")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )

    if not response.data:
        return None

    chat_id = response.data[0].get("telegram_chat_id")
    return int(chat_id) if chat_id is not None else None


@router.post("/api/telegram/connect")
async def connect_telegram(
    request: TelegramConnectRequest,
    user_id: str = Depends(get_current_user),
) -> dict[str, int | str]:
    await get_user_stats(user_id)

    def update_chat_id() -> None:
        supabase.table("users").update(
            {"telegram_chat_id": request.chat_id}
        ).eq("id", user_id).execute()

    await asyncio.to_thread(update_chat_id)

    await send_message(
        request.chat_id,
        "✅ Connected! You'll receive 5 words every morning at 9:00 UTC.",
    )

    return {"message": "connected", "chat_id": request.chat_id}


@router.post("/api/telegram/test")
async def send_test_words(
    user_id: str = Depends(get_current_user),
) -> dict[str, str]:
    chat_id = await asyncio.to_thread(_get_user_telegram_chat_id, user_id)

    if chat_id is None:
        raise HTTPException(status_code=400, detail="Telegram not connected")

    await send_daily_words_to_user(user_id, chat_id)
    return {"message": "sent"}


@router.get("/api/telegram/status")
async def telegram_status(
    user_id: str = Depends(get_current_user),
) -> dict[str, bool | int | None]:
    chat_id = await asyncio.to_thread(_get_user_telegram_chat_id, user_id)
    return {"connected": chat_id is not None, "chat_id": chat_id}
