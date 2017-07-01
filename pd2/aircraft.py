__author__ = 'Geoffrey Nyaga'

import sys
sys.path.append('../')
from API.db_API import write_to_db, read_from_db

import numpy as np
from sklearn import tree
import pandas as pd 

datatest= pd.DataFrame((pd.read_csv('sizing.csv',index_col = 0)))
data1 = datatest.LSA.tolist()
data2 = datatest.LSA.tolist()
data3 = datatest.GA.tolist()
data4 = datatest.GA2.tolist()
data5 = datatest.sailplanes.tolist()
data6 = datatest.sailplanes2.tolist()
data7 = datatest.propliners.tolist()
data8 = datatest.propliners2.tolist()
data9 = datatest.bizjets.tolist()
data10 = datatest.bizjets2.tolist()
data11 = datatest.jetliners.tolist()
data12 = datatest.jetliners2.tolist()
# print(data1)
# print(data2)
# print(data3)
# print(data4)

features = [data1, data2, data3,data4,data5,data6,data7,data7,data8,data9,data10,data11,data12]

# print(features)
labels = [0,1,2,3,4,5,6,7,8,9,10,11,12]

datarow = pd.read_csv("sizing.csv", index_col = 0 ,nrows=0)
# for i in datarow:
# 	a = np.array([i])
# 	a = np.append(a,[i])
# 	print(a.shape)
# 	# a = np.reshape(1,)
# 	print(a)
clf = tree.DecisionTreeClassifier()
clf = clf.fit(features,labels)

wingSpan = read_from_db('wingSpan')
S = read_from_db('S')*10.764
AR = read_from_db('AR')
taper = read_from_db('taper')
htar = 5
httaper = 1
VTAR = 2
VTtaper = 1
emptyWeight = read_from_db('emptyWeight')
MTOW = read_from_db('finalMTOW')

mydict = ([MTOW,emptyWeight,wingSpan,S,AR,taper,htar,httaper,VTAR,VTtaper])
# print((wingSpan,S,AR,taper,htar,httaper,VTAR,VTtaper,emptyWeight,MTOW))
print(mydict,"this is mydict")
prediction = clf.predict([mydict])
prediction = prediction[0]
# print(prediction,"prediction")

a = list(datatest.columns.values)
# print(a)
print(a[prediction]," is the prediction")