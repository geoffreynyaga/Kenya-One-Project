import pandas as pd 
import quandl
# mydata = quandl.get("ZILL/Z77006_3B")
# print(mydata)


df = pd.read_csv('ZILL-Z77006_3B.csv')
print(df.head())

df.set_index('Date', inplace = True)

df.to_csv('newcsv2.csv')

df = pd.read_csv('newcsv2.csv', index_col = 0)
print(df.head())

df.columns = ['Austin_HPI']
print(df.head())

df.to_csv('newcsv3.csv')
df.to_csv('newcsv4.csv', header = False)

df = pd.read_csv('newcsv4.csv', names = ['Date','Austin_HPI'], index_col = 0)
print(df.head())

df.rename(columns={'Austin_HPI':'Austin_HPI2'},inplace = True)
print(df.head())


