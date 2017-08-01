__author__ = 'Geoffrey Nyaga'

import sys
sys.path.append('../')
from API.db_API import write_to_db


# Range = float(input ('enter the value of range(in km)  ') )
# propEff = float(input ('enter the value of propeller efficiency(0.8-0.85)  ') )
# AR= float(input ('enter the value of aspect ratio (5-9)  ') )
# pax= int(input ('enter the number of passengers  ') )
# crew= int(input ('enter the number of pilots  '))

Range = 1200
propEff = 0.8
AR= 7.8
pax= 4
crew= 2

write_to_db('Range',Range)
write_to_db('propEff',propEff)
write_to_db('AR',AR)
write_to_db('pax',pax)
write_to_db('crew',crew)

ceiling = 15000
maxSpeed = 175
takeOffRun = 1200 #ft
stallSpeed = 61
rateOfClimb = 5 #m/s


write_to_db('ceiling',ceiling)
write_to_db('maxSpeed',maxSpeed)
write_to_db('takeOffRun',takeOffRun)
write_to_db('stallSpeed',stallSpeed)
write_to_db('rateOfClimb',rateOfClimb)

cruise_altitude = 1000
write_to_db('cruise_altitude',cruise_altitude)