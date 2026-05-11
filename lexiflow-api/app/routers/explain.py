from fastapi import APIRouter, Depends

from app.middleware.auth import get_current_user
from app.models.schemas import ExplainRequest, ExplainResponse
from app.services.openai_service import get_explanation

router = APIRouter()


@router.post("/api/explain", response_model=ExplainResponse)
async def explain_word(
    request: ExplainRequest,
    user_id: str = Depends(get_current_user),
) -> ExplainResponse:
    explanation = await get_explanation(
        request.word,
        request.sentence[:300],
        request.target_lang,
    )

    return ExplainResponse(explanation=explanation)
