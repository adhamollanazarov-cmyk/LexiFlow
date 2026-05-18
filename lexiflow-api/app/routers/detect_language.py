from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth import get_current_user
from app.models.schemas import DetectLanguageRequest, DetectLanguageResponse
from app.services.deepl_service import detect_language

router = APIRouter()


@router.post("/api/detect-language", response_model=DetectLanguageResponse)
async def detect_document_language(
    request: DetectLanguageRequest,
    user_id: str = Depends(get_current_user),
) -> DetectLanguageResponse:
    try:
        detected_lang = await detect_language(request.text[:500])
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Language detection failed") from exc

    return DetectLanguageResponse(detected_lang=detected_lang)
