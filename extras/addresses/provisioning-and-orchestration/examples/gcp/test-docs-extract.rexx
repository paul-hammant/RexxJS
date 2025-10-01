#!/usr/bin/env rexx
/*
 * Test Google Docs EXTRACT command
 * Demonstrates extracting text ranges for analysis and processing
 */

PARSE ARG credFile, docId

SAY "Google Docs EXTRACT Demo"
SAY "========================="
SAY ""

LET documentId = docId

/* Create a document with sections for extraction */
LET article = <<ARTICLE
The Future of Cloud Computing
==============================

Executive Summary
-----------------
Cloud computing continues to transform how businesses operate.
This report examines key trends and predictions for 2026.

Market Analysis
---------------
The global cloud market is projected to reach $832 billion by 2026,
growing at a CAGR of 17.5%. Key drivers include digital transformation
initiatives and the rise of AI/ML workloads.

Technical Innovations
---------------------
Edge computing and serverless architectures are gaining momentum.
Organizations are adopting multi-cloud strategies to avoid vendor lock-in
and optimize costs across different service providers.

Conclusion
----------
Cloud adoption will accelerate as technologies mature and costs decline.
Organizations must develop cloud-native strategies to remain competitive.
ARTICLE

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

SAY "Step 2: Creating document..."
"DOCS CLEAR"
"DOCS INSERT text={article}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Document created (" || RESULT.textLength || " chars)"
SAY ""

SAY "Step 3: Finding 'Executive Summary' section..."
"DOCS FIND text=Executive Summary"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

LET occurrences = RESULT.occurrences
LET firstOcc = ARRAY_GET(occurrences, 1)
SAY "✓ Found at position " || firstOcc.startIndex
SAY ""

SAY "Step 4: Extracting the Executive Summary section..."
/* Extract from start of "Executive Summary" to "Market Analysis" */
LET summaryStart = firstOcc.startIndex
LET summaryEnd = summaryStart + 200

"DOCS EXTRACT start={summaryStart} end={summaryEnd}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ " || RESULT.message
SAY "  Range: [" || RESULT.startIndex || ", " || RESULT.endIndex || ")"
SAY "  Length: " || RESULT.length || " chars"
SAY ""
SAY "Extracted text:"
SAY "-------------------------------------------"
SAY RESULT.text
SAY "-------------------------------------------"
SAY ""

SAY "Step 5: Finding and extracting specific data..."
"DOCS FIND text=$832 billion"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

IF RESULT.count > 0 THEN DO
  SAY "✓ Found market size figure"

  /* Extract surrounding context (50 chars before and after) */
  LET occurrences = RESULT.occurrences
  LET figureOcc = ARRAY_GET(occurrences, 1)
  LET figureStart = figureOcc.startIndex
  LET contextStart = figureStart - 50
  LET contextEnd = figureStart + 100

  SAY ""
  SAY "Step 6: Extracting context around the figure..."
  "DOCS EXTRACT start={contextStart} end={contextEnd}"

  IF RC \= 0 THEN DO
    SAY "✗ FAILED: " || ERRORTEXT
    EXIT 1
  END

  SAY "✓ Context extracted"
  SAY ""
  SAY "Context around '$832 billion':"
  SAY "-------------------------------------------"
  SAY RESULT.text
  SAY "-------------------------------------------"
  SAY ""
END

SAY "Step 7: Extracting specific character range..."
"DOCS EXTRACT start=1 end=50"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ First 50 characters:"
SAY "  '" || RESULT.text || "'"
SAY ""

SAY "✓ Demo complete!"
SAY ""
SAY "This demonstrates:"
SAY "  • Extracting text from specific character ranges"
SAY "  • Combining FIND and EXTRACT for targeted extraction"
SAY "  • Extracting context around search terms"
SAY "  • Perfect for document analysis and data mining"
SAY "  • Enables intelligent content processing"
SAY ""
SAY "View at: https://docs.google.com/document/d/" || documentId

EXIT 0
