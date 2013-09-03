Pinboard archiver
================

This Python script and the related files will download your bookmarks from Pinboard and save them in an XML archive on your computer, which can be imported into another bookmarking site, or Pinboard if you have an account problem. The script is described in [this blog post](http://alexwlchan.net/blog/2013/03/pinboard-backups/).

The script can be run as frequently as you want; every time you run the script, a new backup is created. (However, it will only create one backup file per day unless you modify the script.)

The two files in the repository are:

* `archive-bookmarks.py`. This is the script that does the work. It can be stored anywhere, and should be run periodically (I run it weekly) with something like `cron` or `launchd`. On OS X, I use [Lingon](http://www.peterborgapps.com/lingon/) for this.
* `pinboard-credentials`. This should be renamed to `.pinboard-credentials` and saved in your home directory. The file should contain your username and API token. Go to the [Password settings](https://pinboard.in/settings/password/) on Pinboard, and copy and paste your API token verbatim into this file.

You don't *need* to keep the archive in Dropbox, but I find it a reasonably convenient place. The directory for the archive can be changed by editing line&nbsp;17 of `archive-bookmarks.py`.
