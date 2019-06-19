
# coding: utf-8

__author__ = 'Geoffrey Nyaga'

import sys
sys.path.append('../')
from API.db_API import write_to_db, read_from_db

import numpy as np
from sklearn import tree
import pandas as pd 
import random

# In[5]:

def aircraft_type(number_of_aircraft,mydict):

	finaldp = []

	LSA = number_of_aircraft

	def dpLSA():
	    grossweight = random.randint(400,1430)
	    emptyweight = random.randint(200,880)
	    wingarea = random.randint(75,160)
	    wingspan = random.randint(17,35)
	    row = [grossweight,emptyweight,wingarea,wingspan,0]
	    return row

	for x in range(LSA):
	    temp = dpLSA()
	    finaldp.append(temp,)

	sailplanes = number_of_aircraft

	def dpSailplanes():
	    grossweight = random.randint(280,1700)
	    emptyweight = random.randint(100,1100)
	    wingarea = random.randint(120,150)
	    wingspan = random.randint(35,101)
	    row = [grossweight,emptyweight,wingarea,wingspan,1]
	    return row

	for x in range(sailplanes):
	    temp = dpSailplanes()
	    finaldp.append(temp,)

	GA = number_of_aircraft

	def dpGA():
	    grossweight = random.randint(1500,12500)
	    emptyweight = random.randint(800,3000)
	    wingarea = random.randint(150,400)
	    wingspan = random.randint(30,45)
	    row = [grossweight,emptyweight,wingarea,wingspan,2]
	    return row

	for x in range(GA):
	    temp = dpGA()
	    finaldp.append(temp,)

	# In[10]:
	mydata = finaldp

	# print(finaldp,"finaldp")
	df = pd.DataFrame(mydata, columns = ["grossweight","emptyweight","wingarea","wingspan","target"])
	#training data
	train_target = np.array(df.target)
	# print(train_target, "train_target")
	# print(train_target)
	c = np.array(finaldp)
	train_data = np.delete(c,[4], axis =1 )
	# print(train_data,"train_data")
	clf = tree.DecisionTreeClassifier()
	clf = clf.fit(train_data,train_target)
	prediction = clf.predict([mydict])
	# prediction = prediction[0]
	# print(prediction,"prediction")
	return prediction[0]




# def fin(iter):
# 	return_matrixx = []
# 	for x in range(iter):
# 		c = aircraft_type(number_of_aircraft,mydict)
# 		return_matrixx.append(c)
# 	return (np.bincount(return_matrixx).argmax())


# return_matrix1 = []
# for x in range(20):
# 	c = aircraft_type()
# 	return_matrix1.append(c)

# # print(return_matrix)
# print(np.bincount(return_matrix1).argmax())

# return_matrix2 = []
# for x in range(20):
# 	c = aircraft_type()
# 	return_matrix2.append(c)

# # print(return_matrix)
# print(np.bincount(return_matrix2).argmax())

# return_matrix3 = []
# for x in range(20):
# 	c = aircraft_type()
# 	return_matrix3.append(c)

# # print(return_matrix)
# print(np.bincount(return_matrix3).argmax())

# return_matrix4 = []
# for x in range(20):
# 	c = aircraft_type()
# 	return_matrix4.append(c)

# # print(return_matrix)
# print(np.bincount(return_matrix4).argmax())

# return_matrix5 = []
# for x in range(20):
# 	c = aircraft_type()
# 	return_matrix5.append(c)

# # print(return_matrix)
# print(np.bincount(return_matrix5).argmax())



