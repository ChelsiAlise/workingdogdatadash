#!/usr/bin/env python
import os, sys, csv

# object to hold parsed data for a dog
class DogData(object):
    def __init__(self, name, dog_id = None, tattoo_number = None):
        self.name = name
        self.dog_id = dog_id
        self.tattoo_number = tattoo_number
        self.awake = 0
        self.active = 0
        self.rest = 0
        # TODO:
        """
        self.days_total = None
        self.days_invalid = None
        self.days_zero = None
        """

    def __repr__(self):
        return "<DogData name:%s dog_id:%s tattoo_number:%s awake:%s active:%s rest:%s>" % \
            (self.name, self.dog_id, self.tattoo_number, self.awake, self.active, self.rest)

# method to parse a "cci-puppy_minutes-*.csv" file
def parse_minutes_file(file_name, variable_name, data):
    with open(file_name, 'rb') as csv_file:
        reader = csv.reader(csv_file, delimiter=',')
        row_n = 0
        dog_order = []
        for row in reader:
            if row[0] == "":
                for name in row[1:]:
                    if not name in data:
                        data[name] = DogData(name)
                    dog_order.append(name)
            elif row[0] == "dog_id":
                for i in range(1, len(row)):
                    dog_id = row[i]
                    data[dog_order[i-1]].dog_id = int(float(dog_id))
            elif row[0] == "tattoo_number":
                for i in range(1, len(row)):
                    tattoo_number = row[i]
                    if tattoo_number != "n/a":
                        data[dog_order[i-1]].tattoo_number =\
                            int(float(tattoo_number))
            else:
                for i in range(1, len(row)):
                    raw = row[i]
                    if raw != "n/a":
                        minutes = int(float(raw))
                        dog = data[dog_order[i-1]]
                        curr_minutes = getattr(dog, variable_name)
                        setattr(dog, variable_name, curr_minutes + minutes)
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

def iterate_and_print(iterable, tabs=0):
    if tabs:
        tabs_str = "".join(['\t']*tabs)
        for v in iterable:
            print(tabs_str.join(str(vv) for vv in v))
    else:
        for v in iterable:
            print(v)

def print_bar():
    print("".join(['=']*80))

if __name__ == "__main__":
    self_path = os.path.dirname(os.path.realpath(__file__))
    data_dir = os.path.join(self_path, "..","..","CCI Puppy Data","Dailies")
    # last argument should be the data dir
    if len(sys.argv) > 1:
        data_dir = sys.argv[-1]
    dog_data = parse_dog_data(data_dir)
    # sort dogs by activity
    by_activity = sorted((v.active, v.name, v) for v in dog_data.values())
    print("active\t\tname\t\trepr(DogData)")
    print_bar()
    iterate_and_print(by_activity[::-1], 2)

