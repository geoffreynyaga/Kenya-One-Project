#!/usr/bin/env python3
# -*- coding:utf-8 -*-
##################################################################################
# File: c:\Projects\KENYA ONE PROJECT\CORE\engines\prerequisitesEngine.py        #
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
__author__ = "Geoffrey Nyaga"

import sys

sys.path.append("../")
from API.db_API import write_to_db


# Range = float(input ('enter the value of range(in km)  ') )
# propEff = float(input ('enter the value of propeller efficiency(0.8-0.85)  ') )
# AR= float(input ('enter the value of aspect ratio (5-9)  ') )
# pax= int(input ('enter the number of passengers  ') )
# crew= int(input ('enter the number of pilots  '))

Range = 1200
propEff = 0.8
AR = 7.8
pax = 4
crew = 2

write_to_db("Range", Range)
write_to_db("propEff", propEff)
write_to_db("AR", AR)
write_to_db("pax", pax)
write_to_db("crew", crew)

ceiling = 15000
maxSpeed = 175
takeOffRun = 1200  # ft
stallSpeed = 61
rateOfClimb = 5  # m/s


write_to_db("ceiling", ceiling)
write_to_db("maxSpeed", maxSpeed)
write_to_db("takeOffRun", takeOffRun)
write_to_db("stallSpeed", stallSpeed)
write_to_db("rateOfClimb", rateOfClimb)

cruise_altitude = 10000
write_to_db("cruise_altitude", cruise_altitude)
