from dataclasses import replace
from math import isclose
from unittest import TestCase

from aircraft_design.sref import (
    ENGINE_CATALOG,
    SrefCalculationError,
    SrefInputs,
    calculate_sref,
)


def assert_close(test_case: TestCase, actual: float, expected: float) -> None:
    test_case.assertTrue(
        isclose(actual, expected, rel_tol=1e-12, abs_tol=1e-8),
        f"{actual!r} != {expected!r}",
    )


class CalculateSrefParityTests(TestCase):
    """Parity against the cached 'Sref and POWER SIZING' worksheet."""

    def test_atmosphere_matches_workbook(self):
        result = calculate_sref()

        assert_close(
            self, result.atmosphere.rho_altitude_slug_per_ft3, 0.001756074594414648
        )
        assert_close(self, result.atmosphere.sigma, 0.7384670287698267)
        assert_close(
            self, result.atmosphere.rho_ceiling_slug_per_ft3, 0.0013552150962194316
        )
        assert_close(self, result.atmosphere.sigma_ceiling, 0.5698970127079191)

    def test_stall_limit_and_induced_factor_match_workbook(self):
        result = calculate_sref()

        assert_close(self, result.stall_limit_wing_loading, 22.691275793164802)
        assert_close(self, result.induced_drag_factor, 0.054006965223581664)

    def test_cruise_weights_use_the_cruise_only_fraction(self):
        result = calculate_sref()

        assert_close(self, result.weight_start_cruise_lb, 5561.01)
        assert_close(self, result.weight_end_cruise_lb, 5142.31867529277)
        assert_close(self, result.weight_average_cruise_lb, 5351.664337646385)

    def test_constraint_curves_reproduce_workbook_table(self):
        # Workbook J3:P21 — x from 10 to 46 step 2, four W/P curves per row.
        workbook_first_row = (5.965230373322869, 16.54121527970375,
                              11.372662139759335, 19.61436792878416)
        workbook_last_row = (15.301246640950101, 5.439596384090968,
                             9.149266983344651, 9.93535179982165)

        result = calculate_sref()
        points = {point.wing_loading: point for point in result.curves}

        self.assertEqual(len(result.curves), 19)
        self.assertIn(10.0, points)
        self.assertEqual(max(points), 46.0)

        first = points[10.0]
        assert_close(self, first.wp_vmax, workbook_first_row[0])
        assert_close(self, first.wp_takeoff, workbook_first_row[1])
        assert_close(self, first.wp_climb, workbook_first_row[2])
        assert_close(self, first.wp_ceiling, workbook_first_row[3])

        last = points[46.0]
        assert_close(self, last.wp_vmax, workbook_last_row[0])
        assert_close(self, last.wp_takeoff, workbook_last_row[1])
        assert_close(self, last.wp_climb, workbook_last_row[2])
        assert_close(self, last.wp_ceiling, workbook_last_row[3])

    def test_sizing_from_default_design_point_uses_corrected_cruise_weight(self):
        result = calculate_sref()

        assert_close(self, result.sizing.wing_area_ft2, 5850.0 / 22.691275793164802)
        assert_close(self, result.sizing.wing_area_m2, 23.951178858082848)
        assert_close(self, result.sizing.power_required_hp, 508.69565217391306)
        assert_close(self, result.sizing.power_per_engine_hp, 254.34782608695653)
        assert_close(self, result.sizing.total_horsepower_hp, 508.69565217391306)
        assert_close(self, result.sizing.cruise_cl, 0.4233293675295599)

    def test_catalog_covers_all_propulsion_families(self):
        types = {engine.engine_type.value for engine in ENGINE_CATALOG}
        self.assertEqual(types, {"piston", "turboprop", "turbofan"})

        turbofans = [e for e in ENGINE_CATALOG if e.engine_type.value == "turbofan"]
        self.assertTrue(all(e.thrust_lbf and e.thrust_lbf > 0 for e in turbofans))
        self.assertTrue(all(e.hp == 0 for e in turbofans))

    def test_catalog_numbers_are_unique(self):
        numbers = [engine.number for engine in ENGINE_CATALOG]
        self.assertEqual(len(numbers), len(set(numbers)))

    def test_sizing_result_carries_no_catalog(self):
        """The catalog is served by its own endpoint, not repeated per solve."""
        result = calculate_sref()
        self.assertFalse(hasattr(result, "engines"))
        self.assertFalse(hasattr(result, "selected_engine"))

    def test_zero_wing_loading_rejected(self):
        inputs = SrefInputs()
        bad = replace(
            inputs,
            design_point=replace(inputs.design_point, wing_loading_lb_per_ft2=0.0),
        )
        with self.assertRaises(SrefCalculationError):
            calculate_sref(bad)

    def test_zero_power_loading_rejected(self):
        inputs = SrefInputs()
        bad = replace(
            inputs,
            design_point=replace(inputs.design_point, power_loading_lb_per_hp=0.0),
        )
        with self.assertRaises(SrefCalculationError):
            calculate_sref(bad)

    def test_fractional_efficiency_above_one_rejected(self):
        inputs = SrefInputs()
        bad = replace(
            inputs,
            aerodynamics=replace(inputs.aerodynamics, prop_efficiency_climb=1.2),
        )
        with self.assertRaises(SrefCalculationError):
            calculate_sref(bad)

    def test_ceiling_beyond_density_model_rejected(self):
        inputs = SrefInputs()
        bad = replace(
            inputs,
            atmosphere=replace(inputs.atmosphere, service_ceiling_ft=30000.0),
        )
        with self.assertRaises(SrefCalculationError):
            calculate_sref(bad)

    def test_non_integer_engine_count_rejected(self):
        inputs = SrefInputs()
        bad = replace(
            inputs,
            design_point=replace(inputs.design_point, engine_count=1.5),
        )
        with self.assertRaises(SrefCalculationError):
            calculate_sref(bad)
