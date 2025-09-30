#!/usr/bin/env rexx

PARSE ARG credFile, sheetId

SAY "Writing test data to Google Sheets..."
SAY "Sheet ID: " || sheetId
SAY ""

LET spreadsheetId = sheetId
LET sheetName = "Sheet1"
LET timestamp = TIME()
LET testMessage = "RexxJS Test at " || timestamp

REQUIRE "../address-gcp.js"

ADDRESS GCP

SAY "Connecting to spreadsheet..."
"SHEETS CONNECT spreadsheet={spreadsheetId}"

IF RC = 0 THEN DO
  SAY "✓ Connected to: " || RESULT.title
  SAY ""
  SAY "Writing data to Sheet1..."

  /* Write a row with timestamp and test message */
  "SHEETS INSERT sheet={sheetName} values=RexxJS Test,{timestamp},SUCCESS,{testMessage}"

  IF RC = 0 THEN DO
    SAY "✓ SUCCESS! Data written to spreadsheet"
    SAY ""
    SAY "Open the spreadsheet to see the new row:"
    SAY "https://docs.google.com/spreadsheets/d/" || spreadsheetId
  END
  ELSE DO
    SAY "✗ FAILED to write: RC=" || RC
    IF ERRORTEXT \= '' THEN SAY "  Error: " || ERRORTEXT
  END
END
ELSE DO
  SAY "✗ FAILED to connect: RC=" || RC
  IF ERRORTEXT \= '' THEN SAY "  Error: " || ERRORTEXT
END

EXIT 0