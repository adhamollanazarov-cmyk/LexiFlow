from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ReviewSubmitRequest(BaseModel):
    word_id: UUID
    quality: int = Field(ge=0, le=5)


class ReviewSubmitResponse(BaseModel):
    word_id: UUID
    next_review_at: datetime
    interval_days: int
    easiness_factor: float
    streak_maintained: bool
    current_streak: int


class DueWordResponse(BaseModel):
    id: UUID
    word: str
    translation: str
    example_sentence: Optional[str]
    repetitions: int
    interval_days: int
    easiness_factor: float


class ReviewDueResponse(BaseModel):
    words: list[DueWordResponse]
    total: int


class ReviewStatsResponse(BaseModel):
    due_today: int
    due_this_week: int
    total_words: int
    mastered_words: int
    current_streak_days: int
    review_count_today: int
