from fastapi import HTTPException
import httpx

from app.core.config import settings

DEEPL_TRANSLATE_URL = "https://api-free.deepl.com/v2/translate"


async def translate_text(text: str, source_lang: str, target_lang: str) -> str:
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
            return str(data["translations"][0]["text"])
    except (httpx.HTTPError, KeyError, IndexError, TypeError):
        raise HTTPException(
            status_code=502,
            detail="Translation service unavailable",
        )
