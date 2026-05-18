from fastapi import HTTPException
from openai import AsyncOpenAI, OpenAIError

from app.core.config import settings


async def get_explanation(word: str, sentence: str, ui_language: str) -> str:
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
        "1. A short explanation in context (2-3 sentences)\n"
        "2. Two natural example sentences using this word\n\n"
        "Format your response exactly like this:\n"
        "📖 Explanation:\n"
        "[explanation here]\n\n"
        "✏️ Examples:\n"
        "1. [first example sentence]\n"
        "2. [second example sentence]"
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
