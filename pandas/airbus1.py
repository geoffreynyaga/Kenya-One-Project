import numpy as np
from sklearn import tree
import pandas as pd 

datatest= pd.DataFrame((pd.read_csv('Book1.csv',index_col = 0)))
data1 = datatest.airbus1.tolist()
data2 = datatest.airbus2.tolist()
data3 = datatest.airbus3.tolist()
data4 = datatest.airbus4.tolist()
# print(data1)
# print(data2)
# print(data3)
# print(data4)


features =  [data1, data2, data3]


labels = [ 0,1,2]

datarow = pd.read_csv("Book1.csv", index_col = 0 ,nrows=0)
# for i in datarow:
# 	a = np.array([i])
# 	a = np.append(a,[i])
# 	print(a.shape)
# 	# a = np.reshape(1,)
# 	print(a)
clf = tree.DecisionTreeClassifier()
clf = clf.fit(features,labels)

print(clf.predict([[2.0, 100.0, 170.0, 5.0, 80000.0, 70000.0, 55000.0, 57000.0, 18000.0, 20000.0, 900.0, 55000.0, 0.613, 0.272, 0.295, 0.953]
]))

