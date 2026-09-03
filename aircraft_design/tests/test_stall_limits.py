"""Transcribed regulation, so the test is a transcription check.

Nothing here is computed. What can go wrong is a number typed wrongly or a
row that quietly stops being the one Sheet 04 draws, so this pins the two
values the figure depends on and the invariants that hold across the table.
"""

from aircraft_design.stall_limits import STALL_LIMITS

BY_VALUE = {row.value: row for row in STALL_LIMITS}


def test_row_identifiers_are_unique():
    assert len(BY_VALUE) == len(STALL_LIMITS)


def test_the_two_limits_fig_3_5_draws():
    """Sheet 04 draws these two in green. If either moves, the figure lies."""
    assert BY_VALUE["light_sport"].limit_kcas == 45.0
    assert BY_VALUE["light_sport"].speed == "VS1"
    assert BY_VALUE["far23_single"].limit_kcas == 61.0
    assert BY_VALUE["far23_single"].speed == "VS0"


def test_the_light_twin_carries_the_same_ceiling_as_the_single():
    assert (
        BY_VALUE["far23_light_twin"].limit_kcas
        == BY_VALUE["far23_single"].limit_kcas
    )


def test_the_ultralight_is_the_slowest_rule():
    assert BY_VALUE["ultralight"].limit_kcas == 24.0
    numeric = [row.limit_kcas for row in STALL_LIMITS if row.limit_kcas]
    assert min(numeric) == 24.0


def test_rows_without_a_ceiling_say_so_rather_than_omitting_it():
    """``None`` is the answer, not a gap — and it needs an explanation."""
    unbounded = [row for row in STALL_LIMITS if row.limit_kcas is None]

    assert {row.value for row in unbounded} == {
        "far23_amendment_64",
        "far25_transport",
        "uas_part_107",
    }
    for row in unbounded:
        assert row.speed == "", row.value
        assert len(row.note) > 40, row.value
        assert row.derived_basis, row.value


def test_the_derived_column_is_only_for_rules_that_set_no_ceiling():
    """Otherwise the table would offer two answers to the same question."""
    for row in STALL_LIMITS:
        if row.limit_kcas is not None:
            assert row.derived_kcas is None, row.value
            assert row.derived_basis == "", row.value


def test_the_transport_ceiling_is_the_approach_category_boundary():
    """140 KCAS is where FAA approach category C ends, and VREF = 1.3 VS0."""
    transport = BY_VALUE["far25_transport"]

    assert transport.derived_kcas == 107.0
    # 140 / 1.3 = 107.7, taken down to the whole knot inside the category.
    assert int(140 / 1.3) == transport.derived_kcas
    assert "97.3" in transport.derived_basis


def test_the_restructured_part_23_still_works_to_61_knots():
    amended = BY_VALUE["far23_amendment_64"]

    assert amended.derived_kcas == BY_VALUE["far23_single"].limit_kcas
    assert "consensus standards" in amended.derived_basis


def test_the_uas_row_offers_no_number_because_there_is_none_to_offer():
    """Recovery method sets it, and recovery methods disagree."""
    uas = BY_VALUE["uas_part_107"]

    assert uas.limit_kcas is None
    assert uas.derived_kcas is None
    assert uas.derived_basis


def test_every_row_names_the_section_to_read():
    for row in STALL_LIMITS:
        assert row.citation.startswith("14 CFR"), row.value
        assert row.label and row.note, row.value


def test_the_table_reads_as_a_ladder():
    """Slowest rule first; the rows without a ceiling come last."""
    numeric = [row.limit_kcas for row in STALL_LIMITS if row.limit_kcas]
    assert numeric == sorted(numeric)

    first_unbounded = next(
        index
        for index, row in enumerate(STALL_LIMITS)
        if row.limit_kcas is None
    )
    assert all(
        row.limit_kcas is None for row in STALL_LIMITS[first_unbounded:]
    )
