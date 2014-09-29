healthcare = db.incidents.aggregate([
	{ $match : { "victim.industry" : { $regex : "^62", $options : "i" } } },
	{ $group : { _id : null , "count" : { "$sum" : 1 } } }
])

printjson(healthcare['result'][0]['count'])

