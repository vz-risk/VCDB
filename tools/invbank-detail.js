print()
print("*********************************************************")
print("******  VCDB Investment Banking Industry Overview  ******")
print("*********************************************************")
print()
print()


print()
print("* * * * * * * * * * * * * * * * * * * * * * * * * * * * *")
print("* * * * * * * * *     Records Section     * * * * * * * *")
print("* * * * * * * * * * * * * * * * * * * * * * * * * * * * *")
print()
print()

print()
print("*****  Data Total *****")
print()
healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "attribute.confidentiality.data_total" : { $exists : 1 } } },
        { $group : { _id : null , "count" : { "$sum" : 1 } } }
])

print()
print()
print("Number of Records where we know the amount disclosed: " + healthcare['result'][0]['count'])


healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "attribute.confidentiality.data_total" : { $exists : 1 } } },
	{ $group : { _id : null , "NumRecords" : { "$sum" : "$attribute.confidentiality.data_total" } } }

])

print()
print()
print("Total number of records disclosed:" + healthcare['result'][0]['NumRecords'])



print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()





print()
print("* * * * * * * * * * * * * * * * * * * * * * * * * * * * *")
print("* * * * * * * * *     Timeline Section      * * * * * * *")
print("* * * * * * * * * * * * * * * * * * * * * * * * * * * * *")
print()
print()



healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "timeline.incident.year" : { $exists : 1 } } },
        { $group : { _id : "$timeline.incident.year" , n : { "$sum" : 1 } } },
        { $project : { _id : 0 , timeline_year : "$_id", n : 1 } }
])


print()
print()
print("*****  Incidents by Year *****")
print()
for (var i = 0; i < healthcare['result'].length; i++) {
        print(healthcare['result'][i]['timeline_year'] + ": " + healthcare['result'][i]['n'])
}

print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()








print()
print("* * * * * * * * * * * * * * * * * * * * * * * * * * * * *")
print("* * * * * * * * *     Attributes Section      * * * * * *")
print("* * * * * * * * * * * * * * * * * * * * * * * * * * * * *")
print()
print()




// Count the confidentiality attributes

healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "attribute.confidentiality" : { $exists : 1 } } },
	{ $group : { _id : null , "count" : { "$sum" : 1 } } }
])

print()
print()
print("Confidentiality: " + healthcare['result'][0]['count'])


// Count the integrity attributes

healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "attribute.integrity" : { $exists : 1 } } },
        { $group : { _id : null , "count" : { "$sum" : 1 } } }
])

print("Integrity: " + healthcare['result'][0]['count'])


// Count the availability attributes

healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "attribute.availability" : { $exists : 1 } } },
        { $group : { _id : null , "count" : { "$sum" : 1 } } }
])

print("Availability: " + healthcare['result'][0]['count'])
print()
print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()



healthcare = db.incidents.aggregate([
	{ $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
	{ $match : { "attribute.confidentiality.data_disclosure" : { $exists : 1 } } },
	{ $group : { _id : "$attribute.confidentiality.data_disclosure" , n : { "$sum" : 1 } } },
	{ $project : { _id : 0 , disclosure : "$_id", n : 1 } }
])

// We've filtered by Healthcare industry, and where there is a value for attribute.confidentiality.data_disclosure.  Now we print what we found for each value as the start of this report.

print()
print()
print("*****  Attribute Confidentiality Data Disclosure *****")
print()
print("This section shows you what the status is for data disclosure.")
print()
for (var i = 0; i < healthcare['result'].length; i++) {
	print(healthcare['result'][i]['disclosure'] + ": " + healthcare['result'][i]['n'])
}

print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()



healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "attribute.integrity.variety" : { $exists : 1 } } },        
        { $group : { _id : "$attribute.integrity.variety" , n : { "$sum" : 1 } } },
        { $project : { _id : 0 , attribute_integrity : "$_id", n : 1 } }
])


print()
print()
print("*****  Integrity Variety *****")
print()
for (var i = 0; i < healthcare['result'].length; i++) {
        print(healthcare['result'][i]['attribute_integrity'] + ": " + healthcare['result'][i]['n'])
}

print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()




healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "attribute.availability.variety" : { $exists : 1 } } },
        { $group : { _id : "$attribute.availability.variety" , n : { "$sum" : 1 } } },
        { $project : { _id : 0 , attribute_availability : "$_id", n : 1 } }
]) 


print()
print()
print("***** Availability  Variety *****")
print()
for (var i = 0; i < healthcare['result'].length; i++) {
        print(healthcare['result'][i]['attribute_availability'] + ": " + healthcare['result'][i]['n'])
}

print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()




