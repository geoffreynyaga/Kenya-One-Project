        # KENYA ONE PROJECT #
# Matlab code to solve for MTOW,other weights,design point plot,#
# Cl calculations and Vn diagram.#
        #-----------------------------------------------------------------#
				 # done by Geoffrey Nyaga Kinyua
        #-----------------------------------------------------------------#

import numpy as np
import matplotlib.pylab as plt


R = float(input ('enter the value of range(in km)  ') )
n = float(input ('enter the value of propeller efficiency(0.8-0.85)  ') )
AR= float(input ('enter the value of aspect ratio (5-9)  ') )
pax= int(input ('enter the number of passengers  ') )
crew= int(input ('enter the number of pilots  '))

Wc=float(crew)*200  #total crew weight
Wpl=(float(pax)*180)+(float(pax)*50) #total payload
print(Wc)
print(Wpl)


 # breguet range equation
a= -float(R)*2.52*3280.8399*10 **(-7)
oswaldeff=1.78*(1-0.045*AR **0.68)-0.64 # e is oswalds span efficiency factor 0.7-0.95 #
k=1/(np.pi*oswaldeff*AR) # k is the induced drag factor k=1/(pi*e*AR) #
cdo=0.025  #zerolift drag coefficient
ldmax1=2*np.sqrt(k*cdo)
ldmax=ldmax1 **(-1)
b=a/(n*ldmax)
cfraction=np.exp(b)  # this is w4/w3 #
d = 0.98*0.97*cfraction*0.99*0.997  # this will give W6/W1 #
e=1.05*(1-d)   # Wf/Wto = 1.05(1 - W6/W1) #
# f = A*(Wto **C)*Kvs    f is We/Wto  ......equation 1#
# f = d - (Wpl+Wc)/Wto  ......... ....................equation 2 #
print(e)


Wto = np.arange(3000,7000,10 )
#raymer empty weight constants
A= 1.51
C= -0.10
Kvs=1
f= A*(Wto**C)*Kvs
g= d-f
wto1= g/(Wpl+Wc)
wto_calculated = wto1 **(-1 )
smallest_difference = wto_calculated - Wto
h=abs(smallest_difference)
idx=np.argmin(h)
#print(idx)
j=(idx)
k1=Wto[j]
mtow=k1
Wf=mtow*e
We=mtow-(Wf+Wc+Wpl)
print(' The value of MTOW is ' + str(mtow) + ' lbs')
print(' The value of FUEL is ' + str(Wf)+' lbs')
print(' The value of MTOW is ' + str(We)+' lbs')





#finding the minimum value in array and its index
#a = np.array([2,5,5,1])
#b= np.argmin(a)
#print (b)
#c= a[b]
#print(c)


print( '  EMPTY WEIGHT BREAKDOWN                        ')
#initial percentage weights as given by Kundu[3]
wfus=0.085*mtow
wwing=0.09*mtow
whtail=0.02*mtow
wvtail=0.016*mtow
wnacelle=0.016*mtow
wundercarriage=0.05*mtow
wengine=0.185*mtow
wenginecontrol=0.02*mtow
wfuelsystem=0.015*mtow
woilsystem=0.003*mtow
wapu=0*mtow
wflightcontsys=0.015*mtow
whydpneu=0.0055*mtow
welectrical=0.025*mtow
winstrument=0.008*mtow
wavionics=0.02*mtow
wecs=0.004*mtow
woxyg=0*mtow
wfurnishings=0.04*mtow
wmiscelleneous=0.0015*mtow
wcontigency=0.01*mtow
print( '  A) FUSELAGE                         ' + str(wfus)  + '   lb')
print( '  B) WING                             ' + str(wwing)+ ' lb'  )
print( '   C) PROPULSION ')
print( '      a) engine dry weight ' + str(wengine)+ ' lb'  )
print( '      b) nacelle           ' + str(wnacelle) + '  lb')
print( '      c) engine control    ' + str(wenginecontrol) + '  lb')
print( '  D) UNDERCARRIAGE                    ' + str(wundercarriage) +'    lb'   )
print( '  E) TAIL                   '  )

