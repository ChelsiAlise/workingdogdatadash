#!/usr/bin/env python
# -*- coding: utf8 -*-
"""
this script allows adding new users with the api key
you can use this to bootstrap in your first administrative user

You will need ./../keys.go relative to this file to match the
the one used by the server.

./utils/upload_user.py
"""

from __future__ import print_function
import parse_data
import base64
import os
import sys
import json
import urllib
import urllib2
import hashlib
from getpass import getpass
import subprocess


# get keys.go
self_path = os.path.dirname(os.path.realpath(__file__))
keys_path = os.path.join(self_path, "..", "keys.go")
hash_path = os.path.join(self_path, "hash.go")

# get variables from keys.go
vars = {}
for line in open(keys_path):
    if line.startswith("var "):
        var_name = line[4:].split()[0]
        var_value = json.loads(line[line.index("=")+2:])
        vars[var_name] = var_value

print("please enter desired credentials for P.A.W.S.")
username = raw_input("username: ")
password = getpass("password: ")
if password != getpass("confirm password: "):
    print("Passwords did not match! please try again.")
    sys.exit(-1)
is_admin = raw_input("is this an administrator account? (y/n): ") == "y"
print("is_admin = %r"%is_admin)

raw_input("press enter to confirm.")



# compute hash
hash = subprocess.check_output(['go', 'run', hash_path, username, password, vars["salt1"], vars["salt2"]], stderr=subprocess.STDOUT)

# conver to correct format
user = {
    "username": username.encode('utf-8'),
    "password_hash": hash[:len(hash)-1],
    "is_admin": is_admin,
}
json_data = json.dumps([user])
print(json_data)

# upload
print("Uploading.")
req = urllib2.Request('https://working-dog-data-dash.appspot.com/api/users/upload')
req.add_header('Content-Type', 'application/json')
req.add_header('Upload-Key', vars["uploadKey"])
response = urllib2.urlopen(req, json_data)
print(response.info())
print(response.code)

print("Done.")
