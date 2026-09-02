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

# import sys

# sys.path.append("../")
# from CORE.API.db_API import write_to_db


# Range = float(input ('enter the value of range(in km)  ') )
# propEff = float(input ('enter the value of propeller efficiency(0.8-0.85)  ') )
# AR= float(input ('enter the value of aspect ratio (5-9)  ') )
# pax= int(input ('enter the number of passengers  ') )
# crew= int(input ('enter the number of pilots  '))

# Initial estimates
Range: int = 1200
propEff: float = 0.8
AR: float = 7.8
pax: int = 4
crew: int = 0

# Weights
paxWeight: int = 180  # this is the weight of a single passenger
crewWeight: int = 200
payloadPax: int = 50

# initial estimates
ldMax: float = 13
Vc: float = 140
cbhp: float = 0.4
fuelAllowance: float = 5  # in %

# write_to_db("Range", Range)
# write_to_db("propEff", propEff)
# write_to_db("AR", AR)
# write_to_db("pax", pax)
# write_to_db("crew", crew)

ceiling: int = 15000
maxSpeed: float = 175
takeOffRun: int = 1200  # ft
stallSpeed: float = 61
rateOfClimb: float = 5  # m/s


# write_to_db("ceiling", ceiling)
# write_to_db("maxSpeed", maxSpeed)
# write_to_db("takeOffRun", takeOffRun)
# write_to_db("stallSpeed", stallSpeed)
# write_to_db("rateOfClimb", rateOfClimb)

cruise_altitude: int = 10000
# write_to_db("cruise_altitude", cruise_altitude)


# from Raymer 6th Ed
def get_equivalent_aspect_ratio(aircraft_type: str) -> float:
    """
    This function takes in a General Aviation aircraft type and
    returns its equivalent aspect ratio
        :param aircraft_type:
    """

    if aircraft_type == "Homebuilt":
        return 6.0
    elif aircraft_type == "GA_Single":
        return 7.6
    elif aircraft_type == "GA_Twin":
        return 7.8
    elif aircraft_type == "Agricultural":
        return 7.5
    elif aircraft_type == "Twin_Turboprop":
        return 9.2
    elif aircraft_type == "Flying_Boat":
        return 8.0
    else:
        return 0.0

    # #TODO:
    # elif aircraft_type == "Sailplane":
    #     # =  0.1 9 (best L/D) l.3
    #     pass

    # # Equivalent Aspect Ratio = aMmax^C
    # elif aircraft_type == "Jet_Aircraft":
    #     pass
    # elif aircraft_type == "Jet_Trainer":
    #     pass
    # elif aircraft_type == "Jet_Dogfighter":
    #     pass
    # elif aircraft_type == "Jet_Fighter_other":
    #     pass
    # elif aircraft_type == "Military_cargo_or_bomber":
    #     pass
    # elif aircraft_type == "Jet_Transport":
    #     pass


EMPTY_WEIGHT_CONSTANTS: dict[str, dict[str, float]] = {
    # Raymer, Aircraft Design: A Conceptual Approach, Table 3.1.
    # These are the imperial A values and dimensionless C exponents.
    "SailPlane_Unpowered": {"a": 0.86, "c": -0.05},
    "SailPlane_Powered": {"a": 0.91, "c": -0.05},
    "Homebuilt_Metal_or_Wood": {"a": 1.19, "c": -0.09},
    "Homebuilt_Composite": {"a": 1.15, "c": -0.09},
    "GA_Single": {"a": 2.36, "c": -0.18},
    "GA_Twin": {"a": 1.51, "c": -0.10},
    "Agricultural": {"a": 0.74, "c": -0.03},
    "Twin_Turboprop": {"a": 0.96, "c": -0.05},
    "Flying_Boat": {"a": 1.09, "c": -0.05},
    "Jet_Trainer": {"a": 1.59, "c": -0.10},
    "Jet_Fighter": {"a": 2.34, "c": -0.13},
    "Military_cargo_or_bomber": {"a": 0.93, "c": -0.07},
    "Jet_Transport": {"a": 1.02, "c": -0.06},
    "UAV_Tac_Recce_or_UCAV": {"a": 1.67, "c": -0.16},
    "UAV_High_Altitude": {"a": 2.75, "c": -0.18},
    "UAV_Small": {"a": 0.97, "c": -0.06},
}

AIRCRAFT_TYPE_CATALOG: tuple[dict[str, str], ...] = (
    {"value": "SailPlane_Unpowered", "group": "Sailplane", "label": "Unpowered"},
    {"value": "SailPlane_Powered", "group": "Sailplane", "label": "Powered"},
    {
        "value": "Homebuilt_Metal_or_Wood",
        "group": "Homebuilt",
        "label": "Metal or wood",
    },
    {"value": "Homebuilt_Composite", "group": "Homebuilt", "label": "Composite"},
    {
        "value": "GA_Single",
        "group": "General aviation",
        "label": "Single engine",
    },
    {
        "value": "GA_Twin",
        "group": "General aviation",
        "label": "Twin engine",
    },
    {
        "value": "Agricultural",
        "group": "Special purpose",
        "label": "Agricultural",
    },
    {
        "value": "Twin_Turboprop",
        "group": "Turboprop",
        "label": "Twin turboprop",
    },
    {"value": "Flying_Boat", "group": "Marine", "label": "Flying boat"},
    {"value": "Jet_Trainer", "group": "Jet · military", "label": "Jet trainer"},
    {"value": "Jet_Fighter", "group": "Jet · military", "label": "Jet fighter"},
    {
        "value": "Military_cargo_or_bomber",
        "group": "Jet · military",
        "label": "Cargo or bomber",
    },
    {"value": "Jet_Transport", "group": "Jet · civil", "label": "Jet transport"},
    {
        "value": "UAV_Tac_Recce_or_UCAV",
        "group": "Unmanned",
        "label": "Tactical recce or UCAV",
    },
    {
        "value": "UAV_High_Altitude",
        "group": "Unmanned",
        "label": "High altitude",
    },
    {"value": "UAV_Small", "group": "Unmanned", "label": "Small UAV"},
)


def get_empty_weight_constants(aircraft_type: str) -> dict[str, float]:
    """Return the Raymer empty-weight constants for an aircraft category."""
    return EMPTY_WEIGHT_CONSTANTS.get(aircraft_type, {"a": 0.0, "c": 0.0}).copy()
