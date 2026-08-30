"""Pure constraint-analysis calculations from the 'Sref and POWER SIZING' sheet.

Formula provenance (workbook cell -> function):

- B5/B6, G16/G17  -> _density_at / atmosphere sigma
- K3              -> stall-limit wing loading (vertical line on the plot)
- M3:M27          -> maximum-speed W/P curve
- N3:N27          -> take-off run W/P curve
- O3:O27          -> sea-level rate-of-climb W/P curve
- P3:P27          -> service-ceiling W/P curve
- H80/H82, M87    -> sizing from the picked design point
- G5              -> cruise lift coefficient at the sized wing area

The sweep reproduces the worksheet's J3:J27 table (x = 10..58 step 2).
"""

import math
from dataclasses import asdict

from .contracts import (
    Aerodynamics,
    AtmosphereInputs,
    AtmosphereResult,
    CurvePoint,
    DesignPoint,
    EngineSpec,
    EngineType,
    PerformanceRequirements,
    SrefCalculationError,
    SrefInputs,
    SrefResult,
    SizingResult,
    WeightsAndCruise,
)

SEA_LEVEL_DENSITY_SLUG_FT3 = 0.002378
KNOT_TO_FPS = 1.688
FT2_PER_M2 = 10.76391
GRAVITY_FPS2 = 32.17

# J3 starts at 10 and steps by 2 through row 21 — nineteen points.
SWEEP_START_WING_LOADING = 10.0
SWEEP_STEP = 2.0
SWEEP_POINTS = 19

# Numbers 1-11 are the workbook's engine table (Lycoming + Continental
# pistons, rows A90:G103). Numbers 12+ extend the catalog beyond the sheet
# so the page can size anything from LSA pistons to regional turbofan
# twins. Turboprop power is shaft horsepower; turbofans carry static
# thrust in `thrust_lbf` with `hp` left at zero.
ENGINE_CATALOG: tuple[EngineSpec, ...] = (
    # --- workbook rows -------------------------------------------------
    EngineSpec(1, "Lycoming", "0-540-A", 250, 2575, "8.50:1", 2000, 406),
    EngineSpec(2, "Lycoming", "O-540-E", 260, 2700, "8.50:1", 2000, 399),
    EngineSpec(3, "Lycoming", "IO-540-C", 250, 2575, "8.50:1", 2000, 404),
    EngineSpec(4, "Lycoming", "IO-540-D", 260, 2700, "8.50:1", 2000, 412),
    EngineSpec(5, "Lycoming", "TIO-540-C", 250, 2575, "7.20:1", 2000, 483),
    EngineSpec(6, "Lycoming", "IO-540-AA", 270, 2700, "7.30:1", 1800, 479),
    EngineSpec(
        7, "Continental", "IO-470-C", 250, 2600, "8.0:1", 2000, 402, "91/96"
    ),
    EngineSpec(
        8,
        "Continental",
        "IO-470-D&E",
        260,
        2625,
        "8.60:1",
        1500,
        426,
        "100/130",
    ),
    EngineSpec(
        9,
        "Continental",
        "IO-470-L&M",
        260,
        2625,
        "8.60:1",
        1500,
        411,
        "100/100LL",
    ),
    EngineSpec(
        10,
        "Continental",
        "IO-520-B,BA,BB",
        285,
        2700,
        "8.50:1",
        1700,
        406,
        "100/100LL",
    ),
    EngineSpec(
        11,
        "Continental",
        "TSIO-520-B,BB",
        285,
        2700,
        "7.50:1",
        1400,
        407,
        "100/100LL",
    ),
    # --- light piston extensions ---------------------------------------
    EngineSpec(12, "Continental", "O-200-A", 100, 2750, "7.0:1", 1800, 170),
    EngineSpec(13, "Lycoming", "O-320-D2J", 160, 2700, "7.0:1", 2000, 288),
    EngineSpec(14, "Lycoming", "IO-360-A4M", 180, 2700, "8.5:1", 2000, 277),
    EngineSpec(
        15, "Rotax", "912 ULS", 100, 5800, "10.8:1", 2000, 132, "MOGAS"
    ),
    EngineSpec(
        16, "Rotax", "914 UL", 115, 5800, "9.0:1", 2000, 141, "MOGAS"
    ),
    EngineSpec(
        17, "Rotax", "915 iS", 135, 5800, "10.5:1", 2000, 137, "MOGAS"
    ),
    EngineSpec(18, "Lycoming", "IO-540-K1F5", 300, 2700, "8.7:1", 2000, 300),
    EngineSpec(19, "Continental", "IO-550-N", 310, 2700, "8.6:1", 2000, 419),
    # --- turboprops ------------------------------------------------------
    EngineSpec(
        20,
        "Pratt & Whitney Canada",
        "PT6A-34",
        750,
        2200,
        "n/a",
        7000,
        348,
        "Jet A",
        EngineType.TURBOPROP,
    ),
    EngineSpec(
        21,
        "Pratt & Whitney Canada",
        "PT6A-42",
        850,
        2200,
        "n/a",
        7000,
        392,
        "Jet A",
        EngineType.TURBOPROP,
    ),
    EngineSpec(
        22,
        "GE Aerospace",
        "H80",
        800,
        2200,
        "n/a",
        7000,
        445,
        "Jet A",
        EngineType.TURBOPROP,
    ),
    EngineSpec(
        23,
        "Honeywell",
        "TPE331-10U",
        940,
        2000,
        "n/a",
        7000,
        400,
        "Jet A",
        EngineType.TURBOPROP,
    ),
    EngineSpec(
        24,
        "Pratt & Whitney Canada",
        "PT6A-67AG",
        1200,
        2200,
        "n/a",
        7000,
        490,
        "Jet A",
        EngineType.TURBOPROP,
    ),
    # --- turbofans (static thrust) ---------------------------------------
    EngineSpec(
        25,
        "Garrett",
        "TFE731-2-2B",
        0,
        0,
        "n/a",
        3600,
        446,
        "Jet A",
        EngineType.TURBOFAN,
        3500,
    ),
    EngineSpec(
        26,
        "Williams",
        "FJ44-4A",
        0,
        0,
        "n/a",
        5000,
        885,
        "Jet A",
        EngineType.TURBOFAN,
        3600,
    ),
    EngineSpec(
        27,
        "Pratt & Whitney Canada",
        "PW535E",
        0,
        0,
        "n/a",
        5000,
        825,
        "Jet A",
        EngineType.TURBOFAN,
        3400,
    ),
    EngineSpec(
        28,
        "CFE Company",
        "CFE738-1-1B",
        0,
        0,
        "n/a",
        6000,
        1325,
        "Jet A",
        EngineType.TURBOFAN,
        5910,
    ),
    EngineSpec(
        29,
        "CFM International",
        "CFM56-7B24",
        0,
        0,
        "n/a",
        25000,
        5257,
        "Jet A",
        EngineType.TURBOFAN,
        24000,
    ),
)


