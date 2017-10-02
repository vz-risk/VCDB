#!/usr/bin/env python
"""
 AUTHOR: Gabriel Bassett
 DATE: 10-02-17
 DEPENDENCIES: a list of modules requiring installation
 Copyright 2017 Gabriel Bassett

 LICENSE:
 This program is free software:  you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 or the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.

 DESCRIPTION:
 A description of the software

"""
# PRE-USER SETUP
pass

########### NOT USER EDITABLE ABOVE THIS POINT #################


# USER VARIABLES

########### NOT USER EDITABLE BELOW THIS POINT #################


## IMPORTS
import argparse
import logging
import simplejson as json # to load the json
import fnmatch # to walk the FS
import os # to walk the FS
import zipfile # to compress

## FUNCTIONS
def updateLogger(cfg=None, formatDesign=None, dateFmt=None):
  logger = logging.getLogger()
  FORMAT = '%(asctime)19s - %(processName)s - %(process)d {0}- %(levelname)s - %(message)s'
  logging_remap = {'error': logging.ERROR, 'warning':logging.WARNING, 'critical':logging.CRITICAL, 'info':logging.INFO, 'debug':logging.DEBUG,
                   50: logging.CRITICAL, 40: logging.ERROR, 30: logging.WARNING, 20: logging.INFO, 10: logging.DEBUG, 0: logging.CRITICAL}
  if cfg is not None:
    log_level = logging_remap[cfg['log_level']]
    log_file = cfg.get('log_file', None)
  else:
    log_level = logging.DEBUG
    log_file = None
  logger.setLevel(log_level)
  handlers = logger.handlers
  if formatDesign is None:
    formatter = logging.Formatter(FORMAT.format(""), datefmt=dateFmt)
  else:
    formatter = logging.Formatter(FORMAT.format("- " + formatDesign + " "), datefmt=dateFmt)
  streamHandlerPresent = False
  fileHandlerPresent = False
  for handler in handlers:
    if type(handler) == logging.StreamHandler and streamHandlerPresent is not True:
      handler.setLevel(log_level)
      handler.setFormatter(formatter)
      streamHandlerPresent = True
    elif type(handler) == logging.FileHandler and fileHandlerPresent is not True:
      if log_file is not None:
        if handler.baseFilename != log_file:
          logger.removeHandler()
        else:
          handler.setLevel(log_level)
          handler.setFormatter(formatter)
          fileHandlerPresent = True
    else:
      logger.removeHandler(handler)
      logging.debug("Removing handler of type {0}.".format(type(handler)))
  if streamHandlerPresent is not True:
    sh = logging.StreamHandler()
    sh.setLevel(log_level)
    sh.setFormatter(formatter)
    logger.addHandler(sh)
    logging.debug("No stream handler found.  Adding handler.")
  if fileHandlerPresent is not True and log_file is not None:
    fh = logging.FileHandler(log_file)
    fh.setLevel(log_level)
    fh.setFormatter(formatter)
    logger.addHandler(fh)
    logging.debug("No file handler found and log_file set to {0}. Adding file handler.".format(log_file))

updateLogger()

## SETUP
__author__ = "Gabriel Bassett"
# Parse Arguments (should correspond to user variables)
parser = argparse.ArgumentParser(description='This script processes a graph.')
parser.add_argument('-d', '--debug',
                    help='Print lots of debugging statements',
                    action="store_const", dest="loglevel", const=logging.DEBUG,
                    default=logging.WARNING
                   )
parser.add_argument('-v', '--verbose',
                    help='Be verbose',
                    action="store_const", dest="loglevel", const=logging.INFO
                   )
parser.add_argument('--log', help='Location of log file', default=None)
parser.add_argument('-i', '--input',
                    help='The input directory containing the json',
                    default='../data/json')
parser.add_argument('-o', '--output',
                    help='The output directory to store the single json file in',
                    default='../data/joined')
parser.add_argument('-z', '--zip',
                    help='Compress the output file',
                    action='store_true')
parser.add_argument('-r', '--recurse',
                    help='Recurse into sub directories that may contain additional incidents.',
                    action='store_true')
args = parser.parse_args()
args = {k:v for k,v in vars(args).iteritems() if v is not None}

## Set up Logging
updateLogger({'log_level': args['loglevel'], 'log_file': args.get('log', None)})



## EXECUTION

def main(args):
    logging.info('Beginning main loop.')


    files = list()
    if args['recurse']:
        logging.debug('Searching for json files recursively')
        for root, dirnames, filenames in os.walk(args['input']):
            logging.debug(root)
            for filename in fnmatch.filter(filenames, '*.json'):
                logging.debug(os.path.join(root, filename))
                files.append(os.path.join(root, filename))
    else:
        for filename in os.listdir(args['input']):
            if fnmatch.fnmatch(filename, '*.json'):
                files.append(os.path.join(args['input'], filename))

    incidents = list()
    try:
        for file in files:
            logging.debug(file)
            with open(file, 'r') as filehandle:
                i = json.load(filehandle)
                incidents.append(i)
    except:
        logging.error("failure on file {0}.".format(file))
        raise

    if not os.path.exists(args['output']): os.makedirs(args['output'])
    out_file = os.path.join(args['output'], "vcdb.json")
    incidents = json.dumps(incidents)
    if args['zip']:
        logging.debug('Zipping output file.')
        zf = zipfile.ZipFile(out_file + ".zip", mode='w')
        zf.writestr("vcdb.json", incidents + "\n", zipfile.ZIP_DEFLATED)
        zf.close()
    else:
        with open(out_file, 'w') as filehandle:
            filehandle.write(incidents + "\n")

    logging.info('Ending main loop.')

if __name__ == "__main__":
    main(args)    
