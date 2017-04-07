#!/usr/bin/env python
# -*- coding: utf8 -*-

"""gen_keys creates ./../keys.go (keys.go in the top level of the project)
containing the upload key and salts for the backend
"""

from __future__ import print_function

import random
from os import path

def main():
    """main creates ./../keys.go
    """
    print("generating keys.go")

    # for generating the keys / salts
    rng = random.SystemRandom()

    # generate 32 character random key
    key_length = 32
    salt1_length = salt2_length = 6
    alphabet = list('abcdefghijklmnopqrstuvwxyz'+\
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ'+\
        '0123456789')
    rng.shuffle(alphabet)
    pwd = ""
    while len(pwd) < key_length:
        pwd += rng.choice(alphabet)
    salt1 = ""

    # generate the salts
    while len(salt1) < salt1_length:
        salt1 += rng.choice(alphabet)
    salt2 = ""
    while len(salt2) < salt2_length:
        salt2 += rng.choice(alphabet)

    # create keys.go
    self_path = path.dirname(path.realpath(__file__))
    secrets_path = path.join(self_path, "..", "keys.go")
    with open(secrets_path, "w") as f:
        f.write("package main\n\n// AUTO GENERATED, DO NOT MODIFY!\n")
        f.write("// API KEYS! DO NOT CHECK IN TO GIT!\n\n")
        f.write("var uploadKey string = \"")
        f.write(pwd)
        f.write("\"\n")
        f.write("var salt1 string = \"")
        f.write(salt1)
        f.write("\"\n")
        f.write("var salt2 string = \"")
        f.write(salt2)
        f.write("\"\n")
    print("done.")

if __name__ == "__main__":
    main()
