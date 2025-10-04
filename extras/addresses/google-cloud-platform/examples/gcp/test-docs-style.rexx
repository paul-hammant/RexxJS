#!/usr/bin/env rexx
/*
 * Test Google Docs STYLE command
 * Demonstrates paragraph styling with headings, title, and subtitle
 */

PARSE ARG credFile, docId

SAY "Google Docs STYLE Demo"
SAY "======================"
SAY ""

LET documentId = docId

/* Create a document structure with content for styling */
LET structuredDoc = <<DOCUMENT
RexxJS Cloud Integration Guide

A Comprehensive Overview

Introduction

RexxJS brings the elegance of classic REXX to modern cloud platforms. This guide demonstrates the powerful Google Docs integration capabilities.

Getting Started

Installation and Setup

To begin using RexxJS with Google Cloud, you'll need to set up authentication and enable the required APIs.

Core Features

Document Manipulation

The DOCS ADDRESS provides elegant commands for reading, writing, and formatting Google Docs programmatically.

Advanced Topics

Best Practices

Following these guidelines will ensure optimal performance and maintainability of your RexxJS scripts.

Conclusion

RexxJS makes cloud automation elegant and accessible to developers familiar with REXX.
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

SAY "Step 2: Creating document with unstyled content..."
"DOCS CLEAR"
"DOCS INSERT text={structuredDoc}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Document created (" || RESULT.textLength || " chars)"
SAY ""

SAY "Step 3: Reading document to locate sections..."
"DOCS READ"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

LET content = RESULT.content
SAY "✓ Document length: " || RESULT.length || " characters"
SAY ""

SAY "Step 4: Applying paragraph styles..."
SAY ""

/* Apply TITLE style to the first line */
LET titleText = "RexxJS Cloud Integration Guide"
LET titlePos = POS(titleText, content)
IF titlePos > 0 THEN DO
  /* Add 1 to avoid operating on first section break (index 0) */
  LET startIdx = titlePos
  LET endIdx = titlePos + LENGTH(titleText)
  SAY "Applying TITLE style to main heading..."
  "DOCS STYLE start={startIdx} end={endIdx} type=TITLE"
  SAY "✓ " || RESULT.message || " (" || RESULT.styleType || ")"
  SAY ""
END

/* Apply SUBTITLE */
LET subtitleText = "A Comprehensive Overview"
LET subtitlePos = POS(subtitleText, content)
IF subtitlePos > 0 THEN DO
  LET startIdx = subtitlePos
  LET endIdx = subtitlePos + LENGTH(subtitleText)
  SAY "Applying SUBTITLE style..."
  "DOCS STYLE start={startIdx} end={endIdx} type=SUBTITLE"
  SAY "✓ " || RESULT.message
  SAY ""
END

/* Apply H1 to major sections */
LET h1Sections.1 = "Introduction"
LET h1Sections.2 = "Getting Started"
LET h1Sections.3 = "Core Features"
LET h1Sections.4 = "Advanced Topics"
LET h1Sections.5 = "Conclusion"

SAY "Applying HEADING_1 to major sections..."
DO i = 1 TO 5
  LET sectionText = h1Sections.i
  LET sectionPos = POS(sectionText, content)
  IF sectionPos > 0 THEN DO
    LET startIdx = sectionPos
    LET endIdx = sectionPos + LENGTH(sectionText)
    "DOCS STYLE start={startIdx} end={endIdx} type=H1"
    SAY "  ✓ " || sectionText || " → HEADING_1"
  END
END
SAY ""

/* Apply H2 to subsections */
LET h2Sections.1 = "Installation and Setup"
LET h2Sections.2 = "Document Manipulation"
LET h2Sections.3 = "Best Practices"

SAY "Applying HEADING_2 to subsections..."
DO i = 1 TO 3
  LET sectionText = h2Sections.i
  LET sectionPos = POS(sectionText, content)
  IF sectionPos > 0 THEN DO
    LET startIdx = sectionPos
    LET endIdx = sectionPos + LENGTH(sectionText)
    "DOCS STYLE start={startIdx} end={endIdx} type=H2"
    SAY "  ✓ " || sectionText || " → HEADING_2"
  END
END
SAY ""

SAY "✓ All styles applied!"
SAY ""

SAY "✓ Demo complete!"
SAY ""
SAY "This demonstrates:"
SAY "  • TITLE for document main heading"
SAY "  • SUBTITLE for document subtitle"
SAY "  • HEADING_1 for major sections"
SAY "  • HEADING_2 for subsections"
SAY "  • Perfect for automated document structure"
SAY "  • Creates professional document hierarchy"
SAY ""
SAY "View at: https://docs.google.com/document/d/" || documentId

EXIT 0
