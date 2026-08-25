from django.urls import path

from .views import CostAnalysisAPIView

urlpatterns = [
    path("cost-analysis/", CostAnalysisAPIView.as_view(), name="cost_analysis"),
]
