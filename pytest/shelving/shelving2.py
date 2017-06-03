import shelve

flights = {"1":"A", "2":"B", "3":"C"}
times = ["230pm", "320pm", "420pm"]

db = shelve.open('shelved', "n")

db['flights'] = flights
db['times'] = times

print (db.keys())

db.close()

f = open('shelved.dat', "r")
data = f.read()
print (data)
f.close()

# Retrieving Objects from a Shelve File

db = shelve.open("shelved", "r")

for k in db.keys():
    obj = db[k]
    print ("%s: %s" % (k, obj))

flightDB = db['flights']
flights = flightDB.keys()
cities = flightDB.values()
times = db['times']

# x = 0
# for flight in flights:
#     print(" %s  %s  %s" % (flight, cities[x], times[x]))
#     # print ("Flight %s leaves for %s at %s" % (flight, cities[x],  times[x]))
#     x+=1

db.close()


newtimes = ["110pm", "220pm", "300pm", "445pm"]

db = shelve.open("shelved", "w", writeback=1)

for k in db.keys():
    obj = db[k]
    print ("%s: %s" % (k, obj))

flights = db['flights']
times = db['times']

flights['1145'] = "Dallas"
flights['1709'] = "Orlando"

db['times'] = newtimes

db['oldtimes'] = times

db.sync()

for k in db.keys():
    obj = db[k]
    print ("%s: %s" % (k, obj))

db.close()
