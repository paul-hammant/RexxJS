#!/usr/bin/env ../rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags published-modules, gemini-address, registry, integration, ai */
/* @description Test loading gemini-address from published registry */

SAY "🧪 Testing Published Module: org.rexxjs/gemini-address"
SAY "Loading module from registry..."

// Load gemini-address from the published registry

REQUIRE "../extras/addresses/gemini-address/src/gemini-address.js"
//REQUIRE "registry:org.rexxjs/gemini-address"

SAY "✓ Module loaded successfully"
SAY ""

// Test 1: Simple message completion using heredoc format
SAY "Test 1: Send message to Gemini using heredoc"
SAY "(Note: Requires GEMINI_API_KEY environment variable)"
SAY "Get API key from: https://aistudio.google.com/app/apikey"
SAY ""

ADDRESS GEMINI

<<PROMPT
model=gemini-2.5-flash-lite
prompt=What is the meaning of life according to Douglas Adams? Answer in one sentence.
PROMPT

IF RC = 0 THEN DO
  SAY "✓ Gemini responded: " || RESULT.message
  SAY ""
END
ELSE DO
  SAY "❌ Gemini request failed (RC=" || RC || ")"
  IF RESULT.error THEN DO
    SAY "HTTP status: " || RESULT.rc
    SAY "Error type: " || RESULT.error.error.type
    SAY "Error message: " || RESULT.error.error.message
  END
  ELSE DO
    SAY "Error: " || RESULT
  END
  SAY ""
  SAY "To fix: export GEMINI_API_KEY=your-key-here"
  EXIT 1
END

// Test 2: Follow-up question (conversation context maintained automatically)
SAY "Test 2: Follow-up question with conversation context"
SAY ""

<<FOLLOWUP
prompt=In which book did he write that?
FOLLOWUP

IF RC = 0 THEN DO
  SAY "✓ Gemini responded: " || RESULT.message
  SAY ""
END
ELSE DO
  SAY "❌ Follow-up question failed (RC=" || RC || ")"
  IF RESULT.error THEN DO
    SAY "HTTP status: " || RESULT.rc
    SAY "Error type: " || RESULT.error.error.type
    SAY "Error message: " || RESULT.error.error.message
  END
  ELSE DO
    SAY "Error: " || RESULT
  END
  EXIT 1
END

// Test 3: Close conversation and start a new one
SAY "Test 3: Close conversation and start fresh"
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

// Test 4: New conversation with custom system prompt
SAY "Test 4: New conversation with custom system prompt"
SAY ""

<<NEWCHAT
system=You are a pirate who always speaks in nautical terms.
prompt=What is your favorite color?
NEWCHAT

IF RC = 0 THEN DO
  SAY "✓ Gemini responded: " || RESULT.message
  SAY ""
END
ELSE DO
  SAY "❌ New conversation failed (RC=" || RC || ")"
  IF RESULT.error THEN DO
    SAY "HTTP status: " || RESULT.rc
    SAY "Error type: " || RESULT.error.error.type
    SAY "Error message: " || RESULT.error.error.message
  END
  ELSE DO
    SAY "Error: " || RESULT
  END
  EXIT 1
END

// Test 5: Verify Douglas Adams context is forgotten (should not know the book)
SAY "Test 5: Verify conversation context was reset"
SAY ""

<<VERIFY
prompt=What book was that in?
VERIFY

IF RC = 0 THEN DO
  IF POS("HITCHHIKER", UPPER(RESULT.message)) > 0 || POS("DOUGLAS ADAMS", UPPER(RESULT.message)) > 0 || POS("42", RESULT.message) > 0 THEN DO
    SAY "❌ Context was NOT reset - Gemini still remembers Douglas Adams context!"
    SAY "Response: " || RESULT.message
    EXIT 1
  END
  ELSE DO
    SAY "✓ Context was properly reset - Gemini doesn't remember the Douglas Adams conversation"
    SAY ""
    SAY "🎉 All tests passed for org.rexxjs/gemini-address!"
  END
END
ELSE DO
  SAY "❌ Verification failed (RC=" || RC || ")"
  EXIT 1
END
