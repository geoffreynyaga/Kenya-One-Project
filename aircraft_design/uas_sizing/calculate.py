"""Initial unmanned-aircraft sizing by linear mass fractions.

Gundlach, *Designing Unmanned Aircraft Systems* (2012), chapter 3. Equation
provenance (book -> function):

- 3.6, 3.7, 3.9   -> propulsion_mass_fraction
- 3.21            -> the fixed-engine branch of calculate_uas_sizing
- 3.25, 3.27      -> fuel_mass_fraction_propeller
- 3.33, 3.35      -> fuel_mass_fraction_jet
- 3.43            -> electric_efficiency_product
- 3.52, 3.54      -> battery_mass_fraction
- 3.18            -> takeoff_weight
- 3.19            -> weight_escalation_factor
- Fig. 3.6        -> energy_fraction_sweep
- Raymer Table 3.1 evaluated at the solved weight -> empty_weight_check

Two places knowingly depart from the page and are documented in
plans/extraction/uavs/sizing.md:

1. Eq. 3.6–3.8 print the denominator as a sum of power-to-weight ratios.
   Component weights add, and each is P divided by its own P/W, so the
   correct denominator is the reciprocal of the summed reciprocals. The two
   agree only when a single component carries the whole power, which is the
   case in Example 3.1, so the example still reproduces.
2. The book divides BSFC by 326 (325.66 exactly, from a 6080 ft nautical
   mile) to turn lb/hp/h into 1/nm. The mile is 1852 m by definition, which
   makes the factor 325.87; the difference is under 0.1 % of the fuel
   fraction.
"""

import math

from .contracts import (
    BatteryPerformance,
    EmptyWeightCheck,
    Energy,
    FuelPerformance,
    JetPerformance,
    Mission,
    MissionObjective,
    Propulsion,
    PropulsionType,
    SweepPoint,
    UasSizingError,
    UasSizingInputs,
    UasSizingResult,
    WeightBreakdown,
)

FT_PER_NM = 1852 / 0.3048
FT_LB_PER_S_PER_HP = 550.0
SECONDS_PER_HOUR = 3600.0
# One horsepower-hour of shaft work, expressed in pound-nautical-miles: the
# divisor that turns a BSFC in lb/hp/h into lb of fuel per lb of thrust per nm.
NM_LB_PER_HP_H = FT_LB_PER_S_PER_HP * SECONDS_PER_HOUR / FT_PER_NM

M_PER_NM = 1852.0
MPS_PER_KT = M_PER_NM / SECONDS_PER_HOUR
J_PER_WH = 3600.0
KG_PER_LB = 0.45359237
GRAVITY_MPS2 = 9.80665

SWEEP_POINTS = 101
# The sweep stops short of the asymptote, where the weight is unbounded.
SWEEP_ASYMPTOTE_FRACTION = 0.97
# Above this the book says a programme is unlikely to cope with the weight
# sensitivity (p. 66).
WEF_LIMIT = 8.0

# Gundlach Fig. 3.2: the empty mass fractions actually observed across
# fixed-wing unmanned aircraft, from micro air vehicles to the largest.
OBSERVED_EMPTY_FRACTION_MIN = 0.3
OBSERVED_EMPTY_FRACTION_MAX = 0.85


def _require(value: float | None, name: str) -> float:
    if value is None:
        raise UasSizingError(f"{name} is required for this propulsion type.")
    return value


def _positive(value: float | None, name: str) -> float:
    value = _require(value, name)
    if value <= 0:
        raise UasSizingError(f"{name} must be greater than zero.")
    return value


