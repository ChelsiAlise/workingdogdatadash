#!/usr/bin/env python
# -*- coding: utf8 -*-
"""
    utils.parse_data
    ~~~~~~~~~~~~~~~~

    This module parses working dog activity data.
    See in particular, main(), parse_dog_data(), the DogData class, and the
    DogData.DayData class.
"""

from __future__ import print_function
from os import path # for path joining
import sys # for script arguments
import csv # for file parsing
import datetime # for dates
import glob # for finding files

# object to hold parsed data for a dog
class DogData(object):
    class DayData(object):
        def __init__(self, day):
            # day should be a datetime.date
            self.day = day
            # minutes of each type for the day
            self.awake = None
            self.active = None
            self.rest = None
            self.total = None

        def __repr__(self):
            return "<DogData.DayData day:%s awake:%s active:%s rest:%s>" % \
                (self.day, self.awake, self.active, self.rest)

    def __init__(self, name, dog_id=None, tattoo_number=None):
        self.name = name
        self.dog_id = dog_id
        self.tattoo_number = tattoo_number
        # map of datetime.date -> DayData(datetime.date)
        self.days = {}
        # total minutes of each type
        self.awake_total = 0
        self.active_total = 0
        self.rest_total = 0
        # total of all minutes
        self.total = 0
        # outcome data fields
        self.birth_date = None
        self.breed = None
        self.sex = None
        self.dog_status = None
        self.regional_center = None

    def __repr__(self):
        # NOTE! this no longer contains all fields
        return "<DogData name:%s dog_id:%s tattoo_number:%s days:%s awake:%s active:%s rest:%s>" % \
            (self.name, self.dog_id, self.tattoo_number, self.days,\
            self.awake_total, self.active_total, self.rest_total)

def parse_date_string(date_string):
    """parses a string in the format YYYY-MM-DD

    Args:
        date_string (str): the date string to parse

    Returns:
        the date (datetime.date)
    """
    parts = date_string.split('-')
    return datetime.date(int(parts[0]), int(parts[1]), int(parts[2]))

def compare_dog_names(n1, n2):
    """compares two dog names

    Args:
        n1 (str): the first name
        n2 (str): the second name

    Returns:
        true if the names are considered the same
    """
    return n1.lower() == n2.lower()


def parse_outcomes_file(file_name, data):
    """parses the outcomes data file (outcomes.csv)

    Args:
        file_name (string): the path of the file to process
        data (dict of str: DogData): dog name to DogData

    Returns:
        data (dict of str: DogData): dog name to DogData
    """
    with open(file_name, 'rb') as csv_file:
        # row number
        reader = csv.reader(csv_file, delimiter=',')
        # skip first row
        reader.next()
        # process remaining rows
        while True:
            # get next row
            try:
                row = reader.next()
            except StopIteration:
                break
            # get the name of this dog
            # note that this is sometimes in different format
            # (capitalized)
            name = row[0]
            # find the dog the name matches
            key = None
            for dog in data:
                if compare_dog_names(name, dog):
                    key = dog
                    break
            if key is None:
                print("Failed to match dog name! (%s)"%(name))
                continue
            # add the outcome data
            dog = data[key]
            dog.birth_date = row[1]
            dog.breed = row[2]
            dog.sex = row[3]
            dog.dog_status = row[4]
            dog.regional_center = row[5]
    return data

