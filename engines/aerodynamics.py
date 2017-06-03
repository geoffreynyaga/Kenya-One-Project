
# coding: utf-8

import math
import numpy as np
import matplotlib.pyplot as plt


taper = 0.8


class wingDimensions:
    
    def __init__ (self, S , AR, taper):        
        self.AR = AR
        self.S = S
        self.taper = taper
        
    def wingSpan (self):
        wingspan = math.sqrt (self.AR *self.S) 
        return wingspan
    
    def rootChord(self):
        rootChord = 2* self.S / (wingDimensions.wingSpan(self)*(1+self.taper))
        return rootChord
    
    def tipChord (self):
        tipChord = self.taper*wingDimensions.rootChord(self)
        return tipChord
    
    def chordAtY (self,y):
        chordAtY = wingDimensions.rootChord(self)*(1+(2*(self.taper - 1)*y/wingDimensions.wingSpan(self)))
        return chordAtY
    
    def yMGC (self):
        yMGC = (wingDimensions.wingSpan(self)/6)*((1+2*self.taper)/(1+self.taper))
        return yMGC
    
wing1 = wingDimensions(200,8,taper)

print (wing1.wingSpan())
print (wing1.rootChord())
print (wing1.tipChord())  
print (wing1.chordAtY(10))
print (wing1.yMGC())



initialWeight = 5500
finalWeight = 4900
altitude = 10000
rhoSL = 0.002378
averageWeight = (initialWeight+finalWeight)/2
cbhp = 0.4586
propEff = 0.85
cruiseSpeed =293.7 #ft/s
S = 258  #sq ft
Range = 3937008 #ft
cdMin = 0.02541
endurance = 5.172
### check spelling from previous modules
LDmax = 13.41


class aspectRatio:
    def __init__ (self,initialWeight,finalWeight,altitude,cruiseSpeed,S):
        self.initialWeight = initialWeight
        self.finalWeight = finalWeight
        self.altitude =altitude
        self.cruiseSpeed = cruiseSpeed
        self.S = S
        
    def altitudeDensity(self):
        ### fetch this function in other script
        altitudeDensity = rhoSL*(1-0.0000068756*self.altitude)**4.2561
        return altitudeDensity
    
    def cruiseCL (self):
        #### make a function to calculate cl
        cruiseCL = (2* averageWeight) / (aspectRatio.altitudeDensity(self)*self.S* self.cruiseSpeed**2)
        return cruiseCL
    
    def ct (self):
        ct = (cbhp * self.cruiseSpeed) / (1980000 * propEff)
        return ct
    
    def rangeAR (self):
        ###include range in the init function
        rangeAR = ((aspectRatio.cruiseCL(self))**2 ) / (math.pi*(( (self.cruiseSpeed*aspectRatio.cruiseCL(self)* math.log(self.initialWeight/self.finalWeight))/(Range * aspectRatio.ct(self))) - cdMin) )     
        return rangeAR
    
    def enduranceAR(self):
        enduranceAR = ((aspectRatio.cruiseCL(self))**2 ) / (math.pi*(( (aspectRatio.cruiseCL(self)* math.log(self.initialWeight/self.finalWeight))/(endurance*3600 * aspectRatio.ct(self))) - cdMin) )     
        return enduranceAR
    
    ## put some if-else statements for the sailplane category and remember to check the automatic AR<36 rule
    
    def unPoweredSailplaneAR(self):
        unPoweredSailplaneAR = 44.482 - math.sqrt(1672.2-28.41*LDmax)
        return unPoweredSailplaneAR
    
    def poweredSailplaneAR(self):
        poweredSailplaneAR = (LDmax + 0.443)/1.7405
        return poweredSailplaneAR
    
        

    
wing = aspectRatio(initialWeight,finalWeight,altitude,cruiseSpeed,S)

print(wing.altitudeDensity())
print(wing.cruiseCL())
print (wing.ct())
print (wing.rangeAR(), "range AR")
print (wing.enduranceAR())
print ('sailplanes')
print (wing.unPoweredSailplaneAR())
print (wing.poweredSailplaneAR())



### Gudmundsson says that taper ratio is the second most important geometric properties of the wing


## LDmax as a funtion of taper ratio
ARrange = np.arange(10,36)
ldmaxPowered = 1.7405*ARrange - 0.443
ldmaxunpowered = 0.0352*ARrange**2 + 3.1315*ARrange - 10.787

plt.plot(ARrange,ldmaxPowered)
plt.plot(ARrange,ldmaxunpowered)
plt.show()

########################################################################
########################################################################

## Lift and Moment Xristics of a 3D WING

wing.cruiseSpeed
wing.initialWeight
wing.finalWeight
wing.altitude
wing.S
#will need some funtion to slect the AR depending on aircraft type
wing.rangeAR()

fuselageWidth = 9

## 2D airfoil properties
## this will kill you down the line Nyaga

clalfa = 6.1 #per rad
clo = 0.4
clmax = 1.56

#do shit here later e.g Re on tip and root is different cz of taper. Read from the NACA R-824
clmaxRoot = 1.56
clmaxTip = 1.4

#convert the 57.3
alfazero = - clo/(6.1/57.3)
print(alfazero)

cma = -0.01

## import these stuff
rhoAlt = 0.001756
## also do something abot importing the independent variables loike averageWeight

CLalfa = 5.4 #per rad

## 3D Lift Curve Slope
#for elliptical wing
Mach = wing.cruiseSpeed /11164.27
sweepHalfChord = 5
sweepQuarterChord = 2
sweepLeadingEdge = 0
sweepTmax = 4
class CLalfa:
    
    def ellipticalCLalfa(self):
        ellipticalCLalfa = clalfa/(1+(clalfa/(math.pi*wing.rangeAR())))
        return ellipticalCLalfa 
    
    def hemboldCLalfa(self):
        hemboldCLalfa = (2*math.pi*wing.rangeAR())/(2+math.sqrt(wing.rangeAR()**2 + 4 ))
        return hemboldCLalfa

    def polhamusCLalfa (self):
        beta = (1-Mach**2)**(0.5)
        k = clalfa/(2*math.pi)
        #remember to cremove 57.3 later
        polhamusCLalfa = (2*math.pi*wing.rangeAR())/( 2 + math.sqrt(((wing.rangeAR()*beta)/k)**2 *(1+((math.tan(sweepHalfChord/57.3))**2/beta**2))+4))
        return polhamusCLalfa
    
wing3 = CLalfa()  
# make this shit work
#finalCLalfa = np.average(wing1.ellipticalCLalfa(),wing1.hemboldCLalfa(),wing1.polhamusCLalfa())
finalCLalfa = (wing3.ellipticalCLalfa()+wing3.hemboldCLalfa()+wing3.polhamusCLalfa()) /3
print(wing3.ellipticalCLalfa())
print(wing3.hemboldCLalfa())
print(wing3.polhamusCLalfa())
print('average CLalfa')
print(finalCLalfa)

CLo = - alfazero * finalCLalfa/57.3
print(CLo)

Cma = (finalCLalfa/57.3)*(cma/(clalfa/57.3))
print(Cma)


cruiseCL = CLo + (wing.initialWeight+wing.finalWeight)/(rhoAlt*wing.S*wing.cruiseSpeed**2) + ((finalCLalfa/57.3)*alfazero)
print (cruiseCL)



class classCLmax:
    def rapidClmax(self):
        clmax = clmaxRoot + (wing1.yMGC()/wing1.wingSpan())*(clmaxTip-clmaxRoot)
        # IVE SKIPPED THE  root and tip Re calculations to help reading the equivalent clmax on the NACA graphs
        CLmaxo = 0.9*clmax
        kA = math.cos(sweepQuarterChord/57.3)    
        rapidClmax = CLmaxo*kA
        return rapidClmax
    
        
wing2 = classCLmax()
print(wing2.rapidClmax())



class classOswaldEff:
    def straightWingOswaldEff (self):
        straightWingOswaldEff = 1.78 * (1-0.045*wing.rangeAR()**0.68) - 0.64
        return straightWingOswaldEff
    
    def sweptWingOswaldEff (self):
        sweptWingOswaldEff = 4.61*(1 -0.045*wing.rangeAR()**0.68 )*(math.cos(sweepLeadingEdge/57.3))**0.15 - 3.1
        return sweptWingOswaldEff
    
    def brandtOswaldEff(self):
        brandtOswaldEff = 2/(2-wing.rangeAR()+math.sqrt(4+(wing.rangeAR()**2)*(1+(math.tan(sweepTmax/57.3))**2)   )  )
        return brandtOswaldEff
    
    def douglasOswalfEff(self):
        r = 0.38 -(sweepLeadingEdge/3000)+(sweepLeadingEdge**2/15000)
        u= 0.99
        t= fuselageWidth / wing1.wingSpan()
        douglasOswalfEff = 1/(  (math.pi*wing.rangeAR()*r*cdMin) + (  (1+0.03*t -(2*t**2))*u    ))
        return douglasOswalfEff
    
    ## read Gudmundsson example 9-12 and compute USAF DATCOM method u lazy bastard
    
wing4 = classOswaldEff()
if taper == 1:
    oswaldEff = wing4.straightWingOswaldEff()
else:
    oswaldEff = (wing4.sweptWingOswaldEff()+wing4.brandtOswaldEff()+wing4.douglasOswalfEff())/3
    
print(wing4.straightWingOswaldEff())
print(wing4.sweptWingOswaldEff())
print(wing4.brandtOswaldEff())
print(wing4.douglasOswalfEff())

print(oswaldEff)


                       #Lifting Line Theory
from GA_Sizing import finalMTOW
AOA = 5 #Degrees

angularStation = np.array([22.5,45.0,67.5,90.0])/57.296
CosangularStation = np.cos (angularStation)
cTheta = wing1.tipChord()*CosangularStation + ( wing1.rootChord()*(1-CosangularStation))
SinangularStation = np.sin(angularStation)
SinangularStation3 = np.sin(angularStation*3)
SinangularStation5 = np.sin(angularStation*5)
SinangularStation7 = np.sin(angularStation*7)
angularMu = cTheta*clalfa/(4*wing1.wingSpan())



print (angularStation)
print (CosangularStation)
print (cTheta)
print(SinangularStation)
print(SinangularStation3)
print(SinangularStation5)
print(SinangularStation7)
print (angularMu)


A11 = SinangularStation*(angularMu + SinangularStation)
A12 = SinangularStation3*(3*angularMu + SinangularStation)
A13 = SinangularStation5*(5*angularMu + SinangularStation)
A14 = SinangularStation7*(7*angularMu + SinangularStation)
A = np.array([A11,A12,A13,A14])
Afinal = A.transpose()

B1 = angularMu*(AOA/57.296 - alfazero/57.296)*SinangularStation
Bfinal = B1.reshape(4,1)



#c = Afinal**-1   # THIS METHOD DOESNT WORK FOR MATRIX INVERSE...SH*T AINT LIKE MATLAB HAHA 1 HOUR WASTED
c = np.linalg.inv(Afinal)
d = np.dot(c,Bfinal)
d0 = d[0]

cl = np.pi*wing.rangeAR()*d0
print (cl,"old cl")

dFactor = 3*(d[1]/d[0])**2 + (5*(d[2]/d[0])**2) + (7*(d[3]/d[0])**2)

CDi = cl**2*(1+dFactor)/(np.pi*wing.rangeAR())

oswaldeff = 1/(1+dFactor)
print(oswaldeff)


CLalfa = cl/((AOA/57.296) - (alfazero/57.296))
print (CLalfa , "per radian")


vel = np.sqrt ((2*finalMTOW)/(rhoSL*S*cl))
print (vel,"ft/s")


#Corrected for fuselage

wfus = 4.167 #ft
reducedWingspan = wing1.wingSpan()- wfus
reducedS = S - (wing1.rootChord()*wfus)
reducedAR = reducedWingspan**2 / reducedS
reducedTaper = wing1.wingSpan()*wing1.tipChord() / ( (wing1.rootChord()*(wing1.wingSpan()-wfus)) +wfus*wing1.tipChord())
newCl = 2*finalMTOW/(rhoSL*vel**2*reducedS)
print ("new dimensions")
print(reducedWingspan, "wingspan")
print(reducedS,"area")
print(reducedTaper,"taper")
print (newCl ,"cl")

# do the conclusions from the book .... SH*T ITS HARD


