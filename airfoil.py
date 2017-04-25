import math
import numpy as np
import sys
import os

from values import prerequisites,TESTING_MAIN,wing

## Lift and Moment Xristics of a 3D WING
cruiseSpeed = wing['cruiseSpeed']
initialWeight = TESTING_MAIN['initialWeight']
finalWeight = TESTING_MAIN['finalWeight']
altitude = wing['altitude']
S = TESTING_MAIN['S']*10.76
rangeAR = wing['rangeAR']  #will need some funtion to slect the AR depending on aircraft type
fuselageWidth = wing['fuselageWidth']
yMGC = wing['yMGC']
wingSpan = wing['wingSpan']
sweepHalfChord = wing['sweepHalfChord']
sweepQuarterChord=wing['sweepQuarterChord']


clalfa = wing['clalfa'] #per rad
clo = wing['clo']
clmax = wing['clmax'] #from airfoil
alfazero = wing['alfazero']  # How
cma = wing['cma']
clmaxRoot = wing['clmaxRoot']
clmaxTip = wing['clmaxTip']

## import these stuff
altitudeDensity= wing['altitudeDensity']
CLalfa = wing['CLalfa']

## 3D Lift Curve Slope
#for elliptical wing
Mach = cruiseSpeed /11164.27

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


class CLalfa:
    
    def ellipticalCLalfa(self):
        ellipticalCLalfa = clalfa/(1+(clalfa/(math.pi*rangeAR)))
        return ellipticalCLalfa 
    
    def hemboldCLalfa(self):
        hemboldCLalfa = (2*math.pi*rangeAR)/(2+math.sqrt(rangeAR**2 + 4 ))
        return hemboldCLalfa

    def polhamusCLalfa (self):
        beta = (1-Mach**2)**(0.5)
        k = clalfa/(2*math.pi)
        #remember to cremove 57.3 later
        polhamusCLalfa = (2*math.pi*rangeAR)/( 2 + math.sqrt(((rangeAR*beta)/k)**2 *(1+((math.tan(sweepHalfChord/57.3))**2/beta**2))+4))
        return polhamusCLalfa
    
wing3 = CLalfa()  
# make this shit work
#finalCLalfa = np.average(wing1.ellipticalCLalfa(),wing1.hemboldCLalfa(),wing1.polhamusCLalfa())
finalCLalfa = (wing3.ellipticalCLalfa()+wing3.hemboldCLalfa()+wing3.polhamusCLalfa()) /3
# print(wing3.ellipticalCLalfa())
# print(wing3.hemboldCLalfa())
# # print(wing3.polhamusCLalfa())
# print('average CLalfa')
# print(finalCLalfa,"final Clalfa")
writeToValues(finalCLalfa)


CLo = - alfazero * finalCLalfa/57.3
# print(CLo)
writeToValues(CLo)
Cma = (finalCLalfa/57.3)*(cma/(clalfa/57.3))
# print(Cma)
writeToValues(Cma)
cruiseCL = CLo +((initialWeight+finalWeight)/(altitudeDensity*S*cruiseSpeed**2)) + ((finalCLalfa/57.3)*alfazero)
print (cruiseCL,"cruiseCl")
writeToValues(cruiseCL)


class classCLmax:
    def rapidClmax(self):
        clmax = clmaxRoot + (yMGC/wingSpan)*(clmaxTip-clmaxRoot)
        # IVE SKIPPED THE  root and tip Re calculations to help reading the equivalent clmax on the NACA graphs
        CLmaxo = 0.9*clmax
        kA = math.cos(sweepQuarterChord/57.3)    
        rapidClmax = CLmaxo*kA
        return rapidClmax
    
        
wing2 = classCLmax()
finalCLmax = wing2.rapidClmax()
print(wing2.rapidClmax(),"rapidClmax")
writeToValues(finalCLmax)
