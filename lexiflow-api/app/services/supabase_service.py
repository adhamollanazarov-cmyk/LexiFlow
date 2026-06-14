import asyncio
from datetime import date, datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException
from supabase import Client, create_client

from app.core.config import settings
from app.models.schemas import WordCreate

supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY,
)


def _parse_supabase_date(value: str | None) -> date | None:
    if not value:
        return None

    return date.fromisoformat(value.split("T")[0])


def _create_user_row(user_id: str) -> dict[str, Any]:
    response = (
        supabase.table("users")
        .upsert(
            {
                "id": user_id,
                "email": "",
                "streak_count": 0,
                "last_active_date": None,
                "source_lang": "EN-US",
                "target_lang": "RU",
            }
        )
        .execute()
    )

    if not response.data:
        return {
            "id": user_id,
            "email": "",
            "streak_count": 0,
            "last_active_date": None,
            "source_lang": "EN-US",
            "target_lang": "RU",
        }

    return dict(response.data[0])


async def save_word(user_id: str, word: WordCreate) -> dict[str, Any]:
    def insert_word() -> dict[str, Any]:
        response = (
            supabase.table("words")
            .insert(
                {
                    "user_id": user_id,
                    "original": word.original,
                    "translation": word.translation,
                    "context_sentence": word.context_sentence,
                    "document_name": word.document_name,
                    "source_lang": word.source_lang,
                    "target_lang": word.target_lang,
                }
            )
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=500, detail="Could not save word")

        return dict(response.data[0])

    return await asyncio.to_thread(insert_word)


async def get_words(user_id: str, limit: int, offset: int) -> tuple[list, int]:
    def select_words() -> tuple[list, int]:
        words_response = (
            supabase.table("words")
            .select(
                "id, original, translation, context_sentence, document_name, created_at"
            )
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        count_response = (
            supabase.table("words")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )

        return list(words_response.data or []), int(count_response.count or 0)

    return await asyncio.to_thread(select_words)


async def delete_word(word_id: str, user_id: str) -> bool:
    def delete_selected_word() -> bool:
        word_response = (
            supabase.table("words")
            .select("id, user_id")
            .eq("id", word_id)
            .limit(1)
            .execute()
        )

        if not word_response.data:
            return False

        word = word_response.data[0]
        if str(word["user_id"]) != user_id:
            return False

        supabase.table("words").delete().eq("id", word_id).execute()
        return True

    return await asyncio.to_thread(delete_selected_word)


async def get_due_review_words(user_id: str, limit: int) -> tuple[list, int]:
    def select_due_words() -> tuple[list, int]:
        now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        due_filter = f"next_review_at.is.null,next_review_at.lte.{now_iso}"

        words_response = (
            supabase.table("words")
            .select(
                "id, original, translation, context_sentence, document_name, "
                "source_lang, target_lang, created_at, review_count, review_level"
            )
            .eq("user_id", user_id)
            .or_(due_filter)
            .order("next_review_at", desc=False)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )

        count_response = (
            supabase.table("words")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .or_(due_filter)
            .execute()
        )

        return list(words_response.data or []), int(count_response.count or 0)

    return await asyncio.to_thread(select_due_words)


async def update_word_review(
    word_id: str,
    user_id: str,
    rating: str,
) -> dict[str, Any] | None:
    def update_review() -> dict[str, Any] | None:
        delay_days_by_rating = {
            "again": 1,
            "good": 3,
            "easy": 7,
        }
        level_by_rating = {
            "again": 0,
            "good": 1,
            "easy": 2,
        }
        delay_days = delay_days_by_rating[rating]
        next_review_at = datetime.now(timezone.utc) + timedelta(days=delay_days)
        reviewed_at = datetime.now(timezone.utc)

        word_response = (
            supabase.table("words")
            .select("id, user_id, review_count")
            .eq("id", word_id)
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )

        if not word_response.data:
            return None

        current_word = word_response.data[0]
        review_count = int(current_word.get("review_count") or 0) + 1
        response = (
            supabase.table("words")
            .update(
                {
                    "next_review_at": next_review_at.isoformat(),
                    "last_reviewed_at": reviewed_at.isoformat(),
                    "review_count": review_count,
                    "review_level": level_by_rating[rating],
                }
            )
            .eq("id", word_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not response.data:
            return None

        return dict(response.data[0])

    return await asyncio.to_thread(update_review)


async def get_user_stats(user_id: str) -> dict[str, Any]:
    def select_user_stats() -> dict[str, Any]:
        user_response = (
            supabase.table("users")
            .select("id, email, streak_count, last_active_date, source_lang, target_lang")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )

        if not user_response.data:
            user = _create_user_row(user_id)
        else:
            user = user_response.data[0]

        count_response = (
            supabase.table("words")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )

        return {
            "streak_count": int(user.get("streak_count") or 0),
            "words_total": int(count_response.count or 0),
            "email": str(user.get("email") or ""),
            "last_active_date": user.get("last_active_date"),
            "source_lang": str(user.get("source_lang") or "EN-US"),
            "target_lang": str(user.get("target_lang") or "RU"),
        }

    return await asyncio.to_thread(select_user_stats)


async def update_streak(user_id: str) -> dict[str, int | bool]:
    def update_user_streak() -> dict[str, int | bool]:
        user_response = (
            supabase.table("users")
            .select("streak_count, last_active_date")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )

        if not user_response.data:
            user = _create_user_row(user_id)
        else:
            user = user_response.data[0]

        today = datetime.now(timezone.utc).date()
        yesterday = today - timedelta(days=1)
        last_active = _parse_supabase_date(user.get("last_active_date"))
        current_streak = int(user.get("streak_count") or 0)
        is_new_day = False

        if last_active is None:
            new_streak = 1
            is_new_day = True
        elif last_active == today:
            new_streak = current_streak
        elif last_active == yesterday:
            new_streak = current_streak + 1
            is_new_day = True
        else:
            new_streak = 1
            is_new_day = True

        if is_new_day:
            supabase.table("users").update(
                {
                    "streak_count": new_streak,
                    "last_active_date": today.isoformat(),
                }
            ).eq("id", user_id).execute()

        return {"streak": new_streak, "is_new_day": is_new_day}

    return await asyncio.to_thread(update_user_streak)


async def update_user_language_preferences(
    user_id: str,
    source_lang: str,
    target_lang: str,
) -> dict[str, str]:
    def update_preferences() -> dict[str, str]:
        try:
            user_response = (
                supabase.table("users")
                .select("id")
                .eq("id", user_id)
                .limit(1)
                .execute()
            )

            if not user_response.data:
                _create_user_row(user_id)

            response = (
                supabase.table("users")
                .update(
                    {
                        "source_lang": source_lang,
                        "target_lang": target_lang,
                    }
                )
                .eq("id", user_id)
                .execute()
            )
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail="Supabase failed to update language preferences",
            ) from exc

        if not response.data:
            raise HTTPException(
                status_code=500,
                detail="Supabase returned no updated language preferences",
            )

        return {
            "source_lang": str(response.data[0].get("source_lang") or source_lang),
            "target_lang": str(response.data[0].get("target_lang") or target_lang),
        }

    return await asyncio.to_thread(update_preferences)
