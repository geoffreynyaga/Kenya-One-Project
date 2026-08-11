from math import isclose

from rest_framework.test import APIClient


def test_cost_analysis_defaults_match_workbook_reference():
    response = APIClient().post("/api/designs/cost-analysis/", {}, format="json")

    assert response.status_code == 200
    assert response.data["status"] == "success"
    data = response.data["data"]
    assert isclose(
        data["development"]["breakdown"]["minimum_selling_price"],
        1_288_289.0716629697,
    )
    assert isclose(data["break_even"]["scenarios"][0]["units"], 2.6786873786785526)
    assert isclose(data["operating"]["cost_per_flight_hour"], 516.401455940824)


def test_cost_analysis_accepts_nested_assumption_overrides():
    response = APIClient().post(
        "/api/designs/cost-analysis/",
        {
            "financing": {
                "loan_term_years": 5,
                "annual_interest_percent": 0,
                "loan_principal": 120000,
            },
            "selling_prices": [800000, 1200000, 1300000],
        },
        format="json",
    )

    assert response.status_code == 200
    assert response.data["data"]["financing"] == {
        "principal": 120000.0,
        "monthly_payment": 2000.0,
        "annual_payment": 24000.0,
    }


def test_cost_analysis_returns_field_validation_errors():
    response = APIClient().post(
        "/api/designs/cost-analysis/",
        {
            "aircraft": {"airframe_weight_lb": 0},
            "operating": {
                "flight_hours_per_year": 0,
                "maintenance_factors": [0, 0],
            },
            "selling_prices": [],
        },
        format="json",
    )

    assert response.status_code == 400
    assert response.data["status"] == "error"
    assert set(response.data["errors"]) == {
        "aircraft",
        "operating",
        "selling_prices",
    }


def test_cost_analysis_marks_an_unprofitable_price_as_infeasible():
    response = APIClient().post(
        "/api/designs/cost-analysis/",
        {"selling_prices": [500000]},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["data"]["break_even"]["scenarios"] == [
        {"selling_price": 500000.0, "units": None, "feasible": False}
    ]
