#!/usr/bin/env rexx
/*
 * Test Google Slides DUPLICATE command
 * Demonstrates elegant slide duplication for template-based workflows
 */

PARSE ARG credFile, presId

SAY "Google Slides DUPLICATE Demo"
SAY "============================="
SAY ""

LET presentationId = presId

/* Create a template slide with rich content */
LET templateTitle = "📊 Template: Quarterly Metrics"
LET templateBody = <<TEMPLATE
Key Performance Indicators:
• Revenue: $______
• Growth: ____%
• Customers: _____
• NPS Score: ___

Target Achievement:
✓ Goal 1: _____________
✓ Goal 2: _____________
✓ Goal 3: _____________
TEMPLATE

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

SAY "Step 2: Creating template slide..."
"SLIDES ADD_SLIDE title={templateTitle} body={templateBody}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

LET templateSlideId = RESULT.slideId
SAY "✓ Template slide created: " || templateSlideId
SAY ""

SAY "Step 3: Duplicating template for Q1..."
"SLIDES DUPLICATE slide={templateSlideId}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

LET q1SlideId = RESULT.newSlideId
SAY "✓ " || RESULT.message
SAY "  Original: " || templateSlideId
SAY "  Q1 Copy:  " || q1SlideId
SAY ""

SAY "Step 4: Duplicating template for Q2..."
"SLIDES DUPLICATE slide={templateSlideId}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

LET q2SlideId = RESULT.newSlideId
SAY "✓ " || RESULT.message
SAY "  Q2 Copy:  " || q2SlideId
SAY ""

SAY "Step 5: Reading final presentation..."
"SLIDES READ"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

LET finalCount = RESULT.presentation.slideCount
SAY "✓ Presentation now has " || finalCount || " slides"
SAY ""

SAY "Slides created:"
LET slides = RESULT.slides
DO i = (originalCount + 1) TO finalCount
  LET slide = ARRAY_GET(slides, i)
  SAY "  " || i || ". " || slide.title || " (" || slide.slideId || ")"
END
SAY ""

SAY "Summary:"
SAY "  Before: " || originalCount || " slides"
SAY "  After:  " || finalCount || " slides"
SAY "  Added:  1 template + 2 duplicates = 3 slides"
SAY ""

SAY "✓ Demo complete!"
SAY ""
SAY "This demonstrates:"
SAY "  • Creating a template slide with placeholder content"
SAY "  • Duplicating slides for repetitive structures"
SAY "  • Perfect for quarterly reports, multi-section decks"
SAY "  • Elegant workflow: template → duplicate → customize"
SAY ""
SAY "View at: https://docs.google.com/presentation/d/" || presentationId

EXIT 0
