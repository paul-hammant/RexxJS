#!/usr/bin/env rexx
/*
 * Test Google Slides REPLACE_TEXT command
 * Demonstrates bulk text replacement across presentation
 */

PARSE ARG credFile, presId

SAY "Google Slides REPLACE_TEXT Demo"
SAY "================================="
SAY ""

LET presentationId = presId

/* Create template slides with placeholders */
LET slide1Title = "{{COMPANY}} Overview"
LET slide1Body = <<SLIDE1
Founded: {{YEAR}}
Employees: {{EMPLOYEES}}
Revenue: {{REVENUE}}

Mission: {{MISSION}}
SLIDE1

LET slide2Title = "{{PRODUCT}} Features"
LET slide2Body = <<SLIDE2
Key Benefits:
• {{BENEFIT1}}
• {{BENEFIT2}}
• {{BENEFIT3}}

Contact: {{EMAIL}}
SLIDE2

/* Actual values to substitute */
LET companyName = "RexxJS Solutions"
LET foundedYear = "2024"
LET employeeCount = "50"
LET revenue = "$5M"
LET mission = "Bringing classic REXX elegance to modern cloud platforms"
LET productName = "RexxJS Pro"
LET benefit1 = "Cloud-native scripting"
LET benefit2 = "Google API integration"
LET benefit3 = "Elegant syntax"
LET contactEmail = "hello@rexxjs.dev"

REQUIRE "./extras/addresses/provisioning-and-orchestration/address-gcp.js"

ADDRESS GCP

SAY "Step 1: Connecting to presentation..."
"SLIDES CONNECT presentation={presentationId}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Connected to: " || RESULT.presentation.title
LET baseCount = RESULT.presentation.slideCount
SAY ""

SAY "Step 2: Adding template slides with placeholders..."
SAY ""

"SLIDES ADD_SLIDE title={slide1Title} body={slide1Body}"
SAY "✓ Added template slide 1"

"SLIDES ADD_SLIDE title={slide2Title} body={slide2Body}"
SAY "✓ Added template slide 2"
SAY ""

SAY "Step 3: Replacing all placeholders across presentation..."
SAY ""

/* Replace company and product info */
"SLIDES REPLACE_TEXT find={{COMPANY}} replace={companyName}"
SAY "  ✓ {{COMPANY}} → " || companyName || " (" || RESULT.occurrencesChanged || ")"

"SLIDES REPLACE_TEXT find={{PRODUCT}} replace={productName}"
SAY "  ✓ {{PRODUCT}} → " || productName || " (" || RESULT.occurrencesChanged || ")"

/* Replace company details */
"SLIDES REPLACE_TEXT find={{YEAR}} replace={foundedYear}"
SAY "  ✓ {{YEAR}} → " || foundedYear || " (" || RESULT.occurrencesChanged || ")"

"SLIDES REPLACE_TEXT find={{EMPLOYEES}} replace={employeeCount}"
SAY "  ✓ {{EMPLOYEES}} → " || employeeCount || " (" || RESULT.occurrencesChanged || ")"

"SLIDES REPLACE_TEXT find={{REVENUE}} replace={revenue}"
SAY "  ✓ {{REVENUE}} → " || revenue || " (" || RESULT.occurrencesChanged || ")"

"SLIDES REPLACE_TEXT find={{MISSION}} replace={mission}"
SAY "  ✓ {{MISSION}} → " || mission || " (" || RESULT.occurrencesChanged || ")"

/* Replace product features */
"SLIDES REPLACE_TEXT find={{BENEFIT1}} replace={benefit1}"
SAY "  ✓ {{BENEFIT1}} → " || benefit1 || " (" || RESULT.occurrencesChanged || ")"

"SLIDES REPLACE_TEXT find={{BENEFIT2}} replace={benefit2}"
SAY "  ✓ {{BENEFIT2}} → " || benefit2 || " (" || RESULT.occurrencesChanged || ")"

"SLIDES REPLACE_TEXT find={{BENEFIT3}} replace={benefit3}"
SAY "  ✓ {{BENEFIT3}} → " || benefit3 || " (" || RESULT.occurrencesChanged || ")"

"SLIDES REPLACE_TEXT find={{EMAIL}} replace={contactEmail}"
SAY "  ✓ {{EMAIL}} → " || contactEmail || " (" || RESULT.occurrencesChanged || ")"

SAY ""
SAY "✓ All placeholders replaced!"
SAY ""

SAY "Step 4: Reading updated presentation..."
"SLIDES READ"

SAY "✓ Presentation now has " || RESULT.presentation.slideCount || " slides"
SAY ""
SAY "New slides:"
LET slides = RESULT.slides
LET count = RESULT.presentation.slideCount
DO i = (baseCount + 1) TO count
  LET slide = ARRAY_GET(slides, i)
  SAY "  " || i || ". " || slide.title
END
SAY ""

SAY "✓ Demo complete!"
SAY ""
SAY "This demonstrates:"
SAY "  • Template-based presentations with placeholders"
SAY "  • Bulk text replacement across all slides"
SAY "  • Perfect for automated report generation"
SAY "  • Similar to mail merge but for presentations"
SAY ""
SAY "View at: https://docs.google.com/presentation/d/" || presentationId

EXIT 0
