"""DAPCA IV, break-even, financing, and operating cost calculations."""

from __future__ import annotations

import math

from .contracts import (
    BreakEvenChartPoint,
    BreakEvenResult,
    BreakEvenScenario,
    CostBreakdown,
    CostInputs,
    CostResult,
    DevelopmentResult,
    FinancingResult,
    OperatingResult,
)


class CostCalculationError(ValueError):
    """Raised when cost inputs cannot produce a physical, finite result."""


def _require_finite(name: str, value: float) -> None:
    if not math.isfinite(value):
        raise CostCalculationError(f"{name} must be finite")


def _require_positive(name: str, value: float) -> None:
    _require_finite(name, value)
    if value <= 0:
        raise CostCalculationError(f"{name} must be greater than zero")


def _require_non_negative(name: str, value: float) -> None:
    _require_finite(name, value)
    if value < 0:
        raise CostCalculationError(f"{name} cannot be negative")


def _validate(inputs: CostInputs) -> None:
    aircraft = inputs.aircraft
    development = inputs.development
    operating = inputs.operating
    financing = inputs.financing

    for name, value in (
        ("airframe_weight_lb", aircraft.airframe_weight_lb),
        ("vmax_knots", aircraft.vmax_knots),
        ("production_quantity", development.production_quantity),
        ("certification_factor", development.certification_factor),
        ("complex_flap_factor", development.complex_flap_factor),
        ("pressurization_factor", development.pressurization_factor),
        ("taper_factor", development.taper_factor),
        ("project_years", development.project_years),
        ("work_weeks_per_year", development.work_weeks_per_year),
        ("work_hours_per_week", development.work_hours_per_week),
        ("cpi_2012_factor", development.cpi_2012_factor),
        ("prototype_count", development.prototype_count),
        ("flight_hours_per_year", operating.flight_hours_per_year),
        ("loan_term_years", financing.loan_term_years),
    ):
        _require_positive(name, value)

    for name, value in (
        ("composite_fraction", development.composite_fraction),
        ("engineering_rate", development.engineering_rate),
        ("tooling_rate", development.tooling_rate),
        ("manufacturing_rate", development.manufacturing_rate),
        ("liability_insurance", development.liability_insurance),
        (
            "fixed_gear_discount_per_aircraft",
            development.fixed_gear_discount_per_aircraft,
        ),
        ("engine_cost_factor", development.engine_cost_factor),
        ("propeller_cost_factor", development.propeller_cost_factor),
        ("avionics_cost_per_aircraft", development.avionics_cost_per_aircraft),
        ("engine_count", aircraft.engine_count),
        ("engine_power_hp", aircraft.engine_power_hp),
        ("pilot_count", aircraft.pilot_count),
        ("fuel_flow_gallons_per_hour", aircraft.fuel_flow_gallons_per_hour),
        ("technician_rate", operating.technician_rate),
        ("storage_per_month", operating.storage_per_month),
        ("fuel_price_per_gallon", operating.fuel_price_per_gallon),
        ("crew_rate", operating.crew_rate),
        ("inspection_per_year", operating.inspection_per_year),
        ("insurance_base", operating.insurance_base),
        ("insurance_rate", operating.insurance_rate),
        ("overhaul_per_engine_flight_hour", operating.overhaul_per_engine_flight_hour),
        ("annual_interest_percent", financing.annual_interest_percent),
    ):
        _require_non_negative(name, value)

    if development.composite_fraction > 1:
        raise CostCalculationError("composite_fraction cannot exceed one")
    if len(operating.maintenance_factors) != 8:
        raise CostCalculationError("maintenance_factors must contain eight values")
    for index, factor in enumerate(operating.maintenance_factors, start=1):
        _require_finite(f"maintenance_factors[{index}]", factor)
    if not inputs.selling_prices:
        raise CostCalculationError("at least one selling price is required")
    for index, price in enumerate(inputs.selling_prices, start=1):
        _require_positive(f"selling_prices[{index}]", price)
    if financing.loan_principal is not None:
        _require_non_negative("loan_principal", financing.loan_principal)


