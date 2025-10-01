#!/usr/bin/env rexx
/*
 * Test Google Slides DELETE command
 * Demonstrates elegant slide removal with automatic cleanup
 */

PARSE ARG credFile, presId

SAY "Google Slides DELETE Demo"
SAY "=========================="
SAY ""

LET presentationId = presId

/* Content for a temporary slide we'll delete */
LET tempTitle = "Temporary Slide"
LET tempBody = <<TEMP
This slide will be deleted as part of the demo.

It demonstrates:
• Adding slides programmatically
• Capturing the slide ID automatically
• Deleting slides by ID
• Clean, elegant slide management
TEMP

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

SAY "Step 2: Adding temporary slide to delete..."
"SLIDES ADD_SLIDE title={tempTitle} body={tempBody}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

LET slideToDelete = RESULT.slideId
SAY "✓ Added slide: " || slideToDelete
SAY ""

SAY "Step 3: Reading presentation state..."
"SLIDES READ"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Presentation now has " || RESULT.presentation.slideCount || " slides"
SAY ""

SAY "Step 4: Deleting the slide..."
"SLIDES DELETE slide={slideToDelete}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ " || RESULT.message
SAY "  Deleted slide: " || slideToDelete
SAY ""

SAY "Step 5: Verifying deletion..."
"SLIDES READ"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

LET finalCount = RESULT.presentation.slideCount
SAY "✓ Presentation now has " || finalCount || " slides"
SAY ""
SAY "Verification:"
SAY "  Before: " || originalCount || " slides"
SAY "  After add: " || (originalCount + 1) || " slides"
SAY "  After delete: " || finalCount || " slides"
SAY ""

IF finalCount = originalCount THEN DO
  SAY "✓ Demo complete! Slide successfully deleted."
END
ELSE DO
  SAY "⚠ Warning: Expected " || originalCount || " slides, got " || finalCount
END

SAY ""
SAY "This demonstrates:"
SAY "  • Adding slides to get IDs"
SAY "  • Deleting slides by ID"
SAY "  • Clean slide management workflow"
SAY "  • Perfect for automated cleanup and slide rotation"
SAY ""
SAY "View at: https://docs.google.com/presentation/d/" || presentationId

EXIT 0
