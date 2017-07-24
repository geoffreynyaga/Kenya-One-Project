# coding: utf-8
__author__ = 'Geoffrey Nyaga'

# KENYA ONE PROJECT #
   # Python code to solve for CL of the wing and elliptical#
     #lift distribution without flaps .#
          #--------------------------------------------------------------#
				 # done by Geoffrey Nyaga Kinyua 
          #--------------------------------------------------------------#


import sys
sys.path.append('../')
from API.db_API import write_to_db, read_from_db
from API.lifting_line_theory import llt,llt_with_plots,llt_subplots

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

# print (llt(N,S,AR,taper,alpha_twist,i_w,a_2d,alpha_0))

def lifting_line_theory_combinations():
	 
	myans = 0.4049
	alpha_twist = np.arange(0,-4,-.01)
	# print(alpha_twist)
	i_w = np.arange(0,5,.1)
	x = []
	for i in alpha_twist:
		for j in i_w:
			lst = (i,j)
			x.append (lst)
			
	finalvals = []		
	for alpha_twist,i_w in x:
		final = llt(N,S,AR,taper,alpha_twist,i_w,a_2d,alpha_0)
		# print (final)
		if abs( (final[2]/myans) - 1 ) <= 0.00005:
			print (final[2],alpha_twist,i_w,"yeeh")
			instant = [alpha_twist,i_w]
			finalvals.append(instant)
			llt_with_plots(N,S,AR,taper,alpha_twist,i_w,a_2d,alpha_0)
					
		else:
			pass
	# print(np.array(finalvals).shape)
	last = np.array(finalvals).shape
	finalval = last[0]
	# print (finalval,"finalval")
	return finalval

y = lifting_line_theory_combinations()
plt.show()
print(y)



def lifting_line_theory_subplots():

  myans = 0.4049  
  alpha_twist = np.arange(0,-4,-.01)
  # alpha_twist = np.arange(0,-4,-1)
  
  i_w = np.arange(0,5,.1)
  # i_w = np.arange(0,5,)
  x = []
  for i in alpha_twist:
    for j in i_w:
      lst = (i,j)
      x.append (lst)

  finalyy = []
  finalxx = []
  for alpha_twist,i_w in x:
    final = llt(N,S,AR,taper,alpha_twist,i_w,a_2d,alpha_0)

    if abs( (final[2]/myans) - 1 ) <= 0.00005:
      print (alpha_twist,i_w,"yeeh")
      myx = (final[0])
      myy = (final[1])
      finalyy.append(myy)    
      yy = (np.asarray(finalyy))         
    else:
      pass
    # plt.tight_layout()
  last = np.array(finalyy).shape
  finalval = last[0]
  m = math.ceil(finalval/2) #used below to define number of subplots

  fig, axes = plt.subplots(nrows=m, ncols=2)
  for ax, row in zip(axes.flatten(), finalyy):
      ax.plot(myx,row,'r-'  )   
      # ax.set_label('Label via method')
      # ax.legend()
  # turn remaining axes off
  for i in range(len(finalyy),m):
      axes.flatten()[i].axis("off")
      # ax.legend()
      # ax.title(i)
  plt.tight_layout()
  plt.show() 


lifting_line_theory_subplots()