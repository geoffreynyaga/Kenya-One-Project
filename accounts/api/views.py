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


class ExampleSimpleAPIView(APIView):
    def get(self, request, *args, **kwargs):
        print("===== ExampleSimpleAPIView ===")

        from CORE.engines import Try_GA_Sizing
        from CORE.engines.prerequisitesEngine import (
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
        )

        # x = Try_GA_Sizing.sample_return()
        x = Try_GA_Sizing.MTOW_estimate(
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
        )
        # print(x, "x")
        return Response(
            {
                "Status": "Success",
                # "result1": x["a"],
                # "result2": x["b"],
                "image": x["image"],
            },
            content_type="image/png",
        )
