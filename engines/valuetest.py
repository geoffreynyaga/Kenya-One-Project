import sys
import os
import junkfile
# mydict = {} #'initialising" the an empty dictionary to be used locally in the function below
# def writeToValues(name):
#     fileName = os.path.splitext(os.path.basename(sys.argv[0]))[0]
#     valuePrint=open("values.py","a")
#     def namestr(obj,namespace):
#         return[name for name in namespace if namespace[name] is obj]
#     b = namestr(name, globals())
#     c = "".join(str(x) for x in b)
#     mydict[(c)] = name
#     valuePrint.write(fileName)
#     valuePrint.write("=")
#     valuePrint.write(str(mydict))
#     valuePrint.write("\n")
#     valuePrint.close()
#     return mydict
a = 2
b = 3

junkfile.writeToValues(a)
junkfile.writeToValues(b)
