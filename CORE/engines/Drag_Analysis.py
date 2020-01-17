#!/usr/bin/env python3
# -*- coding:utf-8 -*-
##################################################################################
# File: c:\Projects\KENYA ONE PROJECT\CORE\engines\Drag_Analysis.py              #
# Project: c:\Projects\KENYA ONE PROJECT\CORE\engines                            #
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

from math import sin, cos, pi, sqrt, log
import numpy as np  # type: ignore
import matplotlib.pyplot as plt  # type: ignore

from CORE.engines.wingEngine import (
    reducedS,
    cruiseSpeed,
    rhoSL,
    reducedWingspan,
    wing1,
    wing,
    reducedRootChord,
    fuselageWidth,
)


# SKIN FRICTION DRAG OF A WING

wingSpan: float = 38.30  # ft

# on a standard day (OAT(Outside air Temp)  = 518.67 R or 273.15 K).
OAT: float = 518.67  # R
viscosity: float = 3.17 * (10 ** -11) * OAT ** 1.5 * (734.7 / (OAT + 216))
XtrCr: float = (
    0.45
)  #    % where laminar layer gets disrupted GET FROM THE AIRFOIL DATA OR XFRL5 Xtr/Cr
XtrCtUpper: float = 0.6
XtrCtLower: float = 0.5
# def skinFrictionDrag():
Swet: float = (
    1.07 * reducedS * 2
)  # quick way of calculating wetted area(better method down) #Gud page 681 the value 7% is given
print(Swet, "Swet 1")
# Re of root airfoil
rootRe: float = (rhoSL * cruiseSpeed * wing1.rootChord()) / (viscosity)
print(rootRe, "root airfoil RE")

# Re of tip airfoil
tipRe: float = (rhoSL * cruiseSpeed * wing1.tipChord()) / (viscosity)
print(tipRe, "tip airfoil RE")

# fictitious Turbulent BL on Root Airfoil - Upper Surface

X0CrUpper: float = 36.9 * XtrCr ** 0.625 * (1 / rootRe) ** 0.375
print(X0CrUpper, "upper root surface turbulent BL")
X0CrLower: float = X0CrUpper  # Here we have assumed that the lower part of the root airfoil has tghe same turbulent point on Xtr/Cr

# fictitious Turbulent BL on tip Airfoil - Upper Surface
X0CtUpper: float = 36.9 * XtrCtUpper ** 0.625 * (1 / tipRe) ** 0.375
print(X0CtUpper, "upper tip surface turbulent BL")
# fictitious Turbulent BL on tip Airfoil - lower Surface
X0CtLower: float = 36.9 * XtrCtLower ** 0.625 * (1 / tipRe) ** 0.375
print(X0CtLower, "lower tip surface turbulent BL")
print("\n")
# Skin Friction for Root Airfoil - Upper Surface
CfRootUpper: float = (0.074 / rootRe ** 0.2) * (1 - (XtrCr - X0CrUpper)) ** 0.8
print(CfRootUpper, "skin friction, root airfoil upper part")
# Skin Friction for Root Airfoil - Lower Surface
CfRootLower: float = CfRootUpper  # Here we have assumed that the lower part of the root airfoil has tghe same turbulent point on Xtr/Cr
print(CfRootUpper, "skin friction, root airfoil upper part")
# Average Skin friction for root Airfoil
CfRoot: float = 0.5 * (CfRootLower + CfRootUpper)
print(CfRoot, "skin friction, root airfoil ")

# Skin Friction for Tip Airfoil - Upper Surface
CfTipUpper = (0.074 / tipRe ** 0.2) * (1 - (XtrCtUpper - X0CtUpper)) ** 0.8
print(CfTipUpper, "skin friction, tip airfoil upper part")
# Skin Friction for Tip Airfoil - Lower Surface
CfTipLower = (0.074 / tipRe ** 0.2) * (1 - (XtrCtLower - X0CtLower)) ** 0.8
print(CfRootUpper, "skin friction, tip airfoil upper part")
# Average Skin friction for root Airfoil
CfTip = 0.5 * (CfTipLower + CfTipUpper)
print(CfTip, "skin friction, tip airfoil ")

# Average Skin friction for wing
Cf = 0.5 * (CfTip + CfRoot)
print(Cf, "Wing skin friction ")
print("\n")
Swet = (
    2
    * 1.07
    * (
        (0.5 * (reducedRootChord + wing1.tipChord()))
        * (wing1.wingSpan() - fuselageWidth)
    )
)  # Gud page 681 the value 7% is given
print(Swet, "ft^s Swet of reduced wing")

# Skin friction Drag Coefficient for Complete Wing
CDf = (
    Swet / reducedS
) * Cf  # Here i dont know if the Sref Gudmundsson was referring to is the reduced Sref or the original Sref.
# Ive used the reduced area
print(CDf, "Skin friction Drag Coefficient ")

# Skin friction Drag Force for Complete Wing
Df = 0.5 * rhoSL * cruiseSpeed ** 2 * Swet * Cf
print("\n")
print("Skin friction Drag force")
print(Df, "lbf")
"""
this is the total flat plate skin friction drag for the wing only at  cruise. Theres no account of the fuselage,airfoil shape or control surfaces.
"""
print("Correct AF!!!")
print("\n")

# skin friction coefficient for 100% laminar flow
CfLaminarRoot = 1.328 / (sqrt(rootRe))
CfLaminarTip = 1.328 / (sqrt(tipRe))
CfLaminar = 0.5 * (CfLaminarRoot + CfLaminarTip)
print(CfLaminar, "Cf for 100% laminar flow")

# skin friction coefficient for 100% turbulent flow
CfTurbulentRoot = 0.455 / (log(rootRe, 10)) ** 2.58
CfTurbulentTip = 0.455 / (log(tipRe, 10)) ** 2.58
CfTurbulent = 0.5 * (CfTurbulentRoot + CfTurbulentTip)
print(CfTurbulent, "Cf for 100% turbulent flow")

# Make a TABLE like in Gudmundsson 684
