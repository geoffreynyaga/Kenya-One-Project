"""Table 3-1 is transcribed data, so the test is a transcription check.

There is no formula to verify here. What can go wrong is a row entered
wrongly, so this pins the shape of every row, spot-checks the three classes
this project actually designs against, and asserts the invariants that hold
across the whole table.
"""

from aircraft_design.aero_classes import AERO_CLASSES


def test_the_table_has_every_row_the_book_prints():
    assert len(AERO_CLASSES) == 13


def test_row_identifiers_are_unique():
    assert len({row.value for row in AERO_CLASSES}) == len(AERO_CLASSES)


def test_the_ga_rows_match_the_book():
    by_value = {row.value: row for row in AERO_CLASSES}

    trainer = by_value["ga_trainer"]
    assert (trainer.cd_min_low, trainer.cd_min_high) == (0.030, 0.035)
    assert (trainer.cd_takeoff_low, trainer.cd_takeoff_high) == (0.040, 0.045)
    assert trainer.cl_takeoff == 0.7

    fixed_gear = by_value["ga_single_fixed_gear"]
    assert (fixed_gear.cd_min_low, fixed_gear.cd_min_high) == (0.028, 0.035)
    assert (fixed_gear.cd_takeoff_low, fixed_gear.cd_takeoff_high) == (
        0.038,
        0.045,
    )

    high_performance = by_value["ga_high_performance_single"]
    assert (high_performance.cd_min_low, high_performance.cd_min_high) == (
        0.025,
        0.027,
    )


def test_the_biplane_is_the_only_row_without_flaps():
    without_flaps = [
        row for row in AERO_CLASSES if "no flaps" in row.comment
    ]
    assert [row.value for row in without_flaps] == ["biplane"]
    assert without_flaps[0].cl_takeoff == 0.4


def test_every_range_is_ordered_and_positive():
    for row in AERO_CLASSES:
        assert 0 < row.cd_min_low <= row.cd_min_high, row.value
        assert 0 < row.cd_takeoff_low <= row.cd_takeoff_high, row.value
        assert 0 < row.cl_takeoff, row.value


def test_the_take_off_configuration_always_costs_drag():
    """Gear down and flaps out cannot be cleaner than the clean airframe."""
    for row in AERO_CLASSES:
        assert row.cd_takeoff_low >= row.cd_min_low, row.value
        assert row.cd_takeoff_high >= row.cd_min_high, row.value


def test_the_ground_run_lift_coefficients_are_ground_attitude_values():
    """Not the lift coefficient at rotation, which is roughly twice these.

    The distinction matters because eq. (3-4) reads C_L_TO as the lift the
    wing carries during the roll. Every row sits well under 1.0; a value
    near 1.5 in one of these fields is a liftoff coefficient in the wrong
    place.
    """
    for row in AERO_CLASSES:
        assert row.cl_takeoff <= 0.8, row.value