def _specific_power_terms(propulsion: Propulsion) -> list[tuple[str, float]]:
    """The components that share the propulsive power, with their hp/lb."""
    if propulsion.type is PropulsionType.RECIPROCATING:
        named = [
            ("Powerplant power-to-weight", propulsion.powerplant_power_to_weight),
            ("Propeller power-to-weight", propulsion.propeller_power_to_weight),
        ]
    else:
        named = [
            ("Motor power-to-weight", propulsion.motor_power_to_weight),
            ("Controller power-to-weight", propulsion.controller_power_to_weight),
            ("Propeller power-to-weight", propulsion.propeller_power_to_weight),
        ]
    terms = [(name, value) for name, value in named if value is not None]
    if not terms:
        raise UasSizingError(
            "Enter a power-to-weight ratio for at least one propulsion component."
        )
    for name, value in terms:
        if value <= 0:
            raise UasSizingError(f"{name} must be greater than zero.")
    return terms


def propulsion_mass_fraction(propulsion: Propulsion) -> float:
    """Eq. 3.6, 3.7 and 3.9 with the component weights summed.

    W_i = P / (P/W)_i for every component, so
    MF_prop = f_install · (P/W)_aircraft · Σ 1/(P/W)_i.
    """
    if propulsion.install_factor < 1:
        raise UasSizingError("Installation factor cannot be below one.")

    if propulsion.type is PropulsionType.JET:
        aircraft = _positive(
            propulsion.aircraft_thrust_to_weight, "Aircraft thrust-to-weight"
        )
        powerplant = _positive(
            propulsion.powerplant_thrust_to_weight, "Powerplant thrust-to-weight"
        )
        return propulsion.install_factor * aircraft / powerplant

    aircraft = _positive(
        propulsion.aircraft_power_to_weight, "Aircraft power-to-weight"
    )
    weight_per_power = sum(1 / value for _, value in _specific_power_terms(propulsion))
    return propulsion.install_factor * aircraft * weight_per_power


def fuel_mass_fraction_propeller(mission: Mission, fuel: FuelPerformance) -> float:
    """Eq. 3.25 (range) and Eq. 3.27 (endurance) for a propeller aircraft."""
    lift_to_drag = _positive(mission.lift_to_drag, "Lift-to-drag ratio")
    if not 0 < fuel.propeller_efficiency <= 1:
        raise UasSizingError("Propeller efficiency must lie in (0, 1].")
    bsfc_per_nm = (
        _positive(fuel.bsfc_lb_per_hp_h, "Brake specific fuel consumption")
        * mission.load_factor
        / NM_LB_PER_HP_H
    )
    distance_nm = _segment_distance_nm(mission)
    return 1 - math.exp(-distance_nm * bsfc_per_nm / (lift_to_drag * fuel.propeller_efficiency))


def fuel_mass_fraction_jet(mission: Mission, jet: JetPerformance) -> float:
    """Eq. 3.33 (range) and Eq. 3.35 (endurance) for a thrust-dominated aircraft."""
    lift_to_drag = _positive(mission.lift_to_drag, "Lift-to-drag ratio")
    tsfc = _positive(jet.tsfc_per_h, "Thrust specific fuel consumption") * mission.load_factor
    if mission.objective is MissionObjective.RANGE:
        airspeed = _positive(mission.airspeed_kt, "Airspeed")
        hours = _positive(mission.range_nm, "Range") / airspeed
    else:
        hours = _positive(mission.endurance_h, "Endurance")
    return 1 - math.exp(-hours * tsfc / lift_to_drag)


def electric_efficiency_product(battery: BatteryPerformance) -> float:
    """Eq. 3.43: every loss between the battery terminals and the thrust."""
    stages = (
        ("Propeller efficiency", battery.propeller_efficiency),
        ("Gearbox efficiency", battery.gearbox_efficiency),
        ("Motor efficiency", battery.motor_efficiency),
        ("Controller efficiency", battery.controller_efficiency),
        ("Distribution efficiency", battery.distribution_efficiency),
    )
    product = 1.0
    for name, value in stages:
        if not 0 < value <= 1:
            raise UasSizingError(f"{name} must lie in (0, 1].")
        product *= value
    return product


