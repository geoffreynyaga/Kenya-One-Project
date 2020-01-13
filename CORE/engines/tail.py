#!/usr/bin/env python3
# -*- coding:utf-8 -*-
##################################################################################
# File: c:\Projects\KENYA ONE PROJECT\CORE\engines\tail.py                       #
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


import numpy as np  # type: ignore
from math import pi, sqrt
import matplotlib.pylab as plt  # type: ignore


from CORE.engines.wingEngine import wing, wing1, S


Sref = S  # ft^2
Cref = wing1.meanGeometricChord()  # ft   #Shit is confusing, do i use MGC or Cref?????
VHT: float = 0.75
ConeRadius1: float = 2.0  # ft
ConeRadius2: float = 0.3  # ft
bref = wing1.wingSpan()


##DIMENSIONING

HtailAR: float = 4.0
HtailTaper: float = 0.5
# HtailWingspan


# INITIAL TAIL SIZING CONSIDERING H.TAIL ONLY - GUDMUNDSSON


# Optimim tail Arm
HtailArm = sqrt((2 * VHT * Sref * Cref) / (pi * (ConeRadius1 + ConeRadius2)))
Swet = pi * (ConeRadius1 + ConeRadius2) * HtailArm + (2 * VHT * Sref * Cref / HtailArm)
print(HtailArm, "ft is the Tail Arm for the VHT input of", VHT, "ft")
print(Swet, "ft^2 is the correponding wetted area")


HtailArea = (VHT * Sref * Cref) / HtailArm
HtailWingspan = sqrt(HtailAR * HtailArea)
HtailCavg = HtailWingspan / HtailAR


print(HtailArea, "ft^2 Horizontal Tail Area")
print(HtailWingspan, "ft Horizontal Tail wingspan")
print(HtailCavg, "ft Horizontal Tail average chord")


def SurfaceAreavsTailArm():
    tailArm = np.arange(2, 20)  # THIS WILL CHANGE FIR DRONES AND COMMERCIAL JETS
    tailArea = VHT * Sref * Cref / tailArm

    coneArea = np.pi * (ConeRadius1 + ConeRadius2) * tailArm
    Swet = coneArea + (2 * tailArea)

    a = min(Swet)
    b = np.argmin(Swet)
    c = tailArm[b]

    plt.subplot(2, 1, 2)

    plt.axhline(a)
    plt.axvline(c)

    plt.plot(tailArm, tailArea)
    plt.plot(tailArm, coneArea)
    plt.plot(tailArm, Swet)

    plt.subplot(2, 2, 1)

    vht = np.arange(0.4, 1, 0.1)
    for i in vht:
        tailArea = i * Sref * Cref / tailArm
        plt.plot(tailArm, tailArea)
        plt.plot(tailArm, coneArea)

    plt.subplot(2, 2, 2)

    vht = np.arange(0.4, 1, 0.1)
    print(
        "these are the minimum wetted areas on the second graph on the right. More visualization coming soon"
    )
    for i in vht:
        tailArea = i * Sref * Cref / tailArm
        Swet1 = np.array(coneArea + (2 * tailArea))
        # a = np.asarray([min(Swet1)])
        a = min(Swet1)

        print(a)
        plt.plot(tailArm, Swet1)
        # plt.scatter(tailArm,a)

    plt.show()


SurfaceAreavsTailArm()


# INITIAL TAIL SIZING OPTIMIZATION CONSIDERING V.TAIL ONLY - GUDMUNDSSON


Vvt: float = 0.040
VtailAR: float = 4.0


VtailArm = sqrt((Vvt * Sref * bref) / (pi * (ConeRadius1 + ConeRadius2)))
print(VtailArm, "ft Optimum V.Tail arm")


if HtailArm >= VtailArm:
    VtailArea = (Vvt * Sref * bref) / HtailArm
else:
    VtailArea = (Vvt * Sref * bref) / VtailArm
print(VtailArea, "ft^2 VTail area")

VtailWingspan = sqrt(VtailAR * VtailArea)
VtailCavg = VtailWingspan / VtailAR

print(VtailWingspan, "ft VTail wingspan")
print(VtailCavg, "ft VTail average chord")


# INITIAL TAIL SIZING OPTIMIZATION CONSIDERING H.TAIL and V.TAIL  - GUDMUNDSSON
