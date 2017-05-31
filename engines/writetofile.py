import sys
import os

# mydict = {}
#
# def writeToValues(name):
#
#     fileName = os.path.splitext(os.path.basename(sys.argv[0]))[0]
#     valuePrint=open("values.py","w")
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

# from junkfile import writeToValues as wrt

# mytest = 70
# mytest2 = 7450

# wrt(mytest)
# wrt(mytest2)

foo = 2
bar = 2
# d = dict(((k, eval(k)) for k in ('foo','bar')))
# print(d)
def createDict(*args):
     return dict(((k, eval(k)) for k in args))

print(createDict('foo'))
# print(createDict.append('bar'))

# mydict = {'myage': 40, 'hisage':20}
# mydict2 = {'myage': 41, 'hisage':20}

# print(mydict == mydict2)



# file = open("valuetest.py","w")

# mydict2 = file.write(str('mydict')+" ="+str(mydict2))
# print (mydict2,"im here")
# del mydict2
# file.close()

# read = open("values.py","r" )
# read.read()
# text = read.read()
# # del writetofile{}
# print (text)


# dicts = {}
# for dicts in dicts:
#     if dicts == mydict:
#         del dicts
# read.close()



# read = open("valuetest.py","r" )

# text = read.read()
# dicts = {}
# for dicts in dicts:
#     if mydict == mydict:
#         del mydict
# read.close()