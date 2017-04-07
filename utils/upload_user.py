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

import os
import sys
import json
import urllib2
import subprocess
from getpass import getpass


def main():
    """uploads a user to the backend using the upload key in ./../keys.go
    """
    # get keys.go
    self_path = os.path.dirname(os.path.realpath(__file__))
    keys_path = os.path.join(self_path, "..", "keys.go")
    hash_path = os.path.join(self_path, "hash.go")

    # get variables from keys.go
    key_vars = {}
    for line in open(keys_path):
        if line.startswith("var "):
            var_name = line[4:].split()[0]
            var_value = json.loads(line[line.index("=")+2:])
            key_vars[var_name] = var_value

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
    user_hash = subprocess.check_output(
        ['go', 'run', hash_path, username,
         password, key_vars["salt1"], key_vars["salt2"]],
        stderr=subprocess.STDOUT
    )

    # convert to correct format
    user = {
        "username": username.encode('utf-8'),
        "password_hash": user_hash[:len(user_hash)-1],
        "is_admin": is_admin,
    }
    json_data = json.dumps([user])

    # upload
    print("Uploading.")
    req = urllib2.Request('https://working-dog-data-dash.appspot.com/api/upload/users')
    req.add_header('Content-Type', 'application/json')
    req.add_header('Upload-Key', key_vars["uploadKey"])
    response = urllib2.urlopen(req, json_data)
    print(response.info())
    print(response.code)

    print("Done.")

if __name__ == "__main__":
    main()
