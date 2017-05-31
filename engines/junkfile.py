import numpy as np
# import matplotlib.pyplot as plt
import sys
import os

# import PyQt4

# pyuic5 -x example.ui -o example.py


# dict = {'name':'Zara','Age': 7,'class':'first'}
# dict['Age']= 8

# dict['hair'] = "long"
# print(dict)
# a=(dict['Age'])
# print(a*2)

# mydict = {}
# from values import prerequisites
# AR = prerequisites['AR'] * 2
# print(prerequisites['AR'],"print test")
# test1 = 2.0
# test2 = 2

mydict = {} #'initialising" the an empty dictionary to be used locally in the function below
def writeToValues(name):
	# mydict = {}
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

# writeToValues(test1)
# writeToValues(test2)



# print(mydict,"this is my dict")
# x= 2
# y=20
# z=x+y
#
# def mul():
#         z = x+y
#         return z
#
# answer = mul()
# print(answer)
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
# print (Bob.name)
# print (Bob.health)
# Bob.eat('apple')
# print (Bob.health)
# Bob.eat('ham')
# print (Bob.health)
# print(z)
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
# print(emp_1.first)
# print(emp_1.last)
# print(emp_1.raise_amount)
# print(emp_1.fullname())
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
# print(d)
# plt.show()
#
#
# #finding the minimum value in array and its index
# #a = np.array([2,5,5,1])
# #b= np.argmin(a)
# #print (b)
# #c= a[b]
# #print(c)
#
# N = 9 # (number of segments - 1)
# S = 24.3919 # m^2
# AR = 7.8 # Aspect ratio
# taper = 0.45 # Taper ratio
# alpha_twist = -2 # Twist angle (deg)
# i_w = 1 # wing setting angle (deg)
# a_2d = 6.8754 # lift curve slope (1/rad)
# alpha_0 = -4.2 # zero-lift angle of attack (deg)
#
#
# b = np.sqrt(AR*S) # wing span (m)
# MAC = S/b # Mean Aerodynamic Chord (m)
# Croot = (1.5*(1+taper)*MAC)/(1+taper+taper**2) # root chord (m)
# theta = np.arange(np.pi/(2*N), np.pi/2, np.pi/(2*N))
# alpha = np.arange(i_w+alpha_twist,i_w ,-alpha_twist/(N-1))
#
#
# # segment’s angle of attack
# z = (b/2)*np.cos(theta)
# c = Croot * (1 - (1-taper)*np.cos(theta)) # Mean Aerodynamics
# #Chord at each segment (m)
# mu = c * a_2d / (4 * b)
# LHS = mu * (alpha-alpha_0)/57.3 # Left Hand Side
#
# N=9
# for i in np.arange(1,N):
#    # B =  theta*(i) * (1  / np.sin(theta*(i)))
#     for j in np.arange(1,N):
#         B = np.sin((2*j-1) * theta*(i)) * (1 + (mu*(i) * (2*j-1)) / np.sin(theta*(i)))
#
#         print(B)
#
# b = np.array([[1,2],[3,4]],np.int32)
# d = b.transpose()
#
#
# a= np.array([6,2,3,4])
# b=np.argmin(a)
# c=([1,2.3,4])
# d=c[b]
# print(b)
# print(d)
#
# def is_even(i):
#     print ("inside is even")
#     return i%2 == 0
# is_even(4)
#
#
#
# def func_a():
#     print ('inside func_a')
#
# def func_b(y):
#     print ('inside func_b')
#     return y
#
# def func_c(z):
#     print ('inside func_c')
#     return z
#
# print (func_a())
#
# print ('\n')
#
# print (5+func_b(2))
#
# print ('\n')
#
# print (func_c(func_a))
#
# def g(x):
#     def h():
#         x = "abc"
#     x = x+1
#     print("g: x = ", x)
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
# print (x)
# print (y)
# print("\n")
# x = 1
# y = 2
# temp = x
# x=y
# y=temp
# print (x)
# print (y)
# print("\n")
# x = 1
# y = 2
# (x,y)=(y,x)
# print (x)
# print (y)
# print("\n")