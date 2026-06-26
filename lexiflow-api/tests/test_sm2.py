from app.services.sm2 import SM2Card, calculate_sm2


def test_quality_5_on_new_card_sets_interval_1_and_rep_1() -> None:
    result = calculate_sm2(SM2Card(0, 2.5, 1), 5)

    assert result.interval_days == 1
    assert result.repetitions == 1


def test_quality_5_twice_sets_interval_6_and_rep_2() -> None:
    first = calculate_sm2(SM2Card(0, 2.5, 1), 5)
    second = calculate_sm2(
        SM2Card(first.repetitions, first.easiness_factor, first.interval_days),
        5,
    )

    assert second.interval_days == 6
    assert second.repetitions == 2


def test_quality_5_three_times_multiplies_interval_by_easiness() -> None:
    result = calculate_sm2(SM2Card(2, 2.5, 6), 5)

    assert result.interval_days == 15
    assert result.repetitions == 3


def test_quality_0_after_successful_reps_resets_card() -> None:
    result = calculate_sm2(SM2Card(3, 2.5, 15), 0)

    assert result.repetitions == 0
    assert result.interval_days == 1


def test_easiness_factor_never_goes_below_1_3() -> None:
    result = calculate_sm2(SM2Card(3, 1.3, 15), 0)

    assert result.easiness_factor == 1.3


def test_repeated_quality_0_never_pushes_easiness_below_1_3() -> None:
    card = SM2Card(0, 2.5, 1)

    for _ in range(20):
        result = calculate_sm2(card, 0)
        card = SM2Card(
            result.repetitions,
            result.easiness_factor,
            result.interval_days,
        )

    assert card.easiness_factor == 1.3


def test_quality_3_on_new_card_sets_interval_1_and_rep_1() -> None:
    result = calculate_sm2(SM2Card(0, 2.5, 1), 3)

    assert result.interval_days == 1
    assert result.repetitions == 1
