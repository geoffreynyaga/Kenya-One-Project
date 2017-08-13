from sklearn.datasets import load_iris
import numpy as np
from sklearn import tree

iris = load_iris()
print(iris.feature_names)
print(iris.target_names)
print(iris.data ,"iris data")
print(iris.data[50])
print (iris.target[1])
print(iris.target)
# for i in range(len(iris.target)):
# 	print("example %d: label %s, features %s"%(i,iris.target[i],iris.data[i]))

test_idx = [0,50,100]

#training data
train_target = np.delete(iris.target, test_idx)
train_data = np.delete(iris.data, test_idx, axis=0)

#testing data
test_target = iris.target[test_idx]
test_data = iris.data[test_idx]

clf = tree.DecisionTreeClassifier()
clf = clf.fit(train_data,train_target)

print(train_data)

# print(test_target)
# print (clf.predict(test_data))

import pydotplus
from sklearn.externals.six import StringIO
from IPython.display import Image 
dot_data = StringIO()
tree.export_graphviz(clf,
        out_file=dot_data,
        feature_names=iris.feature_names,
        class_names=iris.target_names,
        filled=True, rounded=True,
        impurity=False)
graph = pydotplus.graph_from_dot_data(dot_data.getvalue())
Image(graph.create_png())  

graph.write_pdf("iris.pdf")


# print(test_data[0],test_target[0])
# print(iris.feature_names,iris.target_names)