print( '      a) horizontal tail      ' + str(whtail) + '   lb')
print( '      b) verticall tail      ' + str(wvtail) + '   lb')
print( '  F) SYSTEMS  ')
print( '      a) fuel system       ' + str(wfuelsystem) + '   lb')
print( '      b) oil system        ' + str(woilsystem) +'  lb')
print( '      c) a.p.u             ' + str(wapu) +'      lb')
print( '      d) flight contr. sys ' + str(wflightcontsys) + '   lb')
print( '      e) hyd & pneu sys    ' + str(whydpneu)+'  lb'  )
print( '      f) electrical system ' + str(welectrical)+ '  lb')
print( '      g) instruments       ' + str(winstrument)+'  lb'  )
print( '      h) avionics          ' + str(wavionics)+ '   lb'  )
print( '      i) ecs               ' + str(wecs) +'  lb')
print( '      j) oxygen system     ' + str(woxyg) +'      lb')
print( '  G) FURNISHINGS                      ' + str(wfurnishings)+' lb'  )
print( '  H) CONTIGENCY                       ' + str(wcontigency) +'  lb')
print( '  I)MISCELLLENEOUS                    ' + str(wmiscelleneous)+'  lb')
print( '                                      _________    ')

calcemptyw=wfus+wwing+whtail+wvtail+wnacelle+wundercarriage+wengine+wenginecontrol+wfuelsystem+woilsystem+wapu+wflightcontsys+whydpneu+welectrical+winstrument+wavionics+wecs+woxyg+wfurnishings+wmiscelleneous+wcontigency

error=((calcemptyw-We)/We)*100
print( '  TOTAL CALCULATED EMPTY WEIGHT        ' + str(calcemptyw)+'  lb' )
print( '                          ')
print( '  INITIAL ESTIMATED EMPTY WEIGHT       ' + str(We)+'  lb')

print( '  PERCENTAGE ERROR            ' + str(error),' %' )

print( '____________________________________________________ ')
print( '   NOW ENTER THE INITIAL PERFORMANCE DATA ESTIMATES  ')
print( ' ___________________________________________________ ')


h= float(input(' Ceiling (ft) ===>  ') )
vmaxe=float(input(' Vmax (knots) ===>  ') )
sto=float(input(' Take-Off Run (ft) ===>  ') )
vstall=float(input(' Stall speed (61knots max) ===>  ') )
roc_estimate= float(input(' rate of climb (m/s) ===>  ') )

print( '                          ')
print( 'A GRAPH OF POWER LOADING VS WING LOADING IS SHOWN HERE' )
print( '                          ')
print( '- - - - - - - - - - - - - - - - - - - - - - - - - - ' )
print( 'PLEASE READ THE GRAPH AND FILL IN THE VALUES BELOW')
print( '- - - - - - - - - - - - - - - - - - - - - - - - - - ' )
print( '                          ')


# WS = W/S WING LOADING lb/ft **2 #
# WP = W/P POWER LOADING lb/hp #

                   #Vmax calculations#

ws = np.arange(1,51)
np=0.7
do = 0.002378
vmax = vmaxe*1.688 # we have assumed it is 150 knots#
cdo=0.025  #cdo = 0.022 - 0.028#

# AR=7.5 AR is the aspect ratio 5-9 for GA aircraft #
# e=0.8 e is oswalds span efficiency factor 0.7-0.95 #

#k=1/(np.pi*oswaldeff*AR)
dalt=0.001756
rade = (1- (h*6.873*10 **(-6))) ** 4.26
d1 = 0.5*do*(vmax **3)*cdo
d4a=d1/ws
d2=(2 * k) /(dalt*rade*vmax)
nume=0.7*550
wpvmax =nume/(d4a+(d2*ws))
plt.plot(ws,wpvmax)
plt.show()

# TAKE-OFF RUN CALCULATION#
vto=1.1*vstall*1.688
ws=np.arange(1,51)
do=0.002378
cdo=0.025
U=0.04
CLC=0.4042
CLFLAP=0.8
CLTO=CLC+CLFLAP
CDOLG=0.009
CDOHLD=0.007
CDOTO=cdo+CDOLG+CDOHLD
CDTO=CDOTO+k*CLTO**2
CLR=1.8/1.1 **2
CDG=CDTO-U*CLTO
mf4=0.6*do*32.17*CDG*sto
mf2=ws/(mf4)
mf3=mf2**-1
mf=np.exp(mf3)
mf1=U+(CDG/CLR)
mf5=(1-mf)
mf6=mf1*mf
mff=(mf5)/(U-(mf6))
wptor= (mff*0.6*550)/(vto)

plt.plot( ws ,  wptor)

















