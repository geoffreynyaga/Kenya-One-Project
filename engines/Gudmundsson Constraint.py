import numpy as np
import matplotlib.pyplot as plt
import math


# In[ ]:




# In[2]:

grossWeight = 2000
cruiseAltitude = 8000 #ft
cruiseSpeed = 150
gForce = 2
V_ROC = 80
ROC = 1500
vLof = 70
groundRun = 900
serviceCeiling = 20000


# In[3]:

AR=9
cdMin=0.025
wsInitial = 10 #lb/f**2
wsfromsizing = 23
rhoSL = 0.002378
g = 32.174
CDto = 0.04
CLto = 0.5
groundFriction = 0.04
propEff = 0.8

def oswaldEff (AR):
    e= (1.78*(1-(0.045*AR**0.68)))-0.64
    return e

e = oswaldEff(AR)
print('Oswald Span Efficiency, e = ' +str(e))

k = 1/(math.pi * AR * e)
print ('lift induced drag, k = ' +str(k) )

#dynamic pressure at altitude

def rhoAlt(cruiseAltitude):
    rhoalt = rhoSL*(1-0.0000068756*cruiseAltitude)**4.2561
    return rhoalt
rhoCruise = rhoAlt(cruiseAltitude)
print ('air density at cruise altitude, rho = ' +str(rhoCruise))

qAltitude = 0.5*rhoCruise*(1.688*cruiseSpeed)**2
print('dynamic pressure at altitude = ' +str(qAltitude))

#Gag Ferrar Model
def gagFerrar(bhp):
    normBhp=bhp/(1.132*(rhoCruise/rhoSL)-0.132)
    return normBhp


# In[4]:

WS = np.arange(10,30)
print (WS)


# In[ ]:




# In[5]:

twTurn = qAltitude*( (cdMin/WS)+ k*(gForce/ qAltitude)**2 *(WS) )

qROC = 0.5*rhoSL*(V_ROC*1.688)**2
Vv = ROC/60
twROC = ( (Vv/(V_ROC*1.688)) + (qROC*cdMin/WS)+(k*WS/qROC))

qVlof = 0.5*rhoSL*(vLof*1.688/math.sqrt(2))**2
twVlof = ((vLof*1.688)**2/(2*g*groundRun))+(qVlof*CDto/WS)+(groundFriction*(1-(qVlof*CLto/WS)) ) 

rhoCeiling = rhoAlt(serviceCeiling)
print(rhoCeiling)
twCruise = qAltitude*cdMin*(1/WS) + (k)

twCeiling = (1.667/(np.sqrt((2*WS/rhoCeiling)*math.sqrt(k/3*cdMin))))+((k*cdMin/3)*4)


plt.plot(WS,twTurn)
plt.plot(WS,twROC)
plt.plot(WS,twVlof)
plt.plot(WS,twCruise)
plt.plot(WS,twCeiling)
plt.axvline(x=wsfromsizing)
plt.show()


# In[6]:

###NORMAlization
norm_twTurn = gagFerrar((grossWeight*twTurn*1.688*cruiseSpeed/(propEff*550)))
test=(grossWeight*twTurn*1.688*cruiseSpeed/(propEff*550))
norm_twROC = gagFerrar((grossWeight*twROC*1.688*V_ROC/(propEff*550)))
norm_twVlof = gagFerrar((grossWeight*twVlof*1.688*vLof/(propEff*550)))
norm_twCruise = gagFerrar((grossWeight*twCruise*1.688*cruiseSpeed/(propEff*550)))
norm_twCeiling = gagFerrar((grossWeight*twCeiling*1.688*cruiseSpeed/(propEff*550)))

plt.plot(WS,norm_twTurn)
plt.plot(WS,norm_twROC)
plt.plot(WS,norm_twVlof)
plt.plot(WS,norm_twCruise)
plt.plot(WS,norm_twCeiling)

         
plt.axvline(x=wsfromsizing)
plt.show()


# In[7]:

tw_Turn = qAltitude*( (cdMin/wsInitial)+ k*(gForce/ qAltitude)**2 *(wsInitial) )
print(tw_Turn)


# In[8]:

tw_ROC = ( (Vv/(V_ROC*1.688)) + (qROC*cdMin/wsInitial)+(k*wsInitial/qROC))
print(tw_ROC)


# In[9]:

tw_Vlof = ((vLof*1.688)**2/(2*g*groundRun))+(qVlof*CDto/wsInitial)+(groundFriction*(1-(qVlof*CLto/wsInitial)) )                       
print(tw_Vlof)


# In[10]:

tw_Cruise = qAltitude*cdMin*(1/wsInitial) + (k)
print(tw_Cruise)


# In[11]:

tw_Ceiling = (1.667/(math.sqrt((2*wsInitial/rhoCeiling)*math.sqrt(k/3*cdMin))))+(k*cdMin/3)*4
print(tw_Ceiling)


# In[12]:

##Selecting the T/W 
twList = ([tw_Ceiling,tw_Cruise,tw_Vlof,tw_ROC,tw_Turn])
maxTW = np.argmax(twList)
V=int(maxTW)
print(V)
finalTW=twList[V]
print(finalTW)


# In[13]:

#for first case
propThrust = grossWeight*finalTW
print(propThrust)
pBHP=propThrust*(cruiseSpeed*1.688)/(propEff*550)
print(pBHP)


# In[14]:

normBhp = gagFerrar(pBHP)
print(normBhp)


# In[ ]:




# In[ ]:




# In[ ]:



