#!/usr/bin/env rexx
/*
 * Google Slides Integration Demo
 * Demonstrates connecting, reading, adding slides, and inserting text
 */

PARSE ARG credFile, presentationId

SAY "Google Slides Integration Demo"
SAY "==============================="
SAY "Presentation ID: " || presentationId
SAY ""

LET presId = presentationId
LET timestamp = TIME()
LET testMessage = "RexxJS Test at " || timestamp

REQUIRE "./extras/addresses/provisioning-and-orchestration/address-gcp.js"

ADDRESS GCP

SAY "Step 1: Connecting to Google Slides presentation..."
"SLIDES CONNECT presentation={presId}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED to connect: RC=" || RC
  IF ERRORTEXT \= '' THEN SAY "  Error: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Connected to: " || RESULT.presentation.title
SAY "  Presentation ID: " || RESULT.presentation.presentationId
SAY "  Current slide count: " || RESULT.presentation.slideCount
SAY "  Revision ID: " || RESULT.presentation.revisionId
SAY ""

SAY "Step 2: Reading presentation structure..."
"SLIDES READ"

IF RC \= 0 THEN DO
  SAY "✗ FAILED to read: RC=" || RC
  IF ERRORTEXT \= '' THEN SAY "  Error: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Presentation structure retrieved"
SAY "  Total slides: " || RESULT.presentation.slideCount
SAY ""
SAY "Slides:"
LET slides = RESULT.slides
LET slideCount = RESULT.presentation.slideCount
DO i = 1 TO slideCount
  LET slide = ARRAY_GET(slides, i)
  SAY "  Slide " || i || ": " || slide.title || " (ID: " || slide.slideId || ")"
END
SAY ""

SAY "Step 3: Adding a new slide..."
"SLIDES ADD_SLIDE"

IF RC \= 0 THEN DO
  SAY "✗ FAILED to add slide: RC=" || RC
  IF ERRORTEXT \= '' THEN SAY "  Error: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Slide added successfully"
LET newSlideId = RESULT.slideId
SAY "  New slide ID: " || newSlideId
SAY ""

SAY "Step 4: Inserting text into the new slide..."
LET textContent = "Hello from RexxJS!\n\nGenerated at: " || testMessage
"SLIDES INSERT_TEXT slide={newSlideId} text={textContent}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED to insert text: RC=" || RC
  IF ERRORTEXT \= '' THEN SAY "  Error: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Text inserted successfully"
SAY "  Text length: " || RESULT.textLength || " characters"
SAY "  Text box ID: " || RESULT.textBoxId
SAY ""

SAY "Step 5: Reading updated presentation..."
"SLIDES READ"

IF RC \= 0 THEN DO
  SAY "✗ FAILED to read: RC=" || RC
  IF ERRORTEXT \= '' THEN SAY "  Error: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Updated presentation retrieved"
SAY "  Total slides: " || RESULT.presentation.slideCount
SAY ""

SAY "✓ Demo completed successfully!"
SAY ""
SAY "View your presentation at:"
SAY "https://docs.google.com/presentation/d/" || presId

EXIT 0
