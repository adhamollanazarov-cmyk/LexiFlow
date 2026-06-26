from datetime import date, timedelta


def update_streak(
    last_review_date: date | None,
    current_streak: int,
    today: date | None = None,
) -> int:
    review_day = today or date.today()
    yesterday = review_day - timedelta(days=1)

    if last_review_date is None:
        return 1

    if last_review_date == review_day:
        return current_streak

    if last_review_date == yesterday:
        return current_streak + 1

    return 1
