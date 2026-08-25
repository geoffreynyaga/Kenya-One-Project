from dataclasses import asdict

from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_control
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from aircraft_design.costs import CostCalculationError, calculate_costs
from aircraft_design.sref import ENGINE_CATALOG, SrefCalculationError, calculate_sref

from .serializers import CostAnalysisRequestSerializer, SrefSizingRequestSerializer


class CostAnalysisAPIView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = CostAnalysisRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    "status": "error",
                    "message": "Check the highlighted cost inputs and try again.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = calculate_costs(serializer.to_domain())
        except CostCalculationError as error:
            return Response(
                {
                    "status": "error",
                    "code": "INVALID_COST_INPUTS",
                    "message": str(error),
                },
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        return Response({"status": "success", "data": asdict(result)})


class SrefSizingAPIView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = SrefSizingRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    "status": "error",
                    "message": "Check the highlighted sizing inputs and try again.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = calculate_sref(serializer.to_domain())
        except SrefCalculationError as error:
            return Response(
                {
                    "status": "error",
                    "code": "INVALID_SIZING_INPUTS",
                    "message": str(error),
                },
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        return Response({"status": "success", "data": asdict(result)})


class SrefEngineCatalogAPIView(APIView):
    """The engine reference table.

    Static data that only changes when the code does, so it is served once and
    cached rather than repeated in every sizing response.
    """

    @method_decorator(cache_control(max_age=60 * 60 * 24, public=True))
    def get(self, request, *args, **kwargs):
        return Response(
            {
                "status": "success",
                "data": [asdict(engine) for engine in ENGINE_CATALOG],
            }
        )
