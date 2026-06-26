from dataclasses import dataclass
from datetime import datetime, timedelta, timezone


@dataclass
class SM2Card:
    repetitions: int
    easiness_factor: float
    interval_days: int


@dataclass
class SM2Result:
    repetitions: int
    easiness_factor: float
    interval_days: int
    next_review_at: datetime


def calculate_sm2(card: SM2Card, quality: int) -> SM2Result:
    """
    quality: 0-5
      5 = perfect response
      4 = correct after hesitation
      3 = correct with serious difficulty
      2 = incorrect, easy to recall
      1 = incorrect, hard to recall
      0 = complete blackout
    """
    if not 0 <= quality <= 5:
        raise ValueError("Quality must be between 0 and 5")

    rep = card.repetitions
    ef = card.easiness_factor
    interval = card.interval_days

    if quality >= 3:
        if rep == 0:
            interval = 1
        elif rep == 1:
            interval = 6
        else:
            interval = round(interval * ef)
        rep += 1
    else:
        rep = 0
        interval = 1

    ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    ef = max(1.3, ef)

    next_review = datetime.now(timezone.utc) + timedelta(days=interval)

    return SM2Result(
        repetitions=rep,
        easiness_factor=round(ef, 4),
        interval_days=interval,
        next_review_at=next_review,
    )
