"""Pinned to Gundlach (2012) chapter 3, Examples 3.1 and 3.2.

Example 3.1 states 70 KTAS, a propeller efficiency of 0.7 and once says the
fixed weights total 200 lb, but its arithmetic uses 90 kt, 0.6 and 100 lb
(p. 81). The tests below feed the arithmetic values, since those are what the
printed answers come from, and plans/extraction/uavs/sizing.md records the
discrepancy. The book also rounds each fuel fraction to two figures before
solving the weight, which is why 769 lb and 345 lb are matched loosely.
"""

from dataclasses import replace
from math import exp
from unittest import TestCase

from aircraft_design.uas_sizing import (
    NM_LB_PER_HP_H,
    BatteryPerformance,
    Energy,
    FixedWeights,
    FuelPerformance,
    JetPerformance,
    Mission,
    MissionObjective,
    Propulsion,
    PropulsionType,
    ScalingFractions,
    UasSizingError,
    UasSizingInputs,
    battery_mass_fraction,
    calculate_uas_sizing,
    propulsion_mass_fraction,
)

LOITER = Mission(
    MissionObjective.ENDURANCE, endurance_h=24, airspeed_kt=90, lift_to_drag=15
)

TWO_STROKE = UasSizingInputs(
    fixed_weights=FixedWeights(payload_lb=100, avionics_lb=0),
    fractions=ScalingFractions(structure=0.25, subsystems=0.05),
    propulsion=Propulsion(
        PropulsionType.RECIPROCATING,
        aircraft_power_to_weight=0.05,
        powerplant_power_to_weight=1.0,
    ),
    energy=Energy(mission=LOITER, fuel=FuelPerformance(1.0, 0.6)),
)

FOUR_STROKE = replace(
    TWO_STROKE,
    propulsion=replace(TWO_STROKE.propulsion, powerplant_power_to_weight=0.5),
    energy=Energy(mission=LOITER, fuel=FuelPerformance(0.5, 0.6)),
)


class Example31EngineSelection(TestCase):
    def test_two_stroke_reproduces_the_book(self):
        result = calculate_uas_sizing(TWO_STROKE)

        self.assertAlmostEqual(result.propulsion_mass_fraction, 0.05)
        self.assertAlmostEqual(result.energy_mass_fraction, 0.52, places=2)
        # The book rounds 0.5212 to 0.52 before 100 / (0.65 − 0.52) = 769.
        self.assertAlmostEqual(result.weights.takeoff_lb, 769, delta=10)
        self.assertAlmostEqual(result.required_power_hp, 38.5, delta=0.5)

    def test_four_stroke_is_lighter_despite_the_heavier_engine(self):
        result = calculate_uas_sizing(FOUR_STROKE)

        self.assertAlmostEqual(result.propulsion_mass_fraction, 0.10)
        self.assertAlmostEqual(result.energy_mass_fraction, 0.31, places=2)
        self.assertAlmostEqual(result.weights.takeoff_lb, 345, delta=5)
        self.assertAlmostEqual(result.required_power_hp, 17.3, delta=0.3)

    def test_the_stated_inputs_do_not_give_the_printed_answer(self):
        # 0.7 is what the problem statement says. Recorded so nobody "fixes"
        # the fixture back to the prose and wonders why the numbers moved.
        stated = replace(
            TWO_STROKE, energy=Energy(mission=LOITER, fuel=FuelPerformance(1.0, 0.7))
        )
        self.assertAlmostEqual(
            calculate_uas_sizing(stated).energy_mass_fraction, 0.468, places=3
        )

    def test_bsfc_conversion_uses_the_1852_m_nautical_mile(self):
        # 550 ft·lb/s × 3600 s ÷ 6076.12 ft. The book's 326 (325.66) is a
        # 6080 ft mile.
        self.assertAlmostEqual(NM_LB_PER_HP_H, 325.866, places=3)


