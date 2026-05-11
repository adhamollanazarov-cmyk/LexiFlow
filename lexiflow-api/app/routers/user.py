from fastapi import APIRouter, Depends

from app.middleware.auth import get_current_user
from app.models.schemas import UserResponse
from app.services.supabase_service import get_user_stats, update_streak

router = APIRouter()


@router.get("/api/user/me", response_model=UserResponse)
async def get_me(user_id: str = Depends(get_current_user)) -> UserResponse:
    stats = await get_user_stats(user_id)

    return UserResponse(
        id=user_id,
        email=stats["email"],
        streak_count=stats["streak_count"],
        words_total=stats["words_total"],
        last_active_date=stats["last_active_date"],
    )


@router.post("/api/user/activity")
async def update_activity(
    user_id: str = Depends(get_current_user),
) -> dict[str, int | bool]:
    return await update_streak(user_id)
