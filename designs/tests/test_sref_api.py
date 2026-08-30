from math import isclose

from rest_framework.test import APIClient


def test_sref_sizing_defaults_use_the_cruise_only_fraction():
    response = APIClient().post("/api/designs/sref-sizing/", {}, format="json")

    assert response.status_code == 200
    assert response.data["status"] == "success"
    data = response.data["data"]
    assert isclose(data["stall_limit_wing_loading"], 22.691275793164802)
    assert isclose(data["sizing"]["wing_area_m2"], 23.951178858082848)
    assert isclose(data["sizing"]["power_required_hp"], 508.69565217391306)
    assert isclose(data["sizing"]["cruise_cl"], 0.4233293675295599)
    assert len(data["curves"]) == 19
    assert data["curves"][0]["wp_vmax"] == 5.965230373322869


def test_sref_sizing_accepts_design_point_overrides():
    response = APIClient().post(
        "/api/designs/sref-sizing/",
        {
            "design_point": {
                "wing_loading_lb_per_ft2": 20.0,
                "power_loading_lb_per_hp": 10.0,
                "engine_count": 2,
            },
        },
        format="json",
    )

    assert response.status_code == 200
    data = response.data["data"]
    assert isclose(data["sizing"]["wing_area_ft2"], 5850.0 / 20.0)
    assert isclose(data["sizing"]["wing_area_m2"], 5850.0 / 20.0 / 10.76391)
    assert isclose(data["sizing"]["power_required_hp"], 585.0)
    assert isclose(data["sizing"]["power_per_engine_hp"], 292.5)


def test_sref_sizing_rejects_invalid_requirements():
    response = APIClient().post(
        "/api/designs/sref-sizing/",
        {"requirements": {"stall_speed_kcas": 0}},
        format="json",
    )

    assert response.status_code == 400
    assert response.data["status"] == "error"


def test_sref_sizing_rejects_physically_invalid_combinations():
    response = APIClient().post(
        "/api/designs/sref-sizing/",
        {
            "atmosphere": {"service_ceiling_ft": 30000.0},
            "requirements": {"ceiling_rate_of_climb_fpm": 100},
        },
        format="json",
    )

    assert response.status_code == 422
    assert response.data["code"] == "INVALID_SIZING_INPUTS"


def test_sref_engine_catalog_is_served_separately_and_cached():
    response = APIClient().get("/api/designs/sref-engines/")

    assert response.status_code == 200
    assert response.data["status"] == "success"
    engines = response.data["data"]
    assert {engine["engine_type"] for engine in engines} == {
        "piston",
        "turboprop",
        "turbofan",
    }
    assert any(engine["name"] == "IO-540-D" for engine in engines)
    assert "max-age=86400" in response["Cache-Control"]


def test_sref_sizing_response_omits_the_engine_catalog():
    """63% of the old payload was a static table repeated on every solve."""
    response = APIClient().post("/api/designs/sref-sizing/", {}, format="json")

    assert response.status_code == 200
    assert "engines" not in response.data["data"]
    assert "selected_engine" not in response.data["data"]
