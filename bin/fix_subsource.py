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
########### NOT USER EDITABLE BELOW THIS POINT #################


## IMPORTS
import argparse
import configparser
import os
import simplejson
from tqdm import tqdm
from pprint import pprint, pformat
from distutils.version import LooseVersion
from github import Github
from jsonschema import ValidationError


## SETUP
__author__ = "Gabriel Bassett"
# Default Configuration Settings
## Labels in priority order (higher up takes precidence)
PRIORITIZED_LABELS = [
  "priority",
  "phidbr",
  "covid19"
]

cfg = {
    'log_level': 'warning',
    'log_file': None,
    'version':"1.3.2",
    'output': None,
    'quiet': False,
    'gh_user': None,
    'gh_password': None,
    'priority_labels': PRIORITIZED_LABELS,
    'fix': False
}

## GLOBAL EXECUTION
logging.getLogger().setLevel(logging.WARNING)

## FUNCTION DEFINITION
class Subsource():
    cfg = None
    repo = None
    issue_map = None

    def __init__(self, cfg):
        logging.debug("Initializing subsource correction object.")

        self.cfg = cfg

        if LooseVersion(cfg.get('version', '1.3.2')) < LooseVersion("1.3.2"): # assume 1.3.2 since at time of writing all VZ veris is at least 1.3.2 - GDB 181127 
            raise ValueError("The veris/vcdb version must be at least 1.3.2 to include plus.subsource.")

        # TODO: Load GITHUB stuff
        if cfg['gh_user'] is not None and cfg['gh_password'] is not None:
          self.gh = Github(cfg['gh_user'], cfg['gh_password'], per_page=100)
        else:
          self.gh = Github(per_page=100)
        self.repo = self.gh.get_user("vz-risk").get_repo("VCDB")
        self.labels = self.get_labels()


    def get_labels(self):
      issue_map = {}


      issues = self.repo.get_issues(state="closed", sort="created", direction="desc")
      for issue in issues:
        if issue.labels:
          for plabel in self.cfg['priority_labels']:
            if any(plabel in label.name.lower() for label in issue.labels):
              issue_map[str(issue.number)] = plabel
              break # NOTE: this causes only the first label found to be used.  This may result in unintended behavior. - GDB 200604

#      ## DEBUG:
#      with open("/Users/v685573/issue_map.json", 'r') as filehandle:
#        #simplejson.dump(issue_map, filehandle, sort_keys=True, indent=2, separators=(',', ': '))
#        issue_map = simplejson.load(filehandle)

      self.issue_map = issue_map


    def fix_subsource(self, incident):
        if 'plus' in incident.keys():
          gh_id = incident['plus'].get('github', '')
          if gh_id in self.issue_map.keys():
            #print("{0} in map".format(gh_id))
            # the not in bla be low is important as otherwise legitimate labels can be overwritten. - GDB 200604
            if not incident['plus'].get('sub_source', '') in self.cfg['priority_labels'] and incident['plus'].get('sub_source', '') != self.issue_map[gh_id]:
              logging.warning("Incident {0} has plus.sub_source set to '{1}', however it should be '{3}'' based on the tags in github issue {2}.".format(
                  incident['plus'].get('master_id', "no_master_id"),
                  incident['plus'].get('sub_source', 'no_sub_source'),
                  gh_id,
                  self.issue_map[gh_id]
              ))
              if self.cfg['fix']:
                incident['plus']['sub_source'] = self.issue_map[gh_id]
          elif incident['plus'].get('sub_source', '') in PRIORITIZED_LABELS:
            pass # if the sub_source is already a priority sub-source, leave it.
          else:
            #print("{0} not in map".format(gh_id))
            if 'sub_source' in incident['plus']:
              logging.warning("Incident {0} has plus.sub_source set to '{1}', however there are no tags in the associated github issue {2}.".format(
                  incident['plus'].get('master_id', "no_master_id"),
                  incident['plus'].get('sub_source', 'no_sub_source'),
                  gh_id
              ))
              if self.cfg['fix']:
                _ = incident['plus'].pop("sub_source")
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
    parser.add_argument("--gh_user", help="The github user to use")
    parser.add_argument("--gh_password", help="The password for the github user")
    parser.add_argument("--fix", help="Include to replace the plus.sub_source field if an appropriate tag is found.", action="store_true", default=False)
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

    logging.getLogger().setLevel({
      "debug": logging.DEBUG,
      "info": logging.INFO,
      "warning": logging.WARNING,
      "critical": logging.CRITICAL}[cfg['log_level']])
    if cfg['log_file'] is not None:
      fileHandler = logging.FileHandler(cfg['log_file'])
      logging.getLogger().addHandler(fileHandler)

    logging.debug(args)

    logging.debug(cfg)

    logging.info('Beginning main loop.')


    subsource = Subsource(cfg)

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



    # open each json file
    if 'output' in cfg and cfg['output'] is not None:
        overwrite = False
    else:
        overwrite = True
    for filename in tqdm(filenames):
        with open(filename, 'r+') as filehandle:
            try:
                incident = simplejson.load(filehandle)
            except:
                logging.warning("Unable to load {0}.".format(filename))
                continue
            logging.debug("Before parsing:\n" + pformat(incident))
            # fixsource
            incident = subsource.fix_subsource(incident)
            if cfg['fix']:
              if overwrite:
                  filehandle.seek(0)
                  simplejson.dump(incident, filehandle, sort_keys=True, indent=2, separators=(',', ': '))
                  filehandle.truncate()
              else:
                  with open(cfg['output'].rstrip("/") + "/" + filename.split("/")[-1], 'w') as outfilehandle:
                      simplejson.dump(incident, outfilehandle, sort_keys=True, indent=2, separators=(',', ': '))
            logging.debug("After parsing:\n" + pformat(incident)) 

    logging.info('Ending main loop.')





