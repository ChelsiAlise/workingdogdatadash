# Working Dog Data Dash

This is Team Pawsitive's / JDC162's Jr. Design Design project:
 "Working Dog Data Dash". 

This project implements a dashboard and custom graphing application for a
 private working dog dataset. It runs on Google 
 [App Engine](https://cloud.google.com/appengine/) using 
 [Cloud Datastore](https://cloud.google.com/datastore/).

## Existing Users / Clients

Please visit [https://working-dog-data-dash.appspot.com/](https://working-dog-data-dash.appspot.com/) to use the service.

You can find new help content in the "help tab"

## Release Notes

The final release for spring 2017 is here.  

### New Features:
 - Improved graphs and graph types are now available
 - All graphs are in highcharts and exportable as PNG, JPEG, SVG, and PDF
 - Intensity data / Activity Minutes are supported by the server
 - Intensity data is Graphable (though it will take time to load all of it)
 - Filtering is toggleable in custom graphs
 - Custom graphs interface is simpler and clearer
 - Help tab contains usage guides in the application including annotated screenshots
 - Improved options for selecting dogs by type.
 - Improved number of datasets that are graphable
 - Raw data tables for dailies are available
 - Improved CSS should work reasonably well on iPads and most desktop browsers
 - Dashboard graphs include fitted trendlines
 - The backend and data parsing pipeline support the full data sets
 - The backend service serves content quicker and has apis for managing user accounts securely

### Bug Fixes:
 - All data is now loaded once, asynchronously.
  - The entire application was converted to a single page app to support this
 - Data is now cached by the app engine memcache AND the browser where appropriate
  - The cache is correctly and automatically flushed when new data is loaded into the service
 - The previously buggy custom graph interface has been replaced with one with no known bugs
 - Various CSS and javascript fixes to correct layout quirks when resizing

### Known Bugs and Defects
From our extended / stretch-goals the following features are missing:
 - IFTT is not supported
 - Proximity data is not supported
 - Administrative management is command line only
 - Statistical analysis in the web UI is limited to box-plots
  - for some of our offline analysis, see `utils/Outcome Analysis.ipynb`
 - More powerful graphs, saving graphs to the dashboard, and custom comparison graphs are not present.
 - Some of the dashboard graphs display tooltips on trendlines that contain unused fields carried over from actual data points. This may be tricky to fix but does not affect functionality.

## Deploying / Install Guide

To deploy the service yourself you will need:

- [Go](https://golang.org/) ([installation](https://golang.org/doc/install)) --
the server is implemented in Go.

- [Python 2.7](https://www.python.org/downloads/) -- this comes standard on most
POSIX systems and is used for most of the utilities. If you are on macOS or
Linux you likely have this installed by default.

- [Google Cloud SDK](https://cloud.google.com/sdk/) -- used to build and deploy
 to App Engine.

- [Google App Engine SDK for GO](https://cloud.google.com/appengine/docs/standard/go/download)
 -- used to build and deploy to App Engine.

- Ideally a bash shell, again if you are on macOS or Linux you likely have this
 already.

Steps: 

1) Install the tools above.

2) Open a shell. Run `gcloud init` to login to your Google Cloud account.

3) [Create a project on Google Cloud](https://cloud.google.com/appengine/docs/standard/go/quickstart).

4) [Clone this repository](https://help.github.com/articles/cloning-a-repository/).

5) Open a shell to the project and run `utils/gen_keys.py`
 to generate the secret keys.

6) From the same shell run `appcfg.py -A your-cloud-project-name-here ./`.

You can now import the data. 
Next to where you have cloned the project, create a folder "CCI Puppy Data".
This should contain a file "outcomes.csv" exported from the outcomes excel sheet, a "Dailies" folder with the Dailies files, and a "point_entries" directory with the point entries dataset.  

Once you have added these files, you can use `utils/upload_user.py` to bootstrap
an account from the machine you ran `utils/gen_keys.py` on. Using this account's credentials you can then use `utils/upload_data.py` to parse and upload the datasets to the service.

For more information on this, look at `utils/README.md`

Finally, you can go to the [Google Cloud Console](https://console.cloud.google.com/) and open your project, there should be a
 link to the running service here.


