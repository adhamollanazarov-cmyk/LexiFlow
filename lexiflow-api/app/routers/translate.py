import logging

from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth import get_current_user
from app.models.schemas import TranslateRequest, TranslateResponse
from app.services.deepl_service import translate_text
from app.services.openai_service import get_simple_definition, translate_with_openai

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
SUPPORTED_LANGUAGE_CODES = set(LANGUAGE_NAME_BY_CODE)


def normalize_language(code: str) -> str:
    return code.upper().replace("_", "-")


def language_name(code: str) -> str:
    normalized = normalize_language(code)
    return LANGUAGE_NAME_BY_CODE.get(normalized, normalized)


def is_same_language(source_lang: str, target_lang: str) -> bool:
    return language_name(source_lang) == language_name(target_lang)


def is_openai_translation_target(target_lang: str) -> bool:
    return normalize_language(target_lang) == "UZ"


def validate_language_codes(source_lang: str, target_lang: str) -> None:
    unsupported = [
        code
        for code in (normalize_language(source_lang), normalize_language(target_lang))
        if code not in SUPPORTED_LANGUAGE_CODES
    ]

    if unsupported:
        raise HTTPException(
            status_code=400,
            detail="Unsupported language code",
        )


@router.post("/api/translate", response_model=TranslateResponse)
async def translate_word(
    request: TranslateRequest,
    user_id: str = Depends(get_current_user),
) -> TranslateResponse:
    validate_language_codes(request.source_lang, request.target_lang)

    try:
        if is_same_language(request.source_lang, request.target_lang):
            translation = await get_simple_definition(
                request.text,
                request.context,
                language_name(request.target_lang),
            )
            mode = "meaning"
            provider = "openai"
        elif is_openai_translation_target(request.target_lang):
            translation = await translate_with_openai(
                request.text,
                request.context,
                language_name(request.source_lang),
                language_name(request.target_lang),
            )
            mode = "translation"
            provider = "openai"
        else:
            try:
                translation = await translate_text(
                    request.text,
                    request.source_lang,
                    request.target_lang,
                )
                mode = "translation"
                provider = "deepl"
            except HTTPException as exc:
                logger.warning(
                    "DeepL translation failed; falling back to OpenAI "
                    "status_code=%s source_lang=%s target_lang=%s has_text=%s",
                    exc.status_code,
                    request.source_lang,
                    request.target_lang,
                    bool(request.text),
                )
                translation = await translate_with_openai(
                    request.text,
                    request.context,
                    language_name(request.source_lang),
                    language_name(request.target_lang),
                )
                mode = "translation"
                provider = "openai"
    except HTTPException as exc:
        logger.warning(
            "Translation provider failed status_code=%s source_lang=%s "
            "target_lang=%s has_text=%s",
            exc.status_code,
            request.source_lang,
            request.target_lang,
            bool(request.text),
        )
        raise
    except Exception as exc:
        logger.warning(
            "Unexpected translation failure error=%s source_lang=%s "
            "target_lang=%s has_text=%s",
            exc.__class__.__name__,
            request.source_lang,
            request.target_lang,
            bool(request.text),
        )
        raise HTTPException(status_code=500, detail="Translation failed") from exc

    logger.info(
        "Translation request user_id=%s source_lang=%s target_lang=%s has_text=%s",
        user_id,
        request.source_lang,
        request.target_lang,
        bool(request.text),
    )

    return TranslateResponse(translation=translation, provider=provider, mode=mode)
