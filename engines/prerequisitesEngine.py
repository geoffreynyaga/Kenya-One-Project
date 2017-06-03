__author__ = 'Geoffrey Nyaga'

import sys
sys.path.append('../')
from API.db_API import write_to_db

# import os




# for some wierd reason using int for pax and crew number brings a problem when the two are equal
Range = float(input ('enter the value of range(in km)  ') )
propEff = float(input ('enter the value of propeller efficiency(0.8-0.85)  ') )
AR= float(input ('enter the value of aspect ratio (5-9)  ') )
pax= int(input ('enter the number of passengers  ') )
crew= int(input ('enter the number of pilots  '))


write_to_db('Range',Range)
write_to_db('propEff',propEff)
write_to_db('AR',AR)
write_to_db('pax',pax)
write_to_db('crew',crew)
