# coding: utf-8
__author__ = 'Geoffrey Nyaga'

import sys
sys.path.append('../')
from API.db_API import write_to_db, read_from_db

# KENYA ONE PROJECT #
		 # Matlab code to solve for CL of the wing and elliptical#
        # lift distribution with flaps .#
               #-------------------------------------------------------#
				 # done by Geoffrey Nyaga Kinyua #
               #-------------------------------------------------------#
import numpy as np
import math
import matplotlib.pylab as plt

import lifting_line_theory as llt

N = llt.N# (number of segments - 1)
S = llt.S # m^2
AR = llt.AR # Aspect ratio
taper = llt.taper # Taper ratio
alpha_twist = llt.alpha_twist # Twist angle (deg)
a_2d = llt.a_2d # lift curve slope (1/rad)
alpha_0 = llt.alpha_0 # zero-lift angle of attack (deg)

a_0 = -4.2 # flap up zero-lift angle of attack (deg)

i_w = llt.i_w # wing setting angle (deg)
fuselage_angle = 10
i_wing = fuselage_angle + i_w ; # takeoff_wing_setting_angle (deg)(fuselage angle+wing incidence)

cfc=0.20
df=14
doflap=-1.15*cfc*df
bf_b=0.6 #flap-to-wing span ratio

b = llt.b # wing span (m)
a_0_fd = doflap+a_0 # flap down zero-lift angle of attack (deg)
MAC = llt.MAC # Mean Aerodynamic Chord (m)
Croot = llt.Croot # root chord (m)
theta = llt.theta
alpha = np.linspace(i_wing+alpha_twist,i_wing ,N)

# segment’s angle of attack
for i in range (1,N):
    if (i/N)>(1-bf_b):
        alpha_0=a_0_fd #flap down zero lift AOA

    else:
        alpha_0=a_0 #flap up zero lift AOA
    
z = (b/2)*np.cos(theta)
c = Croot * (1 - (1-taper)* np.cos(theta)) # Mean Aerodynamics
mu = c * a_2d / (4 * b)
LHS = (mu * (np.array(alpha)-alpha_0)/57.3)#.reshape((N-1),1)# Left Hand Side

# Solving N equations to find coefficients A(i):
RHS = []
for i in range(1,2*N+1,2):
    RHS_iter = (np.sin(i*theta)*(1+(mu*i)/(np.sin(list(theta)))))#.reshape(1,N)
    RHS.append(RHS_iter)

test = (np.asarray(RHS))
x = np.transpose(test)
inv_RHS = np.linalg.inv(x)
ans = np.matmul(inv_RHS,LHS)

CL_TO = math.pi * AR * ans[0]

if __name__ == '__main__':
  print (CL_TO,"CL_wing")

# USE THIS CL WITH take-off speed TO CALCULATE THE ACCURATE LIFT!!!!!!!!!!