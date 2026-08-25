"""Immutable input and result contracts for aircraft cost calculations."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class AircraftCostContext:
    airframe_weight_lb: float = 1740.1367540708186
    vmax_knots: float = 170.0
    engine_count: int = 2
    engine_power_hp: float = 260.0
    pilot_count: int = 2
    fuel_flow_gallons_per_hour: float = 32.33390119250426


@dataclass(frozen=True)
class DevelopmentAssumptions:
    production_quantity: int = 1
    certification_factor: float = 1.0
    complex_flap_factor: float = 1.0
    composite_fraction: float = 0.0
    pressurization_factor: float = 1.0
    taper_factor: float = 1.0
    project_years: float = 1.0
    work_weeks_per_year: float = 48.0
    work_hours_per_week: float = 24.0
    engineering_rate: float = 0.0
    cpi_2012_factor: float = 1.0
    prototype_count: int = 1
    tooling_rate: float = 0.0
    manufacturing_rate: float = 0.0
    liability_insurance: float = 300_000.0
    fixed_gear_discount_per_aircraft: float = 7_500.0
    engine_cost_factor: float = 174.0
    propeller_cost_factor: float = 3_145.0
    avionics_cost_per_aircraft: float = 15_000.0


@dataclass(frozen=True)
class OperatingAssumptions:
    maintenance_factors: tuple[float, ...] = (-0.15, 0, 0, 0.02, 0, 0, 0, 0)
    technician_rate: float = 10.0
    flight_hours_per_year: float = 1_040.0
    storage_per_month: float = 250.0
    fuel_price_per_gallon: float = 5.59
    crew_rate: float = 0.0
    inspection_per_year: float = 500.0
    insurance_base: float = 500.0
    insurance_rate: float = 0.015
    overhaul_per_engine_flight_hour: float = 5.0


@dataclass(frozen=True)
class FinancingAssumptions:
    loan_term_years: float = 5.0
    annual_interest_percent: float = 9.0
    loan_principal: float | None = None


@dataclass(frozen=True)
class CostInputs:
    aircraft: AircraftCostContext = AircraftCostContext()
    development: DevelopmentAssumptions = DevelopmentAssumptions()
    operating: OperatingAssumptions = OperatingAssumptions()
    financing: FinancingAssumptions = FinancingAssumptions()
    selling_prices: tuple[float, ...] = (800_000.0, 1_200_000.0, 1_300_000.0)


@dataclass(frozen=True)
class CostBreakdown:
    engineering: float
    development_support: float
    flight_test: float
    tooling: float
    certification: float
    manufacturing_labor: float
    quality_control: float
    materials_and_equipment: float
    fixed_gear_discount: float
    engines: float
    propellers: float
    avionics: float
    liability_insurance: float
    total_to_produce: float
    minimum_selling_price: float


@dataclass(frozen=True)
class DevelopmentResult:
    engineering_hours: float
    tooling_hours: float
    manufacturing_hours: float
    engineers_required: float
    manufacturing_hours_per_aircraft: float
    breakdown: CostBreakdown


@dataclass(frozen=True)
class BreakEvenScenario:
    selling_price: float
    units: float | None
    feasible: bool


@dataclass(frozen=True)
class BreakEvenChartPoint:
    units: float
    total_cost: float
    fixed_cost: float
    revenues: tuple[float, ...]


@dataclass(frozen=True)
class BreakEvenResult:
    fixed_cost: float
    variable_cost: float
    scenarios: tuple[BreakEvenScenario, ...]
    chart: tuple[BreakEvenChartPoint, ...]


@dataclass(frozen=True)
class FinancingResult:
    principal: float
    monthly_payment: float
    annual_payment: float


@dataclass(frozen=True)
class OperatingResult:
    maintenance_to_flight_hour_ratio: float
    maintenance: float
    storage: float
    fuel: float
    insurance: float
    inspection: float
    engine_overhaul: float
    crew: float
    loan_repayment: float
    total_per_year: float
    cost_per_flight_hour: float


@dataclass(frozen=True)
class CostResult:
    development: DevelopmentResult
    break_even: BreakEvenResult
    financing: FinancingResult
    operating: OperatingResult
