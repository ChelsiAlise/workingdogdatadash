#!/usr/bin/env python
# -*- coding: utf8 -*-

"""
    utils.upload_points
    ~~~~~~~~~~~~~~~~

    This script parses working dog intensity points data for individual dog +
    collar id directories.

    use like:
    ./utils/upload_data.py

    This script will fetch the uploadKey from ./../keys.go
"""

from __future__ import print_function
import os # for path joining
import csv # for file parsing
import glob # for finding files
import json # we encode the data to json for uploading
import urllib2 # for uploading
import re # for extracting the date
import traceback
import sys

import parse_data

def parse_individual_points_file(file_name, debug=False):
    """parses a <name>_<date>_points.csv file

    Arguments:
        file_name: the path of the file to parse
        data: the dict to add the processed data to
        all_times: a set to add all of the valid timestamps too
        debug: if True, debug information will be printed

    Returns:
        dict[str (timestamp)]: float (intensity)
    """
    with open(file_name, 'rb') as csv_file:
        # parse earch row in the csv
        reader = csv.reader(csv_file, delimiter=',')
        data = {}
        try:
            row = reader.next()
        except:
            raise Exception("File does not contain enough lines!")
        if len(row) < 2 or row[0] != "timestamp":
            raise Exception("File does not match expected format!")
        # get first data line
        try:
            row = reader.next()
        except:
            raise Exception("File does not contain enough lines!")
        # process all lines
        while True:
            # NOTE: this validation is probably un-necessary and slows loading
            """
            if len(row) != row_len:
                raise Exception("Line does not have enough cells!")
            """
            # parse date (ignore :00 for seconds at the end)
            timestamp = row[0]
            value = row[1]
            # there are times without a value, we don't really need these
            if value == "":
                continue
            # there are a lot of zeros, we don't want to invoke parsing these
            value = float(value) if value[0] != "0" else 0
            data[timestamp] = value
            try:
                row = reader.next()
            except StopIteration:
                break
        return data


def upload_data(upload_key, data, dog_id, date):
    json_data = json.dumps(data)
    url = 'https://working-dog-data-dash.appspot.com/api/upload/points?dog_id=%s&date=%s'% (dog_id, date)
    req = urllib2.Request(url)
    req.add_header('Content-Type', 'application/json')
    req.add_header('Upload-Key', upload_key)
    response = urllib2.urlopen(req, json_data)


def main():
    # get path to data
    self_path = os.path.dirname(os.path.realpath(__file__))
    data_dir = os.path.join(self_path, "..", "..", "CCI Puppy Data", "point_entries")

    print("Loading data...")

    # get keys.go
    self_path = os.path.dirname(os.path.realpath(__file__))
    keys_path = os.path.join(self_path, "..", "keys.go")

    # get variables from keys.go
    key_vars = {}
    for line in open(keys_path):
        if line.startswith("var "):
            var_name = line[4:].split()[0]
            var_value = json.loads(line[line.index("=")+2:])
            key_vars[var_name] = var_value
    upload_key = key_vars["uploadKey"]

    # get dog data, we need this to match dogs to ids
    dog_data = parse_data.parse_dog_data()

    print("Data load complete. Please Select Which Dogs to Upload.")

    # find all points files
    files = next(os.walk(data_dir))[1]
    dog_folder_suffix = "_activity_details"
    date_re = re.compile(r".*_([\d]+)_.*\.csv", re.DOTALL)
    for name in files:
        # we only care about the individual data directories
        if not name.endswith(dog_folder_suffix):
            continue
        dir_name = os.path.join(data_dir, name)
        # parse out the dog's name
        print_name = name[:len(name)-len(dog_folder_suffix)]
        split_idx = print_name[::-1].index('_')
        if split_idx == -1:
            print("Invalid name! (%s)" % print_name)
            continue
        split_idx = len(print_name) - split_idx - 1
        dog_name = print_name[:split_idx].replace("_", " ")
        dog_name = parse_data.normalize_dog_name(dog_name)
        _id = print_name[split_idx+1:]
        # make sure the dog is in the original data set
        if dog_name not in dog_data:
            print("Could not find match for '%s' in dog data." % (dog_name))
            continue
        dog_id = dog_data[dog_name].dog_id
        _id_int = int(_id)
        if dog_id != _id_int:
            print("ID mismatch (%s, %d, %d)" % (print_name, dog_id, _id_int))
            continue
        if raw_input("Upload: '%s' ? (y/n): " % print_name) == "y":
            glob_path = os.path.join(dir_name, "*_points.csv")
            for file_name in glob.glob(glob_path):
                base_name = os.path.basename(file_name)
                date = date_re.search(base_name).group(1)
                date = date[:4]+"-"+date[4:6]+"-"+date[6:]
                data = parse_individual_points_file(file_name)
                should_upload = True
                while should_upload:
                    try:
                        print("Uploading: %s" % base_name)
                        upload_data(upload_key, data, dog_id, date)
                        should_upload = False
                    except:
                        print("Failed to upload, stacktrace: ")
                        traceback.print_exc(file=sys.stdout)
                        print("")
                        should_upload = raw_input("Try Again? (y/n): ") == "y"
                #return


if __name__ == "__main__":
    main()
