# Utils

This directory contains the python and go scripts for importing data and managing the service.

In particular:
 - `gen_keys.py` is necessary for deploying the service
 - `upload_points.py` is used for importing the activity intensity minutes data
 - `upload_data.py` is used for importing the outcomes and dailies
 - `upload_user.py` is used for bootstrapping accounts using the deployment key created by `gen_keys.py`

The other files are either libraries imported by these or part of our offline analysis attempts.

Each of these scripts contains their own documentation.

