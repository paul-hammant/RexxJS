#!/usr/bin/env rexx
/*
 * Test Google Slides SET_BACKGROUND command
 * Demonstrates setting slide background colors for visual impact
 */

PARSE ARG credFile, presId

SAY "Google Slides SET_BACKGROUND Demo"
SAY "==================================="
SAY ""

LET presentationId = presId

/* Create branded slides with different colors */
LET titleSlide = "Brand Color Palette"
LET slide1Title = "Primary Brand Color"
LET slide2Title = "Secondary Accent"
LET slide3Title = "Dark Theme"
LET slide4Title = "Light Theme"

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

SAY "Step 2: Adding branded slides..."
SAY ""

"SLIDES ADD_SLIDE title={titleSlide}"
LET titleSlideId = RESULT.slideId
SAY "✓ Title slide: " || titleSlideId

"SLIDES ADD_SLIDE title={slide1Title}"
LET slide1Id = RESULT.slideId
SAY "✓ Slide 1: " || slide1Id

"SLIDES ADD_SLIDE title={slide2Title}"
LET slide2Id = RESULT.slideId
SAY "✓ Slide 2: " || slide2Id

"SLIDES ADD_SLIDE title={slide3Title}"
LET slide3Id = RESULT.slideId
SAY "✓ Slide 3: " || slide3Id

"SLIDES ADD_SLIDE title={slide4Title}"
LET slide4Id = RESULT.slideId
SAY "✓ Slide 4: " || slide4Id

SAY ""

SAY "Step 3: Applying brand colors..."
SAY ""

/* Title slide - Corporate blue */
LET corporateBlue = "#1E3A8A"
SAY "Setting title slide to corporate blue (" || corporateBlue || ")..."
"SLIDES SET_BACKGROUND slide={titleSlideId} color={corporateBlue}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ " || RESULT.message
SAY "  Color: " || RESULT.color
SAY ""

/* Slide 1 - Vibrant red */
LET vibrantRed = "#DC2626"
SAY "Setting slide 1 to vibrant red (" || vibrantRed || ")..."
"SLIDES SET_BACKGROUND slide={slide1Id} color={vibrantRed}"
SAY "✓ " || RESULT.message
SAY "  Color: " || RESULT.color
SAY ""

/* Slide 2 - Emerald green */
LET emeraldGreen = "#059669"
SAY "Setting slide 2 to emerald green (" || emeraldGreen || ")..."
"SLIDES SET_BACKGROUND slide={slide2Id} color={emeraldGreen}"
SAY "✓ " || RESULT.message
SAY "  Color: " || RESULT.color
SAY ""

/* Slide 3 - Dark slate */
LET darkSlate = "#1E293B"
SAY "Setting slide 3 to dark slate (" || darkSlate || ")..."
"SLIDES SET_BACKGROUND slide={slide3Id} color={darkSlate}"
SAY "✓ " || RESULT.message
SAY "  Color: " || RESULT.color
SAY ""

/* Slide 4 - Light cream */
LET lightCream = "#FFFBEB"
SAY "Setting slide 4 to light cream (" || lightCream || ")..."
"SLIDES SET_BACKGROUND slide={slide4Id} color={lightCream}"
SAY "✓ " || RESULT.message
SAY "  Color: " || RESULT.color
SAY ""

SAY "Step 4: Verifying presentation..."
"SLIDES READ"

SAY "✓ Presentation now has " || RESULT.presentation.slideCount || " slides"
SAY ""

SAY "Color palette applied:"
SAY "  Title:     Corporate Blue  " || corporateBlue
SAY "  Slide 1:   Vibrant Red     " || vibrantRed
SAY "  Slide 2:   Emerald Green   " || emeraldGreen
SAY "  Slide 3:   Dark Slate      " || darkSlate
SAY "  Slide 4:   Light Cream     " || lightCream
SAY ""

SAY "✓ Demo complete!"
SAY ""
SAY "This demonstrates:"
SAY "  • Setting slide background colors with hex values"
SAY "  • Creating branded presentations"
SAY "  • Visual hierarchy through color"
SAY "  • Perfect for automated deck theming"
SAY "  • Supports #RRGGBB format"
SAY ""
SAY "View at: https://docs.google.com/presentation/d/" || presentationId

EXIT 0
