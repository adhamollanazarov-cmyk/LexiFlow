import logging

from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth import get_current_user
from app.models.schemas import TranslateRequest, TranslateResponse
from app.services.deepl_service import translate_text
from app.services.openai_service import get_simple_definition, translate_to_uzbek

logger = logging.getLogger(__name__)

router = APIRouter()


LANGUAGE_NAME_BY_CODE = {
    "EN": "English",
    "EN-US": "English",
    "EN-GB": "English",
    "RU": "Russian",
    "DE": "German",
    "FR": "French",
    "ES": "Spanish",
    "UZ": "Uzbek",
    "TR": "Turkish",
}


def normalize_language(code: str) -> str:
    return code.upper().split("_")[0]


def language_name(code: str) -> str:
    normalized = normalize_language(code)
    return LANGUAGE_NAME_BY_CODE.get(normalized, normalized)


def is_same_language(source_lang: str, target_lang: str) -> bool:
    return language_name(source_lang) == language_name(target_lang)


@router.post("/api/translate", response_model=TranslateResponse)
async def translate_word(
    request: TranslateRequest,
    user_id: str = Depends(get_current_user),
) -> TranslateResponse:
    try:
        if is_same_language(request.source_lang, request.target_lang):
            translation = await get_simple_definition(
                request.text,
                request.context,
                language_name(request.target_lang),
            )
            mode = "meaning"
            provider = "openai"
        elif request.target_lang.upper() == "UZ":
            translation = await translate_to_uzbek(request.text)
            mode = "translation"
            provider = "openai"
        else:
            translation = await translate_text(
                request.text,
                request.source_lang,
                request.target_lang,
            )
            mode = "translation"
            provider = "deepl"
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Translation failed") from exc

    logger.info("User %s translated: %s", user_id, request.text[:30])

    return TranslateResponse(translation=translation, provider=provider, mode=mode)
