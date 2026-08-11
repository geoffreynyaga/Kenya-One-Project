#!/usr/bin/env python3
# -*- coding:utf-8 -*-
##################################################################################
# File: c:\Projects\KENYA ONE PROJECT\accounts\api\views.py                      #
# Project: c:\Projects\KENYA ONE PROJECT\accounts\api                            #
# Created Date: Sunday, January 12th 2020, 3:26:05 pm                            #
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

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import InitialSizingRequestSerializer


class ExampleSimpleAPIView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = InitialSizingRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    "Status": "Error",
                    "message": "Check the highlighted sizing inputs and try again.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        sizing_inputs = serializer.validated_data
        pax = sizing_inputs["pax"]
        aircraft_type = sizing_inputs["aircraft_type"]
        crew = sizing_inputs["crew"]
        Range = sizing_inputs["range"]
        propEff = sizing_inputs["propellerEfficiency"]
        xAxisLimits = sizing_inputs["xAxisLimits"]

        from CORE.engines import Try_GA_Sizing
        from CORE.engines.prerequisitesEngine import (
            paxWeight,
            crewWeight,
            payloadPax,
            ldMax,
            Vc,
            cbhp,
            fuelAllowance,
        )

        try:
            x = Try_GA_Sizing.MTOW_estimate(
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
            )
        except ValueError:
            return Response(
                {
                    "Status": "Error",
                    "code": "NO_PHYSICAL_MTOW_SOLUTION",
                    "message": (
                        "No physical MTOW solution was found for these inputs. "
                        "Reduce the design range or review the propeller efficiency "
                        "and payload."
                    ),
                },
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )
        # print(x, "x")
        return Response(
            {
                "Status": "Success",
                "finalMTOW": x["finalMTOW"],
                "suggestedAxisLimits": x["suggestedAxisLimits"],
                "warnings": x["warnings"],
                # "image": x["image"],
                "wtoGuess": x["wtoGuess"],
                "wtoYaxisRaymer": x["wtoYaxisRaymer"],
                "wtoYaxisGud": x["wtoYaxisGud"],
                "wtoYaxisRoskam": x["wtoYaxisRoskam"],
                "wtoYaxisSadraey": x["wtoYaxisSadraey"],
                "raymerIntersect": x["raymerIntersect"],
                "gudmundssonIntersect": x["gudmundssonIntersect"],
                "roskamIntersect": x["roskamIntersect"],
                "sadraeyIntersect": x["sadraeyIntersect"],
                "raymer_idx": x["raymer_idx"],
                "gudmundsson_idx": x["gudmundsson_idx"],
                "roskam_idx": x["roskam_idx"],
                "sadraey_idx": x["sadraey_idx"],
            },
            # content_type="image/png",
        )

    def get(self, request, *args, **kwargs):
        """

        return empty for now
        """
        return Response(
            {"Status": "Cannot use GET method for now"},
            # content_type="image/png",
        )
