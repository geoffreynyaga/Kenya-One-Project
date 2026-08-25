from rest_framework import serializers

from aircraft_design.costs import (
    AircraftCostContext,
    CostInputs,
    DevelopmentAssumptions,
    FinancingAssumptions,
    OperatingAssumptions,
)


class AircraftCostContextSerializer(serializers.Serializer):
    airframe_weight_lb = serializers.FloatField(min_value=0.000001, required=False)
    vmax_knots = serializers.FloatField(min_value=0.000001, required=False)
    engine_count = serializers.IntegerField(min_value=0, required=False)
    engine_power_hp = serializers.FloatField(min_value=0, required=False)
    pilot_count = serializers.IntegerField(min_value=0, required=False)
    fuel_flow_gallons_per_hour = serializers.FloatField(min_value=0, required=False)


class DevelopmentAssumptionsSerializer(serializers.Serializer):
    production_quantity = serializers.IntegerField(min_value=1, required=False)
    certification_factor = serializers.FloatField(min_value=0.000001, required=False)
    complex_flap_factor = serializers.FloatField(min_value=0.000001, required=False)
    composite_fraction = serializers.FloatField(
        min_value=0, max_value=1, required=False
    )
    pressurization_factor = serializers.FloatField(min_value=0.000001, required=False)
    taper_factor = serializers.FloatField(min_value=0.000001, required=False)
    project_years = serializers.FloatField(min_value=0.000001, required=False)
    work_weeks_per_year = serializers.FloatField(min_value=0.000001, required=False)
    work_hours_per_week = serializers.FloatField(min_value=0.000001, required=False)
    engineering_rate = serializers.FloatField(min_value=0, required=False)
    cpi_2012_factor = serializers.FloatField(min_value=0.000001, required=False)
    prototype_count = serializers.IntegerField(min_value=1, required=False)
    tooling_rate = serializers.FloatField(min_value=0, required=False)
    manufacturing_rate = serializers.FloatField(min_value=0, required=False)
    liability_insurance = serializers.FloatField(min_value=0, required=False)
    fixed_gear_discount_per_aircraft = serializers.FloatField(
        min_value=0, required=False
    )
    engine_cost_factor = serializers.FloatField(min_value=0, required=False)
    propeller_cost_factor = serializers.FloatField(min_value=0, required=False)
    avionics_cost_per_aircraft = serializers.FloatField(min_value=0, required=False)


class OperatingAssumptionsSerializer(serializers.Serializer):
    maintenance_factors = serializers.ListField(
        child=serializers.FloatField(), min_length=8, max_length=8, required=False
    )
    technician_rate = serializers.FloatField(min_value=0, required=False)
    flight_hours_per_year = serializers.FloatField(min_value=0.000001, required=False)
    storage_per_month = serializers.FloatField(min_value=0, required=False)
    fuel_price_per_gallon = serializers.FloatField(min_value=0, required=False)
    crew_rate = serializers.FloatField(min_value=0, required=False)
    inspection_per_year = serializers.FloatField(min_value=0, required=False)
    insurance_base = serializers.FloatField(min_value=0, required=False)
    insurance_rate = serializers.FloatField(min_value=0, required=False)
    overhaul_per_engine_flight_hour = serializers.FloatField(
        min_value=0, required=False
    )


class FinancingAssumptionsSerializer(serializers.Serializer):
    loan_term_years = serializers.FloatField(min_value=0.000001, required=False)
    annual_interest_percent = serializers.FloatField(min_value=0, required=False)
    loan_principal = serializers.FloatField(
        min_value=0, allow_null=True, required=False
    )


class CostAnalysisRequestSerializer(serializers.Serializer):
    aircraft = AircraftCostContextSerializer(required=False)
    development = DevelopmentAssumptionsSerializer(required=False)
    operating = OperatingAssumptionsSerializer(required=False)
    financing = FinancingAssumptionsSerializer(required=False)
    selling_prices = serializers.ListField(
        child=serializers.FloatField(min_value=0.000001),
        min_length=1,
        required=False,
    )

    def to_domain(self) -> CostInputs:
        data = self.validated_data
        operating = dict(data.get("operating", {}))
        if "maintenance_factors" in operating:
            operating["maintenance_factors"] = tuple(operating["maintenance_factors"])

        selling_prices = data.get("selling_prices")
        return CostInputs(
            aircraft=AircraftCostContext(**data.get("aircraft", {})),
            development=DevelopmentAssumptions(**data.get("development", {})),
            operating=OperatingAssumptions(**operating),
            financing=FinancingAssumptions(**data.get("financing", {})),
            selling_prices=(
                tuple(selling_prices)
                if selling_prices is not None
                else CostInputs().selling_prices
            ),
        )