class Example32MavPayload(TestCase):
    def test_lighting_consumes_the_whole_payload(self):
        # Fractions entered directly, as the example gives them; the 0.2 lb
        # lighting system is the "other" fixed weight.
        inputs = UasSizingInputs(
            fixed_weights=FixedWeights(payload_lb=0, avionics_lb=0.05, other_lb=0.2),
            fractions=ScalingFractions(structure=0.2, subsystems=0.0),
            propulsion=Propulsion(PropulsionType.BATTERY, mass_fraction=0.1),
            energy=Energy(mass_fraction=0.2),
        )
        result = calculate_uas_sizing(inputs)
        # With no payload the aircraft already weighs the 0.5 lb the
        # container allows, so the payload capacity at 0.5 lb is zero.
        self.assertAlmostEqual(result.weights.takeoff_lb, 0.5)
        self.assertAlmostEqual(result.weight_escalation_factor, 2.0)


class PropulsionMassFraction(TestCase):
    def test_component_weights_add(self):
        # A 10 hp aircraft at 1 hp/lb with a 10 hp/lb propeller carries a
        # 10 lb engine and a 1 lb propeller — 11 lb, not the 0.9 lb the
        # printed form of Eq. 3.6 (dividing by the summed ratios) gives.
        propulsion = Propulsion(
            PropulsionType.RECIPROCATING,
            aircraft_power_to_weight=0.1,
            powerplant_power_to_weight=1.0,
            propeller_power_to_weight=10.0,
        )
        self.assertAlmostEqual(propulsion_mass_fraction(propulsion), 0.1 * (1 + 0.1))

    def test_electric_chain_sums_motor_controller_and_propeller(self):
        propulsion = Propulsion(
            PropulsionType.BATTERY,
            aircraft_power_to_weight=0.08,
            install_factor=1.1,
            motor_power_to_weight=2.0,
            controller_power_to_weight=8.0,
            propeller_power_to_weight=20.0,
        )
        expected = 1.1 * 0.08 * (1 / 2.0 + 1 / 8.0 + 1 / 20.0)
        self.assertAlmostEqual(propulsion_mass_fraction(propulsion), expected)

    def test_jet_uses_thrust(self):
        propulsion = Propulsion(
            PropulsionType.JET,
            aircraft_thrust_to_weight=0.33,
            powerplant_thrust_to_weight=6.0,
        )
        self.assertAlmostEqual(propulsion_mass_fraction(propulsion), 0.055)

    def test_a_component_is_required(self):
        with self.assertRaises(UasSizingError):
            propulsion_mass_fraction(
                Propulsion(PropulsionType.RECIPROCATING, aircraft_power_to_weight=0.05)
            )


class JetFuelFraction(TestCase):
    def test_range_and_endurance_are_breguet(self):
        jet = JetPerformance(tsfc_per_h=0.8)
        by_range = Mission(
            MissionObjective.RANGE, range_nm=400, airspeed_kt=200, lift_to_drag=12
        )
        by_time = Mission(MissionObjective.ENDURANCE, endurance_h=2, lift_to_drag=12)
        inputs = UasSizingInputs(
            FixedWeights(500, 0),
            ScalingFractions(0.35, 0.1),
            Propulsion(PropulsionType.JET, mass_fraction=0.055),
            Energy(mission=by_range, jet=jet),
        )
        expected = 1 - exp(-2 * 0.8 / 12)
        self.assertAlmostEqual(
            calculate_uas_sizing(inputs).energy_mass_fraction, expected
        )
        self.assertAlmostEqual(
            calculate_uas_sizing(
                replace(inputs, energy=Energy(mission=by_time, jet=jet))
            ).energy_mass_fraction,
            expected,
        )


