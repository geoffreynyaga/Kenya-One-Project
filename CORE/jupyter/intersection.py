##################################################################################
# File: c:\Projects\KENYA ONE PROJECT\CORE\jupyter\intersect.py                  #
# Project: c:\Projects\KENYA ONE PROJECT\CORE\jupyter                            #
# Created Date: Wednesday, February 26th 2020, 2:00:56 pm                        #
# Author: Geoffrey Nyaga Kinyua ( <info@geoffreynyaga.com> )                     #
# -----                                                                          #
# Last Modified: Wednesday February 26th 2020 2:00:56 pm                         #
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
import numpy as np  # type: ignore
import matplotlib.pyplot as plt  # type: ignore

from typing import Any

# def get_intersection_index_with_plot(array1, array2):
#     x = np.arange(0, 100, 0.01)  # x- axis
#     y_data = np.full(10000, 40)
#     g = np.arange(-40, 60, 0.01)

#     plt.plot(x, y_data, "-")
#     plt.plot(x, g, "-")
#     # plt.plot(y_data, x, "x")

#     idx = np.argwhere(np.diff(np.sign(y_data - g))).flatten()
#     print(idx, "idx")
#     print(x[idx], "x[idx]")

#     idx2 = np.argwhere(np.diff(np.sign(g - y_data))).flatten()
#     print(idx2, "idx2")
#     print(y_data[idx], "y_data[idx]")

#     plt.plot(x[idx], y_data[idx], "ro")


#     plt.show()


def get_intersection_index(array1: Any, array2: Any) -> int:
    # array1 = np.full(10000, 40)
    # array2 = np.arange(-40, 60, 0.01)

    idx = np.argwhere(np.diff(np.sign(array1 - array2))).flatten()
    print(idx, "idx")
    return idx[0]


# x = get_intersection_index([1], [2])
# print(x)

# if __name__ == "__main__":
#     pass