def battery_mass_fraction(mission: Mission, battery: BatteryPerformance) -> float:
    """Eq. 3.54 (range) and Eq. 3.52 solved for MF_batt (endurance).

    Worked in SI, as the book insists: specific energy is per unit mass, so
    the weight fraction carries a division by g. Range in metres, endurance
    in seconds, airspeed in m/s.
    """
    lift_to_drag = _positive(mission.lift_to_drag, "Lift-to-drag ratio")
    if not 0 < battery.battery_efficiency <= 1:
        raise UasSizingError("Battery efficiency must lie in (0, 1].")
    if not 0 < battery.usable_fraction <= 1:
        raise UasSizingError("Usable battery fraction must lie in (0, 1].")
    specific_energy = (
        _positive(battery.specific_energy_wh_per_kg, "Battery specific energy") * J_PER_WH
    )
    delivered = (
        specific_energy
        * electric_efficiency_product(battery)
        * battery.battery_efficiency
        * battery.usable_fraction
        * lift_to_drag
    )
    if mission.objective is MissionObjective.RANGE:
        distance_m = _positive(mission.range_nm, "Range") * M_PER_NM
    else:
        distance_m = (
            _positive(mission.endurance_h, "Endurance")
            * SECONDS_PER_HOUR
            * _positive(mission.airspeed_kt, "Airspeed")
            * MPS_PER_KT
        )
    return distance_m * GRAVITY_MPS2 / delivered


def _segment_distance_nm(mission: Mission) -> float:
    """Range, or the distance flown during the endurance segment. Eq. 3.26."""
    if mission.objective is MissionObjective.RANGE:
        return _positive(mission.range_nm, "Range")
    return _positive(mission.endurance_h, "Endurance") * _positive(
        mission.airspeed_kt, "Airspeed"
    )


def energy_mass_fraction(propulsion_type: PropulsionType, energy: Energy) -> float:
    if energy.mass_fraction is not None:
        if not 0 <= energy.mass_fraction < 1:
            raise UasSizingError("Energy mass fraction must lie in [0, 1).")
        return energy.mass_fraction

    mission = energy.mission
    if mission is None:
        raise UasSizingError("Enter a mission segment or an energy mass fraction.")
    if mission.load_factor < 1:
        raise UasSizingError("Load factor cannot be below one.")

    if propulsion_type is PropulsionType.RECIPROCATING:
        if energy.fuel is None:
            raise UasSizingError("Fuel performance is required for a reciprocating engine.")
        return fuel_mass_fraction_propeller(mission, energy.fuel)
    if propulsion_type is PropulsionType.JET:
        if energy.jet is None:
            raise UasSizingError("Jet performance is required for a jet engine.")
        return fuel_mass_fraction_jet(mission, energy.jet)
    if energy.battery is None:
        raise UasSizingError("Battery performance is required for electric propulsion.")
    return battery_mass_fraction(mission, energy.battery)


def takeoff_weight(fixed_weight_lb: float, scaling_fraction_sum: float) -> float:
    """Eq. 3.18. The hyperbola's asymptote is a fraction sum of one."""
    if scaling_fraction_sum >= 1:
        raise UasSizingError(
            "The scaling mass fractions sum to one or more, so no take-off weight "
            "closes. Reduce the energy, structure, subsystem or propulsion fraction."
        )
    return fixed_weight_lb / (1 - scaling_fraction_sum)


def weight_escalation_factor(scaling_fraction_sum: float) -> float:
    """Eq. 3.19: pounds of take-off weight per pound of fixed weight added."""
    return 1 / (1 - scaling_fraction_sum)


