#!/usr/bin/env python
"""
 AUTHOR: Gabriel Bassett
 DATE: <01-23-2015>
 DEPENDENCIES: <a list of modules requiring installation>
 Copyright 2015 Gabriel Bassett

 LICENSE:
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.

 DESCRIPTION:
 <A description of the software>

 NOTES:
 <No Notes>

 ISSUES:
 <No Issues>

 TODO:
 <No TODO>

"""
# PRE-USER SETUP
import logging

########### NOT USER EDITABLE ABOVE THIS POINT #################


# USER VARIABLES
NEODB = "http://192.168.121.134:7474/db/data"  # CHANGEME
CONFIG_FILE = "/tmp/verum.cfg"  # CHANGEME
LOGLEVEL = logging.DEBUG
LOG = None

########### NOT USER EDITABLE BELOW THIS POINT #################


## IMPORTS
import argparse
import configparser
import os
import json
from tqdm import tqdm
from pprint import pprint, pformat
from distutils.version import LooseVersion


## SETUP
__author__ = "Gabriel Bassett"


## GLOBAL EXECUTION


## FUNCTION DEFINITION
class Subsource():
    cfg = None

    def __init__(self, cfg):
        veris_logger.updateLogger(cfg)
        logging.debug("Initializing subsource correction object.")

        self.cfg = cfg

        if LooseVersion(cfg.get('version')) < LooseVersion("1.3.2"):
            raise ValueError("The veris/vcdb version must be at least 1.3.2 to include plus.subsource.")

        # TODO: Load GITHUB stuff

    def fix_subsource(incident):


        return incident

## MAIN LOOP EXECUTION
if __name__ == "__main__":
    ## Gabe
    ## The general Apprach to config parsing (Probably not the best way)
    ## 1. create a dictionary called 'cfg' of fallback values (up at the top of the file)
    ## 2. parse the arguments (args) and turn into a dictionary if the value is not None
    ## 3. Use the config from the command line parser to read the config file and update the 'cfg' dictionary
    ## 4. Update the cfg dictionary with the arguements (args) from the command line

    parser = argparse.ArgumentParser(description="This script takes a directory of VCDB VERIS json, parses the files, potentially " +
                                                 "updates the plus.subsource based on the VCDB tag and saves the fil.")
    parser.add_argument("-i", "--input", required=True, help="The json file or directory")
    parser.add_argument("-o", "--output", help="directory where json files will be written")
    parser.add_argument("-l","--log_level",choices=["critical","warning","info","debug"], help="Minimum logging level to display")
    parser.add_argument('--log_file', help='Location of log file')
    parser.add_argument("--version", help="The version of veris in use")
    parser.add_argument('--conf', help='The location of the config file', default="./_checkValidity.cfg")
    args = parser.parse_args()
    args = {k:v for k,v in vars(args).items() if v is not None}

    # Parse the config file
    try:
        config = configparser.ConfigParser()
        config.readfp(open(args["conf"]))
        cfg_key = {
            'GENERAL': ['input', 'output'], #'report', 'analysis', 'year', 'force_analyst', 'version', 'database', 'check'],
            'LOGGING': ['log_level', 'log_file'] #,
            # 'REPO': ['veris', 'dbir_private'],
            # 'VERIS': ['mergedfile', 'enumfile', 'schemafile', 'labelsfile', 'countryfile']
        }
        for section in cfg_key.keys():
            if config.has_section(section):
                for value in cfg_key[section]:
                    if value.lower() in config.options(section):
                        cfg[value] = config.get(section, value)
