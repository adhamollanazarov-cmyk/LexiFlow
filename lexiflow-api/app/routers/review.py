from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.middleware.auth import get_current_user
from app.schemas.review import (
    DueWordResponse,
    ReviewDueResponse,
    ReviewStatsResponse,
    ReviewSubmitRequest,
    ReviewSubmitResponse,
)
from app.services.supabase_service import (
    get_review_stats,
    get_sm2_due_review_words,
    submit_sm2_review,
)

router = APIRouter()


@router.get("/api/review/due", response_model=ReviewDueResponse)
async def list_due_review_words(
    limit: int = Query(20, ge=1, le=50),
    user_id: str = Depends(get_current_user),
) -> ReviewDueResponse:
    try:
        words, total = await get_sm2_due_review_words(user_id, limit)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not load review words") from exc

    return ReviewDueResponse(
        words=[
            DueWordResponse(
                id=word["id"],
                word=str(word.get("original") or ""),
                translation=str(word.get("translation") or ""),
                example_sentence=word.get("context_sentence"),
                repetitions=int(word.get("repetitions") or 0),
                interval_days=int(word.get("interval_days") or 1),
                easiness_factor=float(word.get("easiness_factor") or 2.5),
            )
            for word in words
        ],
        total=total,
    )


@router.post("/api/review/submit", response_model=ReviewSubmitResponse)
async def submit_review(
    request: ReviewSubmitRequest,
    user_id: str = Depends(get_current_user),
) -> ReviewSubmitResponse:
    try:
        result = await submit_sm2_review(user_id, str(request.word_id), request.quality)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not update review") from exc

    if not result:
        raise HTTPException(status_code=403, detail="Not authorized")

    if result.get("error") == "not_found":
        raise HTTPException(status_code=404, detail="Review word not found")

    if result.get("error") == "forbidden":
        raise HTTPException(status_code=403, detail="Not authorized")

    return ReviewSubmitResponse(**result)


@router.get("/api/review/stats", response_model=ReviewStatsResponse)
async def get_stats(user_id: str = Depends(get_current_user)) -> ReviewStatsResponse:
    try:
        stats = await get_review_stats(user_id)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not load review stats") from exc

    return ReviewStatsResponse(**stats)


@router.patch("/api/review/{word_id}")
async def submit_legacy_review(
    word_id: UUID,
    request: dict[str, str],
    user_id: str = Depends(get_current_user),
) -> dict[str, str | int | float | bool]:
    quality_by_rating = {
        "again": 1,
        "hard": 3,
        "good": 4,
        "easy": 5,
    }
    quality = quality_by_rating.get(str(request.get("rating") or ""))

    if quality is None:
        raise HTTPException(status_code=400, detail="Invalid review rating")

    result = await submit_sm2_review(user_id, str(word_id), quality)

    if not result:
        raise HTTPException(status_code=403, detail="Not authorized")

    if result.get("error") == "not_found":
        raise HTTPException(status_code=404, detail="Review word not found")

    if result.get("error") == "forbidden":
        raise HTTPException(status_code=403, detail="Not authorized")

    return {
        "id": str(result["word_id"]),
        "next_review_at": result["next_review_at"].isoformat(),
        "interval_days": result["interval_days"],
        "easiness_factor": result["easiness_factor"],
        "streak_maintained": result["streak_maintained"],
        "current_streak": result["current_streak"],
    }