def energy_fraction_sweep(
    fixed_weight_lb: float, other_fraction_sum: float
) -> tuple[SweepPoint, ...]:
    """Fig. 3.6: take-off weight as the energy fraction grows toward the asymptote."""
    asymptote = 1 - other_fraction_sum
    if asymptote <= 0:
        return ()
    limit = asymptote * SWEEP_ASYMPTOTE_FRACTION
    step = limit / (SWEEP_POINTS - 1)
    return tuple(
        SweepPoint(
            energy_mass_fraction=i * step,
            takeoff_lb=takeoff_weight(fixed_weight_lb, other_fraction_sum + i * step),
        )
        for i in range(SWEEP_POINTS)
    )


def empty_weight_check(
    category: str, takeoff_lb: float, design_fraction: float
) -> EmptyWeightCheck | None:
    """Raymer's We/W0 = A·W0^C at the solved weight, beside this design's.

    Returns None for a category Raymer does not tabulate.
    """
    from CORE.engines.prerequisitesEngine import EMPTY_WEIGHT_CONSTANTS

    constants = EMPTY_WEIGHT_CONSTANTS.get(category)
    if constants is None or takeoff_lb <= 0:
        return None
    a, c = constants["a"], constants["c"]
    return EmptyWeightCheck(
        category=category,
        a=a,
        c=c,
        statistical_fraction=a * takeoff_lb**c,
        design_fraction=design_fraction,
    )


