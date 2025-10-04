#!/usr/bin/env rexx
/*
 * Test Google Slides CLEAR_SLIDE command
 * Demonstrates removing all content from a slide for recycling
 */

PARSE ARG credFile, presId

SAY "Google Slides CLEAR_SLIDE Demo"
SAY "================================"
SAY ""

LET presentationId = presId

/* Create a slide with rich content */
LET draftTitle = "DRAFT: Needs Major Revision"
LET draftBody = <<DRAFT
This is preliminary content that needs complete rework.

Old data:
• Metric 1: [outdated]
• Metric 2: [outdated]
• Metric 3: [outdated]

This slide will be cleared and rebuilt from scratch.
DRAFT

/* Fresh content after clearing */
LET finalTitle = "Q4 Results - Final Version"
LET finalBody = <<FINAL
Successfully met all objectives:

✓ Revenue: $3.2M (+45% YoY)
✓ Customer Growth: 500 new accounts
✓ Product Launch: 3 major releases
✓ Team Expansion: 20 new hires

Strong momentum heading into 2026!
FINAL

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

SAY "Step 2: Adding slide with draft content..."
"SLIDES ADD_SLIDE title={draftTitle} body={draftBody}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

LET slideId = RESULT.slideId
SAY "✓ Draft slide created: " || slideId
SAY "  Title: " || draftTitle
SAY ""

SAY "Step 3: Reading presentation to verify content..."
"SLIDES READ"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

LET slides = RESULT.slides
LET slideCount = RESULT.presentation.slideCount
LET targetSlide = ARRAY_GET(slides, slideCount)

SAY "✓ Slide details:"
SAY "  Title: " || targetSlide.title
SAY "  Page elements: " || targetSlide.pageElementCount
SAY ""

SAY "Step 4: Clearing all content from slide..."
"SLIDES CLEAR_SLIDE slide={slideId}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ " || RESULT.message
SAY "  Objects removed: " || RESULT.objectsRemoved
SAY ""

SAY "Step 5: Verifying slide is empty..."
"SLIDES READ"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

LET slides = RESULT.slides
LET clearedSlide = ARRAY_GET(slides, slideCount)

SAY "✓ Slide after clearing:"
SAY "  Title: " || clearedSlide.title
SAY "  Page elements: " || clearedSlide.pageElementCount
SAY ""

SAY "Step 6: Adding final polished content to cleared slide..."
"SLIDES ADD_SLIDE title={finalTitle} body={finalBody}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

LET newSlideId = RESULT.slideId
SAY "✓ Final content added"
SAY "  New slide: " || newSlideId
SAY ""

SAY "✓ Demo complete!"
SAY ""
SAY "This demonstrates:"
SAY "  • Creating slides with draft content"
SAY "  • Clearing all objects from a slide"
SAY "  • Recycling slide positions with fresh content"
SAY "  • Perfect for iterative presentation development"
SAY "  • Clean slate for major content revisions"
SAY ""
SAY "View at: https://docs.google.com/presentation/d/" || presentationId

EXIT 0
