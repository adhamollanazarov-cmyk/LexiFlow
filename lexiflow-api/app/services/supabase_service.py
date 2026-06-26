import asyncio
from datetime import date, datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException
from supabase import Client, create_client

from app.core.config import settings
from app.models.schemas import WordCreate
from app.services.sm2 import SM2Card, calculate_sm2
from app.services.streak import update_streak as calculate_review_streak

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
                "id, original, translation, context_sentence, document_name, "
                "created_at, next_review_at, last_reviewed_at, review_count, "
                "review_level, source_lang, target_lang"
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


async def get_sm2_due_review_words(user_id: str, limit: int) -> tuple[list, int]:
    def select_due_words() -> tuple[list, int]:
        now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        due_filter = f"next_review_at.is.null,next_review_at.lte.{now_iso}"

        words_response = (
            supabase.table("words")
            .select(
                "id, original, translation, context_sentence, repetitions, "
                "interval_days, easiness_factor"
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


def _get_or_create_profile(user_id: str) -> dict[str, Any]:
    profile_response = (
        supabase.table("profiles")
        .select("id, current_streak, longest_streak, last_review_date")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )

    if profile_response.data:
        return dict(profile_response.data[0])

    created_response = (
        supabase.table("profiles")
        .upsert(
            {
                "id": user_id,
                "current_streak": 0,
                "longest_streak": 0,
                "last_review_date": None,
            }
        )
        .execute()
    )

    if created_response.data:
        return dict(created_response.data[0])

    return {
        "id": user_id,
        "current_streak": 0,
        "longest_streak": 0,
        "last_review_date": None,
    }


def _update_review_streak(user_id: str) -> int:
    today = datetime.now(timezone.utc).date()
    profile = _get_or_create_profile(user_id)
    last_review_date = _parse_supabase_date(profile.get("last_review_date"))
    current_streak = int(profile.get("current_streak") or 0)
    longest_streak = int(profile.get("longest_streak") or 0)
    next_streak = calculate_review_streak(last_review_date, current_streak, today)

    next_longest = max(longest_streak, next_streak)

    if last_review_date != today or next_longest != longest_streak:
        supabase.table("profiles").update(
            {
                "current_streak": next_streak,
                "longest_streak": next_longest,
                "last_review_date": today.isoformat(),
            }
        ).eq("id", user_id).execute()

    return next_streak


async def submit_sm2_review(user_id: str, word_id: str, quality: int) -> dict[str, Any] | None:
    def submit_review() -> dict[str, Any] | None:
        word_response = (
            supabase.table("words")
            .select(
                "id, user_id, repetitions, easiness_factor, interval_days, "
                "review_count"
            )
            .eq("id", word_id)
            .limit(1)
            .execute()
        )

        if not word_response.data:
            return {"error": "not_found"}

        word = word_response.data[0]

        if str(word.get("user_id")) != user_id:
            return {"error": "forbidden"}

        card = SM2Card(
            repetitions=int(word.get("repetitions") or 0),
            easiness_factor=float(word.get("easiness_factor") or 2.5),
            interval_days=int(word.get("interval_days") or 1),
        )
        result = calculate_sm2(card, quality)
        reviewed_at = datetime.now(timezone.utc)
        review_count = int(word.get("review_count") or 0) + 1
        review_level = min(result.repetitions, 3)

        update_response = (
            supabase.rpc(
                "submit_sm2_review_transaction",
                {
                    "p_user_id": user_id,
                    "p_word_id": word_id,
                    "p_quality": quality,
                    "p_repetitions": result.repetitions,
                    "p_easiness_factor": result.easiness_factor,
                    "p_interval_days": result.interval_days,
                    "p_next_review_at": result.next_review_at.isoformat(),
                    "p_reviewed_at": reviewed_at.isoformat(),
                    "p_review_count": review_count,
                    "p_review_level": review_level,
                },
            )
            .execute()
        )

        if not update_response.data:
            return None

        transaction_result = update_response.data[0]

        return {
            "word_id": word_id,
            "next_review_at": result.next_review_at,
            "interval_days": int(transaction_result.get("interval_days") or result.interval_days),
            "easiness_factor": float(
                transaction_result.get("easiness_factor") or result.easiness_factor
            ),
            "streak_maintained": bool(
                transaction_result.get("streak_maintained", quality >= 3)
            ),
            "current_streak": int(transaction_result.get("current_streak") or 0),
        }

    return await asyncio.to_thread(submit_review)


async def get_review_stats(user_id: str) -> dict[str, int]:
    def select_review_stats() -> dict[str, int]:
        now = datetime.now(timezone.utc)
        today = now.date()
        tomorrow = datetime.combine(today + timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc)
        end_of_today = tomorrow - timedelta(seconds=1)
        week_end = now + timedelta(days=7)
        today_iso = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
        end_of_today_iso = end_of_today.isoformat().replace("+00:00", "Z")
        tomorrow_iso = tomorrow.isoformat().replace("+00:00", "Z")
        week_end_iso = week_end.isoformat().replace("+00:00", "Z")
        due_today_filter = f"next_review_at.is.null,next_review_at.lte.{end_of_today_iso}"
        due_week_filter = f"next_review_at.is.null,next_review_at.lte.{week_end_iso}"

        due_today_response = (
            supabase.table("words")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .or_(due_today_filter)
            .execute()
        )
        due_week_response = (
            supabase.table("words")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .or_(due_week_filter)
            .execute()
        )
        total_response = (
            supabase.table("words")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        mastered_response = (
            supabase.table("words")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .gte("repetitions", 5)
            .execute()
        )
        reviewed_today_response = (
            supabase.table("review_logs")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .gte("reviewed_at", today_iso)
            .lt("reviewed_at", tomorrow_iso)
            .execute()
        )
        profile = _get_or_create_profile(user_id)

        return {
            "due_today": int(due_today_response.count or 0),
            "due_this_week": int(due_week_response.count or 0),
            "total_words": int(total_response.count or 0),
            "mastered_words": int(mastered_response.count or 0),
            "current_streak_days": int(profile.get("current_streak") or 0),
            "review_count_today": int(reviewed_today_response.count or 0),
        }

    return await asyncio.to_thread(select_review_stats)


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
        delay_days = delay_days_by_rating[rating]
        next_review_at = datetime.now(timezone.utc) + timedelta(days=delay_days)
        reviewed_at = datetime.now(timezone.utc)

        word_response = (
            supabase.table("words")
            .select("id, user_id, review_count, review_level")
            .eq("id", word_id)
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )

        if not word_response.data:
            return None

        current_word = word_response.data[0]
        review_count = int(current_word.get("review_count") or 0) + 1
        current_level = int(current_word.get("review_level") or 0)
        if rating == "again":
            review_level = 0
        elif rating == "good":
            review_level = min(current_level + 1, 3)
        else:
            review_level = min(current_level + 2, 3)

        response = (
            supabase.table("words")
            .update(
                {
                    "next_review_at": next_review_at.isoformat(),
                    "last_reviewed_at": reviewed_at.isoformat(),
                    "review_count": review_count,
                    "review_level": review_level,
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
