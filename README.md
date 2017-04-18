# Working Dog Data Dash

This is Team Pawsitive's / JDC162's Jr. Design Design project:
 "Working Dog Data Dash". 

This project implements a dashboard and custom graphing application for a
 private working dog dataset. It runs on Google 
 [App Engine](https://cloud.google.com/appengine/) using 
 [Cloud Datastore](https://cloud.google.com/datastore/).

## Existing Users / Clients

Please visit [https://working-dog-data-dash.appspot.com/](https://working-dog-data-dash.appspot.com/) to use the service.

## Deploying

To deploy this you will need:

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

Finally, you can go to the [Google Cloud Console](https://console.cloud.google.com/) and open your project, there should be a
 link to the running service here.


