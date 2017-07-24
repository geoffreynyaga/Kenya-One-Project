
# coding: utf-8
__author__ = 'Geoffrey Nyaga'

import sys
sys.path.append('../')
from API.db_API import write_to_db, read_from_db


import numpy as np
import matplotlib.pyplot as plt
import sys
import os
import math



# fig = plt.figure()

# ax1 = fig.add_subplot(2,2,1)
# ax1.plot([1,2,3,4,5], [10,5,10,5,10], 'r-')

# ax2 = fig.add_subplot(222)
# ax2.plot([1,2,3,4], [1,4,9,16], 'k-')

# ax3 = fig.add_subplot(223)
# ax3.plot([1,2,3,4], [1,10,100,1000], 'b-')

# ax4 = fig.add_subplot(224)
# ax4.plot([1,2,3,4], [0,0,1,1], 'g-')


# # plt.tight_layout()
# plt.show()

m = 3

k = 5

empty = []
for x in range (1,k):
	mat = (m,m,x)
	empty.append(mat)
print(str(empty))

# for x in empty:
	# print (x)
#The x-axis is constant


	



import numpy as np
import matplotlib.pyplot as plt
myx = [  6.89668072, 6.79190465,  6.48075998e+00 ,  5.97270071, 5.28316394 , 4.43310092,  
         3.44834036,  2.35880373,  1.19759604e+00 ,  4.22299899e-16]
#the y axis for this example is 
finalyy =[np.array([ 0.        ,  0.19801812,  0.32703622,  0.39731833,  0.43205176,
                    0.44652588,  0.44920819,  0.44348252,  0.430474  ,  0.40601885]), 
            np.array([ 0.        ,  0.18017484,  0.30180713,  0.37321907,  0.41381173,
                      0.43625179,  0.44750785,  0.44986628,  0.44364735,  0.42256948]), 
            np.array([ 0.        ,  0.16233156,  0.27657803,  0.3491198 ,  0.3955717 ,
                      0.4259777 ,  0.44580751,  0.45625005,  0.4568207 ,  0.43912011]), 
            np.array([ 0.        ,  0.14448829,  0.25134894,  0.32502053,  0.37733167,
                      0.41570361,  0.44410717,  0.46263381,  0.46999405,  0.45567074]),
            np.array([ 0.        ,  0.12664501,  0.22611984,  0.30092126,  0.35909164,
                      0.40542952,  0.44240682,  0.46901757,  0.4831674 ,  0.47222137])]
last = np.array(finalyy).shape
finalval = last[0]
m = math.ceil(finalval/2) #used below to define number of subplots

fig, axes = plt.subplots(nrows=m, ncols=2)
for ax, row in zip(axes.flatten(), finalyy):
    ax.plot(myx,row,  'r-',label = ( "alpha_twist:",num1,"wing_incidence:",num2   ))

# turn remaining axes off
for i in range(len(finalyy),m**2):
    axes.flatten()[i].axis("off")

plt.tight_layout()
plt.show()


# def subplots():
#     nrows = 4
#     fig, axes = plt.subplots(nrows, 2)

#     for row in axes:
#       x = np.random.normal(0, 1, 100).cumsum()
#       y = np.random.normal(0, 0.5, 100).cumsum()
#       plot(row,x, y)

#     plt.show()

# def plot(axrow, x, y):
#     axrow[0].plot(x, color='red')
#     axrow[1].plot(y, color='green')

# subplots()

# plt.scatter(np.linspace(30, 200, 3), np.random.randn(3))
# import PyQt4

# pyuic5 -x example.ui -o example.py


# dict = {'name':'Zara','Age': 7,'class':'first'}
# dict['Age']= 8

# dict['hair'] = "long"
# print((dict)
# a=(dict['Age'])
# print((a*2)

# mydict = {}
# from values import prerequisites
# AR = prerequisites['AR'] * 2
# print((prerequisites['AR'],"print( test")
# test1 = 2.0
# test2 = 2

# mydict = {} #'initialising" the an empty dictionary to be used locally in the function below
# def writeToValues(name):
# 	# mydict = {}
#     fileName = os.path.splitext(os.path.basename(sys.argv[0]))[0]
#     valueprint(=open("values.py","a")
#     def namestr(obj,namespace):
#         return[name for name in namespace if namespace[name] is obj]
#     b = namestr(name, globals())
#     c = "".join(str(x) for x in b)
#     mydict[(c)] = name
#     valueprint(.write(fileName)
#     valueprint(.write("=")
#     valueprint(.write(str(mydict))
#     valueprint(.write("\n")
#     valueprint(.close()
#     return mydict

