the VCDB JSON directory has been separated into three directories.  Historically, VCDB was published roughly quarterly.  At that time, it was a manual process.  When we automated the DBIR process, it necessitated VCDB follow the annual release cycle of the DBIR.  However, we desired to release VCDB regularly again.  To do that, we need to bring some of the validation process from the DBIR to VCDB.  We will impliment that using the following directories:

`submitted`: VCDB json that has been generated, (likely using the veris webapp), but not manually validated. There are a number of status for these to have depending ont he level of manual review, but the most important part is that they have not been automatically validated.

`validated`: VCDB json that has had the VCDB fix_subsource.py, VERIS rules.py, and VERIS checkValidity.py scripts applied as well as jsonschema validation against the current vcdb-merged.json schema and passed (i.e. 0 validation errors).

`overridden`: VCDB json that did not pass validation, but have been manually checked and to be correct.

the VCDB verisr dataframe and joined json will only be built from JSON in `validated` and `overridden`.
