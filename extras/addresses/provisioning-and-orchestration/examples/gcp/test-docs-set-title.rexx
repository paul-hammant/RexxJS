#!/usr/bin/env rexx
/*
 * Test Google Docs SET_TITLE command
 * Demonstrates changing document titles programmatically
 */

PARSE ARG credFile, docId

SAY "Google Docs SET_TITLE Demo"
SAY "============================"
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
LET originalTitle = RESULT.document.title
SAY ""

SAY "Step 2: Creating initial content..."
LET content = <<CONTENT
Document Title Management Demo
==============================

This document demonstrates programmatic title management.
Perfect for automated document generation workflows.
CONTENT

"DOCS CLEAR"
"DOCS INSERT text={content}"
SAY "✓ Content created"
SAY ""

SAY "Step 3: Updating title to project report..."
LET projectTitle = "Q4 2025 Sales Analysis Report"
"DOCS SET_TITLE title={projectTitle}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ " || RESULT.message
SAY "  Old title: " || RESULT.oldTitle
SAY "  New title: " || RESULT.newTitle
SAY ""

SAY "Step 4: Updating title to status report..."
LET statusTitle = "Weekly Status Update - 2025-09-30"
"DOCS SET_TITLE title={statusTitle}"

SAY "✓ " || RESULT.message
SAY "  Old title: " || RESULT.oldTitle
SAY "  New title: " || RESULT.newTitle
SAY ""

SAY "Step 5: Updating to final title..."
LET finalTitle = "Document Title Management - Demo Complete"
"DOCS SET_TITLE title={finalTitle}"

SAY "✓ " || RESULT.message
SAY "  Old title: " || RESULT.oldTitle
SAY "  New title: " || RESULT.newTitle
SAY ""

SAY "Step 6: Restoring original title..."
"DOCS SET_TITLE title={originalTitle}"

SAY "✓ Title restored to: " || RESULT.newTitle
SAY ""

SAY "✓ Demo complete!"
SAY ""
SAY "This demonstrates:"
SAY "  • Changing document titles programmatically"
SAY "  • Perfect for automated workflows"
SAY "  • Ideal for generated reports with dynamic names"
SAY "  • Useful for document lifecycle management"
SAY "  • Can restore previous titles"
SAY ""
SAY "View at: https://docs.google.com/document/d/" || documentId

EXIT 0
