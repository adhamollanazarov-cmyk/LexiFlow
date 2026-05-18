from fastapi import HTTPException
import httpx

from app.core.config import settings

DEEPL_TRANSLATE_URL = "https://api-free.deepl.com/v2/translate"


async def translate_text(text: str, source_lang: str, target_lang: str) -> str:
    if not settings.DEEPL_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="DEEPL_API_KEY is not configured",
        )

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                DEEPL_TRANSLATE_URL,
                headers={
                    "Authorization": f"DeepL-Auth-Key {settings.DEEPL_API_KEY}"
                },
                json={
                    "text": [text],
                    "source_lang": source_lang,
                    "target_lang": target_lang,
                },
            )
            response.raise_for_status()
            data = response.json()
            translation = data.get("translations", [{}])[0].get("text")

            if not translation:
                raise HTTPException(
                    status_code=500,
                    detail="Translation service returned an empty result",
                )

            return str(translation)
    except HTTPException:
        raise
    except (httpx.HTTPError, KeyError, IndexError, TypeError):
        raise HTTPException(
            status_code=500,
            detail="Translation service unavailable",
        )


async def detect_language(text: str) -> str:
    if not settings.DEEPL_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="DEEPL_API_KEY is not configured",
        )

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                DEEPL_TRANSLATE_URL,
                headers={
                    "Authorization": f"DeepL-Auth-Key {settings.DEEPL_API_KEY}"
                },
                json={
                    "text": [text],
                    "target_lang": "EN-US",
                },
            )
            response.raise_for_status()
            data = response.json()
            detected = data.get("translations", [{}])[0].get(
                "detected_source_language"
            )

            if not detected:
                raise HTTPException(
                    status_code=500,
                    detail="Language detection returned an empty result",
                )

            return str(detected)
    except HTTPException:
        raise
    except (httpx.HTTPError, KeyError, IndexError, TypeError):
        raise HTTPException(
            status_code=500,
            detail="Language detection unavailable",
        )
