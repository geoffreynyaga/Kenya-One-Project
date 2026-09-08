from rest_framework.test import APIClient

from aircraft_design.aero_classes import AERO_CLASSES


def test_catalog_serves_every_row_of_table_3_1():
    response = APIClient().get("/api/designs/aero-classes/")

    assert response.status_code == 200
    assert response.data["status"] == "success"
    rows = response.data["data"]
    assert len(rows) == len(AERO_CLASSES)
    assert rows[0]["label"] == "Amphibious"


def test_each_row_carries_both_ranges_and_the_books_comment():
    rows = APIClient().get("/api/designs/aero-classes/").data["data"]
    trainer = next(row for row in rows if row["value"] == "ga_trainer")

    assert trainer["cd_min_low"] == 0.030
    assert trainer["cd_min_high"] == 0.035
    assert trainer["cd_takeoff_low"] == 0.040
    assert trainer["cd_takeoff_high"] == 0.045
    assert trainer["cl_takeoff"] == 0.7
    assert trainer["comment"] == "Assumes flaps in T-O position."


def test_catalog_is_cached_like_the_engine_table():
    response = APIClient().get("/api/designs/aero-classes/")

    assert "max-age=86400" in response["Cache-Control"]
