#!/usr/bin/env python
from __future__ import print_function
import os, sys, csv, datetime, glob

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

    def __init__(self, name, dog_id = None, tattoo_number = None):
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

    def __repr__(self):
        return "<DogData name:%s dog_id:%s tattoo_number:%s days:%s awake:%s active:%s rest:%s>" % \
            (self.name, self.dog_id, self.tattoo_number, self.days,\
            self.awake_total, self.active_total, self.rest_total)

def parse_date_string(date_string):
    parts = date_string.split('-')
    return datetime.date(int(parts[0]), int(parts[1]), int(parts[2]))

# method to parse a "cci-puppy_minutes-*.csv" file
def parse_minutes_file(file_name, minutes_name, total_name, data):
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
                        if not (day in dog.days):
                            dog.days[day] = DogData.DayData(day)
                        setattr(dog.days[day], minutes_name, minutes)
            row_n += 1
    return data

def parse_dog_file(file_name, data):
    with open(file_name, 'rb') as csv_file:
        # parse earch row in the csv, skipping the header row
        reader = csv.reader(csv_file, delimiter=',')
        dog_id, tattoo_number, dog_name = None, None, None
        # skip first row
        reader.next()
        for row in reader:
            if len(row) != 8:
                print("Read bad Row! (length = %d)" % len(row))
                continue
            # id, tatoo #, name
            did, tn, dn = row[0], row[1], row[2]
            if tn and tn != "n/a":
                try:
                    tn = int(float(tn))
                except:
                    print("Could not parse tattoo number! (%s)", tn)
            # date
            date_string = row[3]
            # minutes
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
            try:
                date = parse_date_string(date_string)
            except:
                print("Failed to parse date! (date_string = %s)" % date_string)
                continue
            # check if we found a valid identification value that we had
            # not yet seen
            if dog_id == None and did != "n/a": dog_id = did
            if tattoo_number == None and tn != "n/a": tattoo_number = tn
            if dog_name == None and dn != "n/a": dog_name = dn
            if dog_name == None:
                print("Failed to find dog name!")
                continue
            # add the data
            if not dog_name in data:
                data[dog_name] = DogData(dog_name)
            dog_data = data[dog_name]
            dog_data.dog_id = dog_id
            dog_data.tattoo_number = tattoo_number
            day = DogData.DayData(date)
            day.active = active
            day.awake = awake
            day.rest = rest
            day.total = total
            dog_data.days[day] = day
            dog_data.active_total += active
            dog_data.awake_total += awake
            dog_data.rest_total += rest
            dog_data.total += total
    return data

# method to parse all "cci-puppy_minutes-*.csv" files
def parse_dog_data(data_dir, debug=True):
    """
    # this uses the aggregate files. for now we will use indiviudal instead
    awake_path = os.path.join(data_dir, "cci-puppy_minutes-awake.csv")
    active_path = os.path.join(data_dir, "cci-puppy_minutes-active.csv")
    rest_path = os.path.join(data_dir, "cci-puppy_minutes-rest.csv")
    total_path = os.path.join(data_dir, "cci-puppy_minutes-total.csv")
    data = {}
    parse_minutes_file(awake_path, "awake", "awake_total", data)
    parse_minutes_file(active_path, "active", "active_total", data)
    parse_minutes_file(rest_path, "rest", "rest_total", data)
    parse_minutes_file(total_path, "total", "total", data)
    """
    data = {}
    glob_path = os.path.join(data_dir, "[0-9]?[0-9]*_*.csv")
    files = glob.glob(glob_path)
    for f in files:
        if debug:
            print("Processing: %s"%f)
        data = parse_dog_file(f, data)
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
    # sort dogs by activity percentage
    by_activity = sorted((float(v.active_total)/v.total, float(v.awake_total)/v.total, v.total, v.name, v.dog_id) for v in dog_data.values())
    # print sorted by activity, most first
    print("active%\tawake%\ttotal\tname\tdog_id")
    print_bar()
    iterate_and_print(by_activity[::-1], 1)
