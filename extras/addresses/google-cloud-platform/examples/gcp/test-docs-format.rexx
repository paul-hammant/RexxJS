#!/usr/bin/env rexx
/*
 * Test Google Docs FORMAT command
 * Demonstrates text formatting with bold, italic, underline, and size
 */

PARSE ARG credFile, docId

SAY "Google Docs FORMAT Demo"
SAY "======================="
SAY ""

LET documentId = docId

/* Create a document with sections to format */
LET styledDoc = <<DOCUMENT
FORMATTING SHOWCASE
===================

Section 1: This text will be made BOLD to emphasize importance.

Section 2: This elegant phrase will be rendered in italic style.

Section 3: This critical warning needs to be underlined for attention.

Section 4: This heading deserves a larger font size for prominence.

Section 5: Combine bold and italic for maximum impact on this statement.

End of document.
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

SAY "Step 2: Creating document with plain text..."
"DOCS CLEAR"
"DOCS INSERT text={styledDoc}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Document created (" || RESULT.textLength || " chars)"
SAY ""

SAY "Step 3: Reading document to locate formatting targets..."
"DOCS READ"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

LET content = RESULT.content
SAY "✓ Document length: " || RESULT.length || " characters"
SAY ""

SAY "Step 4: Applying formatting to specific sections..."
SAY ""

/* Format "BOLD" in bold */
LET boldPos = POS("BOLD", content)
IF boldPos > 0 THEN DO
  LET startIdx = boldPos - 1
  LET endIdx = boldPos + 3
  SAY "Applying bold to 'BOLD' (indices " || startIdx || "-" || endIdx || ")..."
  "DOCS FORMAT start={startIdx} end={endIdx} bold=true"
  SAY "✓ " || RESULT.message
  SAY ""
END

/* Format "elegant phrase" in italic */
LET elegantPos = POS("elegant phrase", content)
IF elegantPos > 0 THEN DO
  LET startIdx = elegantPos - 1
  LET endIdx = elegantPos + 13
  SAY "Applying italic to 'elegant phrase' (indices " || startIdx || "-" || endIdx || ")..."
  "DOCS FORMAT start={startIdx} end={endIdx} italic=true"
  SAY "✓ " || RESULT.message
  SAY ""
END

/* Underline "critical warning" */
LET warningPos = POS("critical warning", content)
IF warningPos > 0 THEN DO
  LET startIdx = warningPos - 1
  LET endIdx = warningPos + 15
  SAY "Applying underline to 'critical warning' (indices " || startIdx || "-" || endIdx || ")..."
  "DOCS FORMAT start={startIdx} end={endIdx} underline=true"
  SAY "✓ " || RESULT.message
  SAY ""
END

/* Increase font size for "larger font size" */
LET largerPos = POS("larger font size", content)
IF largerPos > 0 THEN DO
  LET startIdx = largerPos - 1
  LET endIdx = largerPos + 15
  SAY "Applying size 18pt to 'larger font size' (indices " || startIdx || "-" || endIdx || ")..."
  "DOCS FORMAT start={startIdx} end={endIdx} size=18"
  SAY "✓ " || RESULT.message
  SAY ""
END

/* Combine bold and italic */
LET maxPos = POS("maximum impact", content)
IF maxPos > 0 THEN DO
  LET startIdx = maxPos - 1
  LET endIdx = maxPos + 13
  SAY "Applying bold+italic to 'maximum impact' (indices " || startIdx || "-" || endIdx || ")..."
  "DOCS FORMAT start={startIdx} end={endIdx} bold=true italic=true"
  SAY "✓ " || RESULT.message
  SAY "  Formats: " || RESULT.fieldsUpdated.1 || ", " || RESULT.fieldsUpdated.2
  SAY ""
END

SAY "Step 5: Formatting complete!"
SAY ""

SAY "✓ Demo complete!"
SAY ""
SAY "This demonstrates:"
SAY "  • Bold formatting for emphasis"
SAY "  • Italic styling for elegance"
SAY "  • Underline for attention"
SAY "  • Font size adjustment"
SAY "  • Combining multiple formats"
SAY "  • Perfect for automated document styling"
SAY ""
SAY "View at: https://docs.google.com/document/d/" || documentId

EXIT 0
