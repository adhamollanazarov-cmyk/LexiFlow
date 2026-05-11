import logging

from fastapi import APIRouter, Depends

from app.middleware.auth import get_current_user
from app.models.schemas import TranslateRequest, TranslateResponse
from app.services.deepl_service import translate_text

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/api/translate", response_model=TranslateResponse)
async def translate_word(
    request: TranslateRequest,
    user_id: str = Depends(get_current_user),
) -> TranslateResponse:
    translation = await translate_text(
        request.text,
        request.source_lang,
        request.target_lang,
    )
    logger.info("User %s translated: %s", user_id, request.text[:30])

    return TranslateResponse(translation=translation)
