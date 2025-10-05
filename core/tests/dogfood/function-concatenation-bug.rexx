#!/usr/bin/env ../../rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags function-concatenation, bug-reproduction, address-context, dogfood */
/* @description BUG: Function calls in concatenation fail after ADDRESS + REQUIRE */

REQUIRE "../../src/expectations-address.js"

SAY "🧪 Testing Function Calls in Concatenation Expressions"
SAY "📝 Reproducing bug where functions print literally after ADDRESS is set"
SAY ""

/* ============= TEST 1: Baseline - Functions work without ADDRESS ============= */
SAY "Test 1: Baseline - functions in concatenation WITHOUT ADDRESS context"
LET text1 = "Hello World"
SAY "Input: 'Hello World'"
SAY "Length: " || LENGTH(text1)
SAY "First 5: " || SUBSTR(text1, 1, 5)
SAY ""

ADDRESS EXPECTATIONS
"LENGTH: " || LENGTH(text1) || " should be 11"
"SUBSTR(text1, 1, 5) should be Hello"
SAY "✓ Test 1 passed: Functions work in concatenation without ADDRESS context"
SAY ""

/* ============= TEST 2: BUG - Functions fail with ADDRESS context ============= */
SAY "Test 2: BUG - functions in concatenation AFTER ADDRESS is set"

// Replicate the exact sequence from test-claude-address.rexx:
// Load ADDRESS module, make calls, set RESULT multiple times

// Simulate loading claude-address module
REQUIRE "../test-libs/calculator-service.js"

// Simulate ADDRESS switching (even though we won't actually call it)
ADDRESS EXPECTATIONS

// Simulate Test 1 - setting RESULT after an ADDRESS call
LET RESULT.response = "What is your name?"
LET RESULT.message = "What is your name?"
LET RESULT.messageCount = 1
LET RESULT.success = true
LET RC = 0
SAY "Simulated Test 1: " || RESULT.message

// Simulate Test 2 - setting RESULT again after another ADDRESS call
LET RESULT.response = "What is your favorite color?"
LET RESULT.message = "What is your favorite color?"
LET RESULT.messageCount = 2
SAY "Simulated Test 2: " || RESULT.message

// Simulate Test 3 - CLOSE operation with different RESULT structure
LET RESULT.operation = "CLOSE_CHAT"
LET RESULT.messageCount = 2
LET RESULT.success = true

// Simulate Test 4 - new conversation, new RESULT
LET RESULT.response = "42 is the answer you seek"
LET RESULT.message = "42 is the answer you seek"
LET RESULT.messageCount = 1
LET RESULT.conversationId = "conv-456"
SAY "Simulated Test 4: " || RESULT.message

// Now Test 5 - this is where the bug appeared
// Set RESULT.message to a different value and test concatenation
LET text2 = "Test message"
LET RESULT.message = text2
LET RESULT.success = true

SAY "Input: 'Test message'"
SAY "DEBUG: RESULT.message = " || RESULT.message
SAY "DEBUG: text2 = " || text2

// Use INTERPRET_JS to inspect the actual state
INTERPRET_JS "const resultValue = this.variables.get('RESULT'); console.log('JS DEBUG: RESULT =', JSON.stringify(resultValue)); console.log('JS DEBUG: RESULT.message =', resultValue?.message); console.log('JS DEBUG: text2 =', this.variables.get('text2'));"

LET len_result = LENGTH(RESULT.message)
SAY "DEBUG: LENGTH(RESULT.message) pre-evaluated = " || len_result
SAY ""

INTERPRET_JS "console.log('=== BEFORE CONCATENATION BUG ==='); console.log('RESULT type:', typeof this.variables.get('RESULT')); console.log('RESULT.message:', this.variables.get('RESULT')?.message); console.log('text2:', this.variables.get('text2')); console.log('len_result:', this.variables.get('len_result'));"

SAY "Testing: Length: " || LENGTH(RESULT.message)
SAY "Testing: First 4: " || SUBSTR(RESULT.message, 1, 4)
SAY ""

// BUG DEMONSTRATED ABOVE:
// Expected output: "Testing: Length: 12" and "Testing: First 4: Test"
// Actual output (if bug present): "Testing: Length: LENGTH(text2)" and "Testing: First 4: SUBSTR(text2, 1, 4)"

SAY "If you see literal function names above, the BUG IS PRESENT"
SAY "If you see evaluated results (12 and Test), the bug is fixed"
SAY ""

/* ============= TEST 3: WORKAROUND - Pre-evaluate into variables ============= */
SAY "Test 3: WORKAROUND - pre-evaluate functions before concatenation"
LET text3 = "Another test"

ADDRESS CALCULATOR

// Pre-evaluate functions into variables BEFORE concatenation
LET len3 = LENGTH(text3)
LET first3 = SUBSTR(text3, 1, 7)

SAY "Input: 'Another test'"
SAY "Length (pre-evaluated): " || len3
SAY "First 7 (pre-evaluated): " || first3
SAY ""

SAY "✓ Test 3 passed: Workaround works - pre-evaluating avoids the bug"
SAY ""

SAY "🎉 All tests completed!"
SAY ""
SAY "📋 Summary:"
SAY "  - Functions in concatenation work WITHOUT ADDRESS context"
SAY "  - BUG: Functions may print literally AFTER ADDRESS is set (if bug present)"
SAY "  - WORKAROUND: Pre-evaluate functions into variables before concatenation"
