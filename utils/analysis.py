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
    return float(sum((v-avg)**2 for v in values)) / (len(values)-1)

def main():
    """this computes some simple statistics over the dog data
    """
    # load the data
    data = parse_data.parse_dog_data()
    # sort dogs into buckets by outcome
    by_outcome = defaultdict(list)
    for _, dog in data.iteritems():
        status = dog.dog_status
        by_outcome[status].append(dog)
    # we will store computed results for each outcome here
    outcome_results = {}
    # these are the percentages of active / total * 100, etc for each dog
    all_active_p = []
    all_awake_p = []
    all_rest_p = []
    print "="*80
    print "Averages & Outcomes By Outcome:"
    # look at dogs by their outcome and compute statistics.
    for outcome, dogs in by_outcome.iteritems():
        print "-"*80
        print "outcome = '"+outcome+"'"
        awake_avg = rest_avg = active_avg = 0
        # these are like all_active_p but just within the outcome
        active_p = []
        awake_p = []
        rest_p = []
        # for each dog, compute the percent active, rest, awake
        for dog in dogs:
            total = dog.total
            active = float(dog.awake_total) / total * 100
            rest = float(dog.rest_total) / total * 100
            awake = float(dog.active_total) / total * 100
            active_p.append(active)
            rest_p.append(rest)
            awake_p.append(awake)
        # average percentages within the outcome
        awake_avg = average(active_p)
        rest_avg = average(rest_p)
        active_avg = average(awake_p)
        # store and print the results formatted nicely
        values = {
            "awake": awake_avg,
            "rest": rest_avg,
            "active": active_avg,
            "awake s^2": variance(awake_p),
            "rest s^2": variance(rest_p),
            "active s^2": variance(active_p),
        }
        for key, value in sorted(values.iteritems()):
            print "%12s %.5f" % (key+":", value)
        outcome_results[outcome] = values
        # store the percentages of all dogs together for later use
        all_active_p.extend(active_p)
        all_rest_p.extend(rest_p)
        all_awake_p.extend(awake_p)
    print "="*80
    # print the variances across the outcome types
    print "Outcome Variances:"
    print "-"*80
    active_var = variance([v["active"] for v in outcome_results.itervalues()])
    awake_var = variance([v["awake"] for v in outcome_results.itervalues()])
    rest_var = variance([v["awake"] for v in outcome_results.itervalues()])
    print "active s^2: %f, s: %f"%(active_var, math.sqrt(active_var))
    print " awake s^2: %f, s: %f"%(awake_var, math.sqrt(awake_var))
    print "  rest s^2: %f, s: %f"%(rest_var, math.sqrt(rest_var))
    print "="*80
    # print the averages and variances across all dogs
    print "All Dog Averages & Variances:"
    print "-"*80
    print "    active: %.5f" % (average(all_active_p))
    print "active s^2: %.5f" % (variance(all_active_p))
    print "     awake: %.5f" % (average(all_awake_p))
    print " awake s^2: %.5f" % (variance(all_awake_p))
    print "      rest: %.5f" % (average(all_rest_p))
    print "  rest s^2: %.5f" % (variance(all_rest_p))
    print "="*80


if __name__ == "__main__":
    main()
