#!/usr/bin/env python3
# -*- coding:utf-8 -*-
##################################################################################
# File: c:\Projects\KENYA ONE PROJECT\accounts\tests.py                          #
# Project: c:\Projects\KENYA ONE PROJECT\accounts                                #
# Created Date: Thursday, January 9th 2020, 8:56:55 pm                           #
# Author: Geoffrey Nyaga Kinyua ( <info@geoffreynyaga.com> )                     #
# -----                                                                          #
# Last Modified: Thursday January 9th 2020 8:56:55 pm                            #
# Modified By:  Geoffrey Nyaga Kinyua ( <info@geoffreynyaga.com> )               #
# -----                                                                          #
# MIT License                                                                    #
#                                                                                #
# Copyright (c) 2020 KENYA ONE PROJECT                                           #
#                                                                                #
# Permission is hereby granted, free of charge, to any person obtaining a copy of#
# this software and associated documentation files (the "Software"), to deal in  #
# the Software without restriction, including without limitation the rights to   #
# use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies  #
# of the Software, and to permit persons to whom the Software is furnished to do #
# so, subject to the following conditions:                                       #
#                                                                                #
# The above copyright notice and this permission notice shall be included in all #
# copies or substantial portions of the Software.                                #
#                                                                                #
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR     #
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,       #
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE    #
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER         #
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,  #
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE  #
# SOFTWARE.                                                                      #
# -----                                                                          #
# Copyright (c) 2020 KENYA ONE PROJECT                                           #
##################################################################################

import numpy as np  # type: ignore
from math import isclose
from rest_framework.test import APIClient  # type: ignore


def test_a_plus_b():
    assert 1 + 1 == 2


def test_mtow_solve_is_independent_of_requested_plot_range():
    response = APIClient().post(
        "/api/accounts/example/",
        {
            "yAxisLimits": [3000, 6000],
            "xAxisLimits": [3000, 6000],
            "aircraft_type": "GA_Single",
            "altitude": 10000,
            "pax": 3,
            "propellerEfficiency": 0.78,
            "range": 1200,
            "aspectRatio": 7.8,
            "crew": 1,
        },
        format="json",
    )

    assert response.status_code == 200
    assert response.data["Status"] == "Success"
    assert isclose(response.data["cruiseFraction"], 0.9245599454856899)

    method_results = [
        response.data["raymerIntersect"][0],
        response.data["gudmundssonIntersect"][0],
        response.data["roskamIntersect"][0],
        response.data["sadraeyIntersect"][0],
    ]
    assert all(np.isfinite(result) for result in method_results)
    assert all(2700 < result < 3000 for result in method_results)
    assert 2800 < response.data["finalMTOW"] < 2900

    # The split each method decided, which the detailed weights sheet checks
    # its component buildup against.
    for method, mtow in zip(
        ("raymer", "gudmundsson", "roskam", "sadraey"), method_results
    ):
        empty_fraction = response.data["emptyWeightFraction"][method]
        fuel_fraction = response.data["fuelFraction"][method]
        assert 0.55 < empty_fraction < 0.75
        assert 0.05 < fuel_fraction < 0.25
        # Empty, fuel and useful load are the whole aeroplane.
        useful_load = 3 * 180 + 3 * 50 + 1 * 200
        assert (
            abs((empty_fraction + fuel_fraction) * mtow + useful_load - mtow) < 1
        )

    assert response.data["suggestedAxisLimits"] == [2000, 4000]
    assert len(response.data["wtoGuess"]) == 401
    assert response.data["wtoGuess"][0] == 2000
    assert response.data["wtoGuess"][-1] == 4000

    assert response.data["warnings"] == [
        {
            "code": "MTOW_OUTSIDE_REQUESTED_RANGE",
            "field": "xAxisLimits",
            "message": (
                "Calculated MTOW is below the requested 3,000 lbf minimum. "
                "The suggested sweep is 2,000–4,000 lbf."
            ),
            "requestedAxisLimits": [3000, 6000],
            "suggestedAxisLimits": [2000, 4000],
        }
    ]


def test_mtow_api_returns_actionable_field_validation_errors():
    response = APIClient().post(
        "/api/accounts/example/",
        {
            "yAxisLimits": [2000, 4000],
            "xAxisLimits": [4000, 2000],
            "aircraft_type": "GA_Single",
            "altitude": -1,
            "pax": -1,
            "propellerEfficiency": 1.2,
            "range": 0,
            "aspectRatio": 0,
            "crew": 0,
        },
        format="json",
    )

    assert response.status_code == 400
    assert response.data == {
        "Status": "Error",
        "message": "Check the highlighted sizing inputs and try again.",
        "errors": {
            "xAxisLimits": ["Minimum sweep weight must be less than maximum."],
            "altitude": ["Altitude cannot be negative."],
            "pax": ["Passenger count cannot be negative."],
            "propellerEfficiency": [
                "Propeller efficiency must be greater than 0 and no more than 1."
            ],
            "range": ["Design range must be greater than 0 km."],
            "aspectRatio": ["Aspect ratio must be greater than 0."],
            "crew": ["At least one crew member is required."],
        },
    }


def test_mtow_api_explains_when_inputs_have_no_physical_solution():
    response = APIClient().post(
        "/api/accounts/example/",
        {
            "yAxisLimits": [2000, 4000],
            "xAxisLimits": [2000, 4000],
            "aircraft_type": "GA_Single",
            "altitude": 10000,
            "pax": 3,
            "propellerEfficiency": 0.5,
            "range": 1_000_000,
            "aspectRatio": 7.8,
            "crew": 1,
        },
        format="json",
    )

    assert response.status_code == 422
    assert response.data == {
        "Status": "Error",
        "code": "NO_PHYSICAL_MTOW_SOLUTION",
        "message": (
            "No physical MTOW solution was found for these inputs. Reduce the "
            "design range or review the propeller efficiency and payload."
        ),
    }


def test_mtow_api_rejects_unknown_aircraft_types():
    response = APIClient().post(
        "/api/accounts/example/",
        {
            "yAxisLimits": [2000, 4000],
            "xAxisLimits": [2000, 4000],
            "aircraft_type": "Unknown",
            "altitude": 10000,
            "pax": 3,
            "propellerEfficiency": 0.78,
            "range": 1200,
            "aspectRatio": 7.8,
            "crew": 1,
        },
        format="json",
    )

    assert response.status_code == 400
    assert response.data["errors"] == {
        "aircraft_type": ["Select a supported aircraft category."]
    }
