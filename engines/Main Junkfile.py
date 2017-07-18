import numpy as np
import matplotlib.pyplot as plt
import os
import sys

a = [1,2,3]
b = np.array((2,3,4))
print(np.hstack((a,b)))
# from values import mtow
# print(mtow*2)
#
#
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
# import math

# from sympy import *
# x = symbols('x')

# init_printing()


# (x+1)**2 - (x**2 + 2*x + 1**2)

# print(integrate(cos(x),x))
