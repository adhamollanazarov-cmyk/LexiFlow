from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth import get_current_user
from app.models.schemas import UserLanguagePreferencesUpdate, UserResponse
from app.services.supabase_service import (
    get_user_stats,
    update_streak,
    update_user_language_preferences,
)

router = APIRouter()


@router.get("/api/user/me", response_model=UserResponse)
async def get_me(user_id: str = Depends(get_current_user)) -> UserResponse:
    try:
        stats = await get_user_stats(user_id)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not load user") from exc

    return UserResponse(
        id=user_id,
        email=stats["email"],
        streak_count=stats["streak_count"],
        words_total=stats["words_total"],
        last_active_date=stats["last_active_date"],
        source_lang=stats["source_lang"],
        target_lang=stats["target_lang"],
    )


@router.post("/api/user/activity")
async def update_activity(
    user_id: str = Depends(get_current_user),
) -> dict[str, int | bool]:
    try:
        return await update_streak(user_id)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not update activity") from exc


@router.patch("/api/user/preferences")
async def update_preferences(
    request: UserLanguagePreferencesUpdate,
    user_id: str = Depends(get_current_user),
) -> dict[str, str]:
    try:
        return await update_user_language_preferences(
            user_id,
            request.source_lang,
            request.target_lang,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Could not update language preferences",
        ) from exc
