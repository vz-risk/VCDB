import json
import os
from datetime import datetime
import uuid

# i = getIncident('blahblahblah.json')
def getIncident(inString):
  return json.loads(open(inString).read())

# updateIncident(i, 'blahblahblah.json', True)
def updateIncident(i,inFilename,validated=False):
  i['plus']['modified'] = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
  if validated:
    i['plus']['analysis_status'] = "Validated"
  outfile = open(inFilename,'w')
  outfile.write(json.dumps(i,sort_keys=True, indent=2,separators=(',', ': ')))
  outfile.close()

def findandFix(inDict,filename):
    for eachfile in os.listdir('/tmp/vcdb'):
        if eachfile.endswith('.json'):
            i = getIncident('/tmp/vcdb/'+eachfile)
            if i['summary'] == inDict['summary'] and i['reference'] == inDict['reference']:
                print("\tFix it with /tmp/vcdb/" + eachfile)
                inDict['attribute']['confidentiality']['data'] = i['attribute']['confidentiality']['data']
                updateIncident(inDict,'json/'+filename)
                


for eachfile in os.listdir('json'):
    if eachfile.endswith('.json'):
      oldfile = getIncident('json/'+eachfile)
      try:
        if len(oldfile['attribute']['confidentiality']['data']) == 0:
          print("need to fix",eachfile)
          findandFix(oldfile,eachfile)
      except KeyError:
        continue
