import pytest
from rest_framework.test import APIClient

from aircraft_design.airfoils import AirfoilNotFound, get_airfoil, list_airfoils


def test_catalog_lists_only_sections_with_a_source():
    response = APIClient().get("/api/designs/airfoils/")

    assert response.status_code == 200
    assert response.data["status"] == "success"
    rows = response.data["data"]
    assert len(rows) == len(list_airfoils())
    assert all(row["source"] for row in rows)
    # Shape is generated in the browser, so it is never served.
    assert "coordinates" not in rows[0]


def test_catalog_is_cached_like_the_engine_table():
    response = APIClient().get("/api/designs/airfoils/")

    assert "max-age=86400" in response["Cache-Control"]


def test_detail_serves_the_measurements_and_the_source():
    response = APIClient().get("/api/designs/airfoils/4412/")

    assert response.status_code == 200
    data = response.data["data"]
    assert data["name"] == "NACA 4412"
    assert "NACA R-824" in data["source"]
    assert data["reynolds"][0]["cl_max"] == 1.53
    assert data["reynolds"][0]["reynolds"] == 3000000


def test_a_section_with_no_measurements_is_a_404_that_explains_itself():
    response = APIClient().get("/api/designs/airfoils/0012/")

    assert response.status_code == 404
    assert "generated from the designation" in response.data["message"]


def test_the_sourced_section_carries_its_caveat():
    section = get_airfoil("4412")

    # The workbook's drag column is an order of magnitude out; the catalogue
    # carries it as the workbook has it but says so rather than staying quiet.
    assert any("decimal slip" in w for w in section.warnings)


@pytest.mark.parametrize("designation", ["4412", "naca-4412", "NACA 4412", " 4412 "])
def test_lookup_accepts_the_ways_a_designation_gets_written(designation):
    assert get_airfoil(designation).designation == "4412"


@pytest.mark.parametrize("designation", ["", "0012", "nonsense", "63-412"])
def test_lookup_raises_for_anything_uncatalogued(designation):
    with pytest.raises(AirfoilNotFound):
        get_airfoil(designation)


def test_every_reynolds_row_is_ordered_and_physical():
    for section in list_airfoils():
        reynolds = [row.reynolds for row in section.reynolds]
        assert reynolds == sorted(reynolds)
        for row in section.reynolds:
            assert row.reynolds > 0
            assert 0 < row.cl_max < 3