#        if "year" in cfg:
#            cfg["year"] = int(cfg["year"])
#        else:
#            cfg["year"] = int(datetime.now().year)
#        cfg["vcdb"] = {True:True, False:False, "false":False, "true":True}[cfg["vcdb"].lower()]
        logging.debug("config import succeeded.")
    except Exception as e:
        logging.warning("config import failed with error {0}.".format(e))
        #raise e
        pass

    cfg.update(args)

    logging.debug(args)

    logging.debug(cfg)

    logging.info('Beginning main loop.')

    # get all files in directory and sub-directories
    if os.path.isfile(cfg['input']):
        filenames = [cfg['input']]
    elif os.path.isdir(cfg['input']):
        # http://stackoverflow.com/questions/14798220/how-can-i-search-sub-folders-using-glob-glob-module-in-python
        filenames = [os.path.join(dirpath, f)
            for dirpath, dirnames, files in os.walk(cfg['input'])
            for f in files if f.endswith(".json")]
    else:
        raise OSError("File or directory {0} does not exist.".format(cfg['input']))

    subsource = Subsource(cfg)

    # open each json file
    if 'output' in cfg and cfg['output'] is not None:
        overwrite = False
    else:
        overwrite = True
    for filename in tqdm(filenames):
        with open(filename, 'r+') as filehandle:
            try:
                incident = json.load(filehandle)
            except:
                logging.warning("Unable to load {0}.".format(filename))
                continue
            logging.debug("Before parsing:\n" + pformat(incident))
            # fixsource
            incident = rules.makeValid(incident, cfg)
            logging.debug("After parsing:\n" + pformat(incident))
            # save it back out
            if overwrite:
                filehandle.seek(0)
                json.dump(incident, filehandle, sort_keys=True, indent=2, separators=(',', ': '))
                filehandle.truncate()
            else:
                with open(cfg['output'].rstrip("/") + "/" + filename.split("/")[-1], 'w') as outfilehandle:
                    json.dump(incident, outfilehandle, sort_keys=True, indent=2, separators=(',', ': '))


    logging.info('Ending main loop.')




##### VCDB ASSIGN #####
## HEADER ##

# TODO: Prioritize newer over older
# TODO: up to 5 news-worthy incidents (and record the ones not randomly chosen)
# TODO: Move Labels and Assignees to config file and use proper config file setup
# TODO: Set the assigner to automatically run in cron and notify me when it runs
# TODO: Filter out 'needs details'

## IMPORT ##

from github import Github
import json
import csv
import os
import sys
import random
from pprint import pprint



## Variables ##
#YEAR = None # create year. If set, only issues created in the listed years will elligable.
#YEAR = [2015]  # create year. If set, only issues created in the listed years will elligable.
# IDS = (5807,6934)  # 2015 IDs
IDS = (6567, 100000) # 2016 IDs, starting november 2015
TEAM_CASE_COUNT = 12 # Cases per assignee
HELP_CASE_COUNT = 7
ANTI_LABELS = ["Update", "schema", "Autocode-Test", "Autocode", "enhancement", "invalid", "Mining", "Needs Details", "question", "wontfix"]
LABELS = [ "Breach", "DOS", "Defacement", "Environmental", "Error", 
           "Hacking", "Malware", "Misuse", "Outage", "Physical", "Social" ] 
ASSIGNEES = {"swidup": TEAM_CASE_COUNT, 
             "spitler": TEAM_CASE_COUNT, 
             "dhylender": TEAM_CASE_COUNT#, 
#              "B-byrd": 10,
             "jasoncmiller79": 15 # out 3 weeks.  back Nov 12.
            } #, "gdbassett": TEAM_CASE_COUNT}
PRIORITIZED_LABELS = ["Priority", 
                      "Priority 2016", 
                      "PHIDBR2016", 
                      "Priority 2017", 
                      "PHIDBR2017", 
                      "PHIDBR2018", 
                      "Priority 2018", 
                      "PHIDBR2019"
                      ]
RANDOM_ASSIGNMENT_LABEL = "random_assignment"
MAX_PRIORITY = .8  # The maximum amount of prioritized incidents to include
PRIORITY_LOG_FILE = "/Users/v685573/Documents/Development/vcdbassign/priority.log"
CONFIG_FILE = "/Users/v685573/Documents/Development/vcdbassign/vcdbassign.conf"

