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

# load data
data = parse_data.parse_dog_data()
# convert data to upload format
dataBlob = {"dogs":[],"days":[]}
# insert data
print("Converting Data")
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
    }
    dataBlob["dogs"].append(upload_dog)
for day in days:
    dataBlob["days"].append(days[day])
# convert to json
json_data = json.dumps(dataBlob)
req = urllib2.Request('https://working-dog-data-dash.appspot.com/api/data/upload')
req.add_header('Content-Type', 'application/json')
req.add_header('Upload-Key', key)
print("Uploading.")
response = urllib2.urlopen(req, json_data)
print("Done.")