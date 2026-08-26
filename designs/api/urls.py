from django.urls import path

from .views import (
    AirfoilCatalogAPIView,
    AirfoilDetailAPIView,
    CostAnalysisAPIView,
    SrefEngineCatalogAPIView,
    SrefSizingAPIView,
)

urlpatterns = [
    path("cost-analysis/", CostAnalysisAPIView.as_view(), name="cost_analysis"),
    path("sref-sizing/", SrefSizingAPIView.as_view(), name="sref_sizing"),
    path(
        "sref-engines/",
        SrefEngineCatalogAPIView.as_view(),
        name="sref_engines",
    ),
    path("airfoils/", AirfoilCatalogAPIView.as_view(), name="airfoil_catalog"),
    path(
        "airfoils/<slug:slug>/",
        AirfoilDetailAPIView.as_view(),
        name="airfoil_detail",
    ),
]