def _require_finite(name: str, value: float) -> None:
    if not math.isfinite(value):
        raise SrefCalculationError(f"{name} must be a finite number.")


def _require_positive(name: str, value: float) -> None:
    _require_finite(name, value)
    if value <= 0:
        raise SrefCalculationError(f"{name} must be greater than zero.")


def _require_fraction(name: str, value: float) -> None:
    _require_positive(name, value)
    if value > 1:
        raise SrefCalculationError(f"{name} must be a fraction of at most one.")


def _validate(inputs: SrefInputs) -> None:
    req = inputs.requirements
    aero = inputs.aerodynamics
    weights = inputs.weights
    point = inputs.design_point
    atm = inputs.atmosphere

    _require_positive("altitude_ft", atm.altitude_ft)
    _require_positive("service_ceiling_ft", atm.service_ceiling_ft)
    if atm.service_ceiling_ft >= 20805.7:
        # The workbook density model diverges once the bracket turns negative.
        raise SrefCalculationError(
            "service_ceiling_ft exceeds the density model range (20,805 ft)."
        )

    _require_positive("cl_max", req.cl_max)
    _require_positive("stall_speed_kcas", req.stall_speed_kcas)
    _require_positive("vmax_knots", req.vmax_knots)
    _require_positive("takeoff_run_ft", req.takeoff_run_ft)
    _require_positive("rate_of_climb_fpm", req.rate_of_climb_fpm)
    _require_positive("ceiling_rate_of_climb_fpm", req.ceiling_rate_of_climb_fpm)

    _require_positive("cd0", aero.cd0)
    _require_positive("aspect_ratio", aero.aspect_ratio)
    _require_fraction("oswald_efficiency", aero.oswald_efficiency)
    if aero.induced_drag_factor_override is not None:
        _require_positive(
            "induced_drag_factor_override", aero.induced_drag_factor_override
        )
    _require_positive("ld_max", aero.ld_max)
    _require_fraction("prop_efficiency_cruise", aero.prop_efficiency_cruise)
    _require_fraction("prop_efficiency_climb", aero.prop_efficiency_climb)
    _require_fraction("prop_efficiency_takeoff", aero.prop_efficiency_takeoff)
    _require_positive("cl_takeoff", aero.cl_takeoff)
    _require_positive("takeoff_speed_knots", aero.takeoff_speed_knots)
    _require_non_negative_gear_drag(aero.takeoff_gear_drag)
    _require_positive("rolling_friction", aero.rolling_friction)

    _require_positive("design_weight_lb", weights.design_weight_lb)
    _require_fraction("taxi_fraction", weights.taxi_fraction)
    _require_fraction("climb_fraction", weights.climb_fraction)
    _require_fraction("cruise_fraction", weights.cruise_fraction)
    _require_positive("cruise_speed_knots", weights.cruise_speed_knots)

    _require_positive(
        "wing_loading_lb_per_ft2", point.wing_loading_lb_per_ft2
    )
    _require_positive(
        "power_loading_lb_per_hp", point.power_loading_lb_per_hp
    )
    if not isinstance(point.engine_count, int) or point.engine_count < 1:
        raise SrefCalculationError("engine_count must be a whole number of at least one.")


