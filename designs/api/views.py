from dataclasses import asdict

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from aircraft_design.costs import CostCalculationError, calculate_costs

from .serializers import CostAnalysisRequestSerializer


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