# method to parse a "cci-puppy_minutes-*.csv" file
def parse_minutes_file(file_name, minutes_name, total_name, data):
    """parses an aggregate dog data file

    Args:
        file_name (string): the path of the file to process
        minutes_name (string): the name of the minutes variable being updated
            in each DogData.DayData
        total_name (string): thea name of each total minutes variable being
            updated in each DogData
        data (dict of str: DogData): dog name to DogData

    Returns:
        data (dict of str: DogData): dog name to DogData
    """
    with open(file_name, 'rb') as csv_file:
        # row number
        row_n = 0
        # this tracks the order of the dogs by column 1..n
        dog_order = []
        # parse earch row in the csv
        reader = csv.reader(csv_file, delimiter=',')
        for row in reader:
            # the first 3 rows are not dates/minutes
            if row_n < 3:
                # first row is dog names
                if row[0] == "":
                    for name in row[1:]:
                        if not name in data:
                            data[name] = DogData(name)
                        dog_order.append(name)
                # second row is IDs
                elif row[0] == "dog_id":
                    for i in range(1, len(row)):
                        dog_id = row[i]
                        data[dog_order[i-1]].dog_id = int(float(dog_id))
                # third row is tattoo numbers
                elif row[0] == "tattoo_number":
                    for i in range(1, len(row)):
                        tattoo_number = row[i]
                        if tattoo_number != "n/a":
                            data[dog_order[i-1]].tattoo_number =\
                                int(float(tattoo_number))
            # remaining rows are dates with minutes
            else:
                day = parse_date_string(row[0])
                for i in range(1, len(row)):
                    raw = row[i]
                    if raw != "n/a":
                        minutes = int(float(raw))
                        dog = data[dog_order[i-1]]
                        curr_minutes = getattr(dog, total_name)
                        setattr(dog, total_name, curr_minutes + minutes)
                        if not day in dog.days:
                            dog.days[day] = DogData.DayData(day)
                        setattr(dog.days[day], minutes_name, minutes)
            row_n += 1
    return data

def normalize_dog_name(name):
    """removes adjacent spaces as seen in one of the dogs' data.
    Args:
        name (string): the name to normalize
    
    Returns:
        the normalized name (string)
    """
    return " ".join(name.split())

def parse_dog_file(file_name, data):
    """parses an individual dog data file ([0-9]+_*.csv)

    Args:
        file_name (string): the path of the file to process
        data (dict of str: DogData): dog name to DogData

    Returns:
        data (dict of str: DogData): dog name to DogData
    """
    with open(file_name, 'rb') as csv_file:
        # parse earch row in the csv, skipping the header row
        reader = csv.reader(csv_file, delimiter=',')
        # skip first row
        try:
            reader.next()
        except:
            print("File does not contain enough lines!")
            return data
        # get dog name/id etc, from second row.
        try:
            row = reader.next()
        except:
            print("File does not contain enough lines!")
            return data
        if len(row) != 8:
            print("Read bad first row! (length = %d, row = %s)" % \
                (len(row), str(row)))
            return data
        dog_id, tattoo_number, dog_name = None, None, row[2]
        dog_name = normalize_dog_name(dog_name)
        try:
            dog_id = int(float(row[0]))
        except:
            print("Could not parse dog id: %s", row[0])
        try:
            # we expect missing tattoo numbers as "n/a",
            # keep these as None
            if row[1] != "n/a":
                tattoo_number = int(float(row[1]))
        except:
            print("Could not parse tattoo number: %s", row[1])
        # add the dog to data
        if not dog_name in data:
            data[dog_name] = DogData(dog_name)
            dog_data = data[dog_name]
            dog_data.dog_id = dog_id
            dog_data.tattoo_number = tattoo_number
        else:
            dog_data = data[dog_name]
            # check that the identification matches
            if dog_data.dog_id != dog_id or\
                dog_data.tattoo_number != tattoo_number:
                print("Id or tattoo # does not match: (%s %s) vs (%s %s)" %\
                    (dog_data.dog_id, dog_data.tattoo_number,
                     dog_id, tattoo_number))
        # parse minutes in each row
        while True:
            if len(row) != 8:
                print("Read bad row! (length = %d)" % len(row))
                continue
            # check that the id, tatoo #, and name match
            did, tn, dn = row[0], row[1], normalize_dog_name(row[2])
            if tn and tn != "n/a":
                try:
                    tn = int(float(tn))
                except:
                    print("Could not parse tattoo number! (%s)", tn)
                if tn != tattoo_number:
                    print("Found different tattoo number: (orig: %d new: %d)" %\
                        (tattoo_number, tn))
            try:
                did = int(float(did))
                if did != dog_id:
                    print("Found different dog id: (orig: %d new: %d)" %\
                        (dog_id, did))
            except:
                print("Could not parse dog id: %s", did)
            if dn != dog_name:
                print("Found different dog name: (orig: %s new: %s)" %\
                    (dog_name, dn))
            # parse date
            try:
                date = parse_date_string(row[3])
            except:
                print("Failed to parse date! (date_string = %s)" % row[3])
                continue
            # parse minutes
            active_s, awake_s, rest_s, total_s = row[4], row[5], row[6], row[7]
            try:
                active = int(float(active_s))
                awake = int(float(awake_s))
                rest = int(float(rest_s))
                total = int(float(total_s))
            except:
                print("Failed to parse minutes: (active = %s, awake = %s, rest = %s, total = %s)" %\
                (active_s, awake_s, rest_s, total_s))
            if total != active + awake + rest:
                print("Read invalid total! (active = %d, awake = %d, rest = %d ,total = %d)" %\
                    (active, awake, rest, total))
                continue
            # add day
            day = DogData.DayData(date)
            day.active = active
            day.awake = awake
            day.rest = rest
            day.total = total
            dog_data.days[date] = day
            # update totals
            dog_data.active_total += active
            dog_data.awake_total += awake
            dog_data.rest_total += rest
            dog_data.total += total
            # get next row
            try:
                row = reader.next()
            except StopIteration:
                break
    return data