# writeToValues(test1)
# writeToValues(test2)



# print((mydict,"this is my dict")
# x= 2
# y=20
# z=x+y
#
# def mul():
#         z = x+y
#         return z
#
# answer = mul()
# print((answer)
#
# class Hero:
#
#     def __init__ (self,names):
#
#         self.name=names
#         self.health=100
#
#     def eat(self,food):
#         if (food == 'apple'):
#             self.health -= 100
#         elif (food=='ham'):
#             self.health += 20
#
# Bob = Hero('Bob')
# print( (Bob.name)
# print( (Bob.health)
# Bob.eat('apple')
# print( (Bob.health)
# Bob.eat('ham')
# print( (Bob.health)
# print((z)
#
# class Employee:
#     raise_amount = 1.05
#
#     def __init__ (self,first,last,pay):
#         self.first = first
#         self.last= last
#         self.pay = pay
#
#     def fullname(self):
#
#         return '{} {}'.format(self.first , self.last)
#
#     def apply_raise(self):
#         self.pay = int(self.pay*self.raise_amount)
#
#
# emp_1 = Employee('Geoffrey','Nyaga', 5000)
#
# print((emp_1.first)
# print((emp_1.last)
# print((emp_1.raise_amount)
# print((emp_1.fullname())
#
# x=np.arange(100)
# f=np.arange(100)
# g=(np.sin(x))*100
# idx = np.argwhere(np.diff(np.sign(f-g))!=0).reshape(-1)+0
# plt.axvline(x=6)
# plt.plot(x,g)
# plt.plot(x,f)
# plt.plot(x[idx], f[idx], 'ro')
# d = x[idx]
# print((d)
# plt.show()
#
#
# #finding the minimum value in array and its index
# #a = np.array([2,5,5,1])
# #b= np.argmin(a)
# #print( (b)
# #c= a[b]
# #print((c)
#
#
# a= np.array([6,2,3,4])
# b=np.argmin(a)
# c=([1,2.3,4])
# d=c[b]
# print((b)
# print((d)
#
# def is_even(i):
#     print( ("inside is even")
#     return i%2 == 0
# is_even(4)
#
#
#
# def func_a():
#     print( ('inside func_a')
#
# def func_b(y):
#     print( ('inside func_b')
#     return y
#
# def func_c(z):
#     print( ('inside func_c')
#     return z
#
# print( (func_a())
#
# print( ('\n')
#
# print( (5+func_b(2))
#
# print( ('\n')
#
# print( (func_c(func_a))
#
# def g(x):
#     def h():
#         x = "abc"
#     x = x+1
#     print(("g: x = ", x)
#     h()
#     return x
# x = 3
# z = g(x)
#
#
# x = 1
# y = 2
# x = y
# y = x
# print( (x)
# print( (y)
# print(("\n")
# x = 1
# y = 2
# temp = x
# x=y
# y=temp
# print( (x)
# print( (y)
# print(("\n")
# x = 1
# y = 2
# (x,y)=(y,x)
# print( (x)
# print( (y)
# print(("\n")

# x = [1,2,3,4,5]
# f = [2,4,6,8,10]
# g = [10,8,6,4,2]
# h = [(x[i], f[i]) for i,_ in enumerate(zip(f,g)) if f[i] == g[i]]

# print((h)



#
# intersections.py
#
# Python for finding line intersections
#   intended to be easily adaptable for line-segment intersections
#

# from scipy.optimize import fsolve
# import pylab
# import numpy

# def findIntersection(fun1,fun2,x0):
#  return fsolve(lambda x : fun1(x) - fun2(x),x0)

# result = findIntersection(numpy.sin,numpy.cos,0.0)
# x = numpy.linspace(-2,2,50)
# pylab.plot(x,numpy.sin(x),x,numpy.cos(x),result,numpy.sin(result),'ro')
# pylab.show()

# import numpy as np
# import matplotlib.pyplot as plt

# xs = np.linspace(-np.pi, np.pi, 30)
# ys = np.sin(xs)
# markers_on = [1, 17, 18, 19]
# plt.plot(xs, ys, '-gD', markevery=markers_on)
# plt.show()