def _calculate_development(inputs: CostInputs) -> DevelopmentResult:
    aircraft = inputs.aircraft
    assumptions = inputs.development
    weight = aircraft.airframe_weight_lb
    speed = aircraft.vmax_knots
    quantity = assumptions.production_quantity
    certification = assumptions.certification_factor
    flap = assumptions.complex_flap_factor
    composite = 1 + assumptions.composite_fraction
    pressurization = assumptions.pressurization_factor
    cpi = assumptions.cpi_2012_factor

    engineering_hours = (
        0.0396
        * weight**0.791
        * speed**1.526
        * quantity**0.183
        * certification
        * flap
        * composite
        * pressurization
    )
    production_rate_per_month = quantity / 60
    tooling_hours = (
        1.0032
        * weight**0.764
        * speed**0.899
        * quantity**0.178
        * production_rate_per_month**0.066
        * assumptions.taper_factor
        * flap
        * composite
        * pressurization
    )
    manufacturing_hours = (
        9.6613
        * weight**0.74
        * speed**0.543
        * quantity**0.524
        * certification
        * flap
        * composite
    )

    engineering = 2.0969 * engineering_hours * assumptions.engineering_rate * cpi
    development_support = (
        0.06458
        * weight**0.873
        * speed**1.89
        * assumptions.prototype_count**0.346
        * cpi
        * certification
        * flap
        * (1 + 0.5 * assumptions.composite_fraction)
        * pressurization
    )
    flight_test = (
        0.009646
        * weight**1.16
        * speed**1.3718
        * assumptions.prototype_count**1.281
        * cpi
        * certification
    )
    tooling = 2.0969 * tooling_hours * cpi * assumptions.tooling_rate
    certification_cost = engineering + development_support + flight_test + tooling

    manufacturing_labor = (
        2.0969 * manufacturing_hours * assumptions.manufacturing_rate * cpi
    )
    quality_control = (
        0.13
        * manufacturing_labor
        * certification
        * (1 + 0.5 * assumptions.composite_fraction)
    )
    # Gudmundsson eq (2-11) prints the leading constant as 24.896; the
    # workbook (Cost Analysis!L22) truncates it to 24.89, a 0.024% shift on
    # this one line item. The workbook figure is kept for parity.
    materials_and_equipment = (
        24.89
        * weight**0.689
        * speed**0.624
        * quantity**0.792
        * cpi
        * certification
        * flap
        * pressurization
    )
    fixed_gear_discount = -assumptions.fixed_gear_discount_per_aircraft * quantity
    engines = (
        assumptions.engine_cost_factor
        * aircraft.engine_count
        * aircraft.engine_power_hp
        * cpi
    )
    propellers = assumptions.propeller_cost_factor * aircraft.engine_count * cpi
    avionics = assumptions.avionics_cost_per_aircraft * quantity

    total_to_produce = sum(
        (
            certification_cost,
            manufacturing_labor,
            quality_control,
            materials_and_equipment,
            fixed_gear_discount,
            engines,
            propellers,
            avionics,
        )
    )
    minimum_selling_price = total_to_produce + assumptions.liability_insurance

    return DevelopmentResult(
        engineering_hours=engineering_hours,
        tooling_hours=tooling_hours,
        manufacturing_hours=manufacturing_hours,
        engineers_required=engineering_hours
        / (
            assumptions.project_years
            * assumptions.work_weeks_per_year
            * assumptions.work_hours_per_week
        ),
        manufacturing_hours_per_aircraft=manufacturing_hours / quantity,
        breakdown=CostBreakdown(
            engineering=engineering,
            development_support=development_support,
            flight_test=flight_test,
            tooling=tooling,
            certification=certification_cost,
            manufacturing_labor=manufacturing_labor,
            quality_control=quality_control,
            materials_and_equipment=materials_and_equipment,
            fixed_gear_discount=fixed_gear_discount,
            engines=engines,
            propellers=propellers,
            avionics=avionics,
            liability_insurance=assumptions.liability_insurance,
            total_to_produce=total_to_produce,
            minimum_selling_price=minimum_selling_price,
        ),
    )


