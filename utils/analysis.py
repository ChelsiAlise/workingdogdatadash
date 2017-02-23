#!/usr/bin/env python
# -*- coding: utf8 -*-
"""
    utils.analysis
    ~~~~~~~~~~~~~~~~

    This script performs some basic analysis on the dog data
    Note: this is depreciated in favor of the Outcome Analysis Ipython notebook
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

def kth_maximum(values, k):
    values = sorted(values)
    return values[-k]

def main():
    """this computes some simple statistics over the dog data
    """
    # load the data
    data = parse_data.parse_dog_data()
    data = parse_data.filter_data(data, deep_copy=False)
    # sort dogs into buckets by outcome
    by_outcome = defaultdict(list)
    for _, dog in data.iteritems():
        status = dog.dog_status
        if status == '':
            status = 'Unknown Status'
        by_outcome[status].append(dog)
    outcomes = sorted(by_outcome.keys())
    # we will store computed results for each outcome here
    outcome_results = {}
    # these are the percentages of active / total * 100, etc for each dog
    all_active_p = []
    all_awake_p = []
    all_rest_p = []
    print "="*80
    print "Averages & Outcomes By Outcome:"
    # look at dogs by their outcome and compute statistics.
    for outcome in outcomes:
        dogs = by_outcome[outcome]
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
            active = float(dog.active_total) / total * 100
            rest = float(dog.rest_total) / total * 100
            awake = float(dog.awake_total) / total * 100
            active_p.append(active)
            rest_p.append(rest)
            awake_p.append(awake)
        # average percentages within the outcome
        awake_avg = average(awake_p)
        rest_avg = average(rest_p)
        active_avg = average(active_p)
        # store and print the results formatted nicely
        values = {
            "awake": awake_avg,
            "rest": rest_avg,
            "active": active_avg,
            "awake s^2": variance(awake_p),
            "rest s^2": variance(rest_p),
            "active s^2": variance(active_p),
            "percents": [{
                "rest": rest_p[i],
                "awake": awake_p[i],
                "active": active_p[i],
            } for i in xrange(len(awake_p))],
        }
        print "   num dogs: %d" % (len(active_p))
        for key in ["awake", "rest", "active"]:
            value = values[key]
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
    # explore dogs by top percentage in field
    n_dogs = len(data)
    rest_threshold = kth_maximum(all_rest_p, int(n_dogs*.33))
    for outcome in outcomes:
        computed = outcome_results[outcome]
        count = 0
        for percents in computed["percents"]:
            if percents["rest"] >= rest_threshold:
                count += 1
        print "'%s' has %d dogs with rest %% >= %.5f" % (outcome, count, rest_threshold)
    print "-"*80
    active_threshold = kth_maximum(all_active_p, int(n_dogs*.33))
    for outcome in outcomes:
        computed = outcome_results[outcome]
        count = 0
        for percents in computed["percents"]:
            if percents["active"] >= active_threshold:
                count += 1
        print "'%s' has %d dogs with active %% >= %.5f" % (outcome, count, active_threshold)
    print "-"*80
    awake_threshold = kth_maximum(all_awake_p, int(n_dogs*.33))
    for outcome in outcomes:
        computed = outcome_results[outcome]
        count = 0
        for percents in computed["percents"]:
            if percents["awake"] >= awake_threshold:
                count += 1
        print "'%s' has %d dogs with awake %% >= %.5f" % (outcome, count, awake_threshold)


if __name__ == "__main__":
    main()
