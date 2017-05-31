import sqlite3
from db_API import write_to_db
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

variable3 = 34
variable4 = 15
write_to_db('variable3',variable3)
write_to_db('variable4',variable4)