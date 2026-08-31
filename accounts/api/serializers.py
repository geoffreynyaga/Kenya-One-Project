from rest_framework import serializers

from CORE.engines.prerequisitesEngine import EMPTY_WEIGHT_CONSTANTS


AIRCRAFT_TYPES = tuple(EMPTY_WEIGHT_CONSTANTS)


class InitialSizingRequestSerializer(serializers.Serializer):
    aircraft_type = serializers.ChoiceField(
        choices=AIRCRAFT_TYPES,
        error_messages={"invalid_choice": "Select a supported aircraft category."},
    )
    altitude = serializers.FloatField(
        min_value=0,
        error_messages={"min_value": "Altitude cannot be negative."},
    )
    pax = serializers.IntegerField(
        min_value=0,
        error_messages={"min_value": "Passenger count cannot be negative."},
    )
    crew = serializers.IntegerField(
        min_value=1,
        error_messages={"min_value": "At least one crew member is required."},
    )
    range = serializers.FloatField()
    propellerEfficiency = serializers.FloatField()
    # Best lift-to-drag ratio. A consequence of the drag polar rather than a
    # constant, so the client sends the one the rest of the design uses; the
    # module default stands in only for callers that have not got one yet.
    ldMax = serializers.FloatField(
        min_value=0.000001,
        required=False,
        error_messages={"min_value": "L/D max must be greater than zero."},
    )
    aspectRatio = serializers.FloatField()
    xAxisLimits = serializers.ListField(
        child=serializers.FloatField(),
        min_length=2,
        max_length=2,
    )
    yAxisLimits = serializers.ListField(
        child=serializers.FloatField(),
        min_length=2,
        max_length=2,
        required=False,
    )

    def validate_range(self, value):
        if value <= 0:
            raise serializers.ValidationError("Design range must be greater than 0 km.")
        return value

    def validate_propellerEfficiency(self, value):
        if value <= 0 or value > 1:
            raise serializers.ValidationError(
                "Propeller efficiency must be greater than 0 and no more than 1."
            )
        return value

    def validate_aspectRatio(self, value):
        if value <= 0:
            raise serializers.ValidationError("Aspect ratio must be greater than 0.")
        return value

    def validate_xAxisLimits(self, value):
        if value[0] >= value[1]:
            raise serializers.ValidationError(
                "Minimum sweep weight must be less than maximum."
            )
        return value
