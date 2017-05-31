import sqlite3
import time
import datetime
import random
import os
import sys
conn = sqlite3.connect('tutorial.db')
c = conn.cursor() 

var1 = 3
var2 = 6
var3 = 4
dbname1 = str(os.path.splitext(os.path.basename(sys.argv[0]))[0])
print(dbname1)
def create_table():
    # import os
    # import sys
    dbname1 = str(os.path.splitext(os.path.basename(sys.argv[0]))[0])
    c.execute('CREATE TABLE IF NOT EXISTS dbname1(num1 TEXT,num2 REAL)')

def data_entry(name,var1):
#     c.execute("INSERT INTO wing (var1) VALUES (?")
#     conn.commit()
#     c.close()
#     conn.close()
    c.execute("INSERT INTO dbname1 VALUES (?, ?)", (name, var1))
    conn.commit()


def read_from_db():
	c.execute("SELECT * FROM dbname1 WHERE num1='var2'")
	# data = c.fetchall()
	# print(data)
	for row in c.fetchall():
		print(row)


create_table()
data_entry("var3",var3)
data_entry("var2",var2)

read_from_db()

c.close()
conn.close()