print()
print("* * * * * * * * * * * * * * * * * * * * * * * * * * * * *")
print("* * * * * * * * *     Actors Section    * * * * * * * * *")
print("* * * * * * * * * * * * * * * * * * * * * * * * * * * * *")
print()
print()







// Count the external actors

healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "actor.external" : { $exists : 1 } } },
	{ $group : { _id : null , "count" : { "$sum" : 1 } } }
])

print()
print()
print("*****  Actors  *****")
print()
print("External: " + healthcare['result'][0]['count'])

// Count the internal actors

healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "actor.internal" : { $exists : 1 } } },
        { $group : { _id : null , "count" : { "$sum" : 1 } } }
])

print("Internal: " + healthcare['result'][0]['count'])


// Count the partner actors

healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "actor.partner" : { $exists : 1 } } },
        { $group : { _id : null , "count" : { "$sum" : 1 } } }
])

print("Partner: " + healthcare['result'][0]['count'])


// Count the Unknown actors

healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "actor.unknown" : { $exists : 1 } } },
        { $group : { _id : null , "count" : { "$sum" : 1 } } }
])

print("Unknown: " + healthcare['result'][0]['count'])


print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()


healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "actor.external.variety" : { $exists : 1 } } },
        { $group : { _id : "$actor.external.variety" , n : { "$sum" : 1 } } },
        { $project : { _id : 0 , actor_external : "$_id", n : 1 } }
])


print()
print()
print("*****  External Actor Variety  *****")
print()
for (var i = 0; i < healthcare['result'].length; i++) {
        print(healthcare['result'][i]['actor_external'] + ": " + healthcare['result'][i]['n'])
}

print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()



healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "actor.external.motive" : { $exists : 1 } } },
        { $group : { _id : "$actor.external.motive" , n : { "$sum" : 1 } } },
        { $project : { _id : 0 , actor_external_motive : "$_id", n : 1 } }
])


print()
print()
print("*****  External Actor Motive *****")
print()
for (var i = 0; i < healthcare['result'].length; i++) {
        print(healthcare['result'][i]['actor_external_motive'] + ": " + healthcare['result'][i]['n'])
}

print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()





healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "actor.internal.variety" : { $exists : 1 } } },
        { $group : { _id : "$actor.internal.variety" , n : { "$sum" : 1 } } },
        { $project : { _id : 0 , actor_internal : "$_id", n : 1 } }
])


print()
print()
print("*****  Internal Actor Variety *****")
print()
for (var i = 0; i < healthcare['result'].length; i++) {
        print(healthcare['result'][i]['actor_internal'] + ": " + healthcare['result'][i]['n'])
}

print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()



healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "actor.internal.motive" : { $exists : 1 } } },
        { $group : { _id : "$actor.internal.motive" , n : { "$sum" : 1 } } },
        { $project : { _id : 0 , actor_internal_motive : "$_id", n : 1 } }
])


print()
print()
print("*****  Internal Actor Motive *****")
print()
for (var i = 0; i < healthcare['result'].length; i++) {
        print(healthcare['result'][i]['actor_internal_motive'] + ": " + healthcare['result'][i]['n'])
}

print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()




healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "actor.partner.variety" : { $exists : 1 } } },        
        { $group : { _id : "$actor.partner.variety" , n : { "$sum" : 1 } } },
        { $project : { _id : 0 , actor_partner : "$_id", n : 1 } }
])


print()
print()
print("*****  Partner Actor Variety *****")
print()
for (var i = 0; i < healthcare['result'].length; i++) {
        print(healthcare['result'][i]['actor_partner'] + ": " + healthcare['result'][i]['n'])
}

print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()



healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "actor.partner.motive" : { $exists : 1 } } },
        { $group : { _id : "$actor.partner.motive" , n : { "$sum" : 1 } } },
        { $project : { _id : 0 , actor_partner_motive : "$_id", n : 1 } }
])


print()
print()
print("*****  Partner Actor Motive *****")
print()
for (var i = 0; i < healthcare['result'].length; i++) {
        print(healthcare['result'][i]['actor_partner_motive'] + ": " + healthcare['result'][i]['n'])
}

print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()




print()
print("* * * * * * * * * * * * * * * * * * * * * * * * * * * * *")
print("* * * * * * * * *     Actions Section   * * * * * * * * *")
print("* * * * * * * * * * * * * * * * * * * * * * * * * * * * *")
print()
print()




// Moving on to the Actions section now


// Count the Malware Actions

healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "action.malware" : { $exists : 1 } } },
        { $group : { _id : null , "count" : { "$sum" : 1 } } }
])



print()
print()
print("Malware: " + healthcare['result'][0]['count'])


// Count the Hacking Actions

healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "action.hacking" : { $exists : 1 } } },
        { $group : { _id : null , "count" : { "$sum" : 1 } } }
])


print("Hacking: " + healthcare['result'][0]['count'])



// Count the Social Actions

healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "action.social" : { $exists : 1 } } },
        { $group : { _id : null , "count" : { "$sum" : 1 } } }
])


print("Social: " + healthcare['result'][0]['count'])



// Count the Misuse Actions

healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "action.misuse" : { $exists : 1 } } },
        { $group : { _id : null , "count" : { "$sum" : 1 } } }
])


print("Misuse: " + healthcare['result'][0]['count'])


// Count the Physical Actions

healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "action.physical" : { $exists : 1 } } },
        { $group : { _id : null , "count" : { "$sum" : 1 } } }
])



print("Physical: " + healthcare['result'][0]['count'])



// Count the Error Actions

healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "action.error" : { $exists : 1 } } },
        { $group : { _id : null , "count" : { "$sum" : 1 } } }
])



print("Error: " + healthcare['result'][0]['count'])


// Count the Environmental Actions

healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "action.environmental" : { $exists : 1 } } },
        { $group : { _id : null , "count" : { "$sum" : 1 } } }
])



//print("Environmental: " + healthcare['result'][0]['count'])




print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()



healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "action.malware.variety" : { $exists : 1 } } },
        { $group : { _id : "$action.malware.variety" , n : { "$sum" : 1 } } },
        { $project : { _id : 0 , action_malware_variety : "$_id", n : 1 } }
])


print()
print()
print("*****  Action Malware Variety  *****")
print()
for (var i = 0; i < healthcare['result'].length; i++) {
        print(healthcare['result'][i]['action_malware_variety'] + ": " + healthcare['result'][i]['n'])
}

print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()




healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "action.malware.vector" : { $exists : 1 } } },
        { $group : { _id : "$action.malware.vector" , n : { "$sum" : 1 } } },
        { $project : { _id : 0 , action_malware_vector : "$_id", n : 1 } }
])


print()
print()
print("*****  Action Malware Vector  *****")
print()
for (var i = 0; i < healthcare['result'].length; i++) {
        print(healthcare['result'][i]['action_malware_vector'] + ": " + healthcare['result'][i]['n'])     
}       

print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()




healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "action.hacking.variety" : { $exists : 1 } } },
        { $group : { _id : "$action.hacking.variety" , n : { "$sum" : 1 } } },
        { $project : { _id : 0 , action_hacking_variety : "$_id", n : 1 } }
])


print()
print()
print("*****  Action Hacking Variety  *****")
print()
for (var i = 0; i < healthcare['result'].length; i++) {
        print(healthcare['result'][i]['action_hacking_variety'] + ": " + healthcare['result'][i]['n'])     
}       

print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()




healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "action.hacking.vector" : { $exists : 1 } } },
        { $group : { _id : "$action.hacking.vector" , n : { "$sum" : 1 } } },
        { $project : { _id : 0 , action_hacking_vector : "$_id", n : 1 } }
])


print()
print()
print("*****  Action Hacking Vector  *****")
print()
for (var i = 0; i < healthcare['result'].length; i++) {
        print(healthcare['result'][i]['action_hacking_vector'] + ": " + healthcare['result'][i]['n']) 
}

print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()




healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "action.social.variety" : { $exists : 1 } } },
        { $group : { _id : "$action.social.variety" , n : { "$sum" : 1 } } },
        { $project : { _id : 0 , action_social_variety : "$_id", n : 1 } }
])


print()
print()
print("*****  Action Social Variety  *****")
print()
for (var i = 0; i < healthcare['result'].length; i++) {
        print(healthcare['result'][i]['action_social_variety'] + ": " + healthcare['result'][i]['n'])     
}       

print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()




healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "action.social.vector" : { $exists : 1 } } },
        { $group : { _id : "$action.social.vector" , n : { "$sum" : 1 } } },
        { $project : { _id : 0 , action_social_vector : "$_id", n : 1 } }
])


print()
print()
print("*****  Action Social Vector  *****")
print()
for (var i = 0; i < healthcare['result'].length; i++) {
        print(healthcare['result'][i]['action_social_vector'] + ": " + healthcare['result'][i]['n']) 
}

print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()



healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "action.misuse.variety" : { $exists : 1 } } },
        { $group : { _id : "$action.misuse.variety" , n : { "$sum" : 1 } } },
        { $project : { _id : 0 , action_misuse_variety : "$_id", n : 1 } }
])


