#!/usr/bin/env rexx
/*
 * Test Google Docs DELETE_RANGE command
 * Demonstrates precise content removal by character range
 */

PARSE ARG credFile, docId

SAY "Google Docs DELETE_RANGE Demo"
SAY "=============================="
SAY ""

LET documentId = docId

/* Create a document with sections we'll selectively remove */
LET fullReport = <<REPORT
CONFIDENTIAL REPORT
===================

SECTION A: Public Information
This section contains information that can be shared publicly.
It includes general statistics and overview data.

SECTION B: Internal Use Only
This section contains sensitive internal metrics.
Employee performance data and salary information.
DO NOT DISTRIBUTE

SECTION C: Public Summary
This section summarizes the key findings and is suitable
for external distribution and press releases.

END OF REPORT
REPORT

REQUIRE "./extras/addresses/provisioning-and-orchestration/address-gcp.js"

ADDRESS GCP

SAY "Step 1: Connecting to document..."
"DOCS CONNECT document={documentId}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Connected to: " || RESULT.document.title
SAY ""

SAY "Step 2: Creating document with confidential sections..."
"DOCS CLEAR"
"DOCS INSERT text={fullReport}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Full report inserted (" || RESULT.textLength || " chars)"
SAY ""

SAY "Step 3: Reading document to locate confidential section..."
"DOCS READ"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

LET content = RESULT.content
LET fullLength = RESULT.length
SAY "✓ Document length: " || fullLength || " characters"
SAY ""

/* Find the confidential section boundaries */
LET sectionBStart = POS("SECTION B: Internal Use Only", content)
LET sectionCStart = POS("SECTION C: Public Summary", content)

IF sectionBStart > 0 & sectionCStart > 0 THEN DO
  SAY "Step 4: Located confidential section..."
  SAY "  Section B starts at: " || sectionBStart
  SAY "  Section C starts at: " || sectionCStart
  SAY ""

  /* Delete from start of Section B to start of Section C */
  /* Subtract 2 to preserve the newline before Section C */
  LET deleteStart = sectionBStart - 1
  LET deleteEnd = sectionCStart - 2

  SAY "Step 5: Removing confidential section (indices " || deleteStart || " to " || deleteEnd || ")..."
  "DOCS DELETE_RANGE start={deleteStart} end={deleteEnd}"

  IF RC \= 0 THEN DO
    SAY "✗ FAILED: " || ERRORTEXT
    EXIT 1
  END

  SAY "✓ " || RESULT.message
  SAY "  Removed: " || RESULT.charactersRemoved || " characters"
  SAY "  Range: [" || RESULT.startIndex || ", " || RESULT.endIndex || ")"
  SAY ""
END

SAY "Step 6: Reading sanitized document..."
"DOCS READ"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

LET newLength = RESULT.length
SAY "✓ Sanitized document: " || newLength || " characters"
SAY ""
SAY "Document transformation:"
SAY "  Before: " || fullLength || " chars (with confidential section)"
SAY "  After:  " || newLength || " chars (confidential section removed)"
SAY "  Removed: " || (fullLength - newLength) || " characters"
SAY ""

SAY "✓ Demo complete!"
SAY ""
SAY "This demonstrates:"
SAY "  • Precise range deletion by character indices"
SAY "  • Content sanitization and redaction"
SAY "  • Selective section removal"
SAY "  • Perfect for automated content filtering"
SAY ""
SAY "View at: https://docs.google.com/document/d/" || documentId

EXIT 0
