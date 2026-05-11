from fastapi import HTTPException
from openai import AsyncOpenAI, OpenAIError

from app.core.config import settings


async def get_explanation(word: str, sentence: str, target_lang: str) -> str:
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY is not configured",
        )

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    context_sentence = sentence[:300]

    system_prompt = (
        "You are a professional language tutor.\n"
        "When given a word and its context sentence, explain the word's meaning "
        f"in {target_lang} in 2-3 sentences maximum.\n"
        "Focus on: (1) what the word means in THIS specific context,\n"
        "(2) one alternative meaning if relevant.\n"
        "Be concise. Do NOT translate the whole sentence.\n"
        "Do NOT explain grammar rules."
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
