#!/usr/bin/env python
# -*- coding: utf8 -*-
"""
    utils.analysis
    ~~~~~~~~~~~~~~~~

    This script performs some basic analysis on the dog data
"""

import math
from collections import defaultdict
import parse_data

def average(values):
    """computes average of values"""
    return float(sum(values)) / len(values)

def variance(values):
    """computes s^2 of values"""
    avg = average(values)
    return float(sum(map(lambda x: (x-avg)**2, values))) / (len(values)-1)

def main():
    """this computes some simple statistics over the dog data
    """
    data = parse_data.parse_dog_data()
    by_outcome = defaultdict(list)
    for _, dog in data.iteritems():
        status = dog.dog_status
        by_outcome[status].append(dog)
    outcome_results = {}
    all_active_p = []
    all_awake_p = []
    all_rest_p = []
    for outcome, dogs in by_outcome.iteritems():
        print "="*80
        print "outcome = "+outcome
        awake_avg = rest_avg = active_avg = 0
        active_p = []
        awake_p = []
        rest_p = []
        for dog in dogs:
            total = dog.total
            active = float(dog.awake_total) / total * 100
            rest = float(dog.rest_total) / total * 100
            awake = float(dog.active_total) / total * 100
            active_p.append(active)
            rest_p.append(rest)
            awake_p.append(awake)
        awake_avg = average(active_p)
        rest_avg = average(rest_p)
        active_avg = average(awake_p)
        values = {
            "awake": "%.5f"%(awake_avg),
            "rest": "%.5f"%(rest_avg),
            "active": "%.5f"%(active_avg),
            "awake s^2": "%.5f"%(variance(awake_p)),
            "rest s^2": "%.5f"%(variance(rest_p)),
            "active s^2": "%.5f"%(variance(active_p)),
        }
        outcome_results[outcome] = values
        all_active_p.extend(active_p)
        all_rest_p.extend(rest_p)
        all_awake_p.extend(awake_p)
        print values
        print "="*80
    print "="*80
    print "Outcome variances:"
    active_var = variance([float(v["active"]) for v in outcome_results.itervalues()])
    awake_var = variance([float(v["awake"]) for v in outcome_results.itervalues()])
    rest_var = variance([float(v["awake"]) for v in outcome_results.itervalues()])
    print "active s^2: %f, s: %f"%(active_var, math.sqrt(active_var))
    print "awake s^2: %f, s: %f"%(awake_var, math.sqrt(awake_var))
    print "rest s^2: %f, s: %f"%(rest_var, math.sqrt(rest_var))
    print "="*80
    print "="*80
    print "all dogs averages"
    print "active %.5f"%(average(all_active_p))
    print "rest %.5f"%(average(all_rest_p))
    print "awake %.5f"%(average(all_awake_p))
    print "="*80
    print "="*80
    print "all dogs variances"
    all_active_var = variance(all_active_p)
    all_rest_var = variance(all_rest_p)
    all_awake_var = variance(all_awake_p)
    print "active s^2: %f, s: %f"%(all_active_var, math.sqrt(all_active_var))
    print "awake s^2: %f, s: %f"%(all_awake_var, math.sqrt(all_awake_var))
    print "rest s^2: %f, s: %f"%(all_rest_var, math.sqrt(all_rest_var))

if __name__ == "__main__":
    main()