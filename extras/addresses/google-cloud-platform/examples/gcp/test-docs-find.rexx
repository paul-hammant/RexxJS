#!/usr/bin/env rexx
/*
 * Test Google Docs FIND command
 * Demonstrates finding text positions for programmatic editing
 */

PARSE ARG credFile, docId

SAY "Google Docs FIND Demo"
SAY "====================="
SAY ""

LET documentId = docId

/* Create a technical document with repeated terms */
LET technicalDoc = <<DOCUMENT
API Integration Guide
=====================

Introduction to API
-------------------
Our API provides comprehensive access to system resources.
The API uses RESTful conventions and returns JSON responses.

Authentication
--------------
API authentication requires an API key. Include your API key
in the Authorization header of every API request.

Rate Limits
-----------
The API enforces rate limits to ensure fair usage. Standard
API accounts have a limit of 1000 API calls per hour.

Best Practices
--------------
When working with the API, follow these guidelines:
1. Cache API responses when possible
2. Handle API errors gracefully
3. Monitor your API usage regularly

Conclusion
----------
The API is designed for reliability and ease of use. Start
building with our API today!
DOCUMENT

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

SAY "Step 2: Creating document with repeated terms..."
"DOCS CLEAR"
"DOCS INSERT text={technicalDoc}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Document created (" || RESULT.textLength || " chars)"
SAY ""

SAY "Step 3: Finding all occurrences of 'API'..."
"DOCS FIND text=API"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ " || RESULT.message
SAY "  Search term: '" || RESULT.searchText || "'"
SAY ""

IF RESULT.count > 0 THEN DO
  SAY "Occurrences found:"
  LET occurrences = RESULT.occurrences
  DO i = 1 TO RESULT.count
    LET occ = ARRAY_GET(occurrences, i)
    SAY "  " || i || ". Position " || occ.position || " → indices [" || occ.startIndex || ", " || occ.endIndex || ")"
  END
  SAY ""
END

SAY "Step 4: Using FIND result to format all 'API' occurrences..."
SAY ""

IF RESULT.count > 0 THEN DO
  LET occurrences = RESULT.occurrences
  /* Format in reverse order to maintain index validity */
  DO i = RESULT.count TO 1 BY -1
    LET occ = ARRAY_GET(occurrences, i)
    LET startIdx = occ.startIndex
    LET endIdx = occ.endIndex

    "DOCS FORMAT start={startIdx} end={endIdx} bold=true"
    SAY "  ✓ Formatted occurrence " || i || " at indices [" || startIdx || ", " || endIdx || ")"
  END
  SAY ""
END

SAY "Step 5: Finding a different term..."
"DOCS FIND text=authentication"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ " || RESULT.message
SAY "  Search term: '" || RESULT.searchText || "'"

IF RESULT.count > 0 THEN DO
  SAY ""
  SAY "Occurrences:"
  LET occurrences = RESULT.occurrences
  DO i = 1 TO RESULT.count
    LET occ = ARRAY_GET(occurrences, i)
    SAY "  " || i || ". Position " || occ.position || " at document index " || occ.startIndex
  END
END
SAY ""

SAY "✓ Demo complete!"
SAY ""
SAY "This demonstrates:"
SAY "  • Finding all occurrences of text in a document"
SAY "  • Getting precise document indices for each match"
SAY "  • Using FIND results for programmatic formatting"
SAY "  • Perfect for automated document annotation"
SAY "  • Enables intelligent text processing workflows"
SAY ""
SAY "View at: https://docs.google.com/document/d/" || documentId

EXIT 0
