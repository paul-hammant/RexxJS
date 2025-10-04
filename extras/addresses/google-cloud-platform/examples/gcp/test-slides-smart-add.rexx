#!/usr/bin/env rexx
/*
 * Test Google Slides Smart ADD with HEREDOC
 * Demonstrates elegant slide creation with title and body in one command
 */

PARSE ARG credFile, presId

SAY "Google Slides Smart ADD Demo"
SAY "============================"
SAY ""

LET presentationId = presId

/* Define slide content with HEREDOC - elegant and expressive! */
LET slide1Title = "Q4 2025 Results"
LET slide1Body = <<RESULTS
Key Achievements:
• Revenue: $2.5M (+35% YoY)
• New Customers: 450
• Product Launches: 3 major releases
• Team Growth: 15 new hires

Outlook: Strong momentum heading into 2026
RESULTS

LET slide2Title = "Technical Architecture"
LET slide2Body = <<ARCH
System Components:
────────────────────
┌─ Frontend: RexxJS + React
├─ Backend: Node.js + GCP
├─ Database: Firestore
└─ Storage: Cloud Storage

Benefits:
✓ Scalable
✓ Serverless
✓ Cost-effective
ARCH

REQUIRE "./extras/addresses/provisioning-and-orchestration/address-gcp.js"

ADDRESS GCP

SAY "Step 1: Connecting to presentation..."
"SLIDES CONNECT presentation={presentationId}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Connected to: " || RESULT.presentation.title
SAY "  Current slides: " || RESULT.presentation.slideCount
SAY ""

SAY "Step 2: Adding Q4 Results slide with HEREDOC content..."
"SLIDES ADD_SLIDE title={slide1Title} body={slide1Body}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ " || RESULT.message
SAY "  Slide ID: " || RESULT.slideId
SAY "  Has title: " || RESULT.hasTitle
SAY "  Has body: " || RESULT.hasBody
SAY ""

SAY "Step 3: Adding Technical Architecture slide..."
"SLIDES ADD_SLIDE title={slide2Title} body={slide2Body}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ " || RESULT.message
SAY "  Slide ID: " || RESULT.slideId
SAY ""

SAY "Step 4: Reading updated presentation..."
"SLIDES READ"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Presentation now has " || RESULT.presentation.slideCount || " slides"
SAY ""
SAY "Slides:"
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
SAY "  • One-command slide creation with title + body"
SAY "  • HEREDOC for multi-line, formatted content"
SAY "  • Elegant, expressive syntax"
SAY "  • No manual slide ID management needed!"
SAY ""
SAY "View at: https://docs.google.com/presentation/d/" || presentationId

EXIT 0
