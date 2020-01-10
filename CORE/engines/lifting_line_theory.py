#!/usr/bin/env python3
# -*- coding:utf-8 -*-
##################################################################################
# File: c:\Projects\KENYA ONE PROJECT\CORE\engines\lifting_line_theory.py        #
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
# coding: utf-8
__author__ = "Geoffrey Nyaga"

# KENYA ONE PROJECT #
# Python code to solve for CL of the wing and elliptical#
# lift distribution without flaps .#

import sys

sys.path.append("../")
from API.db_API import write_to_db, read_from_db
from API.lifting_line_theory import llt, llt_with_plots, llt_subplots

import numpy as np
import math
import matplotlib.pylab as plt

N = 9  # (number of segments - 1)
S = read_from_db("S")  # m^2
AR = read_from_db("AR")  # Aspect ratio
taper = read_from_db("taper")  # Taper ratio
alpha_twist = -2  # Twist angle (deg)
i_w = 1  # wing setting angle (deg)
a_2d = 6.8754  # lift curve slope (1/rad)
alpha_0 = -4.2  # zero-lift angle of attack (deg)


def lifting_line_theory_combinations():

    myans = 0.4049  # This is the lift that you want to achieve!!!!!!!!!!!!!!!!!!!!!
    alpha_twist = np.arange(0, -4, -0.01)
    # print(alpha_twist)
    i_w = np.arange(0, 5, 0.1)

    x = []
    for i in alpha_twist:
        for j in i_w:
            lst = (i, j)
            x.append(lst)

    finalvals = []
    for alpha_twist, i_w in x:
        final = llt(N, S, AR, taper, alpha_twist, i_w, a_2d, alpha_0)
        # print (final)
        if abs((final[2] / myans) - 1) <= 0.00005:
            # print ("Calculated CL",final[2],"possible combination",alpha_twist,i_w,"match")
            instant = [alpha_twist, i_w]
            finalvals.append(instant)
            llt_with_plots(N, S, AR, taper, alpha_twist, i_w, a_2d, alpha_0)
        else:
            pass
    last = np.array(finalvals).shape
    finalval = last[0]
    return finalval


lifting_line_theory_combinations()


def lifting_line_theory_subplots():

    myans = 0.4049
    alpha_twist = np.arange(0, -4, -0.01)
    i_w = np.arange(0, 5, 0.1)

    x = []
    for i in alpha_twist:
        for j in i_w:
            lst = (i, j)
            x.append(lst)

    finalyy = []
    finalxx = []
    mycombination = []
    for alpha_twist, i_w in x:
        final = llt(N, S, AR, taper, alpha_twist, i_w, a_2d, alpha_0)

        if abs((final[2] / myans) - 1) <= 0.00005:
            if __name__ == "__main__":
                print(
                    "Calculated CL",
                    final[2],
                    "possible combination",
                    alpha_twist,
                    i_w,
                    "match",
                )
            mycombination.append((alpha_twist, i_w))
            myx = final[0]
            myy = final[1]
            finalyy.append(myy)
            yy = np.asarray(finalyy)
        else:
            pass
    # plt.tight_layout()
    last = np.array(finalyy).shape
    finalval = last[0]
    m = math.ceil(finalval / 2)  # used below to define number of subplots
    fig, axes = plt.subplots(nrows=m, ncols=2)

    for ax, row in zip(axes.flatten(), finalyy):
        ax.plot(myx, row, "r-")
        # ax.set_label('Label via method')
        # ax.legend()
    # turn remaining axes off
    for i in range(len(finalyy), m):
        axes.flatten()[i].axis("off")
        # ax.legend()
        # ax.title(i)
    plt.tight_layout()
    if __name__ == "__main__":
        plt.show()
    return mycombination


x = lifting_line_theory_subplots()


def final_subplot():
    num = 1
    # num = int(input('Select the graph:'))   #AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
    return x[num - 1]


y = final_subplot()
if __name__ == "__main__":
    print(y[0], "this is twist", y[1], "and this is the wing incidence")
write_to_db("alpha_twist", y[0])
write_to_db("wing_incidence", y[1])