class BatteryFraction(TestCase):
    PACK = BatteryPerformance(
        specific_energy_wh_per_kg=200,
        battery_efficiency=0.95,
        usable_fraction=0.8,
        propeller_efficiency=0.75,
        motor_efficiency=0.9,
        controller_efficiency=0.95,
    )

    def test_range_form_matches_eq_354_by_hand(self):
        mission = Mission(MissionObjective.RANGE, range_nm=54, lift_to_drag=12)
        # 54 nm × 1852 m. Espec = 720 000 J/kg. Πη = 0.64125.
        expected = (54 * 1852 * 9.80665) / (
            720_000 * 0.75 * 0.9 * 0.95 * 0.95 * 0.8 * 12
        )
        self.assertAlmostEqual(
            battery_mass_fraction(mission, self.PACK), expected, places=9
        )

    def test_endurance_form_is_range_at_that_airspeed(self):
        by_time = Mission(
            MissionObjective.ENDURANCE, endurance_h=2, airspeed_kt=30, lift_to_drag=12
        )
        by_range = Mission(MissionObjective.RANGE, range_nm=60, lift_to_drag=12)
        self.assertAlmostEqual(
            battery_mass_fraction(by_time, self.PACK),
            battery_mass_fraction(by_range, self.PACK),
        )

    def test_reports_pack_mass_and_usable_energy(self):
        mission = Mission(MissionObjective.RANGE, range_nm=54, lift_to_drag=12)
        inputs = UasSizingInputs(
            FixedWeights(2.0, 1.0),
            ScalingFractions(0.3, 0.05),
            Propulsion(
                PropulsionType.BATTERY,
                aircraft_power_to_weight=0.08,
                motor_power_to_weight=2.5,
                controller_power_to_weight=8.0,
                propeller_power_to_weight=20.0,
            ),
            Energy(mission=mission, battery=self.PACK),
        )
        result = calculate_uas_sizing(inputs)
        self.assertIsNone(result.required_thrust_lbf)
        self.assertAlmostEqual(
            result.battery_mass_kg, result.weights.energy_lb * 0.45359237
        )
        self.assertAlmostEqual(
            result.usable_energy_wh, 200 * result.battery_mass_kg * 0.95 * 0.8
        )


class ClosingTheEquation(TestCase):
    def test_fraction_sum_of_one_is_infeasible(self):
        inputs = UasSizingInputs(
            FixedWeights(100, 0),
            ScalingFractions(0.5, 0.2),
            Propulsion(PropulsionType.BATTERY, mass_fraction=0.1),
            Energy(mass_fraction=0.2),
        )
        with self.assertRaises(UasSizingError):
            calculate_uas_sizing(inputs)

    def test_fixed_engine_moves_into_the_numerator(self):
        # Eq. 3.21. A 40 lb, 50 hp engine on the two-stroke loiter design:
        # 140 lb fixed over the same fractions closes at about 783 lb, which
        # the engine powers at 0.064 hp/lb against the 0.05 required.
        fixed = replace(
            TWO_STROKE,
            propulsion=Propulsion(
                PropulsionType.RECIPROCATING,
                aircraft_power_to_weight=0.05,
                fixed_weight_lb=40,
                fixed_power_hp=50,
            ),
        )
        result = calculate_uas_sizing(fixed)
        self.assertEqual(result.propulsion_mass_fraction, 0.0)
        self.assertAlmostEqual(result.fixed_weight_lb, 140)
        self.assertAlmostEqual(result.weights.propulsion_lb, 40)
        self.assertAlmostEqual(
            result.installed_power_to_weight, 50 / result.weights.takeoff_lb
        )
        self.assertFalse(
            any("fixed engine" in warning for warning in result.warnings)
        )

    def test_underpowered_fixed_engine_is_named(self):
        fixed = replace(
            TWO_STROKE,
            propulsion=Propulsion(
                PropulsionType.RECIPROCATING,
                aircraft_power_to_weight=0.05,
                fixed_weight_lb=40,
                fixed_power_hp=5,
            ),
        )
        result = calculate_uas_sizing(fixed)
        self.assertTrue(any("fixed engine" in w for w in result.warnings))

    def test_sweep_brackets_the_design_point(self):
        result = calculate_uas_sizing(TWO_STROKE)
        fractions = [point.energy_mass_fraction for point in result.sweep]
        weights = [point.takeoff_lb for point in result.sweep]
        self.assertEqual(len(result.sweep), 101)
        self.assertEqual(fractions[0], 0.0)
        self.assertLess(fractions[0], result.energy_mass_fraction)
        self.assertGreater(fractions[-1], result.energy_mass_fraction)
        self.assertEqual(weights, sorted(weights))
        self.assertAlmostEqual(weights[0], 100 / (1 - 0.35))

    def test_weight_escalation_warning(self):
        heavy = replace(TWO_STROKE, fractions=ScalingFractions(0.35, 0.05))
        result = calculate_uas_sizing(heavy)
        self.assertGreater(result.weight_escalation_factor, 8)
        self.assertTrue(any("escalation" in w for w in result.warnings))

    def test_empty_weight_excludes_payload_and_energy(self):
        result = calculate_uas_sizing(TWO_STROKE)
        weights = result.weights
        self.assertAlmostEqual(
            weights.empty_lb,
            weights.structure_lb
            + weights.subsystems_lb
            + weights.propulsion_lb
            + weights.avionics_lb
            + weights.other_lb,
        )
        self.assertAlmostEqual(
            result.empty_weight_fraction, weights.empty_lb / weights.takeoff_lb
        )


