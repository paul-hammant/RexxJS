#!/usr/bin/env rexx
/*
 * Test Google Docs GET_LENGTH command
 * Demonstrates getting document length for validation and monitoring
 */

PARSE ARG credFile, docId

SAY "Google Docs GET_LENGTH Demo"
SAY "==========================="
SAY ""

LET documentId = docId

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

SAY "Step 2: Creating initial document..."
LET initialContent = <<CONTENT
Document Length Tracking Demo
==============================

This document demonstrates real-time length tracking.
CONTENT

"DOCS CLEAR"
"DOCS INSERT text={initialContent}"

SAY "✓ Initial content inserted"
SAY ""

SAY "Step 3: Getting initial length..."
"DOCS GET_LENGTH"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ " || RESULT.message
SAY "  Document index length: " || RESULT.length || " chars"
SAY "  Actual text length: " || RESULT.textLength || " chars"
SAY ""

LET initialLength = RESULT.textLength

SAY "Step 4: Appending content..."
LET additionalContent = <<MORE
Section 2: Adding More Content
-------------------------------
We're now adding additional paragraphs to track growth.
This helps monitor document size during automated generation.
MORE

"DOCS APPEND text={additionalContent}"
SAY "✓ Content appended (" || RESULT.textLength || " chars)"
SAY ""

SAY "Step 5: Checking updated length..."
"DOCS GET_LENGTH"

SAY "✓ Updated length"
SAY "  Document index length: " || RESULT.length || " chars"
SAY "  Actual text length: " || RESULT.textLength || " chars"
SAY ""

LET updatedLength = RESULT.textLength

SAY "Step 6: Appending more content..."
LET finalContent = <<FINAL
Section 3: Final Notes
-----------------------
Length tracking is essential for:
• Monitoring document size limits
• Validating content generation
• Progress tracking in automation
• Ensuring quality control
FINAL

"DOCS APPEND text={finalContent}"
SAY "✓ Final content appended (" || RESULT.textLength || " chars)"
SAY ""

SAY "Step 7: Getting final length..."
"DOCS GET_LENGTH"

SAY "✓ Final length"
SAY "  Document index length: " || RESULT.length || " chars"
SAY "  Actual text length: " || RESULT.textLength || " chars"
SAY ""

LET finalLength = RESULT.textLength

LET growthToUpdated = updatedLength - initialLength
LET growthToFinal = finalLength - updatedLength
LET totalGrowth = finalLength - initialLength

SAY "Length progression:"
SAY "  Initial:  " || initialLength || " chars"
SAY "  Updated:  " || updatedLength || " chars (+" || growthToUpdated || ")"
SAY "  Final:    " || finalLength || " chars (+" || growthToFinal || ")"
SAY "  Total growth: " || totalGrowth || " chars"
SAY ""

SAY "✓ Demo complete!"
SAY ""
SAY "This demonstrates:"
SAY "  • Getting document length at any time"
SAY "  • Tracking document growth during generation"
SAY "  • Both index length and text length metrics"
SAY "  • Perfect for size validation and monitoring"
SAY "  • Useful for progress tracking"
SAY ""
SAY "View at: https://docs.google.com/document/d/" || documentId

EXIT 0
