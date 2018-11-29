### 2018-11-29
VCDB has been updated to version 1.3.3.  This update includes the schema as well as all JSON (using the convert_1.3.2_to_1.3.3.py script from github.com/vz-risk/veris/bin.  Note: plus.master_id was removed as it is now in verisc.

### 2018-11-27
The DBIR team has moved to an automated update process for VCDB.  This has a few impacts.

1. The data/json directory is split into 3 parts.  See the README in that directory.
2. JSON is now enriched using many of the same tools we use for the DBIR data pipeline. This means more fields in the CSV file.
3. Only JSON that validates or is overridden will be in the joined json, verisr object, and csv file.  This will hopefully be all incidents soon, but expect a few steps as we iron things out.
4. The VCDB JSON will be updated regularly.  We're not sure of the periodicity yet, but probably between daily and quarterly somewhere.

*History*
Originally, VCDB was produced using Survey Gizmo forms that output a spreadsheet.  The spreadsheet was parsed with python scripts to convert the spreadsheet to JSON and validate it.  This was done manually quarterly.  When we updated to an automated DBIR data pipeline several years ago, the conversion and validation of VCDB were lumped in with the conversion and validation of all other DBIR sources.  This meant that VCDB was only produced yearly (after the DBIR dataset was finalized to prevent double counting incidents from the VCDB repo and the DBIR store).  Two things have let us go back to regular VCDB releases.  First, we have a webapp that allows us to output JSON directly, (bypassing the nead to manually export spreadsheets and fiddle with conversion).  Second, we've migrated our data pipeline to infrastructure where it can run continously through the year.  Because this necessitates major changes to the pipeline itself, it's a good time to update it to always get data from the VCDB repo rather than split between the DBIR store and VCDB public repo.  That paired with a dedicated data pipeline for VCDB has brought us to the continuous updates we should now be at (once the dust settles).  Ultimately though it necessitates some changes, I think it's a better place to be.

### 2018-11-26
Be advised that in the near future VCDB will be updated to VERIS 1.3.3.  There is a v1_3_3 branch with the schema already.  Once tooling updates are complete, we will update all VCDB json to 1.3.3. This will be in tandem with updates to veris and verisr as well.
