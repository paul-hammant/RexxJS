#!/usr/bin/env rexx
/*
 * Test Google Slides GET_SLIDE command
 * Demonstrates getting slides by index for easy manipulation
 */

PARSE ARG credFile, presId

SAY "Google Slides GET_SLIDE Demo"
SAY "============================="
SAY ""

LET presentationId = presId

REQUIRE "./extras/addresses/provisioning-and-orchestration/address-gcp.js"

ADDRESS GCP

SAY "Step 1: Connecting to presentation..."
"SLIDES CONNECT presentation={presentationId}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Connected to: " || RESULT.presentation.title
SAY ""

SAY "Step 2: Reading presentation to see all slides..."
"SLIDES READ"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

LET slideCount = RESULT.presentation.slideCount
SAY "✓ Presentation has " || slideCount || " slides"
SAY ""

SAY "Listing all slides:"
LET slides = RESULT.slides
DO i = 1 TO slideCount
  LET slide = ARRAY_GET(slides, i)
  SAY "  [" || (i - 1) || "] " || slide.title || " (ID: " || slide.slideId || ")"
END
SAY ""

SAY "Step 3: Getting first slide by index..."
"SLIDES GET_SLIDE index=0"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ " || RESULT.message
SAY "  Index: " || RESULT.index
SAY "  Slide ID: " || RESULT.slideId
SAY "  Title: " || RESULT.slide.title
SAY "  Page elements: " || RESULT.slide.pageElementCount
SAY ""

LET firstSlideId = RESULT.slideId

SAY "Step 4: Getting last slide by index..."
LET lastIndex = slideCount - 1
"SLIDES GET_SLIDE index={lastIndex}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ " || RESULT.message
SAY "  Index: " || RESULT.index
SAY "  Slide ID: " || RESULT.slideId
SAY "  Title: " || RESULT.slide.title
SAY ""

LET lastSlideId = RESULT.slideId

SAY "Step 5: Using GET_SLIDE result to manipulate slides..."
SAY ""

/* Clear the first slide */
SAY "Clearing first slide (index 0)..."
"SLIDES CLEAR_SLIDE slide={firstSlideId}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ First slide cleared (" || RESULT.objectsRemoved || " objects removed)"
SAY ""

/* Duplicate the last slide */
SAY "Duplicating last slide..."
"SLIDES DUPLICATE slide={lastSlideId}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

LET newSlideId = RESULT.newSlideId
SAY "✓ Last slide duplicated"
SAY "  Original: " || lastSlideId
SAY "  Duplicate: " || newSlideId
SAY ""

SAY "Step 6: Verifying changes..."
"SLIDES READ"

SAY "✓ Updated presentation has " || RESULT.presentation.slideCount || " slides"
SAY ""

SAY "✓ Demo complete!"
SAY ""
SAY "This demonstrates:"
SAY "  • Getting slides by index position (0-based)"
SAY "  • Retrieving slide IDs for manipulation"
SAY "  • Using GET_SLIDE with other commands"
SAY "  • Perfect for index-based slide operations"
SAY "  • No need to manually track slide IDs"
SAY ""
SAY "View at: https://docs.google.com/presentation/d/" || presentationId

EXIT 0
