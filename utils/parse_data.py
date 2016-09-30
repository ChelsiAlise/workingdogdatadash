#!/usr/bin/env python
from __future__ import print_function
import os, sys, csv, datetime

# object to hold parsed data for a dog
class DogData(object):
    class DayData(object):
        def __init__(self, day):
            self.day = day
            self.awake = None
            self.active = None
            self.rest = None

        def __repr__(self):
            return "<DogData.DayData day:%s awake:%s active:%s rest:%s>" % \
                (self.day, self.awake, self.active, self.rest)

    def __init__(self, name, dog_id = None, tattoo_number = None):
        self.name = name
        self.dog_id = dog_id
        self.tattoo_number = tattoo_number
        self.days = {}
        self.awake_total = 0
        self.active_total = 0
        self.rest_total = 0
        # TODO: these, plus the dates w/ minutes
        """
        self.days_total = None
        self.days_invalid = None
        self.days_zero = None
        """

    def __repr__(self):
        return "<DogData name:%s dog_id:%s tattoo_number:%s days:%s awake:%s active:%s rest:%s>" % \
            (self.name, self.dog_id, self.tattoo_number, self.days,\
            self.awake_total, self.active_total, self.rest_total)

# method to parse a "cci-puppy_minutes-*.csv" file
def parse_minutes_file(file_name, minutes_type, data):
    with open(file_name, 'rb') as csv_file:
        total_name = minutes_type+"_total"
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
                parts = row[0].split('-')
                day = datetime.date(int(parts[0]), int(parts[1]), int(parts[2]))
                for i in range(1, len(row)):
                    raw = row[i]
                    if raw != "n/a":
                        minutes = int(float(raw))
                        dog = data[dog_order[i-1]]
                        curr_minutes = getattr(dog, total_name)
                        setattr(dog, total_name, curr_minutes + minutes)
                        if not (day in dog.days):
                            dog.days[day] = DogData.DayData(day)
                        setattr(dog.days[day], minutes_type, minutes)
            row_n += 1
    return data

# method to parse all "cci-puppy_minutes-*.csv" files
def parse_dog_data(data_dir):
    awake_path = os.path.join(data_dir, "cci-puppy_minutes-awake.csv")
    active_path = os.path.join(data_dir, "cci-puppy_minutes-active.csv")
    rest_path = os.path.join(data_dir, "cci-puppy_minutes-rest.csv")
    data = {}
    parse_minutes_file(awake_path, "awake", data)
    parse_minutes_file(active_path, "active", data)
    parse_minutes_file(rest_path, "rest", data)
    return data

# data print utility
def iterate_and_print(iterable, tabs=0):
    if tabs:
        tabs_str = "".join(['\t']*tabs)
        for v in iterable:
            print(tabs_str.join(str(vv) for vv in v))
    else:
        for v in iterable:
            print(v)

# print utility, prints an 80 character long equals-sign bar
def print_bar():
    print("".join(['=']*80))

# script only code
if __name__ == "__main__":
    # default to /this/script/dir/../../CCI Puppy Data/Dailies/
    self_path = os.path.dirname(os.path.realpath(__file__))
    data_dir = os.path.join(self_path, "..","..","CCI Puppy Data","Dailies")
    # otherwise the last argument should be the data dir
    if len(sys.argv) > 1:
        data_dir = sys.argv[-1]
    # load the data from the files
    dog_data = parse_dog_data(data_dir)
    # sort dogs by activity
    by_activity = sorted((v.active_total, v.name, v.dog_id) for v in dog_data.values())
    # print sorted by activity, most first
    print("active\t\tname\t\tdog_id")
    print_bar()
    iterate_and_print(by_activity[::-1], 2)
