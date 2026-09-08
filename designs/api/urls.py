from django.urls import path

from .views import (
    AeroClassCatalogAPIView,
    AirfoilCatalogAPIView,
    AirfoilDetailAPIView,
    CostAnalysisAPIView,
    RudderReferenceCatalogAPIView,
    SrefEngineCatalogAPIView,
    SrefSizingAPIView,
    StallLimitCatalogAPIView,
    UasSizingAPIView,
)

urlpatterns = [
    path("cost-analysis/", CostAnalysisAPIView.as_view(), name="cost_analysis"),
    path("sref-sizing/", SrefSizingAPIView.as_view(), name="sref_sizing"),
    path("uas-sizing/", UasSizingAPIView.as_view(), name="uas_sizing"),
    path(
        "sref-engines/",
        SrefEngineCatalogAPIView.as_view(),
        name="sref_engines",
    ),
    path(
        "aero-classes/",
        AeroClassCatalogAPIView.as_view(),
        name="aero_class_catalog",
    ),
    path(
        "stall-limits/",
        StallLimitCatalogAPIView.as_view(),
        name="stall_limit_catalog",
    ),
    path(
        "control-references/rudder/",
        RudderReferenceCatalogAPIView.as_view(),
        name="rudder_reference_catalog",
    ),
    path("airfoils/", AirfoilCatalogAPIView.as_view(), name="airfoil_catalog"),
    path(
        "airfoils/<slug:slug>/",
        AirfoilDetailAPIView.as_view(),
        name="airfoil_detail",
    ),
]
