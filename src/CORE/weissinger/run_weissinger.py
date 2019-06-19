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
  y = np.hstack((y, np.flipud(-y[0:npt-1])))
  cl = np.hstack((cl, np.flipud(cl[0:npt-1])))
  ccl = np.hstack((ccl, np.flipud(ccl[0:npt-1])))

  fig, axarr = plt.subplots(2, sharex=True)

  axarr[0].plot(y, cl, 'r', y, ccl/wing.cbar, 'b' )
  axarr[0].set_xlabel('y')
  axarr[0].set_ylabel('Sectional lift coefficient')
  axarr[0].legend(['Cl', 'cCl / MAC'], numpoints=1)
  axarr[0].grid()
  axarr[0].annotate("CL: {:.4f}\nCDi: {:.5f}".format(CL,CDi), xy=(0.02,0.95), 
                    xycoords='axes fraction', verticalalignment='top', 
                    bbox=dict(boxstyle='square', fc='w', ec='m'), color='m')

  wing.plot(axarr[1])
  plt.show()

if __name__ == "__main__":

  wing = Wing(inputs.span, inputs.root, inputs.tip, inputs.sweep,
              inputs.washout)

  y, cl, ccl, al_i, CL, CDi = weissinger_l(wing, inputs.alpha,
                                           2*inputs.npoints-1)

  print("{:<6}".format("Area: ") + str(wing.area))
  print("{:<6}".format("AR: ") + str(wing.aspect_ratio))
  print("{:<6}".format("MAC: ") + str(wing.cbar))
  print("{:<6}".format("CL: ") + str(CL))
  print("{:<6}".format("CDi: ") + str(CDi))

  create_plot(wing, y, cl, ccl, CL, CDi)