def calculate_uas_sizing(inputs: UasSizingInputs) -> UasSizingResult:
    fixed = inputs.fixed_weights
    for name, value in (
        ("Payload weight", fixed.payload_lb),
        ("Avionics weight", fixed.avionics_lb),
        ("Other fixed weight", fixed.other_lb),
    ):
        if value < 0:
            raise UasSizingError(f"{name} cannot be negative.")
    for name, value in (
        ("Structure mass fraction", inputs.fractions.structure),
        ("Subsystems mass fraction", inputs.fractions.subsystems),
    ):
        if not 0 <= value < 1:
            raise UasSizingError(f"{name} must lie in [0, 1).")

    propulsion = inputs.propulsion
    fixed_propulsion_lb = 0.0
    if propulsion.fixed_weight_lb is not None:
        # Eq. 3.21: a chosen engine is a fixed weight, not a fraction.
        fixed_propulsion_lb = _positive(propulsion.fixed_weight_lb, "Fixed propulsion weight")
        mf_prop = 0.0
    elif propulsion.mass_fraction is not None:
        if not 0 <= propulsion.mass_fraction < 1:
            raise UasSizingError("Propulsion mass fraction must lie in [0, 1).")
        mf_prop = propulsion.mass_fraction
    else:
        mf_prop = propulsion_mass_fraction(propulsion)

    mf_energy = energy_mass_fraction(propulsion.type, inputs.energy)

    fixed_weight_lb = fixed.payload_lb + fixed.avionics_lb + fixed.other_lb + fixed_propulsion_lb
    if fixed_weight_lb <= 0:
        raise UasSizingError("At least one fixed weight must be greater than zero.")

    fraction_sum = inputs.fractions.structure + inputs.fractions.subsystems + mf_prop + mf_energy
    takeoff_lb = takeoff_weight(fixed_weight_lb, fraction_sum)
    wef = weight_escalation_factor(fraction_sum)

    propulsion_lb = fixed_propulsion_lb + mf_prop * takeoff_lb
    energy_lb = mf_energy * takeoff_lb
    weights = WeightBreakdown(
        takeoff_lb=takeoff_lb,
        payload_lb=fixed.payload_lb,
        avionics_lb=fixed.avionics_lb,
        other_lb=fixed.other_lb,
        structure_lb=inputs.fractions.structure * takeoff_lb,
        subsystems_lb=inputs.fractions.subsystems * takeoff_lb,
        propulsion_lb=propulsion_lb,
        energy_lb=energy_lb,
        empty_lb=takeoff_lb - fixed.payload_lb - energy_lb,
    )

    warnings: list[str] = []
    if wef > WEF_LIMIT:
        warnings.append(
            f"Weight escalation factor is {wef:.1f}: every pound of fixed weight "
            f"adds {wef:.1f} lb of take-off weight. Above 8–10 a programme "
            "rarely copes with the sensitivity."
        )

    required_power_hp = None
    required_thrust_lbf = None
    installed_power_to_weight = None
    installed_thrust_to_weight = None
    if propulsion.type is PropulsionType.JET:
        if propulsion.aircraft_thrust_to_weight is not None:
            required_thrust_lbf = takeoff_lb * propulsion.aircraft_thrust_to_weight
        if propulsion.fixed_thrust_lbf is not None:
            installed_thrust_to_weight = propulsion.fixed_thrust_lbf / takeoff_lb
            if (
                propulsion.aircraft_thrust_to_weight is not None
                and installed_thrust_to_weight < propulsion.aircraft_thrust_to_weight
            ):
                warnings.append(
                    f"The fixed engine gives T/W {installed_thrust_to_weight:.3f} "
                    f"against the {propulsion.aircraft_thrust_to_weight:.3f} required. "
                    "A larger engine or engine count is needed."
                )
    else:
        if propulsion.aircraft_power_to_weight is not None:
            required_power_hp = takeoff_lb * propulsion.aircraft_power_to_weight
        if propulsion.fixed_power_hp is not None:
            installed_power_to_weight = propulsion.fixed_power_hp / takeoff_lb
            if (
                propulsion.aircraft_power_to_weight is not None
                and installed_power_to_weight < propulsion.aircraft_power_to_weight
            ):
                warnings.append(
                    f"The fixed engine gives {installed_power_to_weight:.3f} hp/lb "
                    f"against the {propulsion.aircraft_power_to_weight:.3f} hp/lb "
                    "required. A larger engine or engine count is needed."
                )

    battery_mass_kg = None
    usable_energy_wh = None
    battery = inputs.energy.battery
    if propulsion.type is PropulsionType.BATTERY and battery is not None:
        battery_mass_kg = energy_lb * KG_PER_LB
        # Eq. 3.38.
        usable_energy_wh = (
            battery.specific_energy_wh_per_kg
            * battery_mass_kg
            * battery.battery_efficiency
            * battery.usable_fraction
        )

    empty_fraction = weights.empty_lb / takeoff_lb
    if not (
        OBSERVED_EMPTY_FRACTION_MIN
        <= empty_fraction
        <= OBSERVED_EMPTY_FRACTION_MAX
    ):
        warnings.append(
            f"Empty weight is {empty_fraction:.0%} of take-off weight, outside "
            f"the {OBSERVED_EMPTY_FRACTION_MIN:.0%}-"
            f"{OBSERVED_EMPTY_FRACTION_MAX:.0%} band observed across fixed-wing "
            "unmanned aircraft. Check the structure, subsystem and propulsion "
            "fractions."
        )

    check = None
    if inputs.raymer_category is not None:
        check = empty_weight_check(
            inputs.raymer_category, takeoff_lb, empty_fraction
        )

    return UasSizingResult(
        propulsion_mass_fraction=mf_prop,
        energy_mass_fraction=mf_energy,
        structure_mass_fraction=inputs.fractions.structure,
        subsystems_mass_fraction=inputs.fractions.subsystems,
        scaling_fraction_sum=fraction_sum,
        weight_escalation_factor=wef,
        fixed_weight_lb=fixed_weight_lb,
        weights=weights,
        empty_weight_fraction=empty_fraction,
        required_power_hp=required_power_hp,
        required_thrust_lbf=required_thrust_lbf,
        installed_power_to_weight=installed_power_to_weight,
        installed_thrust_to_weight=installed_thrust_to_weight,
        battery_mass_kg=battery_mass_kg,
        usable_energy_wh=usable_energy_wh,
        sweep=energy_fraction_sweep(fixed_weight_lb, fraction_sum - mf_energy),
        empty_weight_check=check,
        warnings=tuple(warnings),
    )
