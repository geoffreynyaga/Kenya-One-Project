
from wing import wing1,wing
import math
import numpy as np



## Lift and Moment Xristics of a 3D WING



wing.cruiseSpeed
wing.initialWeight
wing.finalWeight
wing.altitude
wing.S
#will need some funtion to slect the AR depending on aircraft type
wing.rangeAR()

fuselageWidth = 9


# In[8]:

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


# In[9]:

## import these stuff
rhoAlt = 0.001756
## also do something abot importing the independent variables loike averageWeight


# In[10]:

CLalfa = 5.4 #per rad


# In[11]:

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


# In[12]:

CLo = - alfazero * finalCLalfa/57.3
print(CLo)

Cma = (finalCLalfa/57.3)*(cma/(clalfa/57.3))
print(Cma)


# In[13]:

cruiseCL = CLo + (wing.initialWeight+wing.finalWeight)/(rhoAlt*wing.S*wing.cruiseSpeed**2) + ((finalCLalfa/57.3)*alfazero)
print (cruiseCL)


# In[14]:

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


# In[15]:

from wing import cdMin, taper

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


# In[ ]:




# In[ ]:




# In[ ]:




# In[ ]:



