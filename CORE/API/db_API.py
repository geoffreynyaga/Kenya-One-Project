#!/usr/bin/env python3
# -*- coding:utf-8 -*-
##################################################################################
# File: c:\Projects\KENYA ONE PROJECT\CORE\API\db_API.py                         #
# Project: c:\Projects\KENYA ONE PROJECT\CORE\API                                #
# Created Date: Thursday, January 9th 2020, 8:56:55 pm                           #
# Author: Geoffrey Nyaga Kinyua ( <info@geoffreynyaga.com> )                     #
# -----                                                                          #
# Last Modified: Thursday January 9th 2020 8:56:55 pm                            #
# Modified By:  Geoffrey Nyaga Kinyua ( <info@geoffreynyaga.com> )               #
# -----                                                                          #
# MIT License                                                                    #
#                                                                                #
# Copyright (c) 2020 KENYA ONE PROJECT                                           #
#                                                                                #
# Permission is hereby granted, free of charge, to any person obtaining a copy of#
# this software and associated documentation files (the "Software"), to deal in  #
# the Software without restriction, including without limitation the rights to   #
# use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies  #
# of the Software, and to permit persons to whom the Software is furnished to do #
# so, subject to the following conditions:                                       #
#                                                                                #
# The above copyright notice and this permission notice shall be included in all #
# copies or substantial portions of the Software.                                #
#                                                                                #
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR     #
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,       #
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE    #
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER         #
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,  #
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE  #
# SOFTWARE.                                                                      #
# -----                                                                          #
# Copyright (c) 2020 KENYA ONE PROJECT                                           #
##################################################################################

import sqlite3

# conn = sqlite3.connect("database.db")
# c = conn.cursor()
# db = sqlite3.connect("dbse.db")
# cursor= db.cursor()
# cursor.execute("CREATE TABLE IF NOT EXISTS Myt (Var TEXT, Test REAL)")
# variable = 1
# var1 = 'Variable1'
# cursor.execute('INSERT INTO Myt VALUES (?,?)', (var1, variable,))
# db.commit()


def write_to_db(x, y):
    # try these
    path = "../database/database.db"
    conn = sqlite3.connect(path)
    # conn = sqlite3.connect("database.db")
    c = conn.cursor()
    c.execute("CREATE TABLE IF NOT EXISTS Variables (Variable TEXT, Value REAL)")
    # c.execute('INSERT INTO Variables VALUES (?,?)', (x, y,))
    # c.execute('INSERT OR REPLACE INTO Variables VALUES ((?,?) ' (x, y) )

    c.execute("SELECT * FROM Variables where Variable=?", ([(x)]))
    data = c.fetchall()
    if not data:
        # print ('not found')
        c.execute("INSERT INTO Variables VALUES (?,?)", (x, y))

    else:
        # print ('found')
        c.execute(" UPDATE Variables SET Value=? WHERE Variable = ? ", (y, x))

    conn.commit()
    c.close()
    conn.close()


def read_from_db(x):
    conn = sqlite3.connect("../database/database.db")
    c = conn.cursor()
    # sql = "SELECT * FROM Variables WHERE Variable=?"
    # c.execute(sql, [(x)])
    c.execute("SELECT * FROM Variables WHERE Variable=?", ([(x)]))
    for row in c.fetchall():
        return row[1]

    conn.commit()
    c.close()
    conn.close()


""" How this should be used """
# variable = 1
# variable1 = 15
# writedb('variable',variable)
# writedb('variable1',variable1)
# read_from_db('variable1')
