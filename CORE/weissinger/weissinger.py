#!/usr/bin/env python3
# -*- coding:utf-8 -*-
##################################################################################
# File: c:\Projects\KENYA ONE PROJECT\CORE\weissinger\weissinger.py              #
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

from math import sqrt, pi, cos, sin, tan
import numpy as np

eps = 1e-10


def l_function(lam, spc, y, n):
    """ Weissinger-L function, formulation by De Young and Harper.
      lam: sweep angle of quarter-chord (radians)
      spc: local span/chord
      y: y/l = y*
      n: eta/l = eta* """

    if abs(y - n) < eps:
        weissl = tan(lam)

    else:
        yp = abs(y)
        if n < 0.0:
            weissl = (
                sqrt(
                    (1.0 + spc * (yp + n) * tan(lam)) ** 2.0
                    + spc ** 2.0 * (y - n) ** 2.0
                )
                / (spc * (y - n) * (1.0 + spc * (yp + y) * tan(lam)))
                - 1.0 / (spc * (y - n))
                + 2.0
                * tan(lam)
                * sqrt((1.0 + spc * yp * tan(lam)) ** 2.0 + spc ** 2.0 * y ** 2.0)
                / (
                    (1.0 + spc * (yp - y) * tan(lam))
                    * (1.0 + spc * (yp + y) * tan(lam))
                )
            )
        else:
            weissl = -1.0 / (spc * (y - n)) + sqrt(
                (1.0 + spc * (yp - n) * tan(lam)) ** 2.0 + spc ** 2.0 * (y - n) ** 2.0
            ) / (spc * (y - n) * (1.0 + spc * (yp - y) * tan(lam)))

    return weissl


def weissinger_l(wing, al, m):
    """ Weissinger-L method for a swept, tapered, twisted wing.
      wing.span: span
      wing.root: chord at the root
      wing.tip: chord at the tip
      wing.sweep: quarter-chord sweep (degrees)
      wing.washout: twist of tip relative to root, +ve down (degrees)
      al: angle of attack (degrees) at the root
      m: number of points along the span (an odd number).

      Returns:
      y: vector of points along span
      cl: local 2D lift coefficient cl
      ccl: cl * local chord (proportional to sectional lift)
      al_i: local induced angle of attack
      CL: lift coefficient for entire wing
      CDi: induced drag coefficient for entire wing """

    # Convert angles to radians
    lam = wing.sweep * pi / 180.0
    tw = -wing.washout * pi / 180.0
    al = al * pi / 180.0

    # Initialize solution arrays
    O = m + 2
    phi = np.zeros((m))
    y = np.zeros((m))
    c = np.zeros((m))
    spc = np.zeros((m))
    twist = np.zeros((m))
    theta = np.zeros((O))
    n = np.zeros((O))
    rhs = np.zeros((m, 1))
    b = np.zeros((m, m))
    g = np.zeros((m, m))
    A = np.zeros((m, m))

    # Compute phi, y, chord, span/chord, and twist on full span
    for i in range(m):
        phi[i] = (i + 1) * pi / float(m + 1)  # b[v,v] goes to infinity at phi=0
        y[i] = cos(phi[i])  # y* = y/l
        c[i] = wing.root + (wing.tip - wing.root) * y[i]  # local chord
        spc[i] = wing.span / c[i]  # span/(local chord)
        twist[i] = abs(y[i]) * tw  # local twist

    # Compute theta and n
    for i in range(O):
        theta[i] = (i + 1) * pi / float(O + 1)
        n[i] = cos(theta[i])
    n0 = 1.0
    phi0 = 0.0
    nO1 = -1.0
    phiO1 = pi

    # Construct the A matrix, which is the analog to the 2D lift slope
    print("Calculating aerodynamics ...")
    for j in range(m):
        print("Point " + str(j + 1) + " of " + str(m))
        rhs[j, 0] = al + twist[j]

        for i in range(m):
            if i == j:
                b[j, i] = float(m + 1) / (4.0 * sin(phi[j]))
            else:
                b[j, i] = (
                    sin(phi[i])
                    / (cos(phi[i]) - cos(phi[j])) ** 2.0
                    * (1.0 - (-1.0) ** float(i - j))
                    / float(2 * (m + 1))
                )

            g[j, i] = 0.0
            Lj0 = l_function(lam, spc[j], y[j], n0)
            LjO1 = l_function(lam, spc[j], y[j], nO1)
            fi0 = 0.0
            fiO1 = 0.0
            for mu in range(m):
                fi0 += (
                    2.0
                    / float(m + 1)
                    * (mu + 1)
                    * sin((mu + 1) * phi[i])
                    * cos((mu + 1) * phi0)
                )
                fiO1 += (
                    2.0
                    / float(m + 1)
                    * (mu + 1)
                    * sin((mu + 1) * phi[i])
                    * cos((mu + 1) * phiO1)
                )

            for r in range(O):
                Ljr = l_function(lam, spc[j], y[j], n[r])
                fir = 0.0
                for mu in range(m):
                    fir += (
                        2.0
                        / float(m + 1)
                        * (mu + 1)
                        * sin((mu + 1) * phi[i])
                        * cos((mu + 1) * theta[r])
                    )
                g[j, i] += Ljr * fir
            g[j, i] = (
                -1.0 / float(2 * (O + 1)) * ((Lj0 * fi0 + LjO1 * fiO1) / 2.0 + g[j, i])
            )

            if i == j:
                A[j, i] = b[j, i] + wing.span / (2.0 * c[j]) * g[j, i]
            else:
                A[j, i] = wing.span / (2.0 * c[j]) * g[j, i] - b[j, i]

    # Scale the A matrix
    A *= 1.0 / wing.span

    # Calculate ccl
    ccl = np.linalg.solve(A, rhs)

    # Add a point at the tip where the solution is known
    y = np.hstack((np.array([1.0]), y))
    ccl = np.hstack((np.array([0.0]), ccl[:, 0]))
    c = np.hstack((np.array([wing.tip]), c))
    twist = np.hstack((np.array([tw]), twist))

    # Return only the right-hand side (symmetry)
    nrhs = int((m + 1) / 2) + 1  # Explicit int conversion needed for Python3
    y = y[0:nrhs]
    ccl = ccl[0:nrhs]

    # Sectional cl and induced angle of attack
    cl = np.zeros(nrhs)
    al_i = np.zeros(nrhs)
    for i in range(nrhs):
        cl[i] = ccl[i] / c[i]
        al_e = cl[i] / (2.0 * pi)
        al_i[i] = al + twist[i] - al_e

    # Integrate to get CL and CDi
    CL = 0.0
    CDi = 0.0
    area = 0.0
    for i in range(1, nrhs):
        dA = 0.5 * (c[i] + c[i - 1]) * (y[i - 1] - y[i])
        dCL = 0.5 * (cl[i - 1] + cl[i]) * dA
        dCDi = sin(0.5 * (al_i[i - 1] + al_i[i])) * dCL
        CL += dCL
        CDi += dCDi
        area += dA
    CL /= area
    CDi /= area

    return y * wing.span / 2.0, cl, ccl, al_i * 180.0 / pi, CL, CDi
