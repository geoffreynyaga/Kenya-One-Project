"""Data contracts for the 'Sref and POWER SIZING' worksheet translation.

Every value defaults to the workbook's cached state so the first call
reproduces the sheet exactly. Model corrections belong in later,
separately reviewed work — this module is a faithful port first.
"""

from dataclasses import dataclass
from enum import Enum


class SrefCalculationError(ValueError):
    """Raised when inputs cannot produce a physically meaningful result."""


class EngineType(str, Enum):
    """Propulsion families the sizing sheet can select against."""

    PISTON = "piston"
    TURBOPROP = "turboprop"
    TURBOFAN = "turbofan"


@dataclass(frozen=True)
class AtmosphereInputs:
    altitude_ft: float = 10000.0
    service_ceiling_ft: float = 18000.0


@dataclass(frozen=True)
class PerformanceRequirements:
    cl_max: float = 1.8
    stall_speed_kcas: float = 61.0
    vmax_knots: float = 170.0
    takeoff_run_ft: float = 1500.0
    rate_of_climb_fpm: float = 1600.0
    ceiling_rate_of_climb_fpm: float = 100.0


@dataclass(frozen=True)
class Aerodynamics:
    cd0: float = 0.02521994401080592
    aspect_ratio: float = 7.8
    oswald_efficiency: float = 0.7555260492234778
    # Workbook B16 caches k = 0.054006965223581664, whose implied e
    # (0.75562...) no longer matches the cached B18 e above — a stale
    # cross-sheet cache. The curve columns were evaluated with the cached
    # k, so parity requires carrying k explicitly.
    induced_drag_factor_override: float | None = 0.054006965223581664
    ld_max: float = 13.547933564579795
    prop_efficiency_cruise: float = 0.8
    prop_efficiency_climb: float = 0.7
    prop_efficiency_takeoff: float = 0.583014076612842
    cl_takeoff: float = 1.4869053204776603
    takeoff_speed_knots: float = 67.11577841941003
    takeoff_gear_drag: float = 0.005
    rolling_friction: float = 0.04


@dataclass(frozen=True)
class WeightsAndCruise:
    design_weight_lb: float = 5850.0
    taxi_fraction: float = 0.98
    climb_fraction: float = 0.97
    cruise_weight_ratio: float = 0.8560332551941533
    cruise_speed_knots: float = 140.0


@dataclass(frozen=True)
class DesignPoint:
    wing_loading_lb_per_ft2: float = 22.691275793164802
    power_loading_lb_per_hp: float = 11.5
    engine_count: int = 2


@dataclass(frozen=True)
class SrefInputs:
    atmosphere: AtmosphereInputs = AtmosphereInputs()
    requirements: PerformanceRequirements = PerformanceRequirements()
    aerodynamics: Aerodynamics = Aerodynamics()
    weights: WeightsAndCruise = WeightsAndCruise()
    design_point: DesignPoint = DesignPoint()
    engine_number: int = 4


@dataclass(frozen=True)
class AtmosphereResult:
    rho_altitude_slug_per_ft3: float
    sigma: float
    rho_ceiling_slug_per_ft3: float
    sigma_ceiling: float


@dataclass(frozen=True)
class CurvePoint:
    wing_loading: float
    wp_vmax: float
    wp_takeoff: float
    wp_climb: float
    wp_ceiling: float


@dataclass(frozen=True)
class SizingResult:
    wing_area_ft2: float
    wing_area_m2: float
    power_required_hp: float
    power_per_engine_hp: float
    total_horsepower_hp: float
    cruise_cl: float


@dataclass(frozen=True)
class EngineSpec:
    number: int
    family: str
    name: str
    hp: float
    rpm: float
    compression_ratio: str
    tbo_hours: float
    weight_lb: float
    fuel_grade: str | None = None
    engine_type: EngineType = EngineType.PISTON
    thrust_lbf: float | None = None


@dataclass(frozen=True)
class SrefResult:
    atmosphere: AtmosphereResult
    stall_limit_wing_loading: float
    weight_start_cruise_lb: float
    weight_end_cruise_lb: float
    weight_average_cruise_lb: float
    induced_drag_factor: float
    curves: tuple[CurvePoint, ...]
    sizing: SizingResult
    engines: tuple[EngineSpec, ...]
    selected_engine: EngineSpec | None