def _require_non_negative_gear_drag(value: float) -> None:
    _require_finite("takeoff_gear_drag", value)
    if value < 0:
        raise SrefCalculationError("takeoff_gear_drag cannot be negative.")


def _density_at(altitude_ft: float) -> float:
    """Workbook B5: rho = 0.002378 * (1 - 6.8756e-6 * h)^4.2561 [slug/ft^3]."""
    return SEA_LEVEL_DENSITY_SLUG_FT3 * (
        1 - 0.0000068756 * altitude_ft
    ) ** 4.2561


def _atmosphere(inputs: AtmosphereInputs) -> AtmosphereResult:
    rho_altitude = _density_at(inputs.altitude_ft)
    rho_ceiling = _density_at(inputs.service_ceiling_ft)
    return AtmosphereResult(
        rho_altitude_slug_per_ft3=rho_altitude,
        sigma=rho_altitude / SEA_LEVEL_DENSITY_SLUG_FT3,
        rho_ceiling_slug_per_ft3=rho_ceiling,
        sigma_ceiling=rho_ceiling / SEA_LEVEL_DENSITY_SLUG_FT3,
    )


def _stall_limit_wing_loading(req: PerformanceRequirements) -> float:
    """Workbook K3: constant stall-limit line on wing loading."""
    return 0.5 * SEA_LEVEL_DENSITY_SLUG_FT3 * req.cl_max * (
        req.stall_speed_kcas * KNOT_TO_FPS
    ) ** 2


def _induced_drag_factor(aero: Aerodynamics) -> float:
    """Workbook B16: k = 1 / (pi * AR * e), or the explicit parity override."""
    if aero.induced_drag_factor_override is not None:
        return aero.induced_drag_factor_override
    return 1.0 / (math.pi * aero.oswald_efficiency * aero.aspect_ratio)


def _wp_vmax(wing_loading: float, req: PerformanceRequirements, aero: Aerodynamics, k: float, atm: AtmosphereResult) -> float:
    """Workbook M column: W/P for the level-flight maximum-speed requirement.

    Preserves the worksheet's cruise-altitude scaling: the induced term
    divides by rho-altitude * sigma (cells B5 * B6) rather than sea-level
    density, and omits an extra Oswald factor (it is already inside k).
    """
    vmax_fps = req.vmax_knots * KNOT_TO_FPS
    denominator = (
        0.5
        * SEA_LEVEL_DENSITY_SLUG_FT3
        * vmax_fps**3
        * aero.cd0
        / wing_loading
        + 2
        * k
        * wing_loading
        / (
            atm.rho_altitude_slug_per_ft3
            * atm.sigma
            * vmax_fps
        )
    )
    return aero.prop_efficiency_cruise * 550.0 / denominator


def _takeoff_drag_coefficient(req: PerformanceRequirements, aero: Aerodynamics, k: float) -> float:
    """Workbook B25->B26->B29 chain reduced to the CDG term used in column N."""
    cd_clean = aero.cd0 + aero.takeoff_gear_drag  # B25
    cd_total = cd_clean + k * aero.cl_takeoff**2  # B26
    return cd_total - aero.rolling_friction * aero.cl_takeoff  # B29 (CDG)