class EmptyWeightCheckTests(TestCase):
    def test_compares_a_fraction_with_a_fraction_at_the_solved_weight(self):
        inputs = replace(TWO_STROKE, raymer_category="UAV_Tac_Recce_or_UCAV")
        result = calculate_uas_sizing(inputs)
        check = result.empty_weight_check

        self.assertIsNotNone(check)
        assert check is not None
        self.assertEqual((check.a, check.c), (1.67, -0.16))
        # Raymer's correlation read at the weight the mass fractions solved.
        self.assertAlmostEqual(
            check.statistical_fraction,
            check.a * result.weights.takeoff_lb**check.c,
        )
        self.assertAlmostEqual(check.design_fraction, result.empty_weight_fraction)

    def test_survives_a_design_with_nothing_in_raymers_numerator(self):
        # Raymer's Eq. 3.4 divides crew plus payload by what is left. A drone
        # has no crew, and one whose sensor is its avionics has no payload
        # either, so that closure walks to the singularity and reports the
        # weight where it goes to infinity as though it were an answer. This
        # check never touches the numerator.
        sensor_is_avionics = replace(
            TWO_STROKE,
            fixed_weights=FixedWeights(payload_lb=0, avionics_lb=8, other_lb=0),
            raymer_category="UAV_Small",
        )
        check = calculate_uas_sizing(sensor_is_avionics).empty_weight_check

        self.assertIsNotNone(check)
        assert check is not None
        self.assertGreater(check.statistical_fraction, 0)
        self.assertLess(check.statistical_fraction, 1)

    def test_unknown_category_is_skipped(self):
        inputs = replace(TWO_STROKE, raymer_category="Not_A_Category")
        self.assertIsNone(calculate_uas_sizing(inputs).empty_weight_check)

    def test_no_category_is_skipped(self):
        self.assertIsNone(calculate_uas_sizing(TWO_STROKE).empty_weight_check)


class ObservedEmptyFractionBand(TestCase):
    def test_an_optimistic_airframe_is_named(self):
        # Structure, subsystems and propulsion this light leave an empty
        # fraction below anything Fig. 3.2 records.
        light = replace(TWO_STROKE, fractions=ScalingFractions(0.10, 0.02))
        result = calculate_uas_sizing(light)

        self.assertLess(result.empty_weight_fraction, 0.3)
        self.assertTrue(any("outside" in w for w in result.warnings))

    def test_a_fraction_inside_the_band_says_nothing(self):
        result = calculate_uas_sizing(TWO_STROKE)

        self.assertGreaterEqual(result.empty_weight_fraction, 0.3)
        self.assertLessEqual(result.empty_weight_fraction, 0.85)
        self.assertFalse(any("outside" in w for w in result.warnings))
