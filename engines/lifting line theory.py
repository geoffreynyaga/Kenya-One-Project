
# coding: utf-8

# KENYA ONE PROJECT #
   # Matlab code to solve for CL of the wing and elliptical#
     #lift distribution without flaps .#
          #--------------------------------------------------------------#
				 # done by Geoffrey Nyaga Kinyua 
          #--------------------------------------------------------------#

import numpy as np
import math
import matplotlib.pylab as plt

N = 9 # (number of segments - 1)
S = 24.3919 # m^2
AR = 7.8 # Aspect ratio
taper = 0.45 # Taper ratio
alpha_twist = -2 # Twist angle (deg)
i_w = 1 # wing setting angle (deg)
a_2d = 6.8754 # lift curve slope (1/rad)
alpha_0 = -4.2 # zero-lift angle of attack (deg)

b = math.sqrt(AR*S) # wing span (m)
MAC = S/b # Mean Aerodynamic Chord (m)
Croot = (1.5*(1+taper)*MAC)/(1+taper+taper**2) # root chord (m)
# theta = np.arange(math.pi/(2*N), math.pi/2, math.pi/(2*(N)))
theta = np.linspace((math.pi/(2*N)), (math.pi/2),N,endpoint=True)
# theta = theta.reshape(2,1)
# print(theta,"theta")
# alpha =np.arange(i_w+alpha_twist,i_w ,-alpha_twist/(N))
alpha = np.linspace(i_w+alpha_twist,i_w ,N)
# print(alpha,"alpha")
z = (b/2)*np.cos(theta)
print(z,"z")
c = Croot * (1 - (1-taper)* np.cos(theta)) # Mean Aerodynamics
# print(c,"c")
mu = c * a_2d / (4 * b)
# print(mu,"mu")

LHS = (mu * (np.array(alpha)-alpha_0)/57.3)#.reshape((N-1),1)# Left Hand Side
print(LHS,"LHS")

RHS = []
for i in range(1,2*N+1,2):
  RHS_iter = (np.sin(i*theta)*(1+(mu*i)/(np.sin(list(theta)))))#.reshape(1,N)
  # print(RHS_iter,"RHS_iter shape")
  RHS.append(RHS_iter)
 
test = (np.asarray(RHS))
x = np.transpose(test)
inv_RHS = np.linalg.inv(x)
ans = np.matmul(inv_RHS,LHS)
print(ans,"ans")

mynum = np.divide((4*b),c)
test = ((np.sin((1)*theta))*ans[0]*mynum)
test1 = ((np.sin((3)*theta))*ans[1]*mynum)
test2 = ((np.sin((5)*theta))*ans[2]*mynum)
test3 = ((np.sin((7)*theta))*ans[3]*mynum)
test4 = ((np.sin((9)*theta))*ans[4]*mynum)
test5= ((np.sin((11)*theta))*ans[5]*mynum)
test6 = ((np.sin((13)*theta))*ans[6]*mynum)
test7 = ((np.sin((15)*theta))*ans[7]*mynum)
test8 = ((np.sin((17)*theta))*ans[8]*mynum)

# print (test,"test")
# print (np.sum(test))

# print (test1,"test1")
# print (np.sum(test1))

# print (test2,"test2")
# print (np.sum(test2))

# print (test3,"test3")
# print (np.sum(test3))
# print ('----------------')
CL = test+test1+test2+test3+test4+test5+test6+test7+test8
# print (CL,"CL")

CL1 = np.append (0,CL)
# print (CL1,"CL1")

y_s=[b/2 , z[0], z[1], z[2] ,z[3], z[4] ,z[5], z[6], z[7] ,z[8]]
# print(y_s)

plt.plot(y_s,CL1, marker='o')
plt.title('Lifting Line Theory\n Elliptical Lift distribution')
plt.xlabel('Semi-span location (m)')
plt.ylabel ('Lift coefficient')
plt.grid()
plt.show()



CL_wing = math.pi * AR * ans[0]
print (CL_wing)
