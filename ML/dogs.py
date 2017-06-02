import numpy as np
import matplotlib.pyplot as plt 
greyhounds = 500 #number of greyhounds dogs
labs = 500 #number of dogs

grey_height = 28 + 4 * np.random.randn(greyhounds)
lab_height = 24 + 4 * np.random.randn(labs)

plt.hist([grey_height,lab_height], stacked=True, color=['r','b'])
plt.show()

