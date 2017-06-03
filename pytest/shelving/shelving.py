import shelve

def addCust(database):
    customer = {}

    print ('Add a new customer to the database')

    custNum = input('Enter a customer number: ')
    customer['firstName'] = input('Customer First Name: ')
    customer['lastName'] = input('Customer Last Name: ')
    customer['streetAdd'] = input('Customer Street Address: ')
    customer['city'] = input('Customer City: ')
    customer['state'] = input('Customer State: ')
    customer['zip'] = input('Customer Zip Code: ')

    database[custNum] = customer
    return

def main():
    database = shelve.open('customers.dat', writeback=True)

    addCust(database)

    lookForCust = 1

    while (lookForCust != '0'):
        lookForCust = input("Enter Customer Number(0 to Exit)")

        if lookForCust =='0':
            break
        else:
            try:
                for i in database[lookForCust]:
                    print (i, " ", database[lookForCust][i])
            except KeyError:
                print ("Customer not in database")
                break
            else:
                print ('\n')

    database.close()

if __name__ == '__main__':
    main()