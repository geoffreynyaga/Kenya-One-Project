#!/usr/bin/env python3
# -*- coding:utf-8 -*-
##################################################################################
# File: c:\Projects\KENYA ONE PROJECT\CORE\Machine Learning\aircrafttypeAI.py    #
# Project: c:\Projects\KENYA ONE PROJECT\CORE\Machine Learning                   #
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
# coding: utf-8
__author__ = "Geoffrey Nyaga"

import sys

sys.path.append("../")
from API.db_API import write_to_db, read_from_db
from API.aircrafttypeAPI import aircraft_type

import numpy as np
from sklearn import tree
import pandas as pd
import random

"""
 Explanation Here >>>
 http://geoffreynyaga.com/blog/basic-machine-learning-aircraft-design/

"""

aircraft_categories = ["LSA", "Sailplanes", "GA"]

mydict = [
    read_from_db("finalMTOW"),
    read_from_db("emptyWeight"),
    read_from_db("S") * 10.76,
    read_from_db("wingSpan"),
]

number_of_aircraft = 5000


def fin():
    return_matrixx = []
    for x in range(21):
        c = aircraft_type(number_of_aircraft, mydict)
        return_matrixx.append(c)
    return np.bincount(return_matrixx).argmax()


output_matrix = []

for iteration in range(9):
    print("calculating step", iteration)
    iteration = fin()
    output_matrix.append(iteration)

# print(output_matrix,"pheeeew")
index = np.bincount(output_matrix).argmax()
# print(index,"my index")
aircraft_type = aircraft_categories[index]
print("the aircraft type is:", aircraft_type, " and YEEEEH!!! I finally made it!!!!!!")

