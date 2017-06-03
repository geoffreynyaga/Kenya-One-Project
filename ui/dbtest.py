__author__ = 'Geoffrey Nyaga'

import sys
sys.path.append('../')

from API.db_API import write_to_db

a = 12

write_to_db('a',a)
