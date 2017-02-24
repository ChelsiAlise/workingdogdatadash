#!/usr/bin/env python
# -*- coding: utf8 -*-
"""
    utils.parse_points
    ~~~~~~~~~~~~~~~~

    This module parses working dog intensity points data.
    See in particular parse_points(), the DogData class, and the
    DogData.DayData class.
"""

from __future__ import print_function
from os import path # for path joining
import csv # for file parsing
import glob # for finding files
import time # for debugging performance

def parse_points(data_dir=None, debug=False):
    """parses the point intensity data

    Arguments:
        data_dir: if None then ../../CCI Puppy Data/point_entries/all_dogs
            is used to load the data, otherwise this should be the path to
            the all_dogs directory
        debug: if True, debug information will be printed

    Returns:
        dict[str (dog name)]: dict[int (timestamp)]: float (intensity)
    """
    start_time = time.time()
    if not data_dir:
        self_path = path.dirname(path.realpath(__file__))
        data_dir = path.join(self_path, "..", "..", "CCI Puppy Data",
                             "point_entries", "all_dogs")
    glob_path = path.join(data_dir, "points_[0-9][0-9]*.csv")
    files = glob.glob(glob_path)
    data = {"all_times": set()}
    for file_name in files:
        print(path.basename(file_name))
        data = parse_point_file(file_name, data, debug)
    data["all_times"] = list(data["all_times"])
    if debug:
        print("done after: %s s" % (time.time() - start_time))
    return data

def parse_point_file(file_name, data, debug=False):
    """parses a points_[0-9]+.csv file

    Arguments:
        file_name: the path of the file to parse
        data: the dict to add the processed data to
        debug: if True, debug information will be printed

    Returns:
        dict[dog_name]:OrderedDict[datetime.datetime]:float (intensity)
    """
    with open(file_name, 'rb') as csv_file:
        # parse earch row in the csv
        reader = csv.reader(csv_file, delimiter=',')
        try:
            row = reader.next()
        except:
            raise Exception("File does not contain enough lines!")
        if len(row) < 2 or row[0] != "timestamp":
            raise Exception("File does not match expected format!")
        # make sure names are in data
        names = []
        for name in row[1:]:
            name = " ".join(name.split("_"))
            if name not in data:
                data[name] = {}
            names.append(name)
        #row_len = len(row)
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
            timestamp = row[0][:-3]
            data["all_times"].add(timestamp)
            for i, value in enumerate(row[1:]):
                if value == "":
                    continue
                # no point in parsing all those zeros
                value = float(value) if value[0] != "0" else 0
                data[names[i]][timestamp] = value
            try:
                row = reader.next()
            except StopIteration:
                break
        return data

def write_data(data, file_name):
    # NOTE: this appears to work correctly but should not be used
    with open(file_name, 'wb') as csv_file:
        csv_writer = csv.writer(csv_file, delimiter=',')
        names = sorted([k for k in data.iterkeys() if k != "all_times"])
        print(names)
        csv_writer.writerow(["timestamp"]+names)
        times = sorted(data["all_times"])
        for timestamp in times:
            row = [timestamp]
            for name in names:
                value = data[name].get(timestamp, "")
                if value is None:
                    value = 0
                row.append(value)
            csv_writer.writerow(row)

def main():
    """example script, loads the dog data (used to time loading)
    """
    _ = parse_points(debug=True)
    print("done")

if __name__ == "__main__":
    main()
