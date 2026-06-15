import logging

import httpx
from fastapi import HTTPException
from openai import AsyncOpenAI, OpenAIError

from app.core.config import settings

logger = logging.getLogger(__name__)


async def _create_chat_completion(
    *,
    messages: list[dict[str, str]],
    max_tokens: int,
    temperature: float,
) -> str:
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="AI translation provider is not configured",
        )

    try:
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        content = response.choices[0].message.content
    except TypeError as exc:
        logger.warning(
            "OpenAI SDK client failed before request; using direct HTTP fallback: %s",
            exc.__class__.__name__,
        )
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "gpt-4o-mini",
                        "messages": messages,
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                    },
                )
                response.raise_for_status()
                data = response.json()
                content = data.get("choices", [{}])[0].get("message", {}).get(
                    "content"
                )
        except httpx.HTTPStatusError as http_error:
            logger.warning(
                "OpenAI HTTP fallback failed status_code=%s",
                http_error.response.status_code,
            )
            raise HTTPException(
                status_code=502,
                detail="AI translation provider unavailable",
            ) from http_error
        except (httpx.HTTPError, KeyError, IndexError, TypeError) as http_error:
            logger.warning(
                "OpenAI HTTP fallback failed error=%s",
                http_error.__class__.__name__,
            )
            raise HTTPException(
                status_code=502,
                detail="AI translation provider unavailable",
            ) from http_error
    except OpenAIError as exc:
        logger.warning("OpenAI request failed error=%s", exc.__class__.__name__)
        raise HTTPException(
            status_code=502,
            detail="AI translation provider unavailable",
        ) from exc

    if not content:
        raise HTTPException(
            status_code=502,
            detail="AI translation provider returned an empty result",
        )

    return content.strip()


async def get_explanation(
    word: str,
    sentence: str,
    ui_language: str,
    source_language: str,
) -> str:
    context_sentence = sentence[:300]

    system_prompt = (
        f"You are a language learning assistant. Always respond in {ui_language}.\n"
        "For the given word or phrase, provide:\n"
        f"1. A short explanation in context (2-3 sentences) - write this in {ui_language}\n"
        f"2. Two natural example sentences using this word - write these in {source_language}\n\n"
        "Format your response exactly like this:\n"
        "📖 Explanation:\n"
        f"[explanation in {ui_language}]\n\n"
        "✏️ Examples:\n"
        f"1. [first example sentence in {source_language}]\n"
        f"2. [second example sentence in {source_language}]"
    )

    try:
        return await _create_chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": f"Word: {word}\nContext: {context_sentence}",
                },
            ],
            max_tokens=200,
            temperature=0.3,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("AI explanation failed error=%s", exc.__class__.__name__)
        raise HTTPException(
            status_code=502,
            detail="AI service unavailable",
        ) from exc


async def translate_to_uzbek(text: str) -> str:
    try:
        return await _create_chat_completion(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a professional translator. Translate the given "
                        "text to Uzbek accurately. Return ONLY the translated "
                        "text, no explanations, no quotes."
                    ),
                },
                {"role": "user", "content": text},
            ],
            max_tokens=200,
            temperature=0.2,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Uzbek translation failed error=%s", exc.__class__.__name__)
        raise HTTPException(
            status_code=502,
            detail="Translation service unavailable",
        ) from exc


async def translate_with_openai(
    text: str,
    context: str,
    source_language: str,
    target_language: str,
) -> str:
    safe_context = context[:300]

    try:
        return await _create_chat_completion(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a professional translator. Translate the selected "
                        f"word or short phrase from {source_language} to {target_language}. "
                        "Use the context only to choose the correct meaning. Return ONLY "
                        "the translated text, no explanations, no quotes."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Text: {text}\nContext: {safe_context}",
                },
            ],
            max_tokens=120,
            temperature=0.2,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("OpenAI translation failed error=%s", exc.__class__.__name__)
        raise HTTPException(
            status_code=502,
            detail="Translation service unavailable",
        ) from exc


async def get_simple_definition(text: str, context: str, language: str) -> str:
    safe_context = context[:300]

    try:
        return await _create_chat_completion(
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"You are a beginner-friendly dictionary. Respond in {language}. "
                        "Give one short simple meaning for the selected word or phrase. "
                        "Use one sentence only. Do not translate the whole context. "
                        "Do not add examples, quotes, or extra labels."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Word: {text}\nContext: {safe_context}",
                },
            ],
            max_tokens=80,
            temperature=0.2,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Simple definition failed error=%s", exc.__class__.__name__)
        raise HTTPException(
            status_code=502,
            detail="Definition service unavailable",
        ) from exc
