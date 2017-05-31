
# coding: utf-8

# In[80]:

from math import sqrt
import numpy as np
import matplotlib.pyplot as plt


# In[81]:

altitude = 8500 #ft
rhoSL  = 0.002378
gamma = 1.4   #do sth
gas_constant = 1716
cruiseSpeed = 475 


# In[84]:

class atmosphere:
    def __init__ (self,altitude):
#             self.initialWeight = initialWeight
#             self.finalWeight = finalWeight
        self.altitude = altitude
        #             self.cruiseSpeed = cruiseSpeed
#             self.S = S
         
    def pressure(self):
        altitudePresssure = 2116*(1-(0.0000068756*altitude))**5.2561
        return altitudePresssure
    
    def pressureRatio(self):
        pressureRatio = (1-(0.0000068756*altitude))**5.2561
        return pressureRatio
    
    def density(self):
        ### fetch this function in other script
        altitudeDensity = rhoSL*(1-0.0000068756*self.altitude)**4.2561
        return altitudeDensity
    
    def densityRatio(self):
        ### fetch this function in other script
        densityRatio = (1-0.0000068756*self.altitude)**4.2561
        return densityRatio
    
    def temperature(self):
        temperature = 518.7*(1-0.0000068756*self.altitude)
        return temperature
    
    def temperatureRatio(self):
        temperatureRatio = (1-0.0000068756*self.altitude)
        return temperatureRatio
          
         
atmosphere = atmosphere(altitude) 


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

class speeds:
    
    
    def __init__(self,altitude,altitude_temperature,altitude_pressure,cruiseSpeed):
        self.altitude = altitude
        self.temperature = altitude_temperature
        self.pressure = altitude_pressure
        self.cruiseSpeed = cruiseSpeed
    
    def soundSpeed(self):
        soundSpeed = sqrt(gamma*self.temperature*gas_constant)
        return soundSpeed
    
    def dynamicPressure(self):
        dynamicPressure = altitude_pressure*((1 + 0.2*(self.cruiseSpeed/self.soundSpeed())**2)**3.5 - 1)      
        return dynamicPressure
    
    def EAS(self):
        EAS = cruiseSpeed * sqrt(altitude_density/rhoSL)
        return EAS
    
    def CAS(self):
        CAS = self.EAS()*sqrt(altitude_pressureRatio**-1)*sqrt((((self.dynamicPressure()/(self.pressure/altitude_pressureRatio))+1)**0.2857 - 1)/( (((self.dynamicPressure()/(self.pressure))+1)**0.2857 - 1)))
        return CAS
    
speeds = speeds(altitude,altitude_temperature,altitude_pressure,cruiseSpeed)

print(speeds.soundSpeed(),"ft/s Speed of Sound")
print(speeds.dynamicPressure(),"psf dynamic pressure")
print(speeds.EAS(),"ft/s equivalent airspeed")
print(speeds.CAS(),"ft/s calibrated airspeed")


# In[ ]:




# In[ ]:



