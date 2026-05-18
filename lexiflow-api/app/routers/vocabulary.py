from fastapi import APIRouter, Depends, HTTPException, Query

from app.middleware.auth import get_current_user
from app.models.schemas import VocabularyListResponse, WordCreate, WordResponse
from app.services.supabase_service import delete_word, get_words, save_word

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
