#!/usr/bin/env python3
# -*- coding:utf-8 -*-
##################################################################################
# File: c:\Projects\KENYA ONE PROJECT\CORE\weissinger\wing.py                    #
# Project: c:\Projects\KENYA ONE PROJECT\CORE\weissinger                         #
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

from math import pi, tan


def slope(y2, y1, x2, x1):
    return (y2 - y1) / (x2 - x1)


class Wing:
    """ Class for swept, tapered, twisted wing """

    def __init__(self, span, root, tip, sweep, washout):
        self.span = span
        self.root = root
        self.tip = tip
        self.sweep = sweep
        self.washout = washout
        self.area = None
        self.aspect_ratio = None
        self.cbar = None
        self.xroot = []
        self.yroot = None
        self.xtip = []
        self.ytip = None

        self.compute_geometry()

    def compute_geometry(self):
        """ Computes area, aspect ratio, MAC """

        self.area = 0.5 * (self.root + self.tip) * self.span
        self.aspect_ratio = self.span ** 2.0 / self.area
        self.compute_mac()

    def compute_mac(self):
        """ Computes mean aerodynamic chord """

        if not self.yroot:
            self.compute_coordinates()

        mt = slope(self.xtip[0], self.xroot[0], self.ytip, self.yroot)
        mb = slope(self.xtip[1], self.xroot[1], self.ytip, self.yroot)
        bt = self.xroot[0]
        bb = self.xroot[1]

        self.cbar = (
            2.0
            / self.area
            * (
                1.0 / 3.0 * self.ytip ** 3.0 * (mb - mt) ** 2.0
                + self.ytip ** 2.0 * (mb - mt) * (bb - bt)
                + self.ytip * (bb - bt) ** 2.0
            )
        )

    def compute_coordinates(self):
        """ Computes root and tip x and y coordinates """

        self.yroot = 0.0
        self.ytip = self.span / 2.0
        self.xroot = [0.0, self.root]
        xrootc4 = self.root / 4.0
        xtipc4 = xrootc4 + self.span / 2.0 * tan(self.sweep * pi / 180.0)
        self.xtip = [xtipc4 - 0.25 * self.tip, xtipc4 + 0.75 * self.tip]

    def plot(self, ax):

        if not self.yroot:
            self.compute_coordinates()

        x = [
            self.xroot[0],
            self.xtip[0],
            self.xtip[1],
            self.xroot[1],
            self.xtip[1],
            self.xtip[0],
            self.xroot[0],
        ]
        y = [
            self.yroot,
            self.ytip,
            self.ytip,
            self.yroot,
            -self.ytip,
            -self.ytip,
            self.yroot,
        ]
        xrng = max(x) - min(x)
        yrng = self.span

        ax.plot(y, x, "k")
        ax.set_xlabel("y")
        ax.set_ylabel("x")
        ax.set_xlim(-self.ytip - yrng / 7.0, self.ytip + yrng / 7.0)
        ax.set_ylim(min(x) - xrng / 7.0, max(x) + xrng / 7.0)
        ax.set_aspect("equal", "datalim")
        ax.set_ylim(ax.get_ylim()[::-1])
        ax.annotate(
            "Area: {:.4f}\nAR: {:.4f}\nMAC: {:.4f}".format(
                self.area, self.aspect_ratio, self.cbar
            ),
            xy=(0.02, 0.95),
            xycoords="axes fraction",
            verticalalignment="top",
            bbox=dict(boxstyle="square", fc="w", ec="m"),
            color="m",
        )
