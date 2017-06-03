
__author__ = 'Geoffrey Nyaga'


import sys
sys.path.append('../')

from API.db_API import write_to_db,read_from_db

# db = sqlite3.connect("dbse.db")
# cursor= db.cursor()
# cursor.execute("CREATE TABLE IF NOT EXISTS Myt (Var TEXT, Test REAL)")
# variable = 1
# var1 = 'Variable1'
# cursor.execute('INSERT INTO Myt VALUES (?,?)', (var1, variable,))
# db.commit()

# def writedb(x,y):
# 	db = sqlite3.connect("dbse.db")
# 	cursor= db.cursor()
# 	cursor.execute("CREATE TABLE IF NOT EXISTS Myt (Var TEXT, Test REAL)")
# 	cursor.execute('INSERT INTO Myt VALUES (?,?)', (x, y,))
# 	db.commit()

variable = 11
variable1 = 15
variable5 = 154444

write_to_db('variable',variable)
write_to_db('variable1',variable1)
write_to_db('variable5',variable5)

read_from_db('variable')
a = read_from_db('variable1')

print (a,"this is working, hopefully")