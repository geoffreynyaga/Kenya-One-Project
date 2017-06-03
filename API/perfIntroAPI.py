
# coding: utf-8
from math import sqrt

class atmosphere:
    def __init__ (self,altitude,rhoSL):
#             self.initialWeight = initialWeight
#             self.finalWeight = finalWeight
        self.altitude = altitude
        self.rhoSL = rhoSL
        #             self.cruiseSpeed = cruiseSpeed
#             self.S = S
         
    def pressure(self):
        altitudePresssure = 2116*(1-(0.0000068756*self.altitude))**5.2561
        return altitudePresssure
    
    def pressureRatio(self):
        pressureRatio = (1-(0.0000068756*self.altitude))**5.2561
        return pressureRatio
    
    def density(self):
        ### fetch this function in other script
        altitudeDensity = self.rhoSL*(1-0.0000068756*self.altitude)**4.2561
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
          
         
# In[97]:

class speeds:
    
    
    def __init__(self,altitude,altitude_temperature,altitude_pressure,cruiseSpeed,gas_constant,gamma,altitude_density,altitude_pressureRatio,rhoSL):
        self.altitude = altitude
        self.temperature = altitude_temperature
        self.pressure = altitude_pressure/altitude_pressureRatio ######AAAAAAAAAAAAAAAAAAA confirm i am guessing
        self.altitude_pressure = altitude_pressure
        self.cruiseSpeed = cruiseSpeed
        self.gas_constant = gas_constant
        self.gamma = gamma
        self.altitude_density = altitude_density
        self.altitude_pressureRatio = altitude_pressureRatio
        self.rhoSL = rhoSL
    
    def soundSpeed(self):
        soundSpeed = sqrt(self.gamma*self.temperature*self.gas_constant)
        return soundSpeed
    
    def dynamicPressure(self):
        dynamicPressure = self.altitude_pressure*((1 + 0.2*(self.cruiseSpeed/self.soundSpeed())**2)**3.5 - 1)      
        return dynamicPressure
    
    def EAS(self):
        EAS = self.cruiseSpeed * sqrt(self.altitude_density/self.rhoSL)
        return EAS
    
    def CAS(self):
        CAS = self.EAS()*sqrt(self.altitude_pressureRatio**-1)*sqrt((((self.dynamicPressure()/(self.pressure/self.altitude_pressureRatio))+1)**0.2857 - 1)/( (((self.dynamicPressure()/(self.pressure))+1)**0.2857 - 1)))
        return CAS
    

# In[ ]:



