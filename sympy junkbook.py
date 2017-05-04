
# coding: utf-8

# In[5]:

import math
import sympy
from sympy import *


# In[6]:

x = 9.0
y= 8

print ("math module")
print(math.sqrt(x))
print(math.sqrt(y))

print ("\n")

print ("sympy module")
print(sympy.sqrt(x))
print(sympy.sqrt(y))


# In[7]:

x = symbols('x')

x+1

x,y,z = symbols('x y z')
print(x,y,z)


# In[8]:

Eq(x + 2, 4)


# In[9]:

simplify ( (x+1)**2 - (x**2 + 2*x + 1**2) )


# In[10]:

a = (x+1)**2 
b = (x**2 + 2*x + 1**2)
simplify(a-b)


# In[11]:

a.equals(b)


# In[12]:

init_printing()

print((x+1)**2 - (x**2 + 2*x + 1**2))


# In[13]:

integrate(cos(x),x)


# In[14]:

myexpr = Integral(exp(-x),(x,0,oo))
myexpr.doit()


# In[15]:

Integral(exp(-x),(x,0,oo))
# N(_)


# In[16]:

Integral(exp(-x),(x,0,oo)) +Derivative(x,x)+5


# In[17]:

expr = Integral(exp(-x),(x,0,oo)) +Derivative(x,x)+5
expr.doit()


# In[18]:

integrate(exp(-x),(x,0,oo))


# In[19]:

expr = Sum(1/(x**2 + 2*x),(x,1,10))
expr


# In[20]:

expr.doit()


# In[21]:


llt = ((4*13*3.28)/(2*3.28)) * Sum ((x*sin(40*x)),(x,1,10))
llt

print(llt.doit())

# # In[22]:




# # In[ ]:



