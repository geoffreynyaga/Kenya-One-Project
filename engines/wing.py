from math import sqrt,cos,sin,pi,log,tan
import numpy as np
import matplotlib.pyplot as plt
import sys
import os

from values import prerequisites,TESTING_MAIN

S = TESTING_MAIN['S'] *10.76 #sq ft

taper = 0.8


#IMPORT SOME OF THE VALUES HERE
initialWeight = TESTING_MAIN['initialWeight']
finalWeight = TESTING_MAIN['finalWeight']
finalMTOW = TESTING_MAIN['finalMTOW']
altitude = TESTING_MAIN['altitude'] #ft
rhoSL = TESTING_MAIN['rhoSL']
averageWeight = (initialWeight+finalWeight)/2
cbhp = 0.4586
propEff = prerequisites['propEff']
cruiseSpeed =TESTING_MAIN['maxSpeed']/1.2 #CALCULATE THIS, MAYBE USE MAXSPEED/1.2 THEN LATER OPTIMIZE IN PERFORMANCE
Range = (prerequisites['Range']*3280.84)#ft
cdMin = 0.02541   #CALCULATE THIS SOMEHOW CZ WE HAVE IMPORTED IT INTO THE VALUES FILES
endurance = 5.172 #hours
### check spelling from previous modules
ldMax = TESTING_MAIN['ldMax']
altitudeDensity = TESTING_MAIN['altitudeDensity']

mydict = {} #'initialising" the an empty dictionary to be used locally in the function below
def writeToValues(name):
    fileName = os.path.splitext(os.path.basename(sys.argv[0]))[0]
    valuePrint=open("values.py","a")
    def namestr(obj,namespace):
        return[name for name in namespace if namespace[name] is obj]
    b = namestr(name, globals())
    c = "".join(str(x) for x in b)
    mydict[(c)] = name
    valuePrint.write(fileName)
    valuePrint.write("=")
    valuePrint.write(str(mydict))
    valuePrint.write("\n")
    valuePrint.close()
    return mydict

writeToValues(cdMin)
writeToValues(taper)
writeToValues(cbhp)
writeToValues(cruiseSpeed)
writeToValues(altitude)

class aspectRatio:
    def __init__ (self, initialWeight, finalWeight, altitude, cruiseSpeed,S):
        self.initialWeight = initialWeight
        self.finalWeight = finalWeight
        self.altitude = altitude
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
        rangeAR = ((aspectRatio.cruiseCL(self))**2 ) / (pi*(( (self.cruiseSpeed*aspectRatio.cruiseCL(self)* log(self.initialWeight/self.finalWeight))/(Range * aspectRatio.ct(self))) - cdMin) )     
        return rangeAR
    
    def enduranceAR(self):
        enduranceAR = ((aspectRatio.cruiseCL(self))**2 ) / (pi*(( (aspectRatio.cruiseCL(self)* log(self.initialWeight/self.finalWeight))/(endurance*3600 * aspectRatio.ct(self))) - cdMin) )     
        return enduranceAR
    
    ## put some if-else statements for the sailplane category and remember to check the automatic AR<36 rule
    
    def unPoweredSailplaneAR(self):
        unPoweredSailplaneAR = 44.482 - sqrt(1672.2-28.41*ldMax)
        return unPoweredSailplaneAR
    
    def poweredSailplaneAR(self):
        poweredSailplaneAR = (ldMax + 0.443)/1.7405
        return poweredSailplaneAR

wing = aspectRatio(initialWeight,finalWeight,altitude,cruiseSpeed,S)

# print(wing.altitudeDensity(),"Altitude Density")
# print(wing.cruiseCL(),"Cruise CL")
# print (wing.ct(),"ct")
# print (wing.rangeAR(),"Range AR")
# print (wing.enduranceAR(),"Endurance AR")
# print ('For Sailplanes')
# print (wing.unPoweredSailplaneAR(),"unpowered Sailplane AR")
# print (wing.poweredSailplaneAR(),"powered Sailplane AR")

altitudeDensity = (wing.altitudeDensity())
cruiseCL = (wing.cruiseCL())
ct= (wing.ct())
rangeAR =  (wing.rangeAR())
enduranceAR=  (wing.enduranceAR())
unPoweredSailplaneAR = (wing.unPoweredSailplaneAR())
poweredSailplaneAR =(wing.poweredSailplaneAR())

writeToValues(altitudeDensity)
writeToValues(cruiseCL)
writeToValues(ct)
writeToValues(rangeAR)
writeToValues(enduranceAR)
writeToValues(unPoweredSailplaneAR)
writeToValues(poweredSailplaneAR)


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
    
wing1 = wingDimensions(S,wing.rangeAR(),taper)

# print (wing1.wingSpan(),"wingspan")
# print (wing1.Cavg(),"average chord")
# print (wing1.rootChord(),"root chord")
# print (wing1.tipChord(),"tip chord")
# print (wing1.meanGeometricChord(),"MGC")
# print (wing1.chordAtY(10),"chord at Y")   #CHANGE 10 LATER TO INPUT
# print (wing1.yMGC(),"Y Location of MGC")

wingSpan =  (wing1.wingSpan())
averageChord =  (wing1.Cavg())
rootChord =  (wing1.rootChord())
tipChord =  (wing1.tipChord())
meanGeometricChord =  (wing1.meanGeometricChord())
chordAtY =  (wing1.chordAtY(10))   #CHANGE 10 LATER TO INPUT
# chordAtY =  (wing1.chordAtY(float(input('enter lateral distance for chordAtY:'))))

yMGC = (wing1.yMGC())
writeToValues(wingSpan)
writeToValues(averageChord)
writeToValues(rootChord)
writeToValues(tipChord)
writeToValues(meanGeometricChord)
writeToValues(chordAtY)
writeToValues(yMGC)

### Gudmundsson says that taper ratio is the second most important geometric properties of the wing

## ldMax as a funtion of Aspect ratio
ARrange = np.arange(10,36)
ldmaxPowered = (1.7405*ARrange) - 0.443
ldmaxunpowered = (0.0352*ARrange**2 )+ ((3.1315*ARrange) - 10.787)

plt.plot(ARrange,ldmaxPowered,label = "Powered")
plt.plot(ARrange,ldmaxunpowered,label = "Unpowered")
plt.xlabel('Wing Aspect Ratio')
plt.ylabel('Maximum Lift-to-Drag Ratio')
plt.title(" SAILPLANES \n ldMax as a funtion of Aspect ratio")
plt.legend()
plt.show()

#IMPORT ALL THESE JUNK SOMETIMES LATER... AND JEEZ ORGANIZE THE DAMN CODE
## 2D airfoil properties
## this will kill you down the line Nyaga
AOA = 5 #Degree
clalfa = 6.1
clo = 0.4
alfazero = -clo/(clalfa/57.3)   #confirm this or just read the damn graph
cma = -0.01
clmax = 1.560  #from airfoil
#do shit here later e.g Re on tip and root is different cz of taper. Read from the NACA R-824
clmaxRoot = 1.561
clmaxTip = 1.4

writeToValues(AOA)
writeToValues(clalfa)
writeToValues(clo)
writeToValues(alfazero)
writeToValues(cma)
writeToValues(clmax)
writeToValues(clmaxRoot)
writeToValues(clmaxTip)

angularStation = np.array([22.5,45.0,67.5,90.0])/57.296
CosangularStation = np.cos (angularStation)
cTheta = wing1.tipChord()*CosangularStation + ( wing1.rootChord()*(1-CosangularStation))
SinangularStation = np.sin(angularStation)
SinangularStation3 = np.sin(angularStation*3)
SinangularStation5 = np.sin(angularStation*5)
SinangularStation7 = np.sin(angularStation*7)
angularMu = cTheta*clalfa/(4*wing1.wingSpan())

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
# print (cl,"cl")

dFactor = 3*(d[1]/d[0])**2 + (5*(d[2]/d[0])**2) + (7*(d[3]/d[0])**2)

CDi = cl**2*(1+dFactor)/(np.pi*wing.rangeAR())
# print(CDi,"CDi")
reducedCDi = CDi[0]
writeToValues(reducedCDi)

reducedOswaldEff = 1/(1+dFactor)
# print(reducedOswaldEff,"oswaldEff")
reducedOswaldEff = reducedOswaldEff[0]
writeToValues(reducedOswaldEff)


CLalfa = (cl/((AOA/57.296) - (alfazero/57.296)))
CLalfa = CLalfa[0]
# print (CLalfa , "per radian")
writeToValues(CLalfa)
reducedMaxSpeed = sqrt ((2*finalMTOW)/(rhoSL*S*cl))
writeToValues(reducedMaxSpeed)
# print (vel,"ft/s")


#Accounting for the fuselage
fuselageWidth = 4.167 #ft
writeToValues(fuselageWidth)
reducedWingspan = wing1.wingSpan() - fuselageWidth
reducedS = S - (wing1.rootChord()*fuselageWidth)
reducedAR = (reducedWingspan**2)/reducedS
reducedRootChord= (wing1.rootChord()*(1-(fuselageWidth/wing1.wingSpan())) )+(wing1.tipChord()*(fuselageWidth/wing1.wingSpan()))
reducedTaper = (wing1.wingSpan()*wing1.rootChord())/(wing1.rootChord()*(wing1.wingSpan()-fuselageWidth)+(fuselageWidth*wing1.rootChord()))


# print ("CL of the reduced Wing")
reducedCL = ((2*finalMTOW)/(rhoSL*reducedMaxSpeed**2*reducedS)) #it actually increased. The name reducedCl is just for formality
writeToValues(reducedCL)

# print(reducedCL,"CL due to reduced Wing")
# print(reducedWingspan,"ft, reduced wingspan")
# print(reducedS,"ft^2, reduced Wing Area")
# print(reducedAR,"reduced AR" )
# print(reducedRootChord,"reduced Root Chord" )
# print(reducedTaper,"reduced Taper" )

#for SOME VERY WIERD REASON WE'LL GET INACCURATE DICT VALUES IF ANY OF THE FOLLOWING IS THE SAME WITH ANOTHER VALUE
sweepHalfChord = 4
sweepQuarterChord = 4.0
sweepLeadingEdge = 0
sweepTmax = 4.5

writeToValues(sweepHalfChord)
writeToValues(sweepQuarterChord)
writeToValues(sweepLeadingEdge)
writeToValues(sweepTmax)

class classOswaldEff:
    def straightWingOswaldEff(self):
        straightWingOswaldEff = 1.78 * (1 - 0.045 * rangeAR ** 0.68) - 0.64
        return straightWingOswaldEff

    def sweptWingOswaldEff(self):
        sweptWingOswaldEff = 4.61 * (1 - 0.045 * rangeAR ** 0.68) * (cos(sweepLeadingEdge / 57.3)) ** 0.15 - 3.1
        return sweptWingOswaldEff

    def brandtOswaldEff(self):
        brandtOswaldEff = 2 / (2 - rangeAR + sqrt(4 + (rangeAR ** 2) * (1 + (tan(sweepTmax / 57.3)) ** 2)))
        return brandtOswaldEff

    def douglasOswalfEff(self):
        r = 0.38 - (sweepLeadingEdge / 3000) + (sweepLeadingEdge ** 2 / 15000)
        u = 0.99
        t = fuselageWidth / wingSpan
        douglasOswalfEff = 1 / ((pi * rangeAR * r * cdMin) + ((1 + 0.03 * t - (2 * t ** 2)) * u))
        return douglasOswalfEff

        ## read Gudmundsson example 9-12 and compute USAF DATCOM method u lazy bastard


wing4 = classOswaldEff()
if taper == 1:
    oswaldEff = wing4.straightWingOswaldEff()
else:
    oswaldEff = (wing4.sweptWingOswaldEff() + wing4.brandtOswaldEff() + wing4.douglasOswalfEff()) / 3

writeToValues(oswaldEff)
