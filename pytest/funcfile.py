# a = 1
# b = 2

def addnums(a, b):
	added = a + b
	return added 


c = addnums(a,b)
print (c)

def sum ( arg1, arg2 ):
   # Add both the parameters and return them."
   total = arg1 + arg2
   print ("Inside the function : ", total)
   return total;

# Now you can call sum function
total = sum ( 10, 20 );
print ("outside the function : ", total)