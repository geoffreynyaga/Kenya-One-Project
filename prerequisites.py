import sys
import os


Range = float(input ('enter the value of range(in km)  ') )
propEff = float(input ('enter the value of propeller efficiency(0.8-0.85)  ') )
AR= float(input ('enter the value of aspect ratio (5-9)  ') )
pax= int(input ('enter the number of passengers  ') )
crew= int(input ('enter the number of pilots  '))

# prerequisite = {} #

mydict = {} #'initialising" the an empty dictionary to be used locally in the function below
def writeToValues(name):
    fileName = os.path.splitext(os.path.basename(sys.argv[0]))[0]
    valuePrint=open("values.py","a")
    def namestr(obj,namespace):
        return[name for name in namespace if namespace[name] is obj]
    b = namestr(name, globals())
    c = "".join(str(x) for x in b)
    mydict[(c)] = name
    valuePrint.write(fileName)
    valuePrint.write("=")
    valuePrint.write(str(mydict))
    valuePrint.write("\n")
    valuePrint.close()
    return mydict


writeToValues(Range)
writeToValues(propEff)
writeToValues(AR)
writeToValues(pax)
writeToValues(crew)
