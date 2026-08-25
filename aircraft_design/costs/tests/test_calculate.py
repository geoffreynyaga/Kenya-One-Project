from dataclasses import replace
from math import isclose
from unittest import TestCase

from aircraft_design.costs import (
    CostCalculationError,
    CostInputs,
    DevelopmentAssumptions,
    FinancingAssumptions,
    OperatingAssumptions,
    calculate_costs,
)


def assert_close(test_case: TestCase, actual: float, expected: float) -> None:
    test_case.assertTrue(
        isclose(actual, expected, rel_tol=1e-12, abs_tol=1e-8),
        f"{actual!r} != {expected!r}",
    )


class CalculateCostsParityTests(TestCase):
    def test_defaults_match_workbook_cached_results(self):
        result = calculate_costs()
        development = result.development
        breakdown = development.breakdown

        assert_close(self, development.engineering_hours, 36699.630655063665)
        assert_close(self, development.tooling_hours, 23174.417332022196)
        assert_close(self, development.manufacturing_hours, 39282.67314662316)
        assert_close(self, development.engineers_required, 31.85731827696499)
        assert_close(
            self, development.manufacturing_hours_per_aircraft, 39282.67314662316
        )
        assert_close(self, breakdown.development_support, 715608.998208848)
        assert_close(self, breakdown.flight_test, 63555.59790546199)
        assert_close(self, breakdown.certification, 779164.59611431)
        assert_close(self, breakdown.materials_and_equipment, 104854.4755486597)
        assert_close(self, breakdown.fixed_gear_discount, -7500)
        assert_close(self, breakdown.engines, 90480)
        assert_close(self, breakdown.propellers, 6290)
        assert_close(self, breakdown.avionics, 15000)
        assert_close(self, breakdown.total_to_produce, 988289.0716629697)
        assert_close(self, breakdown.minimum_selling_price, 1288289.0716629697)

        assert_close(self, result.break_even.fixed_cost, 779164.59611431)
        assert_close(self, result.break_even.variable_cost, 509124.4755486597)
        assert_close(self, result.break_even.scenarios[0].units or 0, 2.6786873786785526)
        self.assertEqual(len(result.break_even.chart), 22)
        assert_close(self, result.break_even.chart[-1].units, 10.5)
        assert_close(self, result.break_even.chart[-1].total_cost, 6124971.589375237)

        assert_close(self, result.financing.monthly_payment, 26742.76218380952)
        assert_close(self, result.financing.annual_payment, 320913.1462057142)
        assert_close(
            self, result.operating.maintenance_to_flight_hour_ratio, 0.17
        )
        assert_close(self, result.operating.maintenance, 1768)
        assert_close(self, result.operating.storage, 3000)
        assert_close(self, result.operating.fuel, 187976.36797274274)
        assert_close(self, result.operating.insurance, 12500)
        assert_close(self, result.operating.engine_overhaul, 10400)
        assert_close(self, result.operating.total_per_year, 537057.514178457)
        assert_close(self, result.operating.cost_per_flight_hour, 516.401455940824)

    def test_zero_interest_uses_straight_line_payments(self):
        inputs = replace(
            CostInputs(),
            financing=FinancingAssumptions(
                loan_term_years=5,
                annual_interest_percent=0,
                loan_principal=120_000,
            ),
        )

        result = calculate_costs(inputs)

        self.assertEqual(result.financing.monthly_payment, 2_000)
        self.assertEqual(result.financing.annual_payment, 24_000)

    def test_commercial_labour_rates_flow_into_every_labour_cost(self):
        inputs = replace(
            CostInputs(),
            development=DevelopmentAssumptions(
                engineering_rate=85,
                tooling_rate=70,
                manufacturing_rate=50,
            ),
            operating=OperatingAssumptions(crew_rate=65),
        )

        result = calculate_costs(inputs)
        development = result.development

        assert_close(
            self,
            development.breakdown.engineering,
            2.0969 * development.engineering_hours * 85,
        )
        assert_close(
            self,
            development.breakdown.tooling,
            2.0969 * development.tooling_hours * 70,
        )
        assert_close(
            self,
            development.breakdown.manufacturing_labor,
            2.0969 * development.manufacturing_hours * 50,
        )
        assert_close(self, result.operating.crew, 65 * 2 * 1040)

    def test_unprofitable_selling_price_is_reported_as_infeasible(self):
        inputs = replace(CostInputs(), selling_prices=(500_000,))

        scenario = calculate_costs(inputs).break_even.scenarios[0]

        self.assertFalse(scenario.feasible)
        self.assertIsNone(scenario.units)

    def test_invalid_denominators_raise_a_domain_error(self):
        inputs = replace(
            CostInputs(),
            operating=OperatingAssumptions(flight_hours_per_year=0),
        )

        with self.assertRaisesRegex(CostCalculationError, "flight_hours_per_year"):
            calculate_costs(inputs)
