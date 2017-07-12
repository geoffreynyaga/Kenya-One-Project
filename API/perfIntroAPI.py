
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
    
    
    def __init__(self,altitude,altitude_temperature,altitude_pressure,cruiseSpeed,gas_constant,gamma,altitude_density,
                altitude_pressureRatio,rhoSL):
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


class flightEnvelope:

    def __init__(self,finalMTOW,S,maxSpeed,stallSpeed,negCLmin,rhoSL):
        self.finalMTOW = finalMTOW
        self.S = S
        self.maxSpeed = maxSpeed
        self.stallSpeed = stallSpeed         ########### make this EAS
        self.negCLmin = negCLmin
        self.rhoSL = rhoSL

    def loadFactor(self):
        n = 2.1 + ( 24000/(self.finalMTOW + 10000))
        return n

    def negloadFactor(self):
    	negloadFactor = -0.4*flightEnvelope.loadFactor(self)
    	return negloadFactor

    def minCruiseSpeed(self):
        vcmin = 33*sqrt(self.finalMTOW/self.S)
        return vcmin   #This is in KEAS by default

    def maxCruiseSpeed(self):
        vcmax = 0.9 * self.maxSpeed   ############## convert to KTAS if not
        return vcmax
    
    def diveSpeed(self):
        vD = 1.40 * flightEnvelope.minCruiseSpeed(self)
        return vD  ### dive speed should be greater than this value always

    def maneuveringSpeed(self):
        vA = self.stallSpeed *sqrt(flightEnvelope.loadFactor(self))
        return vA

    def negmaneuveringSpeed(self):
        VG = sqrt( (2*abs(flightEnvelope.negloadFactor(self))*self.finalMTOW)/(self.rhoSL*self.S*abs(self.negCLmin)))
        return VG/1.688

    def maxGustSpeed(self):
    	pass

    



    
