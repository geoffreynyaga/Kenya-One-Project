import numpy as np
import matplotlib.pylab as plt

a = np.arange(50)

ws = np.arange(10, 35, 0.5)
cdmin = 0.025
do = 0.002378
dalt = 0.001756
k = 0.049
v = 140 * 1.688  # cruise speed
qcruise = 0.5 * dalt * v ** 2  # dynamic pressure at cruise
qtakeoff = 0.5 * do * v ** 2  # dynamic pressure at take-off

turnangle = 40  # turn angle
loadfactor = 1 / (np.cos(turnangle))  # loadfactor
twturn = qcruise * ((cdmin / ws) + (k * (loadfactor / qcruise) ** 2) * ws) * (v * 5850 / (0.8 * 550 * 0.6604))

# rate of climb
roc = 1000  # rate of climb ft/min
# Vy=sqrt((2/do)*ws * sqrt( k/(3*cdmin) ))
Vy = 150
Vv = roc / 60
qclimb = 0.5 * do * (Vy ** 2)
twclimb = ((Vv / Vy) + ((qclimb / ws) * cdmin) + ((qclimb / ws) * cdmin) + ((k / qclimb) * ws)) * (
Vy * 5850 / (0.6 * 550))

# ground run
Sg = 1000  # ground run ft
Vlof = 70 * 1.688
clto = 1.4670
u = 0.04
cdto = 0.03
q1 = 0.5 * do * (Vlof / np.sqrt(2)) ** 2
twtakeoff = (((Vlof ** 2) / (2 * 32.174 * Sg)) + ((q1 * cdto) / ws) + u * (1 - (q1 * clto / ws))) * (
Vlof * 5850 / (0.6 * 550))

# cruise altitude
twcruise = (((qcruise * cdmin) / ws) + ((k / qcruise) * ws)) * (v * 5850 / (0.6 * 550 * 0.6604))

# service ceiling
twservceiling = ((1.668 / np.sqrt((2 * ws / dalt) * np.sqrt(k / (3 * cdmin)))) + (4 * np.sqrt(k * cdmin / 3))) * (
(v * 5850) / (0.7 * 550 * 0.6604))

plt.plot(ws, twclimb)
plt.plot(ws, twturn)
plt.plot(ws, twtakeoff)
plt.plot(ws, twservceiling)
plt.plot(ws, twcruise)
plt.axvline(x=22.69)
plt.show()

