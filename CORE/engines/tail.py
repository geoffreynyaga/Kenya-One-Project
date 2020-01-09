
# coding: utf-8

# In[1]:

import numpy as np
from math import pi,sqrt
import matplotlib.pylab as plt


# In[51]:

from wing import wing,wing1,S


# In[52]:

Sref = S #ft^2
Cref = wing1.meanGeometricChord() #ft   #Shit is confusing, do i use MGC or Cref?????
VHT = 0.75
ConeRadius1 = 2 #ft
ConeRadius2 = 0.3 #ft
bref = wing1.wingSpan()


# In[53]:

##DIMENSIONING


# In[54]:

HtailAR = 4
HtailTaper = 0.5
#HtailWingspan 


# In[55]:

#INITIAL TAIL SIZING CONSIDERING H.TAIL ONLY - GUDMUNDSSON


# In[56]:

#Optimim tail Arm
HtailArm = sqrt ((2*VHT*Sref*Cref)/(pi*(ConeRadius1+ConeRadius2)))
Swet = pi*(ConeRadius1+ConeRadius2)*HtailArm + (2*VHT*Sref*Cref/HtailArm)
print (HtailArm,"ft is the Tail Arm for the VHT input of", VHT,"ft")
print (Swet, "ft^2 is the correponding wetted area")


# In[57]:

HtailArea = ((VHT*Sref*Cref)/HtailArm)
HtailWingspan = sqrt(HtailAR*HtailArea)
HtailCavg = HtailWingspan/HtailAR


# In[58]:

print (HtailArea,"ft^2 Horizontal Tail Area")
print (HtailWingspan,"ft Horizontal Tail wingspan")
print (HtailCavg,"ft Horizontal Tail average chord")


# In[59]:

def SurfaceAreavsTailArm():
        tailArm = np.arange(2,20)#THIS WILL CHANGE FIR DRONES AND COMMERCIAL JETS
        tailArea = (VHT*Sref*Cref/tailArm)
        
        coneArea = np.pi*(ConeRadius1+ConeRadius2)*tailArm
        Swet = coneArea+(2*tailArea)
        
        a= min(Swet)
        b = np.argmin(Swet)
        c = tailArm[b]
        
        
        plt.subplot(2,1,2)
    
        plt.axhline(a)
        plt.axvline(c)
        
        plt.plot(tailArm,tailArea)
        plt.plot(tailArm,coneArea)
        plt.plot(tailArm,Swet)
        
        plt.subplot(2,2,1)
        
        vht = np.arange(0.4,1,0.1)
        for i in vht:
            tailArea = i*Sref*Cref / tailArm
            plt.plot(tailArm,tailArea)
            plt.plot(tailArm,coneArea)            
                      
                       
        plt.subplot(2,2,2)
        
        vht = np.arange(0.4,1,0.1)
        print("these are the minimum wetted areas on the second graph on the right. More visualization coming soon")   
        for i in vht:
            tailArea = i*Sref*Cref / tailArm         
            Swet1 = np.array(coneArea+(2*tailArea))
            #a = np.asarray([min(Swet1)])
            a = (min(Swet1))
                       
            print(a)  
            plt.plot(tailArm,Swet1)
            #plt.scatter(tailArm,a)
            
        plt.show()     
        
SurfaceAreavsTailArm()


# In[60]:

#INITIAL TAIL SIZING OPTIMIZATION CONSIDERING V.TAIL ONLY - GUDMUNDSSON


# In[64]:

Vvt = 0.040
VtailAR = 4


# In[65]:

VtailArm = sqrt((Vvt*Sref*bref)/(pi*(ConeRadius1+ConeRadius2)))
print(VtailArm,"ft Optimum V.Tail arm")


# In[66]:

if HtailArm >= VtailArm:
    VtailArea = (Vvt * Sref * bref) / HtailArm
else:
    VtailArea = (Vvt * Sref * bref) / VtailArm
print (VtailArea,"ft^2 VTail area")


# In[67]:

VtailWingspan = sqrt(VtailAR * VtailArea)
VtailCavg = VtailWingspan/VtailAR

print (VtailWingspan,"ft VTail wingspan")
print (VtailCavg,"ft VTail average chord")


# In[31]:

#INITIAL TAIL SIZING OPTIMIZATION CONSIDERING H.TAIL and V.TAIL  - GUDMUNDSSON


# In[ ]:



