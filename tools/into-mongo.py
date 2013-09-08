import pymongo
import json
import os

SERVER = 'localhost'
DATABASE = 'kevin'
COLLECTION = 'vcdb'

server = pymongo.Connection(SERVER)
db = server[DATABASE]
col = db[COLLECTION]


for (path, dirs, files) in os.walk('../incidents/'):
    for file in files:
        print('loading: '+os.path.join('../incidents/',file))
        infile = open(os.path.join('../incidents/',file), 'rb')
        incident = json.loads(infile.read())
        col.insert(incident)
