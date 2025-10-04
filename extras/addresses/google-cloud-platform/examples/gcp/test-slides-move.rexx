#!/usr/bin/env rexx
/*
 * Test Google Slides MOVE command
 * Demonstrates elegant slide reordering for presentation organization
 */

PARSE ARG credFile, presId

SAY "Google Slides MOVE Demo"
SAY "========================"
SAY ""

LET presentationId = presId

/* Create slides for a logical flow */
LET slide1Title = "1. Introduction"
LET slide2Title = "2. Problem Statement"
LET slide3Title = "3. Solution"

LET slide1Body = "Welcome to our presentation"
LET slide2Body = "Current challenges we're facing"
LET slide3Body = "Our innovative approach"

REQUIRE "./extras/addresses/provisioning-and-orchestration/address-gcp.js"

ADDRESS GCP

SAY "Step 1: Connecting to presentation..."
"SLIDES CONNECT presentation={presentationId}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Connected to: " || RESULT.presentation.title
LET originalCount = RESULT.presentation.slideCount
SAY "  Current slides: " || originalCount
SAY ""

SAY "Step 2: Adding slides in random order..."
SAY ""

"SLIDES ADD_SLIDE title={slide3Title} body={slide3Body}"
LET slide3Id = RESULT.slideId
SAY "✓ Added: " || slide3Title || " (" || slide3Id || ")"

"SLIDES ADD_SLIDE title={slide1Title} body={slide1Body}"
LET slide1Id = RESULT.slideId
SAY "✓ Added: " || slide1Title || " (" || slide1Id || ")"

"SLIDES ADD_SLIDE title={slide2Title} body={slide2Body}"
LET slide2Id = RESULT.slideId
SAY "✓ Added: " || slide2Title || " (" || slide2Id || ")"

SAY ""

SAY "Step 3: Reading current (wrong) order..."
"SLIDES READ"

SAY "Current order:"
LET slides = RESULT.slides
LET count = RESULT.presentation.slideCount
DO i = 1 TO count
  LET slide = ARRAY_GET(slides, i)
  SAY "  " || i || ". " || slide.title
END
SAY ""

SAY "Step 4: Reordering to logical sequence..."
SAY ""

/* Move slide 1 (Introduction) to position after original slides */
LET targetPos = originalCount + 1
SAY "Moving '" || slide1Title || "' to position " || targetPos
"SLIDES MOVE slide={slide1Id} index={targetPos}"
SAY "✓ " || RESULT.message
SAY ""

/* Move slide 2 (Problem) to next position */
LET targetPos = originalCount + 2
SAY "Moving '" || slide2Title || "' to position " || targetPos
"SLIDES MOVE slide={slide2Id} index={targetPos}"
SAY "✓ " || RESULT.message
SAY ""

/* Move slide 3 (Solution) to next position */
LET targetPos = originalCount + 3
SAY "Moving '" || slide3Title || "' to position " || targetPos
"SLIDES MOVE slide={slide3Id} index={targetPos}"
SAY "✓ " || RESULT.message
SAY ""

SAY "Step 5: Reading final (correct) order..."
"SLIDES READ"

SAY "Final order:"
LET slides = RESULT.slides
LET count = RESULT.presentation.slideCount
DO i = 1 TO count
  LET slide = ARRAY_GET(slides, i)
  SAY "  " || i || ". " || slide.title
END
SAY ""

SAY "✓ Demo complete!"
SAY ""
SAY "This demonstrates:"
SAY "  • Adding slides in any order"
SAY "  • Rearranging slides programmatically"
SAY "  • Creating logical flow in presentations"
SAY "  • Perfect for automated deck organization"
SAY ""
SAY "View at: https://docs.google.com/presentation/d/" || presentationId

EXIT 0
