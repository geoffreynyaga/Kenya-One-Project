import shelve

shelfFile = shelve.open ('some_file')
myList = [1,2,3]
shelfFile['list'] = myList
myList.append(4)
shelfFile.close()
