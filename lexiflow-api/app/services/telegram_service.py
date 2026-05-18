import asyncio
import logging
import random
from datetime import datetime, timedelta, timezone
from html import escape

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from telegram import Bot
from telegram.error import TelegramError

from app.core.config import settings
from app.services.supabase_service import supabase

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="UTC")


async def send_message(chat_id: int, text: str) -> bool:
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.warning("Telegram bot token is not configured")
        return False

    try:
        async with Bot(token=settings.TELEGRAM_BOT_TOKEN) as bot:
            await bot.send_message(chat_id=chat_id, text=text, parse_mode="HTML")
        return True
    except TelegramError:
        logger.exception("Failed to send Telegram message to chat_id=%s", chat_id)
        return False


def _format_word_card(word: dict[str, object]) -> str:
    original = escape(str(word.get("original") or ""))
    translation = escape(str(word.get("translation") or ""))
    context = escape(str(word.get("context_sentence") or ""))
    context_preview = f"{context[:80]}..." if len(context) > 80 else context

    return (
        f"🇩🇪 <b>{original}</b>\n"
        f"🇷🇺 {translation}\n"
        f"💬 <i>{context_preview}</i>"
    )


async def send_daily_words_to_user(user_id: str, chat_id: int) -> None:
    def fetch_words() -> list[dict[str, object]]:
        try:
            seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
            recent_response = (
                supabase.table("words")
                .select("original, translation, context_sentence, created_at")
                .eq("user_id", user_id)
                .gte("created_at", seven_days_ago.isoformat())
                .order("created_at", desc=True)
                .limit(50)
                .execute()
            )
            words = list(recent_response.data or [])

            if not words:
                fallback_response = (
                    supabase.table("words")
                    .select("original, translation, context_sentence, created_at")
                    .eq("user_id", user_id)
                    .order("created_at", desc=True)
                    .limit(50)
                    .execute()
                )
                words = list(fallback_response.data or [])
        except Exception:
            logger.exception("Failed to fetch Telegram words for user_id=%s", user_id)
            return []

        if len(words) <= 5:
            return [dict(word) for word in words]

        return [dict(word) for word in random.sample(words, 5)]

    words = await asyncio.to_thread(fetch_words)

    if not words:
        await send_message(chat_id, "No words saved yet. Go read some documents!")
        return

    await send_message(chat_id, "📚 <b>Your daily words - LexiFlow</b>")

    for word in words:
        await asyncio.sleep(0.3)
        await send_message(chat_id, _format_word_card(word))

    await send_message(chat_id, "🔥 Keep reading to learn more words!")


async def send_daily_words_to_all() -> None:
    def fetch_connected_users() -> list[dict[str, object]]:
        try:
            response = (
                supabase.table("users")
                .select("id, telegram_chat_id")
                .filter("telegram_chat_id", "not.is", "null")
                .execute()
            )
            return [dict(user) for user in response.data or []]
        except Exception:
            logger.exception("Failed to fetch Telegram-connected users")
            return []

    users = await asyncio.to_thread(fetch_connected_users)
    sent_count = 0

    for user in users:
        user_id = str(user.get("id") or "")
        chat_id_value = user.get("telegram_chat_id")

        if not user_id or chat_id_value is None:
            continue

        try:
            await send_daily_words_to_user(user_id, int(chat_id_value))
            sent_count += 1
        except Exception:
            logger.exception("Failed to send daily Telegram words to user_id=%s", user_id)

    logger.info("Daily Telegram words sent to %s users", sent_count)


def start_scheduler() -> None:
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.info("Telegram bot token is empty; daily words scheduler skipped")
        return

    if scheduler.running:
        return

    scheduler.add_job(
        send_daily_words_to_all,
        trigger="cron",
        hour=9,
        minute=0,
        id="daily_words",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Telegram daily words scheduler started")


def shutdown_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
