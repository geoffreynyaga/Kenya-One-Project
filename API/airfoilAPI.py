import math
import numpy as np
# import sys
# import os

class CLalfa:

    def __init__ (self, clalfa,rangeAR,Mach,sweepHalfChord):
        self.clalfa = clalfa
        self.rangeAR = rangeAR
        self.Mach = Mach
        self.sweepHalfChord = sweepHalfChord     

    def ellipticalCLalfa(self):
        ellipticalCLalfa = self.clalfa/(1+(self.clalfa/(math.pi*self.rangeAR)))
        return ellipticalCLalfa 
    
    def hemboldCLalfa(self):
        hemboldCLalfa = (2*math.pi*self.rangeAR)/(2+math.sqrt(self.rangeAR**2 + 4 ))
        return hemboldCLalfa

    def polhamusCLalfa (self):
        beta = (1-self.Mach**2)**(0.5)
        k = self.clalfa/(2*math.pi)
        #remember to cremove 57.3 later
        polhamusCLalfa = (2*math.pi*self.rangeAR)/( 2 + math.sqrt(((self.rangeAR*beta )/k)**2 *(1+((math.tan(self.sweepHalfChord/57.3))**2/beta **2))+4))
        return polhamusCLalfa
    

class classCLmax:

    def __init__ (self, clmaxRoot,yMGC,wingSpan,clmaxTip,sweepQuarterChord):
        self.clmaxRoot = clmaxRoot
        self.yMGC = yMGC
        self.wingSpan = wingSpan
        self.clmaxTip = clmaxTip 
        self.sweepQuarterChord = sweepQuarterChord

    def rapidClmax(self):
        clmax = self.clmaxRoot + (self.yMGC/self.wingSpan)*(self.clmaxTip-self.clmaxRoot)
        # IVE SKIPPED THE  root and tip Re calculations to help reading the equivalent clmax on the NACA graphs
        CLmaxo = 0.9*clmax
        kA = math.cos(self.sweepQuarterChord/57.3)    
        rapidClmax = CLmaxo*kA
        return rapidClmax
    
        
