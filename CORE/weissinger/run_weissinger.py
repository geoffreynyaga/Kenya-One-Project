#!/usr/bin/env python3
# -*- coding:utf-8 -*-
##################################################################################
# File: c:\Projects\KENYA ONE PROJECT\CORE\weissinger\run_weissinger.py          #
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
#!/usr/bin/env python

# from matplotlib import pyplot as plt
import matplotlib.pyplot as plt
import numpy as np

import inputs
from wing import Wing
from weissinger import weissinger_l


def create_plot(wing, y, cl, ccl, CL, CDi):
    """ Plots lift distribution and wing geometry """

    # Mirror to left side for plotting
    npt = y.shape[0]
    y = np.hstack((y, np.flipud(-y[0 : npt - 1])))
    cl = np.hstack((cl, np.flipud(cl[0 : npt - 1])))
    ccl = np.hstack((ccl, np.flipud(ccl[0 : npt - 1])))

    fig, axarr = plt.subplots(2, sharex=True)

    axarr[0].plot(y, cl, "r", y, ccl / wing.cbar, "b")
    axarr[0].set_xlabel("y")
    axarr[0].set_ylabel("Sectional lift coefficient")
    axarr[0].legend(["Cl", "cCl / MAC"], numpoints=1)
    axarr[0].grid()
    axarr[0].annotate(
        "CL: {:.4f}\nCDi: {:.5f}".format(CL, CDi),
        xy=(0.02, 0.95),
        xycoords="axes fraction",
        verticalalignment="top",
        bbox=dict(boxstyle="square", fc="w", ec="m"),
        color="m",
    )

    wing.plot(axarr[1])
    plt.show()


if __name__ == "__main__":

    wing = Wing(inputs.span, inputs.root, inputs.tip, inputs.sweep, inputs.washout)

    y, cl, ccl, al_i, CL, CDi = weissinger_l(wing, inputs.alpha, 2 * inputs.npoints - 1)

    print("{:<6}".format("Area: ") + str(wing.area))
    print("{:<6}".format("AR: ") + str(wing.aspect_ratio))
    print("{:<6}".format("MAC: ") + str(wing.cbar))
    print("{:<6}".format("CL: ") + str(CL))
    print("{:<6}".format("CDi: ") + str(CDi))

    create_plot(wing, y, cl, ccl, CL, CDi)