## Setup ##
# random_case_count = (1-MAX_PRIORITY) * CASE_COUNT
random_case_count = {who: int((1-MAX_PRIORITY) * cnt) for who, cnt in ASSIGNEES.iteritems()}
# priority_case_count = MAX_PRIORITY * CASE_COUNT
priority_case_count = {who: int(MAX_PRIORITY * cnt) for who, cnt in ASSIGNEES.iteritems()}
# random.shuffle(ASSIGNEES)  # Will randomize assignees which also randomizes who gets priority incidents

## EXECUTION ##

# randomly assign VCDB github issues to folks
with open(os.path.expanduser(CONFIG_FILE)) as cred_file:
  gh_creds = json.load(cred_file)
  gh = Github(gh_creds["user"], gh_creds["password"], per_page=100)

# get all open issues, sorted

repo = gh.get_user("vz-risk").get_repo("VCDB")
issues = repo.get_issues(state="open", sort="created", direction="desc", assignee="none")

total_issues = []
total_priority_issues = []

# gh API takes a bit so inform
print("Getting issues...")

for issue in issues:
    
  if issue.labels:
        
    if any(label.name in LABELS for label in issue.labels) and (not issue.assignee) and not any(label.name in ANTI_LABELS for label in issue.labels):
#      if YEAR is None or issue.created_at.year in YEAR:
      if IDS is None or (issue.number >= IDS[0] and issue.number <= IDS[1]):
        total_issues.append(issue)
    if any(label.name in PRIORITIZED_LABELS for label in issue.labels) and (not issue.assignee) and not any(label.name in ANTI_LABELS for label in issue.labels):
      total_priority_issues.append(issue)

# update this for new team members or - better yet - read a file from somewhere

# gh API takes a bit so inform
print("Assigning issues...")


try:
  # priority_to_be_assigned = random.sample(total_priority_issues, int(len(ASSIGNEES) * priority_case_count))
  priority_to_be_assigned = random.sample(total_priority_issues, int(sum(priority_case_count.values())))
except ValueError:
  priority_to_be_assigned = random.sample(total_priority_issues, len(total_priority_issues))
# to_be_assigned = random.sample(total_issues, len(ASSIGNEES) * CASE_COUNT - len(priority_to_be_assigned))
to_be_assigned = random.sample(total_issues, sum(ASSIGNEES.values()) - len(priority_to_be_assigned))

print "Length of priority incidents is {0}".format(len(priority_to_be_assigned))
print "Length of incidents is {0}".format(len(to_be_assigned))

priority_assigned = []
# Assign
i = 0
k = 0
for who in ASSIGNEES.keys():
  print("- assigning %d cases to [%s]..." % (ASSIGNEES[who], who))
  # assign random incidents
  for j in range(int(random_case_count[who])):
    to_be_assigned[i].edit(assignee=who)
    to_be_assigned[i].add_to_labels(RANDOM_ASSIGNMENT_LABEL) # tag incidents that were randomly assigned so that plus.sub_source can be correctly filled in. - Gdb 171030
#    print "{0} being assigned issue {1} ({2})".format(who, to_be_assigned[i].number, i)  # DEBUG
    i += 1
  # assign prioritized incidents
  for j in range(int(priority_case_count[who])):
    if k < len(priority_to_be_assigned):  # Only do this if we have prioritized incidents
      priority_to_be_assigned[k].edit(assignee=who)
#      print "{0} being assigned priority issue {1} ({2})".format(who, priority_to_be_assigned[k].number, k)  # DEBUG
      priority_assigned.append((priority_to_be_assigned[k].number,who))
      k += 1
    else:  # We're out of priority incidents
      to_be_assigned[i].edit(assignee=who)
#      print "{0} being assigned issue {1} ({2})".format(who, to_be_assigned[i].number, i)  # DEBUG
      i += 1

# Save prioritized issues so we know what we cheated on
print("Saving priority events to file")
with open(PRIORITY_LOG_FILE, 'a') as f:
  for line in priority_assigned:
    print "Priority assigned {0} to {1}".format(line[0], line[1])
    f.write("{0},{1}\n".format(line[0], line[1]))

print("Complete!")