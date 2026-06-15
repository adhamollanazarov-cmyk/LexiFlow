from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator


LANGUAGE_CODE_ALIASES = {
    "DE": "DE",
    "GERMAN": "DE",
    "EN": "EN",
    "EN-US": "EN-US",
    "EN-GB": "EN-GB",
    "ENGLISH": "EN-US",
    "RU": "RU",
    "RUSSIAN": "RU",
    "UZ": "UZ",
    "UZB": "UZ",
    "UZBEK": "UZ",
    "FR": "FR",
    "FRENCH": "FR",
    "ES": "ES",
    "SPANISH": "ES",
    "TR": "TR",
    "TURKISH": "TR",
}


class TranslateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    text: str = Field(
        ...,
        min_length=1,
        max_length=500,
        validation_alias=AliasChoices("text", "word"),
    )
    source_lang: str = Field(
        ...,
        min_length=2,
        max_length=10,
        validation_alias=AliasChoices("source_lang", "source_language"),
    )
    target_lang: str = Field(
        ...,
        min_length=2,
        max_length=10,
        validation_alias=AliasChoices("target_lang", "target_language"),
    )
    context: str = Field(
        "",
        max_length=500,
        validation_alias=AliasChoices("context", "sentence"),
    )

    @field_validator("text", "source_lang", "target_lang", mode="before")
    @classmethod
    def non_empty_string(cls, value: object) -> str:
        if not isinstance(value, str) or not value.strip():
            raise ValueError("Required field must be a non-empty string")

        return value.strip()

    @field_validator("source_lang", "target_lang")
    @classmethod
    def normalize_language_code(cls, value: str) -> str:
        normalized = value.strip().upper().replace("_", "-")
        return LANGUAGE_CODE_ALIASES.get(normalized, normalized)


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
