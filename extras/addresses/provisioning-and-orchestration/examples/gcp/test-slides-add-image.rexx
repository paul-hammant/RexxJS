#!/usr/bin/env rexx
/*
 * Test Google Slides ADD_IMAGE command
 * Demonstrates adding images from URLs to slides
 */

PARSE ARG credFile, presId

SAY "Google Slides ADD_IMAGE Demo"
SAY "=============================="
SAY ""

LET presentationId = presId

/* Public image URLs for testing */
LET logoUrl = "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png"
LET chartUrl = "https://developers.google.com/static/chart/image/chart?cht=p&chs=400x200&chd=t:60,40&chl=Revenue|Expenses"
LET iconUrl = "https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png"

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

SAY "Step 2: Creating slides for image demo..."
SAY ""

"SLIDES ADD_SLIDE title=Logo Slide"
LET logoSlideId = RESULT.slideId
SAY "✓ Logo slide: " || logoSlideId

"SLIDES ADD_SLIDE title=Chart Slide"
LET chartSlideId = RESULT.slideId
SAY "✓ Chart slide: " || chartSlideId

"SLIDES ADD_SLIDE title=Icon Slide"
LET iconSlideId = RESULT.slideId
SAY "✓ Icon slide: " || iconSlideId

SAY ""

SAY "Step 3: Adding logo image..."
"SLIDES ADD_IMAGE slide={logoSlideId} url={logoUrl}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ " || RESULT.message
SAY "  Image ID: " || RESULT.imageId
SAY "  URL: " || RESULT.url
SAY ""

SAY "Step 4: Adding chart image..."
"SLIDES ADD_IMAGE slide={chartSlideId} url={chartUrl}"

SAY "✓ " || RESULT.message
SAY "  Image ID: " || RESULT.imageId
SAY ""

SAY "Step 5: Adding icon image..."
"SLIDES ADD_IMAGE slide={iconSlideId} url={iconUrl}"

SAY "✓ " || RESULT.message
SAY "  Image ID: " || RESULT.imageId
SAY ""

SAY "Step 6: Verifying presentation..."
"SLIDES READ"

SAY "✓ Presentation now has " || RESULT.presentation.slideCount || " slides"
SAY ""

SAY "✓ Demo complete!"
SAY ""
SAY "This demonstrates:"
SAY "  • Adding images from public URLs"
SAY "  • Images automatically centered and sized"
SAY "  • Perfect for logos, charts, and diagrams"
SAY "  • Ideal for automated presentation generation"
SAY "  • Works with PNG, JPG, and other formats"
SAY ""
SAY "View at: https://docs.google.com/presentation/d/" || presentationId

EXIT 0