print()
print()
print("*****  Action Misuse Variety  *****")
print()
for (var i = 0; i < healthcare['result'].length; i++) {
        print(healthcare['result'][i]['action_misuse_variety'] + ": " + healthcare['result'][i]['n'])     
}       

print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()




healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "action.misuse.vector" : { $exists : 1 } } },
        { $group : { _id : "$action.misuse.vector" , n : { "$sum" : 1 } } },
        { $project : { _id : 0 , action_misuse_vector : "$_id", n : 1 } }
])


print()
print()
print("*****  Action Misuse Vector  *****")
print()
for (var i = 0; i < healthcare['result'].length; i++) {
        print(healthcare['result'][i]['action_misuse_vector'] + ": " + healthcare['result'][i]['n']) 
}

print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()



healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "action.physical.variety" : { $exists : 1 } } },
        { $group : { _id : "$action.physical.variety" , n : { "$sum" : 1 } } },
        { $project : { _id : 0 , action_physical_variety : "$_id", n : 1 } }
])


print()
print()
print("*****  Action Physical Variety  *****")
print()
for (var i = 0; i < healthcare['result'].length; i++) {
        print(healthcare['result'][i]['action_physical_variety'] + ": " + healthcare['result'][i]['n'])     
}       

print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()




healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "action.physical.vector" : { $exists : 1 } } },
        { $group : { _id : "$action.physical.vector" , n : { "$sum" : 1 } } },
        { $project : { _id : 0 , action_physical_vector : "$_id", n : 1 } }
])


print()
print()
print("*****  Action Physical Vector  *****")
print()
for (var i = 0; i < healthcare['result'].length; i++) {
        print(healthcare['result'][i]['action_physical_vector'] + ": " + healthcare['result'][i]['n']) 
}

print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()




healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "action.error.variety" : { $exists : 1 } } },
        { $group : { _id : "$action.error.variety" , n : { "$sum" : 1 } } },
        { $project : { _id : 0 , action_error_variety : "$_id", n : 1 } }
])


print()
print()
print("*****  Action Error Variety  *****")
print()
for (var i = 0; i < healthcare['result'].length; i++) {
        print(healthcare['result'][i]['action_error_variety'] + ": " + healthcare['result'][i]['n'])     
}       

print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()




healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "action.error.vector" : { $exists : 1 } } },
        { $group : { _id : "$action.error.vector" , n : { "$sum" : 1 } } },
        { $project : { _id : 0 , action_error_vector : "$_id", n : 1 } }
])


print()
print()
print("*****  Action Error Vector  *****")
print()
for (var i = 0; i < healthcare['result'].length; i++) {
        print(healthcare['result'][i]['action_error_vector'] + ": " + healthcare['result'][i]['n']) 
}

print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()




healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "action.environmental.variety" : { $exists : 1 } } },
        { $group : { _id : "$action.environmental.variety" , n : { "$sum" : 1 } } },
        { $project : { _id : 0 , action_environmental_variety : "$_id", n : 1 } }
])


print()
print()
print("*****  Action Environmental Variety  *****")
print()
for (var i = 0; i < healthcare['result'].length; i++) {
        print(healthcare['result'][i]['action_environmental_variety'] + ": " + healthcare['result'][i]['n'])     
}       

print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()




healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "action.environmental.vector" : { $exists : 1 } } },
        { $group : { _id : "$action.environmental.vector" , n : { "$sum" : 1 } } },
        { $project : { _id : 0 , action_environmental_vector : "$_id", n : 1 } }
])


print()
print()
print("*****  Action Environmental Vector  *****")
print()
for (var i = 0; i < healthcare['result'].length; i++) {
        print(healthcare['result'][i]['action_environmental_vector'] + ": " + healthcare['result'][i]['n']) 
}

print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()






print()
print("* * * * * * * * * * * * * * * * * * * * * * * * * * * * *")
print("* * * * * * * * *     Assets Section    * * * * * * * * *")
print("* * * * * * * * * * * * * * * * * * * * * * * * * * * * *")
print()
print()



// Moving on to the Asset values

healthcare = db.incidents.aggregate([
        { $match : { "victim.industry" : { $regex : "^523", $options : "i" } } },
        { $match : { "asset.assets.variety" : { $exists : 1 } } },
        { $group : { _id : "$asset.assets.variety" , n : { "$sum" : 1 } } },
        { $project : { _id : 0 , disclosure : "$_id", n : 1 } }
])


print()
print()
print("*****  Assets  *****")
print()
//printjson(healthcare)
for (var i = 0; i < healthcare['result'].length; i++) {
        print(healthcare['result'][i]['disclosure'] + ": " + healthcare['result'][i]['n'])
}

print()
print("***** ***** ***** ***** ***** ***** ***** ***** ***** ***** *****")
print()

print()




