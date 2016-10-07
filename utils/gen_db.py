#!/usr/bin/env python
# -*- coding: utf8 -*-
"""
this script generates a local postgres data base with the data
run like:
DATABASE_URL=$(heroku config:get DATABASE_URL -a APP_NAME) ./utils/gen_db.py
"""

from __future__ import print_function
import os
import pwd
import psycopg2
import parse_data

# create postgres connection
dbname = "postgres"
# note this will not work on windows
user = pwd.getpwuid( os.getuid() )[ 0 ]
# get URL
db_url = os.environ.get("DATABASE_URL")
if not db_url:
    db_url = "dbname='%s' user='%s'" % (db_url, dbname, user)
# connect
con = psycopg2.connect(db_url)
# get cursor and print psotgres version
cur = con.cursor()
cur.execute('SELECT version()')
ver = cur.fetchone()
print(ver)
# load data
data = parse_data.parse_dog_data()
# table constants
dog_table_name = "dogs"
dog_table_scheme = "(dog_id integer PRIMARY KEY, name text, tattoo_number integer, awake_total integer, active_total integer, rest_total integer, total integer)"
day_table_name = "days"
day_table_scheme = "(record_id SERIAL PRIMARY KEY, day date, dog_id integer, awake integer, active integer, rest integer, total integer)"
# delete tables
if raw_input("Delete tables? (y/n) ") == "y":
    print("Deleting tables: %s"%(str([dog_table_name, day_table_name])))
    try:
        cur.execute("DROP TABLE %s, %s;" %(dog_table_name, day_table_name))
        con.commit()
    except:
        print("Failed to delete!")
        con.rollback()
print("Creating tables: %s"%(str([dog_table_name, day_table_name])))
# create dog data table
cur.execute('CREATE TABLE '+dog_table_name+" "+dog_table_scheme+";")
con.commit()
# create days data table
cur.execute('CREATE TABLE '+day_table_name+" "+day_table_scheme+";")
con.commit()
# insert data
print("Inserting data.")
days = {}
for dog_name in data.keys():
    print(dog_name)
    dog = data[dog_name]
    # build map of {day:{dog:data}}
    for day in dog.days.keys():
        day_data = dog.days[day]
        # skip days with no data
        if day_data.total == 0: continue
        if not day in days: days[day] = {}
        days[day][dog.dog_id] = day_data
    # insert dog data
    cur.execute("INSERT INTO "+dog_table_name+" (dog_id, name, tattoo_number, awake_total, active_total, rest_total, total) VALUES (%s, %s, %s, %s, %s, %s, %s);", (dog.dog_id, dog.name, dog.tattoo_number, dog.awake_total, dog.active_total, dog.rest_total, dog.total))
con.commit()
for day in sorted(days.keys()):
    print(day)
    dogs_data = days[day]
    for dog_id in dogs_data:
        dog = dogs_data[dog_id]
        cur.execute("INSERT INTO "+day_table_name+" (day, dog_id, awake, active, rest, total) VALUES (%s, %s, %s, %s, %s, %s);", (day, dog_id, dog.awake, dog.active, dog.rest, dog.total))
con.commit()
print("Done.")