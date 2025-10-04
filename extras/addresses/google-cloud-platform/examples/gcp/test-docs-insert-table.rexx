#!/usr/bin/env rexx
/*
 * Test Google Docs INSERT_TABLE command
 * Demonstrates creating tables for structured data
 */

PARSE ARG credFile, docId

SAY "Google Docs INSERT_TABLE Demo"
SAY "==============================="
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

SAY "Step 2: Creating document with table examples..."
LET intro = <<INTRO
Document Tables Demo
====================

This demonstrates creating tables for structured data.

Team Members:
INTRO

"DOCS CLEAR"
"DOCS INSERT text={intro}"
SAY "✓ Header inserted"
SAY ""

SAY "Step 3: Inserting team table (3x3)..."
"DOCS INSERT_TABLE rows=3 cols=3"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ " || RESULT.message
SAY "  Dimensions: " || RESULT.rows || " rows x " || RESULT.columns || " columns"
SAY ""

SAY "Step 4: Inserting timeline table (5x4)..."
"DOCS INSERT_TABLE rows=5 cols=4"

SAY "✓ " || RESULT.message
SAY "  Dimensions: " || RESULT.rows || " rows x " || RESULT.columns || " columns"
SAY ""

SAY "Step 5: Inserting budget table (6x2)..."
"DOCS INSERT_TABLE rows=6 cols=2"

SAY "✓ " || RESULT.message
SAY "  Dimensions: " || RESULT.rows || " rows x " || RESULT.columns || " columns"
SAY ""

SAY "Step 6: Checking final document..."
"DOCS GET_LENGTH"

SAY "✓ Document complete"
SAY "  Total length: " || RESULT.textLength || " chars"
SAY ""

SAY "✓ Demo complete!"
SAY ""
SAY "This demonstrates:"
SAY "  • Creating tables with specified rows and columns"
SAY "  • Perfect for structured data presentation"
SAY "  • Ideal for reports, dashboards, and documentation"
SAY "  • Tables inserted at current document position"
SAY "  • Supports up to 20x20 tables"
SAY ""
SAY "View at: https://docs.google.com/document/d/" || documentId

EXIT 0
