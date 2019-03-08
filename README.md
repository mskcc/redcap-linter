# REDCap Linter
Author: Craig Perkins (perkinsc@mskcc.org)

## Introduction

REDCap Linter is a tool to facilitate the process of preparing data for upload into REDCap. REDCap Linter finds all errors in a datafile and provides a wizard for correcting the errors.

Workflows for preparing data for upload into REDCap follow the same basic steps:

1) Compare columns in the spreadsheet to existing REDCap fields
2) Transform data in columns that contain Permissible Values to their encoded value
3) If the field is not present in the Permissible Values then either add a value in REDCap or find its proper match
4) Resolve columns that fail text validation. Often times these errors only are uncovered after unsuccessfully uploading data into REDCap
5) Prepare checkbox files to be uploaded by appending columns with 1 or 0 to indicate for each record whether the checkbox value is present
6) For repeating instruments, calculate the repeat instance number for each record to be uploaded



## Quick Start Guide

```angularjs
git clone https://github.mskcc.org/health-informatics/redcap-linter.git
cd redcap-linter
docker-compose build
docker-compose up
```

## Configuration

To configure REDCap Linter for an instance of REDCap modify the `/server/config/redcap.yml` file. It is not required to configure REDCap Linter unless you plan to use the token input to use REDCap's APIs.
