import sqlite3
# conn = sqlite3.connect("database.db")
# c = conn.cursor()
# db = sqlite3.connect("dbse.db")
# cursor= db.cursor()
# cursor.execute("CREATE TABLE IF NOT EXISTS Myt (Var TEXT, Test REAL)")
# variable = 1
# var1 = 'Variable1'
# cursor.execute('INSERT INTO Myt VALUES (?,?)', (var1, variable,))
# db.commit()

def write_to_db(x,y):
	#try these
	path = '../database/database.db'
	conn = sqlite3.connect(path)
	# conn = sqlite3.connect("database.db")
	c = conn.cursor()
	c.execute("CREATE TABLE IF NOT EXISTS Variables (Variable TEXT, Value REAL)")
	# c.execute('INSERT INTO Variables VALUES (?,?)', (x, y,))
	# c.execute('INSERT OR REPLACE INTO Variables VALUES ((?,?) ' (x, y) )

	c.execute("SELECT * FROM Variables where Variable=?", ([(x)]))
	data = c.fetchall()
	if not data:
		# print ('not found')
		c.execute('INSERT INTO Variables VALUES (?,?)', (x, y,))

	else:
	    # print ('found')
	    c.execute(" UPDATE Variables SET Value=? WHERE Variable = ? ", (y,x))
		
	conn.commit()
	c.close()
	conn.close()

def read_from_db(x):
	conn = sqlite3.connect("../database/database.db")
	c = conn.cursor()
	# sql = "SELECT * FROM Variables WHERE Variable=?"
	# c.execute(sql, [(x)])
	c.execute("SELECT * FROM Variables WHERE Variable=?",([(x)]))
	for row in c.fetchall():
		return (row[1])

	conn.commit()
	c.close()
	conn.close()

""" How this should be used """
# variable = 1
# variable1 = 15
# writedb('variable',variable)
# writedb('variable1',variable1)
# read_from_db('variable1')