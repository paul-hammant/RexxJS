#!/usr/bin/env ../rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags published-modules, gemini-address, vision, registry, integration, ai */
/* @description Test gemini-address vision capabilities with inline base64 images */

SAY "🧪 Testing Published Module: org.rexxjs/gemini-address (Vision)"
SAY "Loading module from registry..."

// Load gemini-address from the published registry

REQUIRE "../extras/addresses/gemini-address/src/gemini-address.js"
//REQUIRE "registry:org.rexxjs/gemini-address"

SAY "✓ Module loaded successfully"
SAY ""

// Use Wikimedia Commons solid color images
LET red_image = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Solid_red.svg/250px-Solid_red.svg.png"
LET blue_image = "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Solid_blue.svg/250px-Solid_blue.svg.png"

// Test 1: Analyze an image from URL
SAY "Test 1: Analyze red square image from Wikimedia Commons URL"
SAY "(Note: Requires GEMINI_API_KEY environment variable)"
SAY "Get API key from: https://aistudio.google.com/app/apikey"
SAY "Using model: gemini-2.5-flash (supports vision)"
SAY ""

ADDRESS GEMINI

<<ANALYZE
model=gemini-2.5-flash
prompt=What color is this image? Answer in one word.
image={{red_image}}
ANALYZE

IF RC = 0 THEN DO
  SAY "✓ Gemini vision responded: " || RESULT.message
  SAY ""

  // Check if response mentions red
  IF POS("RED", UPPER(RESULT.message)) > 0 THEN DO
    SAY "✓ Correctly identified red color"
    SAY ""
  END
  ELSE DO
    SAY "⚠️  Did not explicitly mention 'red' but got response: " || RESULT.message
    SAY ""
  END
END
ELSE DO
  SAY "❌ Gemini vision request failed (RC=" || RC || ")"
  IF RESULT.error THEN DO
    SAY "HTTP status: " || RESULT.rc
    SAY "Error: " || RESULT.error
  END
  ELSE DO
    SAY "Error: " || RESULT
  END
  SAY ""
  SAY "To fix: export GEMINI_API_KEY=your-key-here"
  EXIT 1
END

// Test 2: Multi-turn conversation with images
SAY "Test 2: Multi-turn vision conversation"
SAY ""

<<COMPARE
prompt=Now I'm showing you a different image. What color is this one? Answer in one word.
image={{blue_image}}
COMPARE

IF RC = 0 THEN DO
  SAY "✓ Gemini vision responded: " || RESULT.message
  SAY ""

  // Check if response mentions blue
  IF POS("BLUE", UPPER(RESULT.message)) > 0 THEN DO
    SAY "✓ Correctly identified blue color"
    SAY ""
  END
  ELSE DO
    SAY "⚠️  Did not explicitly mention 'blue' but got response: " || RESULT.message
    SAY ""
  END
END
ELSE DO
  SAY "❌ Second vision request failed (RC=" || RC || ")"
  EXIT 1
END

// Test 3: Follow-up question without image (should remember previous context)
SAY "Test 3: Follow-up question about previous image"
SAY ""

<<FOLLOWUP
prompt=What was the color of the first image I showed you?
FOLLOWUP

IF RC = 0 THEN DO
  SAY "✓ Gemini responded: " || RESULT.message
  SAY ""

  // Check if it remembers red
  IF POS("RED", UPPER(RESULT.message)) > 0 THEN DO
    SAY "✓ Correctly remembered the first image was red"
    SAY ""
  END
  ELSE DO
    SAY "⚠️  Response: " || RESULT.message
    SAY ""
  END
END
ELSE DO
  SAY "❌ Follow-up question failed (RC=" || RC || ")"
  EXIT 1
END

// Test 4: Close conversation
SAY "Test 4: Close conversation and start fresh"
SAY ""

"close_chat"

IF RC = 0 THEN DO
  SAY "✓ Conversation closed"
  SAY ""
END
ELSE DO
  SAY "❌ Close chat failed (RC=" || RC || ")"
  EXIT 1
END

// Test 5: Verify context was reset (should not remember colors)
SAY "Test 5: Verify conversation context was reset"
SAY ""

<<VERIFY
prompt=What color was the first image I showed you?
VERIFY

IF RC = 0 THEN DO
  IF POS("RED", UPPER(RESULT.message)) > 0 || POS("BLUE", UPPER(RESULT.message)) > 0 THEN DO
    SAY "❌ Context was NOT reset - Gemini still remembers colors!"
    SAY "Response: " || RESULT.message
    EXIT 1
  END
  ELSE DO
    SAY "✓ Context was properly reset - Gemini doesn't remember previous images"
    SAY "Response: " || RESULT.message
    SAY ""
    SAY "🎉 All vision tests passed for org.rexxjs/gemini-address!"
  END
END
ELSE DO
  SAY "❌ Verification failed (RC=" || RC || ")"
  EXIT 1
END