def _calculate_break_even(
    inputs: CostInputs, development: DevelopmentResult
) -> BreakEvenResult:
    breakdown = development.breakdown
    fixed_cost = breakdown.certification
    variable_cost = sum(
        (
            breakdown.manufacturing_labor,
            breakdown.quality_control,
            breakdown.materials_and_equipment,
            breakdown.fixed_gear_discount,
            breakdown.engines,
            breakdown.propellers,
            breakdown.avionics,
            breakdown.liability_insurance,
        )
    )
    scenarios = tuple(
        BreakEvenScenario(
            selling_price=price,
            units=(
                fixed_cost / (price - variable_cost) if price > variable_cost else None
            ),
            feasible=price > variable_cost,
        )
        for price in inputs.selling_prices
    )
    chart = tuple(
        BreakEvenChartPoint(
            units=step / 2,
            total_cost=fixed_cost + variable_cost * (step / 2),
            fixed_cost=fixed_cost,
            revenues=tuple(price * (step / 2) for price in inputs.selling_prices),
        )
        for step in range(22)
    )
    return BreakEvenResult(
        fixed_cost=fixed_cost,
        variable_cost=variable_cost,
        scenarios=scenarios,
        chart=chart,
    )


def _calculate_financing(
    inputs: CostInputs, development: DevelopmentResult
) -> FinancingResult:
    assumptions = inputs.financing
    principal = (
        assumptions.loan_principal
        if assumptions.loan_principal is not None
        else development.breakdown.minimum_selling_price
    )
    months = 12 * assumptions.loan_term_years
    monthly_rate = assumptions.annual_interest_percent / (12 * 100)
    if principal == 0:
        monthly_payment = 0.0
    elif monthly_rate == 0:
        monthly_payment = principal / months
    else:
        monthly_payment = (principal * monthly_rate) / (
            1 - (1 / ((1 + monthly_rate) ** months))
        )
    return FinancingResult(
        principal=principal,
        monthly_payment=monthly_payment,
        annual_payment=monthly_payment * 12,
    )


def _calculate_operating(
    inputs: CostInputs,
    financing: FinancingResult,
) -> OperatingResult:
    aircraft = inputs.aircraft
    assumptions = inputs.operating
    flight_hours = assumptions.flight_hours_per_year
    maintenance_ratio = 0.3 + sum(assumptions.maintenance_factors)
    maintenance = maintenance_ratio * assumptions.technician_rate * flight_hours
    storage = 12 * assumptions.storage_per_month
    fuel = (
        aircraft.fuel_flow_gallons_per_hour
        * flight_hours
        * assumptions.fuel_price_per_gallon
    )
    insured_value = inputs.selling_prices[0]
    insurance = assumptions.insurance_base + assumptions.insurance_rate * insured_value
    engine_overhaul = (
        assumptions.overhaul_per_engine_flight_hour
        * aircraft.engine_count
        * flight_hours
    )
    crew = assumptions.crew_rate * aircraft.pilot_count * flight_hours
    total_per_year = sum(
        (
            maintenance,
            storage,
            fuel,
            insurance,
            assumptions.inspection_per_year,
            engine_overhaul,
            crew,
            financing.annual_payment,
        )
    )
    return OperatingResult(
        maintenance_to_flight_hour_ratio=maintenance_ratio,
        maintenance=maintenance,
        storage=storage,
        fuel=fuel,
        insurance=insurance,
        inspection=assumptions.inspection_per_year,
        engine_overhaul=engine_overhaul,
        crew=crew,
        loan_repayment=financing.annual_payment,
        total_per_year=total_per_year,
        cost_per_flight_hour=total_per_year / flight_hours,
    )


def calculate_costs(inputs: CostInputs = CostInputs()) -> CostResult:
    """Calculate all Cost Analysis sections through one pure interface.

    Defaults reproduce the cached values in the reference workbook. Callers can
    replace assumptions or aircraft context without knowing worksheet cells.
    """

    _validate(inputs)
    development = _calculate_development(inputs)
    break_even = _calculate_break_even(inputs, development)
    financing = _calculate_financing(inputs, development)
    operating = _calculate_operating(inputs, financing)
    return CostResult(
        development=development,
        break_even=break_even,
        financing=financing,
        operating=operating,
    )
