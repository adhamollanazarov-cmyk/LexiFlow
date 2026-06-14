from fastapi import APIRouter, Depends, HTTPException, Query

from app.middleware.auth import get_current_user
from app.models.schemas import (
    ReviewListResponse,
    ReviewUpdateRequest,
    ReviewUpdateResponse,
    ReviewWordResponse,
    VocabularyListResponse,
    WordCreate,
    WordResponse,
)
from app.services.supabase_service import (
    delete_word,
    get_due_review_words,
    get_words,
    save_word,
    update_word_review,
)

router = APIRouter()


@router.post("/api/vocabulary")
async def create_vocabulary_word(
    word: WordCreate,
    user_id: str = Depends(get_current_user),
) -> dict[str, str]:
    try:
        inserted_word = await save_word(user_id, word)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not save word") from exc

    return {"id": str(inserted_word["id"]), "message": "saved"}


@router.get("/api/vocabulary", response_model=VocabularyListResponse)
async def list_vocabulary_words(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user_id: str = Depends(get_current_user),
) -> VocabularyListResponse:
    try:
        words, total = await get_words(user_id, limit, offset)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not load vocabulary") from exc

    return VocabularyListResponse(
        words=[WordResponse(**word) for word in words],
        total=total,
    )


@router.delete("/api/vocabulary/{word_id}")
async def remove_vocabulary_word(
    word_id: str,
    user_id: str = Depends(get_current_user),
) -> dict[str, str]:
    try:
        deleted = await delete_word(word_id, user_id)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not delete word") from exc

    if not deleted:
        raise HTTPException(status_code=403, detail="Not authorized")

    return {"message": "deleted"}


@router.get("/api/review/due", response_model=ReviewListResponse)
async def list_due_review_words(
    limit: int = Query(20, ge=1, le=50),
    user_id: str = Depends(get_current_user),
) -> ReviewListResponse:
    try:
        words, total = await get_due_review_words(user_id, limit)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not load review words") from exc

    return ReviewListResponse(
        words=[ReviewWordResponse(**word) for word in words],
        total=total,
    )


@router.patch("/api/review/{word_id}", response_model=ReviewUpdateResponse)
async def update_review_word(
    word_id: str,
    request: ReviewUpdateRequest,
    user_id: str = Depends(get_current_user),
) -> ReviewUpdateResponse:
    try:
        updated_word = await update_word_review(word_id, user_id, request.rating)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not update review") from exc

    if not updated_word:
        raise HTTPException(status_code=403, detail="Not authorized")

    return ReviewUpdateResponse(
        id=str(updated_word["id"]),
        next_review_at=str(updated_word["next_review_at"]),
        review_count=int(updated_word.get("review_count") or 0),
        review_level=int(updated_word.get("review_level") or 0),
    )
