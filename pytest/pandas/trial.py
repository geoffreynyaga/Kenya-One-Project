import pandas as pd
import datetime
import matplotlib.pyplot as plt
from matplotlib import style
style.use('ggplot')
import numpy as np

web_stats = {'Day':[1,2,3,4,5,6],
             'Visitors':[43,34,65,56,29,76],
             'Bounce_Rate':[65,67,78,65,45,52]}

df = pd.DataFrame(web_stats)

# print(df.head())
# print(df.tail())
# print(df.head(2))

# print(df.set_index('Day'))
# print(df.head())
# df.set_index('Day', inplace=True)
# print(df['Visitors'])
# print(df.Visitors)

# print(df[['Bounce_Rate','Visitors']])

print(df.Visitors.tolist())

df2 = pd.DataFrame(np.array(df[['Bounce_Rate','Visitors']]))
print(df2)