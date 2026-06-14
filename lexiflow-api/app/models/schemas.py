from pydantic import BaseModel, Field


class TranslateRequest(BaseModel):
    text: str = Field(..., max_length=500)
    source_lang: str = "EN-US"
    target_lang: str = "RU"
    context: str = Field("", max_length=300)


class TranslateResponse(BaseModel):
    translation: str
    provider: str = "deepl"
    mode: str = "translation"


class ExplainRequest(BaseModel):
    word: str
    sentence: str
    target_lang: str = "RU"
    ui_language: str = "English"
    source_language: str = "English"


class ExplainResponse(BaseModel):
    explanation: str


class DetectLanguageRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)


class DetectLanguageResponse(BaseModel):
    detected_lang: str


class WordCreate(BaseModel):
    original: str
    translation: str
    context_sentence: str = ""
    document_name: str = ""
    source_lang: str = "EN-US"
    target_lang: str = "RU"


class WordResponse(BaseModel):
    id: str
    original: str
    translation: str
    context_sentence: str
    document_name: str
    created_at: str
    next_review_at: str | None = None
    last_reviewed_at: str | None = None
    review_count: int = 0
    review_level: int = 0
    source_lang: str = ""
    target_lang: str = ""


class VocabularyListResponse(BaseModel):
    words: list[WordResponse]
    total: int


class ReviewWordResponse(BaseModel):
    id: str
    original: str
    translation: str
    context_sentence: str = ""
    document_name: str = ""
    source_lang: str = ""
    target_lang: str = ""
    created_at: str
    review_count: int = 0
    review_level: int = 0


class ReviewListResponse(BaseModel):
    words: list[ReviewWordResponse]
    total: int


class ReviewUpdateRequest(BaseModel):
    rating: str = Field(..., pattern="^(again|good|easy)$")


class ReviewUpdateResponse(BaseModel):
    id: str
    next_review_at: str
    review_count: int
    review_level: int


class UserResponse(BaseModel):
    id: str
    email: str
    streak_count: int
    words_total: int
    last_active_date: str | None = None
    source_lang: str = "EN-US"
    target_lang: str = "RU"


class UserLanguagePreferencesUpdate(BaseModel):
    source_lang: str
    target_lang: str
