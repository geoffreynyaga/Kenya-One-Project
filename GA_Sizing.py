
# coding: utf-8

# In[1]:

import numpy as np
import pandas as pd
import matplotlib.pylab as plt
import math


# In[4]:

wtoGuess = np.arange(2000,6500)
#Gudmundsson
# weWtoGud = 0.4074 + 0.0253 * np.log(wtoGuess)
# print(weWtoGud)
#use this when using Gudmundsson sizing and constants


# In[5]:

## also in input  main file, decide what to import and from which file
pax = 4
paxWeight = 180
crew=2
crewWeight = 200
payloadPax=50


# In[6]:

## also in input  main file, decide what to import and from which file
paxTotal=pax*paxWeight
payload = (payloadPax*pax)+paxTotal
crewTotal = crew*crewWeight


# In[7]:

## also in input  main file, decide what to import and from which file
Range=1200
ldMax=13
Vc = 140
cbhp = 0.4
propEff=0.8
fuelAllowance = 5 # in %
w4w3 = math.exp((-Range*3280.8399*cbhp/3600)/(propEff*ldMax*550))
w2w1= 0.98
w3w2= 0.97
w5w4= 0.99
w6w5=0.997
w6w1=w2w1*w3w2*w4w3*w5w4*w6w5

wfWto=((100+fuelAllowance)/100)*(1-w6w1)

wfWtoRoskam = (1+(fuelAllowance/100))*(1 - w4w3*0.992*0.992*0.996*0.99*0.992*0.992)
wfWtoRaymer = (1+(fuelAllowance/100))*(1 - w4w3*0.97*0.985*0.995)
wfWtoGud = (1+(fuelAllowance/100))*(1 - w4w3*0.994*0.985*0.996*0.995)
wfWtoSadraey = (1+(fuelAllowance/100))*(1 -w2w1*w3w2*w4w3*w5w4*w6w5 )

print(wfWto)

a= 1.51
b= -0.1


# In[8]:

#Raymer
weWto = a*(wtoGuess**b)
wtoYaxisRaymer=(payload+crewTotal)/(1-wfWtoRaymer-weWto)

#Roskam
wtoYaxisRoskam=(payload+crewTotal)/(1-wfWtoRoskam-weWto)

#Sadraey
wtoYaxisSadraey=(payload+crewTotal)/(1-wfWtoSadraey-weWto)

#Gudmundsson
wtoYaxisGud=(payload+crewTotal)/(1-wfWtoGud-weWto)


# In[9]:

plt.plot(wtoGuess,wtoGuess)
plt.plot(wtoGuess,wtoYaxisRaymer, label ="Raymer")
plt.plot(wtoGuess,wtoYaxisGud, label = "Gudmundsson")
plt.plot(wtoGuess,wtoYaxisRoskam, label = "Roskam")
plt.plot(wtoGuess,wtoYaxisSadraey, label= "Sadraey")

idx = np.argwhere(np.diff(np.sign(wtoGuess-wtoYaxisRaymer))!=0).reshape(-1)+0
plt.plot(wtoGuess[idx], wtoYaxisRaymer[idx], 'ro')

idx = np.argwhere(np.diff(np.sign(wtoGuess-wtoYaxisGud))!=0).reshape(-1)+0
plt.plot(wtoGuess[idx], wtoYaxisGud[idx], 'ro')

idx = np.argwhere(np.diff(np.sign(wtoGuess-wtoYaxisRoskam))!=0).reshape(-1)+0
plt.plot(wtoGuess[idx], wtoYaxisRoskam[idx], 'ro')

idx = np.argwhere(np.diff(np.sign(wtoGuess-wtoYaxisSadraey))!=0).reshape(-1)+0
plt.plot(wtoGuess[idx], wtoYaxisSadraey[idx], 'ro')

plt.xlabel("Wto Guess")
plt.ylabel("Wto")
plt.title("WEIGHT SIZING CONSIDERING VARIOUS FUEL FRACTIONS \n But the sizing constants are Raymer's ")
plt.legend()
plt.show()

d = wtoYaxisRaymer[idx]
e = wtoYaxisGud[idx]
f = wtoYaxisRoskam[idx]
g = wtoYaxisSadraey[idx]

h= np.array([d,e,f,g])
finalMTOW = np.mean(h)

print(d,e,f,g)
print("\n")
print(finalMTOW,"LBS <<-- final MTOW")


# In[ ]:




# In[ ]:




# In[ ]:




# In[ ]:



