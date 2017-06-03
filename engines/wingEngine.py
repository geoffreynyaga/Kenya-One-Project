__author__ = 'Geoffrey Nyaga'

import sys
sys.path.append('../')
from API.db_API import write_to_db,read_from_db

from math import sqrt,cos,sin,pi,log,tan
import numpy as np
import matplotlib.pyplot as plt
# import os

import API.wingAPI as wapi 

S = read_from_db('S') *10.76 #sq ft
taper = read_from_db('taper')


#IMPORT SOME OF THE VALUES HERE
initialWeight = read_from_db('initialWeight')
finalWeight = read_from_db('finalWeight')
finalMTOW = read_from_db('finalMTOW')
altitude = read_from_db('altitude') #ft
rhoSL = read_from_db('rhoSL')


cbhp = 0.4586

propEff = read_from_db('propEff')
cruiseSpeed =read_from_db('maxSpeed')/1.2 #CALCULATE THIS, MAYBE USE MAXSPEED/1.2 THEN LATER OPTIMIZE IN PERFORMANCE
Range = read_from_db('Range')*3280.84#ft

cdMin = 0.02541   #CALCULATE THIS SOMEHOW CZ WE HAVE IMPORTED IT INTO THE VALUES FILES
endurance = 5.172 #hours

### check spelling from previous modules
ldMax = read_from_db('ldMax')
rhoSL = read_from_db('rhoSL')
altitudeDensity = read_from_db('altitudeDensity')



write_to_db('cdMin',cdMin)
write_to_db('cbhp',cbhp)
write_to_db('cruiseSpeed',cruiseSpeed)



wing = wapi.aspectRatio(initialWeight,finalWeight,cruiseSpeed,S,rhoSL,altitude,cbhp,propEff,Range,cdMin,endurance,ldMax)

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
ct= wing.ct()
rangeAR =  (wing.rangeAR())
enduranceAR=  (wing.enduranceAR())
unPoweredSailplaneAR = (wing.unPoweredSailplaneAR())
poweredSailplaneAR =(wing.poweredSailplaneAR())

write_to_db('altitudeDensity',altitudeDensity)
write_to_db('cruiseCL',cruiseCL)
write_to_db('ct',ct)
write_to_db('rangeAR',rangeAR)
write_to_db('enduranceAR',enduranceAR)
write_to_db('unPoweredSailplaneAR',unPoweredSailplaneAR)
write_to_db('poweredSailplaneAR',poweredSailplaneAR)

    
wing1 = wapi.wingDimensions(S,wing.rangeAR(),taper)



wingSpan =  (wing1.wingSpan())
averageChord =  (wing1.Cavg())
rootChord =  (wing1.rootChord())
tipChord =  (wing1.tipChord())
meanGeometricChord =  (wing1.meanGeometricChord())
chordAtY =  (wing1.chordAtY(10))   #CHANGE 10 LATER TO INPUT
# chordAtY =  (wing1.chordAtY(float(input('enter lateral distance for chordAtY:'))))

yMGC = (wing1.yMGC())
write_to_db('wingSpan',wingSpan)
write_to_db('averageChord',averageChord)
write_to_db('rootChord',rootChord)
write_to_db('tipChord',tipChord)
write_to_db('meanGeometricChord',meanGeometricChord)
write_to_db('chordAtY',chordAtY)
write_to_db('yMGC',yMGC)

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

write_to_db('AOA',AOA)
write_to_db('clalfa',clalfa)
write_to_db('clo',clo)
write_to_db('alfazero',alfazero)
write_to_db('cma',cma)
write_to_db('clmax',clmax)
write_to_db('clmaxRoot',clmaxRoot)
write_to_db('clmaxTip',clmaxTip)

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
write_to_db('reducedCDi',reducedCDi)

reducedOswaldEff = 1/(1+dFactor)
# print(reducedOswaldEff,"oswaldEff")
reducedOswaldEff = reducedOswaldEff[0]
write_to_db('reducedOswaldEff',reducedOswaldEff)


CLalfa = (cl/((AOA/57.296) - (alfazero/57.296)))
CLalfa = CLalfa[0]
# print (CLalfa , "per radian")
write_to_db('CLalfa',CLalfa)

reducedMaxSpeed = sqrt ((2*finalMTOW)/(rhoSL*S*cl))

write_to_db('reducedMaxSpeed',reducedMaxSpeed)
# print (vel,"ft/s")


#Accounting for the fuselage
fuselageWidth = 4.167 #ft
write_to_db('fuselageWidth',fuselageWidth)

reducedWingspan = wing1.wingSpan() - fuselageWidth
reducedS = S - (wing1.rootChord()*fuselageWidth)
reducedAR = (reducedWingspan**2)/reducedS
reducedRootChord= (wing1.rootChord()*(1-(fuselageWidth/wing1.wingSpan())) )+(wing1.tipChord()*(fuselageWidth/wing1.wingSpan()))
reducedTaper = (wing1.wingSpan()*wing1.rootChord())/(wing1.rootChord()*(wing1.wingSpan()-fuselageWidth)+(fuselageWidth*wing1.rootChord()))


# print ("CL of the reduced Wing")
reducedCL = ((2*finalMTOW)/(rhoSL*reducedMaxSpeed**2*reducedS)) #it actually increased. The name reducedCl is just for formality
write_to_db('reducedCL',reducedCL)

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

write_to_db('sweepHalfChord',sweepHalfChord)
write_to_db('sweepQuarterChord',sweepQuarterChord)
write_to_db('sweepLeadingEdge',sweepLeadingEdge)
write_to_db('sweepTmax',sweepTmax)


wing4 = wapi.classOswaldEff(rangeAR , sweepLeadingEdge, sweepTmax,fuselageWidth,wingSpan,cdMin)
if taper == 1:
    oswaldEff = wing4.straightWingOswaldEff()
else:
    oswaldEff = (wing4.sweptWingOswaldEff() + wing4.brandtOswaldEff() + wing4.douglasOswalfEff()) / 3

write_to_db('oswaldEff',oswaldEff)
