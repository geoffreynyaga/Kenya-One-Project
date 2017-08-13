# coding: utf-8
__author__ = 'Geoffrey Nyaga'

import sys
sys.path.append('../')
from API.db_API import write_to_db, read_from_db
from API.aircrafttypeAPI import aircraft_type

import numpy as np
from sklearn import tree
import pandas as pd 
import random

""" 
 this is my code

"""

aircraft_categories = ["LSA","Sailplanes","GA"]

mydict = [read_from_db('finalMTOW'),read_from_db('emptyWeight'),read_from_db('S')*10.76 ,read_from_db('wingSpan')]

number_of_aircraft = 5000

def fin():
	return_matrixx = []
	for x in range(21):
		c = aircraft_type(number_of_aircraft,mydict)
		return_matrixx.append(c)
	return (np.bincount(return_matrixx).argmax())

output_matrix = []

for iteration in range(9):
	print ('calculating step',iteration)
	iteration = fin()
	output_matrix.append(iteration)

# print(output_matrix,"pheeeew")
index = np.bincount(output_matrix).argmax()
# print(index,"my index")
aircraft_type = aircraft_categories[index]
print("the aircraft type is:",aircraft_type," and YEEEEH!!! I finally i made it!!!!!!")



