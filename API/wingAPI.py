from math import sqrt,cos,sin,pi,log,tan
import numpy as np
import matplotlib.pyplot as plt
# import sys
# import os


class aspectRatio:
    def __init__ (self, initialWeight, finalWeight,cruiseSpeed,S,rhoSL,altitude,cbhp,propEff,Range,cdMin,endurance,ldMax):
        self.initialWeight = initialWeight
        self.finalWeight = finalWeight
        self.cruiseSpeed = cruiseSpeed
        self.S = S
        self.rhoSL = rhoSL
        self.altitude = altitude
        self.averageWeight = (initialWeight+finalWeight)/2
        self.cbhp = cbhp
        self.propEff = propEff
        self.Range = Range
        self.cdMin = cdMin
        self.endurance = endurance
        self.ldMax = ldMax
        
    def altitudeDensity(self):
        ### fetch this function in other script
        altitudeDensity = self.rhoSL*(1-0.0000068756*self.altitude)**4.2561
        return altitudeDensity

    def cruiseCL (self):
        #### make a function to calculate cl
        cruiseCL = (2* self.averageWeight) / (aspectRatio.altitudeDensity(self)*self.S* self.cruiseSpeed**2)
        return cruiseCL
    
    def ct (self):
        ct = (self.cbhp * self.cruiseSpeed) / (1980000 * self.propEff)
        return ct
    
    def rangeAR (self):
        ###include range in the init function
        rangeAR = ((aspectRatio.cruiseCL(self))**2 ) / (pi*(( (self.cruiseSpeed*aspectRatio.cruiseCL(self)* log(self.initialWeight/self.finalWeight))/(self.Range * aspectRatio.ct(self))) - self.cdMin) )     
        return rangeAR
    
    def enduranceAR(self):
        enduranceAR = ((aspectRatio.cruiseCL(self))**2 ) / (pi*(( (aspectRatio.cruiseCL(self)* log(self.initialWeight/self.finalWeight))/(self.endurance*3600 * aspectRatio.ct(self))) - self.cdMin) )     
        return enduranceAR
    
    ## put some if-else statements for the sailplane category and remember to check the automatic AR<36 rule
    
    def unPoweredSailplaneAR(self):
        unPoweredSailplaneAR = 44.482 - sqrt(1672.2-28.41*self.ldMax)
        return unPoweredSailplaneAR
    
    def poweredSailplaneAR(self):
        poweredSailplaneAR = (self.ldMax + 0.443)/1.7405
        return poweredSailplaneAR


class wingDimensions:
    
    def __init__ (self, S , AR, taper):        
        self.AR = AR
        self.S = S
        self.taper = taper
        
    def wingSpan (self):
        wingspan = sqrt (self.AR *self.S) 
        return wingspan
    
    def Cavg (self):
        Cavg = wingDimensions.wingSpan(self)/self.AR
        return Cavg
    
    def rootChord(self):
        rootChord = 2* wingDimensions.Cavg(self)/ (1+self.taper)
        return rootChord
    
    def tipChord (self):
        tipChord = self.taper*wingDimensions.rootChord(self)
        return tipChord
    
    def meanGeometricChord (self):
        meanGeometricChord = (2/3)*(wingDimensions.rootChord(self))*((1+self.taper+self.taper**2)/(1+self.taper))
        return meanGeometricChord
    
    def chordAtY (self,y):
        chordAtY = wingDimensions.rootChord(self)*(1+(2*(self.taper - 1)*y/wingDimensions.wingSpan(self)))
        return chordAtY
    
    def yMGC (self):
        yMGC = (wingDimensions.wingSpan(self)/6)*((1+2*self.taper)/(1+self.taper))
        return yMGC
    


class classOswaldEff:

    def __init__ (self, rangeAR , sweepLeadingEdge, sweepTmax,fuselageWidth,wingSpan,cdMin):        
        self.rangeAR = rangeAR
        self.sweepLeadingEdge = sweepLeadingEdge
        self.sweepTmax = sweepTmax
        self.fuselageWidth = fuselageWidth
        self.wingSpan = wingSpan
        self.cdMin = cdMin

    def straightWingOswaldEff(self):
        straightWingOswaldEff = 1.78 * (1 - 0.045 * self.rangeAR ** 0.68) - 0.64
        return straightWingOswaldEff

    def sweptWingOswaldEff(self):
        sweptWingOswaldEff = 4.61 * (1 - 0.045 * self.rangeAR ** 0.68) * (cos(self.sweepLeadingEdge / 57.3)) ** 0.15 - 3.1
        return sweptWingOswaldEff

    def brandtOswaldEff(self):
        brandtOswaldEff = 2 / (2 - self.rangeAR + sqrt(4 + (self.rangeAR ** 2) * (1 + (tan(self.sweepTmax  / 57.3)) ** 2)))
        return brandtOswaldEff

    def douglasOswalfEff(self):
        r = 0.38 - (self.sweepLeadingEdge / 3000) + (self.sweepLeadingEdge ** 2 / 15000)
        u = 0.99
        t = self.fuselageWidth / self.wingSpan
        douglasOswalfEff = 1 / ((pi * self.rangeAR * r * self.cdMin) + ((1 + 0.03 * t - (2 * t ** 2)) * u))
        return douglasOswalfEff

        ## read Gudmundsson example 9-12 and compute USAF DATCOM method u lazy bastard
