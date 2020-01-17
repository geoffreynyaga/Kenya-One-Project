#!/usr/bin/env python3
# -*- coding:utf-8 -*-
##################################################################################
# File: c:\Projects\KENYA ONE PROJECT\CORE\engines\airfoilEngine.py              #
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


import sys

sys.path.append("../")
from CORE.API.db_API import write_to_db, read_from_db

import math
import numpy as np  # type: ignore

# import os
import CORE.API.airfoilAPI as aa

# from values import prerequisites,TESTING_MAIN,wing

## Lift and Moment Xristics of a 3D WING
cruiseSpeed = read_from_db("cruiseSpeed")
initialWeight = read_from_db("initialWeight")
finalWeight = read_from_db("finalWeight")
altitude = read_from_db("altitude")
S = read_from_db("S") * 10.76
rangeAR = read_from_db(
    "rangeAR"
)  # will need some funtion to slect the AR depending on aircraft type
fuselageWidth = read_from_db("fuselageWidth")
yMGC = read_from_db("yMGC")
wingSpan = read_from_db("wingSpan")
sweepHalfChord = read_from_db("sweepHalfChord")
sweepQuarterChord = read_from_db("sweepQuarterChord")


clalfa = read_from_db("clalfa")  # per rad
clo = read_from_db("clo")
clmax = read_from_db("clmax")  # from airfoil
alfazero = read_from_db("alfazero")  # How
cma = read_from_db("cma")
clmaxRoot = read_from_db("clmaxRoot")
clmaxTip = read_from_db("clmaxTip")

## import these stuff
altitudeDensity = read_from_db("altitudeDensity")
CLalfa = read_from_db("CLalfa")

## 3D Lift Curve Slope
# for elliptical wing
Mach = cruiseSpeed / 11164.27

wing3 = aa.CLalfa(clalfa, rangeAR, Mach, sweepHalfChord)
# make this shit work
# finalCLalfa = np.average(wing1.ellipticalCLalfa(),wing1.hemboldCLalfa(),wing1.polhamusCLalfa())

finalCLalfa = (
    wing3.ellipticalCLalfa() + wing3.hemboldCLalfa() + wing3.polhamusCLalfa()
) / 3
# print(wing3.ellipticalCLalfa())
# print(wing3.hemboldCLalfa())
# # print(wing3.polhamusCLalfa())
# print('average CLalfa')
# print(finalCLalfa,"final Clalfa")
write_to_db("finalCLalfa", finalCLalfa)


CLo = -alfazero * finalCLalfa / 57.3
# print(CLo)
write_to_db("CLo", CLo)
Cma = (finalCLalfa / 57.3) * (cma / (clalfa / 57.3))
# print(Cma)
write_to_db("Cma", Cma)

cruiseCL = (
    CLo
    + ((initialWeight + finalWeight) / (altitudeDensity * S * cruiseSpeed ** 2))
    + ((finalCLalfa / 57.3) * alfazero)
)
print(cruiseCL, "cruiseCl")

write_to_db("cruiseCL", cruiseCL)


wing2 = aa.classCLmax(clmaxRoot, yMGC, wingSpan, clmaxTip, sweepQuarterChord)
finalCLmax = wing2.rapidClmax()
print(wing2.rapidClmax(), "rapidClmax")
write_to_db("finalCLmax", finalCLmax)
