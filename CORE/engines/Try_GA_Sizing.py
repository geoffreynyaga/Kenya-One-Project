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


def MTOW_estimate(
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
) -> dict:

    wtoGuess = np.arange(2000, 6500)
    # Gudmundsson
    # weWtoGud = 0.4074 + 0.0253 * np.log(wtoGuess)
    # print(weWtoGud)
    # use this when using Gudmundsson sizing and constants

    ## also in input  main file, decide what to import and from which file
    # pax = 4
    # paxWeight = 180
    # crew = 2
    # crewWeight = 200
    # payloadPax = 50

    ## also in input  main file, decide what to import and from which file
    paxTotal = pax * paxWeight
    payload = (payloadPax * pax) + paxTotal
    crewTotal = crew * crewWeight

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
    w6w1: float = w2w1 * w3w2 * w4w3 * w5w4 * w6w5

    wfWto = ((100 + fuelAllowance) / 100) * (1 - w6w1)

    wfWtoRoskam = (1 + (fuelAllowance / 100)) * (
        1 - w4w3 * 0.992 * 0.992 * 0.996 * 0.99 * 0.992 * 0.992
    )
    wfWtoRaymer = (1 + (fuelAllowance / 100)) * (1 - w4w3 * 0.97 * 0.985 * 0.995)
    wfWtoGud = (1 + (fuelAllowance / 100)) * (1 - w4w3 * 0.994 * 0.985 * 0.996 * 0.995)
    wfWtoSadraey = (1 + (fuelAllowance / 100)) * (1 - w2w1 * w3w2 * w4w3 * w5w4 * w6w5)

    print(wfWto, "wfWto")

    a: float = 1.51
    b: float = -0.1

    # Raymer
    weWto = a * (wtoGuess ** b)
    wtoYaxisRaymer = (payload + crewTotal) / (1 - wfWtoRaymer - weWto)

    # Roskam
    wtoYaxisRoskam = (payload + crewTotal) / (1 - wfWtoRoskam - weWto)

    # Sadraey
    wtoYaxisSadraey = (payload + crewTotal) / (1 - wfWtoSadraey - weWto)

    # Gudmundsson
    wtoYaxisGud = (payload + crewTotal) / (1 - wfWtoGud - weWto)

    fig = plt.figure()
    plt.plot(wtoGuess, wtoGuess)
    plt.plot(wtoGuess, wtoYaxisRaymer, label="Raymer")
    plt.plot(wtoGuess, wtoYaxisGud, label="Gudmundsson")
    plt.plot(wtoGuess, wtoYaxisRoskam, label="Roskam")
    plt.plot(wtoGuess, wtoYaxisSadraey, label="Sadraey")

    idx = np.argwhere(np.diff(np.sign(wtoGuess - wtoYaxisRaymer)) != 0).reshape(-1) + 0
    plt.plot(wtoGuess[idx], wtoYaxisRaymer[idx], "ro")

    idx = np.argwhere(np.diff(np.sign(wtoGuess - wtoYaxisGud)) != 0).reshape(-1) + 0
    plt.plot(wtoGuess[idx], wtoYaxisGud[idx], "ro")

    idx = np.argwhere(np.diff(np.sign(wtoGuess - wtoYaxisRoskam)) != 0).reshape(-1) + 0
    plt.plot(wtoGuess[idx], wtoYaxisRoskam[idx], "ro")

    idx = np.argwhere(np.diff(np.sign(wtoGuess - wtoYaxisSadraey)) != 0).reshape(-1) + 0
    plt.plot(wtoGuess[idx], wtoYaxisSadraey[idx], "ro")

    plt.xlabel("Wto Guess")
    plt.ylabel("Wto")
    plt.title(
        "WEIGHT SIZING CONSIDERING VARIOUS FUEL FRACTIONS \n But the sizing constants are Raymer's "
    )
    plt.legend()
    # plt.show()

    # plt.plot(range(10))
    figdata = io.BytesIO()
    fig.savefig(figdata, format="png")
    plt.close(fig)
    # figdata.close()
    import base64

    image_base64 = (
        base64.b64encode(figdata.getvalue()).decode("utf-8").replace("\n", "")
    )

    d = wtoYaxisRaymer[idx]
    e = wtoYaxisGud[idx]
    f = wtoYaxisRoskam[idx]
    g = wtoYaxisSadraey[idx]

    h = np.array([d, e, f, g])
    finalMTOW = np.mean(h)

    print(d, e, f, g)
    print("\n")
    print(finalMTOW, "LBS <<-- final MTOW")

    return {"finalMTOW": finalMTOW, "image": image_base64}