def _wp_takeoff(wing_loading: float, req: PerformanceRequirements, aero: Aerodynamics, k: float) -> float:
    """Workbook N column: W/P from the FAR Part 23 take-off run requirement."""
    cdg = _takeoff_drag_coefficient(req, aero, k)
    exponent = 0.6 * SEA_LEVEL_DENSITY_SLUG_FT3 * GRAVITY_FPS2 * cdg * req.takeoff_run_ft / wing_loading
    exponential = math.exp(exponent)
    factor = (1 - exponential) / (
        aero.rolling_friction
        - (aero.rolling_friction + cdg / aero.cl_takeoff) * exponential
    )
    return factor * (550.0 * aero.prop_efficiency_takeoff / (aero.takeoff_speed_knots * KNOT_TO_FPS))


def _wp_climb(wing_loading: float, req: PerformanceRequirements, aero: Aerodynamics, k: float) -> float:
    """Workbook O column: sea-level rate-of-climb W/P requirement."""
    term = req.rate_of_climb_fpm / (60.0 * aero.prop_efficiency_climb * 550.0)
    term += (
        math.sqrt(
            2
            * wing_loading
            / (SEA_LEVEL_DENSITY_SLUG_FT3 * math.sqrt(3 * aero.cd0 / k))
        )
        * (1.155 / (aero.ld_max * aero.prop_efficiency_climb * 550.0))
    )
    return 1.0 / term


def _wp_ceiling(wing_loading: float, req: PerformanceRequirements, aero: Aerodynamics, k: float, atm: AtmosphereResult) -> float:
    """Workbook P column: service-ceiling W/P requirement.

    Preserves the worksheet anomaly of scaling the whole expression by
    sigma-ceiling while using ceiling density inside the square root.
    """
    term = req.ceiling_rate_of_climb_fpm / (60.0 * aero.prop_efficiency_climb * 550.0)
    term += (
        math.sqrt(
            2
            * wing_loading
            / (atm.rho_ceiling_slug_per_ft3 * math.sqrt(3 * aero.cd0 / k))
        )
        * (1.155 / (aero.ld_max * aero.prop_efficiency_climb * 550.0))
    )
    return atm.sigma_ceiling / term


def calculate_sref(inputs: SrefInputs = SrefInputs()) -> SrefResult:
    _validate(inputs)
    atm = _atmosphere(inputs.atmosphere)
    req = inputs.requirements
    aero = inputs.aerodynamics
    weights = inputs.weights
    point = inputs.design_point

    stall_limit = _stall_limit_wing_loading(req)
    k = _induced_drag_factor(aero)

    weight_start = weights.taxi_fraction * weights.climb_fraction * weights.design_weight_lb
    weight_end = weight_start * weights.cruise_fraction
    weight_average = (weight_start + weight_end) / 2.0

    curves = tuple(
        CurvePoint(
            wing_loading=wing_loading,
            wp_vmax=_wp_vmax(wing_loading, req, aero, k, atm),
            wp_takeoff=_wp_takeoff(wing_loading, req, aero, k),
            wp_climb=_wp_climb(wing_loading, req, aero, k),
            wp_ceiling=_wp_ceiling(wing_loading, req, aero, k, atm),
        )
        for wing_loading in (
            SWEEP_START_WING_LOADING + index * SWEEP_STEP
            for index in range(SWEEP_POINTS)
        )
    )

    wing_area_ft2 = weights.design_weight_lb / point.wing_loading_lb_per_ft2
    wing_area_m2 = wing_area_ft2 / FT2_PER_M2
    power_required_hp = weights.design_weight_lb / point.power_loading_lb_per_hp
    power_per_engine_hp = power_required_hp / point.engine_count
    cruise_cl = (2.0 * weight_average) / (
        wing_area_m2
        * 10.7639
        * atm.rho_altitude_slug_per_ft3
        * (weights.cruise_speed_knots * KNOT_TO_FPS) ** 2
    )

    sizing = SizingResult(
        wing_area_ft2=wing_area_ft2,
        wing_area_m2=wing_area_m2,
        power_required_hp=power_required_hp,
        power_per_engine_hp=power_per_engine_hp,
        total_horsepower_hp=power_per_engine_hp * point.engine_count,
        cruise_cl=cruise_cl,
    )

    return SrefResult(
        atmosphere=atm,
        stall_limit_wing_loading=stall_limit,
        weight_start_cruise_lb=weight_start,
        weight_end_cruise_lb=weight_end,
        weight_average_cruise_lb=weight_average,
        induced_drag_factor=k,
        curves=curves,
        sizing=sizing,
    )


__all__ = ["ENGINE_CATALOG", "SrefCalculationError", "calculate_sref"]
