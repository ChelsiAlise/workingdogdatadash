#!/usr/bin/env python
# -*- coding: utf8 -*-
"""
this script uploads the data to the import endpoint
use like:
./utils/upload_data.py <upload_key>
"""

from __future__ import print_function
import parse_data
import sys
import json
import urllib2

key = sys.argv[-1]

def data_to_json(data):
    """
    data_to_json converts data from parse_dog_data()
    to a json blob in the web api's format
    """
    dataBlob = {"dogs":[],"days":[]}
    # insert data
    days = {}
    for dog_name in data.keys():
        print(dog_name)
        dog = data[dog_name]
        # build map of {day:{dog:data}}
        for day in dog.days.keys():
            day_data = dog.days[day]
            # skip days with no data
            if day_data.total == 0: continue
            # convert to upload type
            upload_day = {
                "id": dog.dog_id,
                "total": day_data.total,
                "awake": day_data.awake,
                "rest": day_data.rest,
                "active": day_data.active
            }
            if not day in days:
                days[day] = {"date": str(day), "dogs": []}
            days[day]["dogs"].append(upload_day)
        # conver to uplaod type
        upload_dog = {
            "name": dog.name,
            "id": dog.dog_id,
            "tattoo_number": dog.tattoo_number,
            "total": dog.total,
            "awake": dog.awake_total,
            "active": dog.active_total,
            "rest": dog.rest_total,
            # outcome data:
            "birth_date": dog.birth_date,
            "breed": dog.breed,
            "sex": dog.sex,
            "dog_status": dog.dog_status,
            "regional_center": dog.regional_center,
        }
        dataBlob["dogs"].append(upload_dog)
    for day in days:
        dataBlob["days"].append(days[day])
    # convert to json
    return json.dumps(dataBlob)

# load data
print("Loading Data")
data = parse_data.parse_dog_data()

# convert to json
print("Converting Data")
json_data = data_to_json(data)

# upload
print("Uploading.")
req = urllib2.Request('https://working-dog-data-dash.appspot.com/api/data/upload')
req.add_header('Content-Type', 'application/json')
req.add_header('Upload-Key', key)
response = urllib2.urlopen(req, json_data)

print("Done.")
