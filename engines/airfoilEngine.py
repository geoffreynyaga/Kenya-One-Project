__author__ = 'Geoffrey Nyaga'

import sys
sys.path.append('../')
from API.db_API import write_to_db, read_from_db

import math
import numpy as np
# import os
import API.airfoilAPI as aa

# from values import prerequisites,TESTING_MAIN,wing

## Lift and Moment Xristics of a 3D WING
cruiseSpeed = read_from_db('cruiseSpeed')
initialWeight = read_from_db('initialWeight')
finalWeight = read_from_db('finalWeight')
altitude = read_from_db('altitude')
S = read_from_db('S')*10.76
rangeAR = read_from_db('rangeAR')  #will need some funtion to slect the AR depending on aircraft type
fuselageWidth = read_from_db('fuselageWidth')
yMGC = read_from_db('yMGC')
wingSpan = read_from_db('wingSpan')
sweepHalfChord = read_from_db('sweepHalfChord')
sweepQuarterChord=read_from_db('sweepQuarterChord')


clalfa = read_from_db('clalfa') #per rad
clo = read_from_db('clo')
clmax = read_from_db('clmax') #from airfoil
alfazero = read_from_db('alfazero')  # How
cma = read_from_db('cma')
clmaxRoot = read_from_db('clmaxRoot')
clmaxTip = read_from_db('clmaxTip')

## import these stuff
altitudeDensity= read_from_db('altitudeDensity')
CLalfa = read_from_db('CLalfa')

## 3D Lift Curve Slope
#for elliptical wing
Mach = cruiseSpeed /11164.27


 
wing3 = aa.CLalfa(clalfa,rangeAR,Mach,sweepHalfChord)  
# make this shit work
#finalCLalfa = np.average(wing1.ellipticalCLalfa(),wing1.hemboldCLalfa(),wing1.polhamusCLalfa())

finalCLalfa = (wing3.ellipticalCLalfa()+wing3.hemboldCLalfa()+wing3.polhamusCLalfa()) /3
# print(wing3.ellipticalCLalfa())
# print(wing3.hemboldCLalfa())
# # print(wing3.polhamusCLalfa())
# print('average CLalfa')
# print(finalCLalfa,"final Clalfa")
write_to_db('finalCLalfa',finalCLalfa)


CLo = - alfazero * finalCLalfa/57.3
# print(CLo)
write_to_db('CLo',CLo)
Cma = (finalCLalfa/57.3)*(cma/(clalfa/57.3))
# print(Cma)
write_to_db('Cma',Cma)

cruiseCL = CLo +((initialWeight+finalWeight)/(altitudeDensity*S*cruiseSpeed**2)) + ((finalCLalfa/57.3)*alfazero)
print (cruiseCL,"cruiseCl")

write_to_db('cruiseCL',cruiseCL)


   
        
wing2 = aa.classCLmax(clmaxRoot,yMGC,wingSpan,clmaxTip,sweepQuarterChord)
finalCLmax = wing2.rapidClmax()
print(wing2.rapidClmax(),"rapidClmax")
write_to_db('finalCLmax',finalCLmax)
