from fastapi import HTTPException
from openai import AsyncOpenAI, OpenAIError

from app.core.config import settings


async def get_explanation(
    word: str,
    sentence: str,
    ui_language: str,
    source_language: str,
) -> str:
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY is not configured",
        )

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
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
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
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
        explanation = response.choices[0].message.content

        if not explanation:
            raise HTTPException(
                status_code=502,
                detail="AI service unavailable",
            )

        return explanation.strip()
    except HTTPException:
        raise
    except OpenAIError:
        raise HTTPException(
            status_code=502,
            detail="AI service unavailable",
        )


async def translate_to_uzbek(text: str) -> str:
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY is not configured",
        )

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
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
        translation = response.choices[0].message.content

        if not translation:
            raise HTTPException(
                status_code=500,
                detail="Translation service unavailable",
            )

        return translation.strip()
    except HTTPException:
        raise
    except OpenAIError as exc:
        raise HTTPException(
            status_code=500,
            detail="Translation service unavailable",
        ) from exc


async def get_simple_definition(text: str, context: str, language: str) -> str:
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY is not configured",
        )

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    safe_context = context[:300]

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
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
        definition = response.choices[0].message.content

        if not definition:
            raise HTTPException(
                status_code=500,
                detail="Definition service unavailable",
            )

        return definition.strip()
    except HTTPException:
        raise
    except OpenAIError as exc:
        raise HTTPException(
            status_code=500,
            detail="Definition service unavailable",
        ) from exc
