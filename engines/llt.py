
# coding: utf-8

# In[ ]:

# KENYA ONE PROJECT #
   # Matlab code to solve for CL of the wing and elliptical#
     #lift distribution without flaps .#
          #--------------------------------------------------------------#
				 # done by Geoffrey Nyaga Kinyua 
          #--------------------------------------------------------------#


# In[ ]:

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
theta = np.arange(math.pi/(2*N), math.pi/2, math.pi/(2*(N+1)))
alpha = np.arange(i_w+alpha_twist,i_w ,-alpha_twist/(N))
print(theta.shape,"theta")
print(alpha.shape,"alpha")

# In[5]:

# segment’s angle of attack
z = (b/2)*np.cos(theta)
c = Croot * (1 - (1-taper)* np.cos(theta)) # Mean Aerodynamics
# print(c,"c")
#Chord at each segment (m)
mu = c * a_2d / (4 * b)
# print(mu,"mu")
LHS = np.asarray(mu * (alpha-alpha_0)/57.3)#.reshape((N-1),1)# Left Hand Side
# print(c.shape,"c")
# print(mu.shape,"mu")
# print(LHS,"LHS")



# # Solving N equations to find coefficients A(i):
# N=8
RHS = []
for i in range(1,N+1):
  RHS_iter = np.sin(i*theta)*(1+(mu*i)/(np.sin(theta)))
  RHS.append(RHS_iter)
  # print (RHS)
RHS = (np.asarray(RHS))#.reshape((N-1),(N-1))
# print((RHS),"RHS")
# print(RHS.shape,"RHS")
inv_RHS = np.linalg.inv(RHS)
# print(inv_RHS,"inv_RHS")
ans = np.matmul(inv_RHS,LHS)
# print(ans,"ans")



print ((np.sin((2*(2-1))) * theta[2]) * (1 + (mu[2] * (2*(2-1)) / np.sin(theta[2]))),"tetstststst")
for i,j in  zip (range(1,N),range(1,N)):
    print(i,"i")
    print (j,"j")
    B = (math.sin((2*(j-1))) * theta[i]) * (1 + (mu[i] * (2*j-1)) / np.sin(theta[i]))
           
    #print(B)   
    A = B/np.transpose(LHS) 
    print(A)
    
    sum1 = 0 + (2*j-1) * A[j] * np.sin((2*j-1)* theta[i])
    sum2 = 0 + A[j] * np.sin((2*j-1) * theta[i])
    
          
CL = np.divide((4*b*sum2),c )
#print(CL)


# # In[ ]:

# CL1=(0, CL[1], CL[2], CL[3], CL[4], CL[5], CL[6], CL[7], CL[8])
#         #y_s=(b/2, z[1], z[2], z[3], z[4], z[5], z[6], z[7], z[8], z[9])


# # In[ ]:

# # C = sin((2*j-1)  * (1 + (mu(i) * (2*j-1)) / sin(theta(i))
# a = [1,2,3,4]
# b= 2
# c = np.divide(a,b)
# print(c)


# # In[ ]:

# # Solving N equations to find coefficients A(i):
# for i=1:N
# for j=1:N
# B(i,j) = sin((2*j-1) * theta(i)) * (1 + (mu(i) * (2*j-1)) / sin(theta(i)))
# end
# end
# A=B\transpose(LHS)
# for i = 1:N
# sum1(i) = 0
# sum2(i) = 0
# for j = 1 : N
# sum1(i) = sum1(i) + (2*j-1) * A(j)*sin((2*j-1)*theta(i))
# sum2(i) = sum2(i) + A(j)*sin((2*j-1)*theta(i))
# end
# end
# CL = 4*b*sum2 ./ c
# CL1=[0 CL(1) CL(2) CL(3) CL(4) CL(5) CL(6) CL(7) CL(8) CL(9)]
# y_s=[b/2 z(1) z(2) z(3) z(4) z(5) z(6) z(7) z(8) z(9)]

