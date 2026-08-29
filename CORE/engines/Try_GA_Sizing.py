#!/usr/bin/env python3
# -*- coding:utf-8 -*-
##################################################################################
# File: c:\Projects\KENYA ONE PROJECT\CORE\engines\GA_Sizing.py                  #
# Project: c:\Projects\KENYA ONE PROJECT\CORE\engines                            #
# Created Date: Thursday, January 9th 2020, 8:56:55 pm                           #
# Author: Geoffrey Nyaga Kinyua ( <info@geoffreynyaga.com> )                     #
# -----                                                                          #
# Last Modified: Sunday January 12th 2020 3:43:06 pm                             #
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


import io
import math

import matplotlib  # type: ignore
import numpy as np  # type: ignore
import pandas as pd  # type: ignore
from matplotlib import pylab as plt  # type: ignore

matplotlib.use("Agg")


PLOT_SAMPLE_COUNT = 401
MAX_MTOW_LBF = 10_000_000


"""
    By default matplotlib uses TK gui toolkit, when you're rendering an image without using
    the toolkit (i.e. into a file or a string), matplotlib still instantiates a window that
    doesn't get displayed, causing all kinds of problems. In order to avoid that, you should
    use an Agg backend. It can be activated like so
        import matplotlib
        matplotlib.use("Agg")
        from matplotlib import pylab as plt
"""


def sample_return() -> dict:
    # here is the trick save your figure into a bytes object and you can afterwards expose it via flas
    bytes_image = io.BytesIO()
    # plt.plot([1, 2, 3, 4, 5], [100, 300, 500, 1500, 10])

    # plt.savefig(bytes_image, format="png")
    # y = bytes_image.seek(0)

    fig = plt.figure()
    plt.plot(range(10))
    figdata = io.BytesIO()
    fig.savefig(figdata, format="png")
    plt.close(fig)
    # figdata.close()
    import base64

    image_base64 = (
        base64.b64encode(figdata.getvalue()).decode("utf-8").replace("\n", "")
    )

    # data = base64.b64encode(figdata)
    # with open(fig, "rb") as image_file:
    #     base64string = base64.b64encode(image_file.read())
    #     return base64string

    return {"a": 1, "b": 2, "image": image_base64}


def _estimated_mtow(
    weight: float,
    useful_load: float,
    empty_weight_a: float,
    empty_weight_exponent: float,
    fuel_fraction: float,
) -> float:
    denominator = 1 - fuel_fraction - empty_weight_a * (weight**empty_weight_exponent)
    if denominator <= 0:
        return math.inf
    return useful_load / denominator


def _solve_mtow(
    useful_load: float,
    empty_weight_a: float,
    empty_weight_exponent: float,
    fuel_fraction: float,
) -> float:
    """Solve W = estimated W using an adaptive bracket and bisection."""
    if not 0 < fuel_fraction < 1:
        raise ValueError("Fuel fraction leaves no weight available for the aircraft.")

    singularity = ((1 - fuel_fraction) / empty_weight_a) ** (1 / empty_weight_exponent)
    lower = max(useful_load, singularity) * (1 + 1e-9)

    def residual(weight: float) -> float:
        return (
            _estimated_mtow(
                weight,
                useful_load,
                empty_weight_a,
                empty_weight_exponent,
                fuel_fraction,
            )
            - weight
        )

    upper = max(1000.0, lower * 2)
    while residual(upper) > 0 and upper < MAX_MTOW_LBF:
        upper *= 2

    if upper >= MAX_MTOW_LBF and residual(upper) > 0:
        raise ValueError("No physical MTOW solution was found within the safety limit.")

    for _ in range(80):
        midpoint = (lower + upper) / 2
        if residual(midpoint) > 0:
            lower = midpoint
        else:
            upper = midpoint

    return (lower + upper) / 2


def _nice_plot_limits(mtow_values: list[float]) -> list[int]:
    raw_minimum = min(mtow_values) * 0.75
    raw_maximum = max(mtow_values) * 1.25
    rough_step = (raw_maximum - raw_minimum) / 6
    magnitude = 10 ** math.floor(math.log10(rough_step))
    normalized_step = rough_step / magnitude

    if normalized_step <= 1:
        multiplier = 1
    elif normalized_step <= 2:
        multiplier = 2
    elif normalized_step <= 5:
        multiplier = 5
    else:
        multiplier = 10

    step = int(multiplier * magnitude)
    minimum = max(step, math.floor(raw_minimum / step) * step)
    maximum = math.ceil(raw_maximum / step) * step
    return [minimum, maximum]


def _range_warning(
    requested_limits: list[float],
    suggested_limits: list[int],
    mtow_values: list[float],
) -> list[dict]:
    if len(requested_limits) != 2:
        return []

    requested_minimum, requested_maximum = requested_limits
    calculated_minimum = min(mtow_values)
    calculated_maximum = max(mtow_values)

    if calculated_minimum < requested_minimum:
        position = "below"
        boundary = requested_minimum
        boundary_name = "minimum"
    elif calculated_maximum > requested_maximum:
        position = "above"
        boundary = requested_maximum
        boundary_name = "maximum"
    else:
        return []

    return [
        {
            "code": "MTOW_OUTSIDE_REQUESTED_RANGE",
            "field": "xAxisLimits",
            "message": (
                f"Calculated MTOW is {position} the requested "
                f"{boundary:,.0f} lbf {boundary_name}. The suggested sweep is "
                f"{suggested_limits[0]:,.0f}–{suggested_limits[1]:,.0f} lbf."
            ),
            "requestedAxisLimits": requested_limits,
            "suggestedAxisLimits": suggested_limits,
        }
    ]


def MTOW_estimate(
    aircraft_type,
    pax,
    paxWeight,
    crew,
    crewWeight,
    payloadPax,
    Range,
    ldMax,
    Vc,
    cbhp,
    fuelAllowance,
    propEff,
    xAxisLimits,
) -> dict:
    paxTotal = pax * paxWeight
    payload = (payloadPax * pax) + paxTotal
    crewTotal = crew * crewWeight
    useful_load = payload + crewTotal

    ## also in input  main file, decide what to import and from which file
    # Range = 1200
    # ldMax = 13
    # Vc = 140
    # cbhp = 0.4
    # propEff = 0.8
    # fuelAllowance = 5  # in %
    w4w3 = math.exp((-Range * 3280.8399 * cbhp / 3600) / (propEff * ldMax * 550))
    w2w1: float = 0.98
    w3w2: float = 0.97
    w5w4: float = 0.99
    w6w5: float = 0.997

    wfWtoRoskam = (1 + (fuelAllowance / 100)) * (
        1 - w4w3 * 0.992 * 0.992 * 0.996 * 0.99 * 0.992 * 0.992
    )
    wfWtoRaymer = (1 + (fuelAllowance / 100)) * (1 - w4w3 * 0.97 * 0.985 * 0.995)
    wfWtoGud = (1 + (fuelAllowance / 100)) * (1 - w4w3 * 0.994 * 0.985 * 0.996 * 0.995)
    wfWtoSadraey = (1 + (fuelAllowance / 100)) * (1 - w2w1 * w3w2 * w4w3 * w5w4 * w6w5)

    from CORE.engines.prerequisitesEngine import get_empty_weight_constants

    empty_weight_constants = get_empty_weight_constants(aircraft_type)
    a: float = empty_weight_constants["a"]
    b: float = empty_weight_constants["c"]

    raymer_mtow = _solve_mtow(useful_load, a, b, wfWtoRaymer)
    gudmundsson_mtow = _solve_mtow(useful_load, a, b, wfWtoGud)
    roskam_mtow = _solve_mtow(useful_load, a, b, wfWtoRoskam)
    sadraey_mtow = _solve_mtow(useful_load, a, b, wfWtoSadraey)
    mtow_values = [raymer_mtow, gudmundsson_mtow, roskam_mtow, sadraey_mtow]

    suggested_axis_limits = _nice_plot_limits(mtow_values)
    wtoGuess = np.linspace(
        suggested_axis_limits[0],
        suggested_axis_limits[1],
        PLOT_SAMPLE_COUNT,
    )

    weWto = a * (wtoGuess**b)
    wtoYaxisRaymer = (payload + crewTotal) / (1 - wfWtoRaymer - weWto)
    wtoYaxisRoskam = (payload + crewTotal) / (1 - wfWtoRoskam - weWto)
    wtoYaxisSadraey = (payload + crewTotal) / (1 - wfWtoSadraey - weWto)
    wtoYaxisGud = (payload + crewTotal) / (1 - wfWtoGud - weWto)

    d = np.array([raymer_mtow])
    e = np.array([gudmundsson_mtow])
    f = np.array([roskam_mtow])
    g = np.array([sadraey_mtow])
    finalMTOW = float(np.mean(mtow_values))

    # The weight each method solves is only part of what it decided. The split
    # between empty weight and fuel is the rest of it, and the detailed weights
    # sheet checks its component buildup against exactly that empty weight.
    # Returning the fractions rather than the pounds keeps them attached to the
    # method that produced them, whichever one the reader carries forward.
    empty_weight_fraction = {
        "raymer": float(a * raymer_mtow**b),
        "gudmundsson": float(a * gudmundsson_mtow**b),
        "roskam": float(a * roskam_mtow**b),
        "sadraey": float(a * sadraey_mtow**b),
    }
    fuel_fraction = {
        "raymer": float(wfWtoRaymer),
        "gudmundsson": float(wfWtoGud),
        "roskam": float(wfWtoRoskam),
        "sadraey": float(wfWtoSadraey),
    }

    return {
        "finalMTOW": finalMTOW,
        "emptyWeightFraction": empty_weight_fraction,
        "fuelFraction": fuel_fraction,
        "suggestedAxisLimits": suggested_axis_limits,
        "warnings": _range_warning(xAxisLimits, suggested_axis_limits, mtow_values),
        "wtoGuess": wtoGuess,
        "wtoYaxisRaymer": wtoYaxisRaymer,
        "wtoYaxisGud": wtoYaxisGud,
        "wtoYaxisRoskam": wtoYaxisRoskam,
        "wtoYaxisSadraey": wtoYaxisSadraey,
        "raymerIntersect": d,
        "raymer_idx": d,
        "gudmundssonIntersect": e,
        "gudmundsson_idx": e,
        "roskamIntersect": f,
        "roskam_idx": f,
        "sadraeyIntersect": g,
        "sadraey_idx": g,
    }
