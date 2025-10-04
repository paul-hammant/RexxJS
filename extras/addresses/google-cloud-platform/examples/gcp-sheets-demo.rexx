#!/usr/bin/env rexx
/*
 * Google Sheets & Apps Script Integration Demo
 * Demonstrates rate limiting, aliases, HEREDOC, connecting, writing, Apps Script, and reading data
 */

PARSE ARG credFile, sheetId

SAY "Google Sheets Integration Demo"
SAY "=============================="
SAY "Sheet ID: " || sheetId
SAY ""

LET spreadsheetId = sheetId
LET sheetName = "Sheet1"
LET timestamp = TIME()
LET testMessage = "RexxJS Test at " || timestamp

/* Capture JavaScript code using HEREDOC for Apps Script */
LET jsCode = <<CUSTOM_FUNCTION
function REXX_HELLO(name) {
  return "Hello, " + name + "! (from RexxJS)";
}
CUSTOM_FUNCTION

REQUIRE "./extras/addresses/provisioning-and-orchestration/address-gcp.js"

ADDRESS GCP

SAY "Step 1: Enabling rate limiting..."
"RATELIMIT ENABLE"

IF RC \= 0 THEN DO
  SAY "✗ FAILED to enable rate limiting: RC=" || RC
  IF ERRORTEXT \= '' THEN SAY "  Error: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Rate limiting enabled"
SAY ""

SAY "Step 2: Creating alias 'mysheet' for the spreadsheet..."
LET aliasName = "mysheet"
"SHEETS ALIAS name={aliasName} id={spreadsheetId}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED to create alias: RC=" || RC
  IF ERRORTEXT \= '' THEN SAY "  Error: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Alias created: " || aliasName || " -> " || RESULT.spreadsheetId
SAY ""

SAY "Step 3: Connecting to spreadsheet using alias..."
"SHEETS CONNECT spreadsheet={aliasName}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED to connect: RC=" || RC
  IF ERRORTEXT \= '' THEN SAY "  Error: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Connected to: " || RESULT.title
SAY ""

SAY "Step 4: Writing data with simple values..."
"SHEETS INSERT sheet={sheetName} values=RexxJS Test,{timestamp},SUCCESS,{testMessage}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED to write: RC=" || RC
  IF ERRORTEXT \= '' THEN SAY "  Error: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Data written successfully"
SAY ""

SAY "Step 5: Binding Apps Script to spreadsheet with HEREDOC JavaScript..."
"APPS_SCRIPT BIND spreadsheet={spreadsheetId} code={jsCode}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED to bind Apps Script: RC=" || RC
  IF ERRORTEXT \= '' THEN SAY "  Error: " || ERRORTEXT
  EXIT 1
END

SAY "✓ " || RESULT.message
SAY "  Sheet: " || RESULT.script.sheetName
SAY "  Code: " || RESULT.script.codeLength || " characters"
SAY ""
SAY "  Manual Setup Instructions:"
LET instructions = RESULT.script.instructions
DO i = 1 TO 7
  LET instruction = ARRAY_GET(instructions, i)
  SAY "  " || instruction
END
SAY ""
SAY "  Note: " || RESULT.script.note
SAY ""

SAY "Step 6: Reading all data back from Sheet1..."
"SHEETS SELECT * FROM {sheetName}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED to read: RC=" || RC
  IF ERRORTEXT \= '' THEN SAY "  Error: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Retrieved " || RESULT.count || " rows"
SAY ""
SAY "Data from Sheet1:"
SAY ""

/* Print each row on a separate line */
LET rowData = RESULT.rows
LET rowCount = RESULT.count
DO i = 1 TO rowCount
  LET rowContent = ARRAY_GET(rowData, i)
  SAY "  Row " || i || ": " || rowContent
END

SAY ""
SAY "✓ Demo completed successfully!"
SAY ""
SAY "View your spreadsheet at:"
SAY "https://docs.google.com/spreadsheets/d/" || spreadsheetId

EXIT 0