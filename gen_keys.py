#!/usr/bin/env python
from __future__ import print_function
import random
from os import path
rng = random.SystemRandom()

print("generating keys.go")
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
while len(salt1) < salt1_length:
    salt1 += rng.choice(alphabet)
salt2 = ""
while len(salt2) < salt2_length:
    salt2 += rng.choice(alphabet)
self_path = path.dirname(path.realpath(__file__))
secrets_path = path.join(self_path, "keys.go")
# create keys.go
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