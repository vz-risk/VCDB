import json
import sys

from github import Github

invalid_tags=['Duplicate','Ignore']
action_tags =['Malware','Defacement','Error','Hacking','Misuse','Outage','Physical','Environmental','Social']
other_tags  ={'DDOS':'DOS','DataBreach':'Breach'}

with open('pinboard.json','rb') as f:
    incidents = json.loads(f.read())

with open('.github','rb') as f:
    token = f.read()

# XXX: no validation here that we get a good result
g = Github(login_or_token=token)
repo = g.get_repo('vz-risk/VCDB')
labels = repo.get_labels()
label_map = dict()
analyst_map = dict()

# build map between tags and labels
for l in labels:
    if l.name in invalid_tags:
        break
    elif l.name in action_tags:
        label_map[l.name] = l
    elif l.name in other_tags:
        label_map[other_tags[l.name]] = l

# prepare set of analysts who tagged stuff in Pinboard
analyst_map['Suzanne'] = g.get_user('swidup')
analyst_map['Mining']  = g.get_user('swidup')
analyst_map['Kevin']   = g.get_user('blackfist')
analyst_map['Spitler'] = g.get_user('Spitler')

for i in incidents:
    ignore=False
    # only process incidents without invalid tags
    for t in invalid_tags:
        if i['tags'].find(t) > 0:
            ignore=True
    if not ignore:
        # Apply GitHub tags based on Pinboard labels
        ilabels=list()
        analyst=None
        for t in i.['tags'].split():
            if (t in action_tags) or (t in other_tags):
                ilabels.append(label_map[t])
            # Assign it to the analyst who found it, if one
            if t in analyst_map:
                analyst=analyst_map['t']
        comment = '\n\n'.join((i['href'],i['extended'],i['tags']))
        issue=repo.create_issue(title=i['description'],body=comment,assignee=analyst,labels=ilabels)
    print "Opened issue %d with %d requests remaining" % (issue.id, g.rate_limiting[0])
    if g.rate_limiting[0] < 10:
        raise Exception('Rate limiting!')
