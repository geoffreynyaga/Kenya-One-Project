
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


# In[97]:


    
speeds = pfintro.speeds(altitude,altitude_temperature,altitude_pressure,cruiseSpeed,gas_constant,gamma,altitude_density,altitude_pressureRatio,rhoSL)
print(speeds.soundSpeed(),"ft/s Speed of Sound")
print(speeds.dynamicPressure(),"psf dynamic pressure")
print(speeds.EAS(),"ft/s equivalent airspeed")
print(speeds.CAS(),"ft/s calibrated airspeed")


# In[ ]:




# In[ ]:



