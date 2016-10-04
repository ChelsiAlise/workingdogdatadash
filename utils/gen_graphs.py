#!/usr/bin/env python
# -*- coding: utf8 -*-
"""
    utils.gen_graphs
    ~~~~~~~~~~~~~~~~

    This module generates graphs from the working dog data.
"""
#TODO (bentheelder): Document futher

from __future__ import print_function
import os
import importlib
import parse_data

def __fail(message):
    """private helper that prints a message and exits"""
    print(message)
    os.exit(-1)

def _try_import(module_name, package_name):
    """private helper that attempts to import a package,
        prints a debug message and exits when it encouters an exception."""
    try:
        return importlib.import_module(module_name, package_name)
    except:
        __fail("Could not import module: %s package: %s" %
            (module_name, package_name))

# try to import numpy and matplotlib
np = _try_import("numpy", None)
plt = _try_import("matplotlib.pyplot", None)

def main():
    self_path = os.path.dirname(os.path.realpath(__file__))
    save_dir = os.path.join(self_path, "..", "..")
    # load data
    data = parse_data.parse_dog_data()
    dogs = data.keys()
    n_dogs = len(dogs)
    # change plot font size
    plt.rcParams.update({'font.size': 14})
    # change plot dimensions (in inches)
    plt.rcParams['figure.figsize'] = 16, 9
    # Plot Active VS Rest
    # total minutes for each dog, normalized
    scale = np.array([float(data[dog].total) for dog in data])
    scale = scale/np.linalg.norm(scale) * 300
    # active percent and rest percent of total
    active = np.array([float(data[dog].active_total) / data[dog].total for dog in data])
    rest = np.array([float(data[dog].rest_total) / data[dog].total for dog in data])
    # scatter plot of active vs rest
    scatter = plt.scatter(active, rest, scale)
    # annotate each dog
    for dog, x, y in zip(dogs, active, rest):
        plt.annotate(dog, xy=(x,y), xytext=(2,2),
        textcoords = 'offset points', ha = 'left', va = 'bottom',
        bbox = dict(boxstyle = 'round,pad=0.25', fc = 'yellow', alpha = 0.4),
        arrowprops = dict(arrowstyle = '->', connectionstyle = 'arc3,rad=0'),
        size = 6)
    # label plot
    plt.xlabel("Active Minutes / Total Minutes")
    plt.ylabel("Rest minutes / Total Minutes")
    plt.title("Percent Minutes Active Vs. Percent Minutes Resting, Scaled by Total")
    # make axis limit tighter
    plt.axis([min(active)*.75, max(active)*1.05, min(rest)*.99, max(rest)*1.01])
    # save
    plt.savefig(os.path.join(save_dir, 'active_vs_rest.svg'), format='svg', dpi=1000)
    plt.savefig(os.path.join(save_dir, 'active_vs_rest.png'), format='png', dpi=300)
    # Plot Active
    plt.figure()
    range_dogs = range(n_dogs)
    sorted_dogs = sorted(dogs, key=lambda d: float(data[d].active_total) / data[d].total)[::-1]
    active_sorted = np.array([float(data[d].active_total) / data[d].total for d in sorted_dogs])
    plt.bar(range_dogs, active_sorted)
    plt.xticks(rotation=90)
    plt.xticks(range_dogs, sorted_dogs, fontsize=8)
    plt.ylabel("Active Minutes / Total Minutes")
    plt.title("Distribution of Active Minutes / Total Minutes")
    # save
    plt.savefig(os.path.join(save_dir, 'active_distribution.svg'), format='svg', dpi=1000)
    plt.savefig(os.path.join(save_dir, 'active_distribution.png'), format='png', dpi=300)
    # Plot Rest
    plt.figure()
    sorted_dogs = sorted(dogs, key=lambda d: float(data[d].rest_total) / data[d].total)[::-1]
    rest_sorted = np.array([float(data[d].rest_total) / data[d].total for d in sorted_dogs])
    plt.bar(range_dogs, rest_sorted, width=0.75)
    plt.xticks(rotation=90)
    plt.xticks(range_dogs, sorted_dogs, fontsize=8)
    plt.ylabel("Rest minutes / Total minutes")
    plt.title("Distribution of Rest Minutes / Total Minutes")
    # save
    plt.savefig(os.path.join(save_dir, 'rest_distribution.svg'), format='svg', dpi=1000)
    plt.savefig(os.path.join(save_dir, 'rest_distribution.png'), format='png', dpi=300)
    # display plots
    plt.show()

if __name__ == "__main__":
    main()