# plot(y_s,CL1,'-o')
# grid
# title('Lift distribution')
# xlabel('Semi-span location (m)')
# ylabel ('Lift coefficient')
print(ans[0])
CL_wing = math.pi * AR * ans[0]
print(CL_wing,"CL_wing")


# # In[25]:

# # % Lifting Line code in MATLAB
# # % Coded by L. sankar, December 1998
# # %



# croot=float(input('Please input root chord   '))
# ctip=float(input('Please input tip chord   '))
# span=float(input('Please input span   '))
# thetaroot=float(float(input('Please input Root twist angle in degrees   ')))
# thetatip=float(input('Please input tip twist angle in degrees   '))
# a0root=float(input('Please input root lift curve slope in units/ radian   '))
# a0tip=float(input('Please input lift curve slope at the tip, in units/radian   '))
# alpha=float(input('Please input angle of attack, in degrees   '))
# alpha0root=float(input('Please input zero-lift angle at the root   '))
# alpha0tip=float(input('Please input zero lift angle at the tip   '))


# # In[74]:

# from math import sin,atan,cos
# import numpy as np

# thetaroot = thetaroot / 57.3
# thetatip=(thetatip) * atan(1.)/45.
# alpha = float(alpha) * atan(1.)/45.
# alpha0root= float(alpha0root) * atan(1.)/45.
# alpha0tip=float(alpha0tip) * atan(1.)/45.


# # In[89]:

# n = 10
# theta=np.zeros([1,n])
# y=np.zeros([1,n])
# c=np.zeros([1,n])
# cl=np.zeros([1,n])
# alp=np.zeros([1,n])
# a=np.zeros([1,n])
# rhs=np.zeros([n,1])
# b=np.zeros([n,n])
# a=np.zeros([n,1])
# # %
# # % Define properties at n span stations
# # %
# pi = 4 * atan(1)
# print([i])
# for i in range(n):
#     theta[i] =  i * pi/(2 * n)
#     y[i] = (span) * 0.5 * np.cos(theta[i])
#     c[i] = croot+(ctip-croot)*y[i]*2./span
#     alp[i] = alpha+thetaroot-(alpha0root+(alpha0tip-alpha0root+thetaroot-thetatip)*y[i]*2./span)
#     a[i] =  a0root +((a0tip-a0root)* y[i] * 2 / span )
  
    
#     print(a)


# # In[63]:

# # pi = 4. * atan(1.)
# # # % Set up 2n x 2n system of equations for A1, A3 , ... A2n-1
# # for j=1:n
# #    mu = c(j)* a(j) / (4. * span)
# # rhs(j,1)=alp(j)*sin(theta(j))*c(j)*a(j)/(4*span)
# # for i=1:n
# # l = 2 * i-1
# # b(j,i)=sin(l*theta(j))*(mu*l+sin(theta(j)))

# # # %
# # # % Solve for the Fourier Coefficients
# # # %
# # a=b\rhs
# # # % Compute wing area and aspect ratio
# # S=(croot+ctip)/2.*span
# # AR=span*span/S
# # # % Compute CL
# # CL=a(1)*pi*AR
# # # % Compute CD
# # CD0=1.
# # for i=2:n
# # CD0=CD0+(2.*i-1)*a(i)*a(i)/(a(1)*a(1))
# # end
# # CD = pi * AR * a(1) * a(1) * CD0
# # # % Compute spanwise load distribution, normalized by Freestream velocity times Span
# # gamma=np.zeros([1,n])
# # for i=1:n
# # gamma(i)=0.0
# # y(i)=y(i)*2./span
# # for j=1:n
# # gamma(i)=gamma(i)+2.*a(j)*sin((2*j-1)*theta(i))
# # end
# # gamma(i) = gamma(i) *  span
# # cl(i) = gamma(i)/(0.5*c(i))
# # end
# # cl
# # # %
# # # % Plot the circulation distribution from root to tip with labels
# # # %
# # plot(y,cl)
# # xlabel('y/Semi-Span')
# # ylabel('Cl')
# # title('Sectional Lift Coefficient distribution')


# # In[ ]:

# print('hey')


# # In[ ]:



