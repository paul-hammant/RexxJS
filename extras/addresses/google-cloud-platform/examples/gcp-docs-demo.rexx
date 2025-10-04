#!/usr/bin/env rexx
/*
 * Google Docs Integration Demo
 * Demonstrates connecting, reading, and writing to Google Docs
 */

PARSE ARG credFile, docId

SAY "Google Docs Integration Demo"
SAY "============================"
SAY "Document ID: " || docId
SAY ""

LET documentId = docId
LET timestamp = TIME()
LET testMessage = "RexxJS Test at " || timestamp

REQUIRE "./extras/addresses/provisioning-and-orchestration/address-gcp.js"

ADDRESS GCP

SAY "Step 1: Connecting to Google Doc..."
"DOCS CONNECT document={documentId}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED to connect: RC=" || RC
  IF ERRORTEXT \= '' THEN SAY "  Error: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Connected to: " || RESULT.document.title
SAY "  Document ID: " || RESULT.document.documentId
SAY "  Revision ID: " || RESULT.document.revisionId
SAY ""

SAY "Step 2: Reading current document content..."
"DOCS READ"

IF RC \= 0 THEN DO
  SAY "✗ FAILED to read: RC=" || RC
  IF ERRORTEXT \= '' THEN SAY "  Error: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Document content retrieved"
SAY "  Length: " || RESULT.length || " characters"
SAY ""
SAY "Current content:"
SAY "----------------"
SAY RESULT.content
SAY "----------------"
SAY ""

SAY "Step 3: Inserting test message..."
LET newText = "RexxJS Test - " || testMessage || "\n\n"
"DOCS INSERT text={newText}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED to insert: RC=" || RC
  IF ERRORTEXT \= '' THEN SAY "  Error: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Text inserted successfully"
SAY "  Length: " || RESULT.textLength || " characters"
SAY ""

SAY "Step 4: Reading updated document content..."
"DOCS READ"

IF RC \= 0 THEN DO
  SAY "✗ FAILED to read: RC=" || RC
  IF ERRORTEXT \= '' THEN SAY "  Error: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Updated content retrieved"
SAY "  Length: " || RESULT.length || " characters"
SAY ""
SAY "Updated content:"
SAY "----------------"
SAY RESULT.content
SAY "----------------"
SAY ""

SAY "✓ Demo completed successfully!"
SAY ""
SAY "View your document at:"
SAY "https://docs.google.com/document/d/" || documentId

EXIT 0