def parse_dog_data(data_dir=None, use_individual=True,
                   parse_outcomes=True, debug=False):
    """parses all dog data files in data_dir of type cci-puppy_minutes-*.csv

    Args:
        data_dir (string): the path to the Dailies directory, defaults to None
            in which case ./../../CCI Puppy Data/Dailies/ will be used.
        use_individual (bool): whether to use indivudual files or the aggregate
            files. Defaults to True.
        parse_outcomes (bool): if True, parses the outcomes file.
        debug (bool): whether to print additional debug information while
            processing. Defaults to False.

    Returns:
        data (dict of str: DogData): dog name to DogData
    """
    # this uses the aggregate files. we default to using individual
    # because these are not necessarily complete
    if not data_dir:
        self_path = path.dirname(path.realpath(__file__))
        data_dir = path.join(self_path, "..", "..", "CCI Puppy Data", "Dailies")
    data = {}
    if not use_individual:
        # make paths to aggregate files
        awake_path = path.join(data_dir, "cci-puppy_minutes-awake.csv")
        active_path = path.join(data_dir, "cci-puppy_minutes-active.csv")
        rest_path = path.join(data_dir, "cci-puppy_minutes-rest.csv")
        total_path = path.join(data_dir, "cci-puppy_minutes-total.csv")
        # parse files
        parse_minutes_file(awake_path, "awake", "awake_total", data)
        parse_minutes_file(active_path, "active", "active_total", data)
        parse_minutes_file(rest_path, "rest", "rest_total", data)
        parse_minutes_file(total_path, "total", "total", data)
    else:
        # find individual files with glob, individual files start with a dog
        # id number followed by an underscore and then the dog's name.
        glob_path = path.join(data_dir, "[0-9]?[0-9]*_*.csv")
        files = glob.glob(glob_path)
        # process each file
        for file_name in files:
            if debug:
                print("Processing: %s" % file_name)
            data = parse_dog_file(file_name, data)
    if parse_outcomes:
        outcomes_path = path.join(data_dir, "..", "outcomes.csv")
        parse_outcomes_file(outcomes_path, data)
    return data

def main():
    """example script, loads the dog data, computes some stats and prints them
    """
    # data print utility
    def _iterate_and_print(iterable, tabs=0):
        if tabs:
            tabs_str = "".join(['\t']*tabs)
            for val in iterable:
                print(tabs_str.join(str(valval) for valval in val))
        else:
            for val in iterable:
                print(val)
    # print utility, prints an 80 character long equals-sign bar
    def _print_bar():
        print("".join(['=']*80))
    # default to /this/script/dir/../../CCI Puppy Data/Dailies/
    self_path = path.dirname(path.realpath(__file__))
    data_dir = path.join(self_path, "..", "..", "CCI Puppy Data", "Dailies")
    # otherwise the last argument should be the data dir
    if len(sys.argv) > 1:
        data_dir = sys.argv[-1]
    # load the data from the files
    dog_data = parse_dog_data(data_dir)
    # sort dogs by activity percentage
    by_activity = sorted(
        (float(v.active_total)/v.total, float(v.awake_total)/v.total,
         v.total, v.name, v.dog_id)
        for v in dog_data.values()
    )
    # print sorted by activity, most first
    print("active%\tawake%\ttotal\tname\tdog_id")
    _print_bar()
    _iterate_and_print(by_activity[::-1], 1)

if __name__ == "__main__":
    main()
