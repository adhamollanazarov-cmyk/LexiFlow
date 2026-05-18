import logging

from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth import get_current_user
from app.models.schemas import TranslateRequest, TranslateResponse
from app.services.deepl_service import translate_text
from app.services.openai_service import translate_to_uzbek

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/api/translate", response_model=TranslateResponse)
async def translate_word(
    request: TranslateRequest,
    user_id: str = Depends(get_current_user),
) -> TranslateResponse:
    try:
        if request.target_lang.upper() == "UZ":
            translation = await translate_to_uzbek(request.text)
        else:
            translation = await translate_text(
                request.text,
                request.source_lang,
                request.target_lang,
            )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Translation failed") from exc

    logger.info("User %s translated: %s", user_id, request.text[:30])

    return TranslateResponse(translation=translation)
