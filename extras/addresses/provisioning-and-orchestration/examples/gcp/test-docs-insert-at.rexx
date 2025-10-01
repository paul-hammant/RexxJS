#!/usr/bin/env rexx
/*
 * Test Google Docs INSERT_AT command
 * Demonstrates precise text insertion at specific positions
 */

PARSE ARG credFile, docId

SAY "Google Docs INSERT_AT Demo"
SAY "==========================="
SAY ""

LET documentId = docId

/* Create a story with gaps that we'll fill in */
LET storyBeginning = <<STORY_START
THE ADVENTURE BEGINS
===================

Once upon a time, in a land far away,

[INSERT CHARACTER HERE]

One day, something extraordinary happened:

[INSERT EVENT HERE]

And so the adventure began...
STORY_START

/* Content to insert at specific positions */
LET characterIntro = <<CHARACTER
there lived a brave knight named Sir Reginald.
He was known throughout the kingdom for his courage
and his unwavering sense of justice.
CHARACTER

LET eventDesc = <<EVENT
A mysterious dragon appeared in the northern mountains,
threatening the peaceful villages below. The king sent
word that a hero was needed to investigate.
EVENT

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

SAY "Step 2: Clearing document and inserting template..."
"DOCS CLEAR"
"DOCS INSERT text={storyBeginning}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Template inserted (" || RESULT.textLength || " chars)"
SAY ""

SAY "Step 3: Reading document to find insertion points..."
"DOCS READ"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

LET content = RESULT.content
SAY "✓ Current content: " || RESULT.length || " characters"
SAY ""

/* Find where to insert character description */
LET charMarker = "[INSERT CHARACTER HERE]"
LET charPos = POS(charMarker, content)

IF charPos > 0 THEN DO
  SAY "Step 4: Inserting character description at position " || (charPos - 1) || "..."
  LET insertIndex = charPos - 1
  "DOCS INSERT_AT index={insertIndex} text={characterIntro}"

  IF RC \= 0 THEN DO
    SAY "✗ FAILED: " || ERRORTEXT
    EXIT 1
  END

  SAY "✓ " || RESULT.message
  SAY "  Inserted " || RESULT.textLength || " characters"
  SAY ""
END

SAY "Step 5: Reading updated document..."
"DOCS READ"
LET content = RESULT.content

/* Find where to insert event description */
LET eventMarker = "[INSERT EVENT HERE]"
LET eventPos = POS(eventMarker, content)

IF eventPos > 0 THEN DO
  SAY "Step 6: Inserting event description at position " || (eventPos - 1) || "..."
  LET insertIndex = eventPos - 1
  "DOCS INSERT_AT index={insertIndex} text={eventDesc}"

  IF RC \= 0 THEN DO
    SAY "✗ FAILED: " || ERRORTEXT
    EXIT 1
  END

  SAY "✓ " || RESULT.message
  SAY "  Inserted " || RESULT.textLength || " characters"
  SAY ""
END

SAY "Step 7: Reading final story..."
"DOCS READ"

SAY "✓ Final document: " || RESULT.length || " characters"
SAY ""

SAY "✓ Demo complete!"
SAY ""
SAY "This demonstrates:"
SAY "  • Precise insertion at calculated positions"
SAY "  • Finding markers and replacing with content"
SAY "  • Building documents programmatically"
SAY "  • Perfect for template filling and dynamic content"
SAY ""
SAY "View at: https://docs.google.com/document/d/" || documentId

EXIT 0
