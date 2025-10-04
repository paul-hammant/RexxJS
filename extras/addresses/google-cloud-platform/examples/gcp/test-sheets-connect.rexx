#!/usr/bin/env rexx
/* Test SHEETS CONNECT command after refactoring */

/* Parse command line args */
parse arg credFile sheetId

if credFile = '' | sheetId = '' then do
  say '✗ Usage: test-sheets-connect.rexx <credentials.json> <spreadsheet_id>'
  exit 1
end

LET spreadsheetId = sheetId

REQUIRE "./extras/addresses/provisioning-and-orchestration/address-gcp.js"

ADDRESS GCP

say 'Step 1: Connecting to spreadsheet...'
'SHEETS CONNECT spreadsheet={spreadsheetId}'

IF RC \= 0 THEN DO
  SAY '✗ FAILED: ' || ERRORTEXT
  EXIT 1
END

SAY '✓ Connected to: ' || RESULT.title

say ''
say '✓ SheetsHandler working correctly after refactoring'
exit 0
