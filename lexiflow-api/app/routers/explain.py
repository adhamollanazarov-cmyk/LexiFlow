from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth import get_current_user
from app.models.schemas import ExplainRequest, ExplainResponse
from app.services.openai_service import get_explanation

router = APIRouter()


@router.post("/api/explain", response_model=ExplainResponse)
async def explain_word(
    request: ExplainRequest,
    user_id: str = Depends(get_current_user),
) -> ExplainResponse:
    try:
        explanation = await get_explanation(
            request.word,
            request.sentence[:300],
            request.ui_language,
            request.source_language,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="AI explanation failed") from exc

    return ExplainResponse(explanation=explanation)
