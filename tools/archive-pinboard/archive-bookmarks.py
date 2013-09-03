#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
from datetime import datetime
import requests


def brutal_error_handler():
    """ Silly, simple error handling. Never do this. """
    print("Something went horribly wrong, so we're not continuing")
    sys.exit(1)


# Parameters.
bookmarkdir = os.path.join(os.environ['HOME'], 'vcdb/')
pinboard_api = 'https://api.pinboard.in/v1/'
yearfmt = '%Y'
datefmt = '%m-%d'
y = datetime.utcnow().strftime(yearfmt)
t = datetime.utcnow().strftime(datefmt)

backup = os.path.join(bookmarkdir + y, 'pinboard-backup_' + t + '.json')
if len(sys.argv) > 1:
    backup = os.path.abspath(sys.argv[1])


outdir = os.path.dirname(backup)

if not os.path.exists(outdir):
    try:
        os.makedirs(outdir)
    except OSError:
        print("Couldn't create a directory at %s" % outdir)
        brutal_error_handler()


"""
Get the user's authentication token
It's available at https://pinboard.in/settings/password
Store it in your home dir, in a file named .pinboard-credentials
"""
try:
    with open(
        os.path.join(
            os.environ['HOME'],
            '.pinboard-credentials')) as credentials:
                payload = {"auth_token": credentials.readline().strip(),
                           "format": "json"}
except IOError:
    print("Couldn't get your credentials from %s" % credentials.name)
    brutal_error_handler()

if not payload.get("auth_token"):
    raise Exception(
        "There was a problem with your pinboard credentials:\n\
They should be stored in the format 'pinboard_username:xxxxxxxxxxxxxxxxxxxx'")

# Get all the posts from Pinboard
req = requests.get(
    pinboard_api + 'posts/all',
    params=payload)
# raise an exception for a 4xx code
req.raise_for_status()
print("Authentication successful, trying to write backup.")

# write a new bookmarks file
try:
    with open(backup, 'w') as o:
        o.write(req.text.encode("utf-8"))
except IOError:
    print("Couldn't create new bookmarks file at %s" % outdir)
    brutal_error_handler()
print("Done! Backed up bookmarks to %s" % o.name)
