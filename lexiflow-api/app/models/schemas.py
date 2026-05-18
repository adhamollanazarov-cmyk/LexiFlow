from pydantic import BaseModel, Field


class TranslateRequest(BaseModel):
    text: str = Field(..., max_length=500)
    source_lang: str = "DE"
    target_lang: str = "RU"


class TranslateResponse(BaseModel):
    translation: str
    provider: str = "deepl"


class ExplainRequest(BaseModel):
    word: str
    sentence: str
    target_lang: str = "RU"


class ExplainResponse(BaseModel):
    explanation: str


class WordCreate(BaseModel):
    original: str
    translation: str
    context_sentence: str = ""
    document_name: str = ""
    source_lang: str = "DE"
    target_lang: str = "RU"


class WordResponse(BaseModel):
    id: str
    original: str
    translation: str
    context_sentence: str
    document_name: str
    created_at: str


class VocabularyListResponse(BaseModel):
    words: list[WordResponse]
    total: int


class UserResponse(BaseModel):
    id: str
    email: str
    streak_count: int
    words_total: int
    last_active_date: str | None = None
    source_lang: str = "DE"
    target_lang: str = "RU"


class UserLanguagePreferencesUpdate(BaseModel):
    source_lang: str
    target_lang: str
