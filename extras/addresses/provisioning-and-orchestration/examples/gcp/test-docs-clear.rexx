#!/usr/bin/env rexx
/*
 * Test Google Docs CLEAR - Start fresh with elegant content generation
 * Demonstrates clearing existing content and building a new document from scratch
 */

PARSE ARG credFile, docId

SAY "Google Docs CLEAR & Rebuild Demo"
SAY "================================="
SAY ""

LET documentId = docId

/* Prepare fresh content */
LET newContent = <<FRESH_DOC
📋 QUARTERLY REPORT - Q4 2025
================================

Executive Summary
-----------------
This quarter marked exceptional growth across all metrics.
Revenue increased 45% YoY, reaching $3.2M.

Key Achievements
----------------
• Product Launch: Successfully launched RexxJS Pro
• Market Expansion: Entered 3 new geographic markets
• Team Growth: Hired 12 new team members
• Customer Satisfaction: NPS score increased to 72

Financial Highlights
--------------------
Revenue:        $3.2M (+45% YoY)
Gross Margin:   68%
Net Income:     $890K
ARR:            $12.8M

Looking Ahead
-------------
Q1 2026 will focus on:
1. Enterprise feature rollout
2. Strategic partnerships
3. International expansion
4. Product line diversification

This document was generated programmatically using RexxJS.
Last updated: $(date)
FRESH_DOC

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

SAY "Step 2: Reading current document state..."
"DOCS READ"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

LET originalLength = RESULT.length
SAY "✓ Current content: " || originalLength || " characters"
SAY ""

SAY "Step 3: Clearing all existing content..."
"DOCS CLEAR"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ " || RESULT.message
SAY "  Removed: " || RESULT.charactersRemoved || " characters"
SAY ""

SAY "Step 4: Inserting fresh quarterly report..."
"DOCS INSERT text={newContent}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ New content inserted"
SAY "  Length: " || RESULT.textLength || " characters"
SAY ""

SAY "Step 5: Verifying final state..."
"DOCS READ"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Final document: " || RESULT.length || " characters"
SAY ""
SAY "Transformation:"
SAY "  Before: " || originalLength || " chars (old content)"
SAY "  After:  " || RESULT.length || " chars (fresh quarterly report)"
SAY ""

SAY "✓ Demo complete!"
SAY ""
SAY "This demonstrates:"
SAY "  • CLEAR to start with blank slate"
SAY "  • INSERT to add fresh structured content"
SAY "  • Perfect for automated report generation"
SAY "  • Elegant workflow: CONNECT → CLEAR → INSERT"
SAY ""
SAY "View regenerated document at:"
SAY "https://docs.google.com/document/d/" || documentId

EXIT 0
