
# coding: utf-8

# In[80]:
__author__ = 'Geoffrey Nyaga'

import sys
sys.path.append('../')
from API.db_API import write_to_db,read_from_db

from math import sqrt
import numpy as np
import matplotlib.pyplot as plt

import API.perfIntroAPI as pfintro

# In[81]:

altitude = 8500 #ft
rhoSL  = read_from_db('rhoSL')
gamma = 1.4   #do sth
gas_constant = 1716
cruiseSpeed = read_from_db('cruiseSpeed') 
finalMTOW = read_from_db('finalMTOW')
maxSpeed = read_from_db('maxSpeed')
         
atmosphere = pfintro.atmosphere(altitude,rhoSL) 


print(atmosphere.pressure(),"psf")
print(atmosphere.pressureRatio(),"pressure ratio")
print(atmosphere.density(),"slugs/ft^3")
print(atmosphere.densityRatio(),"density ratio")
print(atmosphere.temperature(),"degree R")
print(atmosphere.temperatureRatio(),"temperature Ratio")

altitude_pressure = atmosphere.pressure()
altitude_density = atmosphere.density()
altitude_temperature = atmosphere.temperature()
altitude_pressureRatio = atmosphere.pressureRatio()


    
speeds = pfintro.speeds(altitude,altitude_temperature,altitude_pressure,cruiseSpeed,gas_constant,gamma,altitude_density,
	altitude_pressureRatio,rhoSL)
print(speeds.soundSpeed(),"ft/s Speed of Sound")
print(speeds.dynamicPressure(),"psf dynamic pressure")
print(speeds.EAS(),"ft/s equivalent airspeed")
print(speeds.CAS(),"ft/s calibrated airspeed")




finalMTOW = read_from_db('finalMTOW')
S = read_from_db('S')*10.76
stallSpeed = read_from_db('stallSpeed')

negloadFactor = -1.2
negCLmin = -1


flightEnvelope = pfintro.flightEnvelope(finalMTOW,S,maxSpeed,stallSpeed,negCLmin,negloadFactor,rhoSL)


print(flightEnvelope.loadFactor(),"load factor")
print(flightEnvelope.minCruiseSpeed(),"min Cruise Speed")
print(flightEnvelope.maxCruiseSpeed(),"max Cruise Speed")
print(flightEnvelope.diveSpeed(),"dive Speed")
print(flightEnvelope.maneuveringSpeed(),"maneuvering Speed")
print(flightEnvelope.negmaneuveringSpeed(),"neg maneuvering Speed") # AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA

maneuveringSpeed = flightEnvelope.maneuveringSpeed()
CLmax = 1.8 ####flaps down
vt = np.arange(1,200)

linev = 0.003388*vt**2*S*CLmax / finalMTOW
linevneg = 0.003388*vt**2*S*negCLmin / finalMTOW
# plt.scatter(np.linspace(30, 200, 3), np.random.randn(3))
plt.scatter(np.linspace(stallSpeed, flightEnvelope.maneuveringSpeed(), 2), ((0.003388*stallSpeed**2*S*CLmax / finalMTOW),(0.003388*flightEnvelope.maneuveringSpeed()**2*S*CLmax / finalMTOW)))

plt.plot (vt,linev)
plt.plot (vt,linevneg)


plt.show()