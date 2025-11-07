#!/usr/bin/env ../../rexxt

// Test REXX-style numeric comparison in expectations
// Copyright (c) 2025 RexxJS Project
// Tests that the expectations framework uses REXX-style numeric comparison
// where "150" (string) equals 150 (number) when both look numeric

/* @test-tags expectations, numeric, comparison */
/* @description Test REXX-style numeric comparison in expectations framework */

REQUIRE "../../src/expectations-address.js"

SAY "Testing REXX-style numeric comparison in expectations..."
SAY ""

// Test 1: String "150" should equal number 150
LET str_val = "150"
ADDRESS EXPECTATIONS "{str_val} should equal 150"
SAY "✓ Test 1: '150' (string) equals 150 (number)"

// Test 2: Number 150 should equal string "150"
LET num_val = 150
ADDRESS EXPECTATIONS "{num_val} should equal '150'"
SAY "✓ Test 2: 150 (number) equals '150' (string)"

// Test 3: String "007.50" should equal number 7.5
LET padded = "007.50"
ADDRESS EXPECTATIONS "{padded} should equal 7.5"
SAY "✓ Test 3: '007.50' (string) equals 7.5 (number)"

// Test 4: String with spaces "  42  " should equal 42
LET spaced = "  42  "
ADDRESS EXPECTATIONS "{spaced} should equal 42"
SAY "✓ Test 4: '  42  ' (string with spaces) equals 42 (number)"

// Test 5: Non-numeric strings should still use strict equality
LET text = "hello"
ADDRESS EXPECTATIONS "{text} should equal 'hello'"
SAY "✓ Test 5: 'hello' (string) equals 'hello' (string)"

SAY ""
SAY "✅ All REXX-style numeric comparison tests passed!"
