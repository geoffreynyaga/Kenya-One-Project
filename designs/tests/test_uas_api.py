from math import isclose

from rest_framework.test import APIClient

URL = "/api/designs/uas-sizing/"

TWO_STROKE_EXAMPLE_3_1 = {
    "fixed_weights": {"payload_lb": 100, "avionics_lb": 0},
    "fractions": {"structure": 0.25, "subsystems": 0.05},
    "propulsion": {
        "type": "reciprocating",
        "aircraft_power_to_weight": 0.05,
        "powerplant_power_to_weight": 1.0,
    },
    "energy": {
        "mission": {
            "objective": "endurance",
            "endurance_h": 24,
            "airspeed_kt": 90,
            "lift_to_drag": 15,
        },
        "fuel": {"bsfc_lb_per_hp_h": 1.0, "propeller_efficiency": 0.6},
    },
    "raymer_category": "UAV_Tac_Recce_or_UCAV",
}


def test_uas_sizing_reproduces_example_3_1():
    response = APIClient().post(URL, TWO_STROKE_EXAMPLE_3_1, format="json")

    assert response.status_code == 200
    assert response.data["status"] == "success"
    data = response.data["data"]
    assert isclose(data["weights"]["takeoff_lb"], 769, abs_tol=10)
    assert isclose(data["energy_mass_fraction"], 0.52, abs_tol=0.005)
    check = data["empty_weight_check"]
    assert check is not None
    assert check["category"] == "UAV_Tac_Recce_or_UCAV"
    # A fraction against a fraction, both at the solved weight.
    assert 0 < check["statistical_fraction"] < 1
    assert check["design_fraction"] == data["empty_weight_fraction"]
    assert len(data["sweep"]) == 101


def test_uas_sizing_reproduces_example_3_2_from_direct_fractions():
    response = APIClient().post(
        URL,
        {
            "fixed_weights": {"payload_lb": 0, "avionics_lb": 0.05, "other_lb": 0.2},
            "fractions": {"structure": 0.2, "subsystems": 0},
            "propulsion": {"type": "battery", "mass_fraction": 0.1},
            "energy": {"mass_fraction": 0.2},
        },
        format="json",
    )

    assert response.status_code == 200
    data = response.data["data"]
    assert data["weights"]["takeoff_lb"] == 0.5
    assert data["empty_weight_check"] is None


def test_uas_sizing_rejects_a_missing_required_field():
    body = {key: value for key, value in TWO_STROKE_EXAMPLE_3_1.items()}
    del body["fixed_weights"]

    response = APIClient().post(URL, body, format="json")

    assert response.status_code == 400
    assert response.data["status"] == "error"
    assert "fixed_weights" in response.data["errors"]


def test_uas_sizing_rejects_fractions_that_do_not_close():
    response = APIClient().post(
        URL,
        {
            **TWO_STROKE_EXAMPLE_3_1,
            "fractions": {"structure": 0.6, "subsystems": 0.4},
        },
        format="json",
    )

    assert response.status_code == 422
    assert response.data["status"] == "error"
    assert response.data["code"] == "INVALID_UAS_INPUTS"


def test_uas_sizing_rejects_an_unknown_propulsion_type():
    response = APIClient().post(
        URL,
        {
            **TWO_STROKE_EXAMPLE_3_1,
            "propulsion": {"type": "warp", "aircraft_power_to_weight": 0.05},
        },
        format="json",
    )

    assert response.status_code == 400
    assert "propulsion" in response.data["errors"]
