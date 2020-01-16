#!/usr/bin/env python3
# -*- coding:utf-8 -*-
##################################################################################
# File: c:\Projects\KENYA ONE PROJECT\CORE\API\airfoilAPI.py                     #
# Project: c:\Projects\KENYA ONE PROJECT\CORE\API                                #
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

import math
import numpy as np  # type: ignore

# import sys
# import os


class CLalfa:
    def __init__(self, clalfa, rangeAR, Mach, sweepHalfChord):
        self.clalfa = clalfa
        self.rangeAR = rangeAR
        self.Mach = Mach
        self.sweepHalfChord = sweepHalfChord

    def ellipticalCLalfa(self):
        ellipticalCLalfa = self.clalfa / (1 + (self.clalfa / (math.pi * self.rangeAR)))
        return ellipticalCLalfa

    def hemboldCLalfa(self):
        hemboldCLalfa = (2 * math.pi * self.rangeAR) / (
            2 + math.sqrt(self.rangeAR ** 2 + 4)
        )
        return hemboldCLalfa

    def polhamusCLalfa(self):
        beta = (1 - self.Mach ** 2) ** (0.5)
        k = self.clalfa / (2 * math.pi)
        # remember to cremove 57.3 later
        polhamusCLalfa = (2 * math.pi * self.rangeAR) / (
            2
            + math.sqrt(
                ((self.rangeAR * beta) / k) ** 2
                * (1 + ((math.tan(self.sweepHalfChord / 57.3)) ** 2 / beta ** 2))
                + 4
            )
        )
        return polhamusCLalfa


class classCLmax:
    def __init__(self, clmaxRoot, yMGC, wingSpan, clmaxTip, sweepQuarterChord):
        self.clmaxRoot = clmaxRoot
        self.yMGC = yMGC
        self.wingSpan = wingSpan
        self.clmaxTip = clmaxTip
        self.sweepQuarterChord = sweepQuarterChord

    def rapidClmax(self):
        clmax = self.clmaxRoot + (self.yMGC / self.wingSpan) * (
            self.clmaxTip - self.clmaxRoot
        )
        # IVE SKIPPED THE  root and tip Re calculations to help reading the equivalent clmax on the NACA graphs
        CLmaxo = 0.9 * clmax
        kA = math.cos(self.sweepQuarterChord / 57.3)
        rapidClmax = CLmaxo * kA
        return rapidClmax
