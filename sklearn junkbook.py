
# coding: utf-8

# In[1]:

import matplotlib.pyplot as plt
from sklearn import datasets
from sklearn import svm


# In[2]:

digits = datasets.load_digits()
print (digits.data)
print (digits.target)
print (digits.images[0])


# In[3]:

clf = svm.SVC(gamma=0.0001, C=100)


# In[4]:

x,y = digits.data[:-10], digits.target[:-10]
print(len(digits.data))
print(len(digits.target))


# In[5]:

clf.fit(x,y)
print("Prediction:",clf.predict(digits.data[-1]))
plt.imshow(digits.images[-6], cmap=plt.cm.gray_r, interpolation = "nearest")
plt.show()


# In[ ]:




# In[ ]:




# In[ ]:



