from rest_framework.test import APIClient

from aircraft_design.stall_limits import STALL_LIMITS


def test_catalog_serves_every_certification_basis():
    response = APIClient().get("/api/designs/stall-limits/")

    assert response.status_code == 200
    assert response.data["status"] == "success"
    rows = response.data["data"]
    assert len(rows) == len(STALL_LIMITS)
    assert rows[0]["value"] == "ultralight"


def test_the_two_limits_the_figure_draws_come_across_intact():
    rows = APIClient().get("/api/designs/stall-limits/").data["data"]
    by_value = {row["value"]: row for row in rows}

    assert by_value["light_sport"]["limit_kcas"] == 45.0
    assert by_value["light_sport"]["citation"] == "14 CFR 1.1"
    assert by_value["far23_single"]["limit_kcas"] == 61.0
    assert by_value["far23_single"]["speed"] == "VS0"


def test_an_absent_ceiling_serialises_as_null_not_zero():
    """A zero would read as "stalls at nothing", which is the opposite."""
    rows = APIClient().get("/api/designs/stall-limits/").data["data"]
    transport = next(row for row in rows if row["value"] == "far25_transport")

    assert transport["limit_kcas"] is None


def test_catalog_is_cached_like_the_other_reference_tables():
    response = APIClient().get("/api/designs/stall-limits/")

    assert "max-age=86400" in response["Cache-Control"]
