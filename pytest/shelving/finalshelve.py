import shelve

database = shelve.open('filename')
object = 4
database['key'] = object

