from datetime import date, timedelta

from app.services.streak import update_streak


def test_review_streak_scenarios() -> None:
    today = date.today()
    yesterday = today - timedelta(days=1)
    two_days_ago = today - timedelta(days=2)

    cases = [
        (None, 0, 1, "first ever review"),
        (today, 5, 5, "second session today"),
        (yesterday, 5, 6, "reviewed yesterday"),
        (two_days_ago, 5, 1, "missed a day"),
    ]

    for last_date, current, expected, label in cases:
        result = update_streak(last_review_date=last_date, current_streak=current)
        assert result == expected, f"FAIL [{label}]: got {result}, expected {expected}"
