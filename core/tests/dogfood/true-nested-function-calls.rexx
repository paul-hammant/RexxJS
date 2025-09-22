#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags nested-functions, functions, true-nesting, dogfood */
/* @description True Nested Function Call Tests - Actual nesting syntax */

REQUIRE "./src/expectations-address.js"

/* ============= SETUP SECTION ============= */
SAY "🧪 True Nested Function Calls Test Suite Starting..."
SAY "🎯 Testing actual nested function syntax like ABS(MIN(1,2,3))"

/* ============= TRUE NESTED FUNCTION TESTS ============= */

/* Test true nested function calls - these actually work! */
LET math_nested = ABS(MIN(-10, -5, -1))
LET multi_nested = MATH_ADD(MAX(1, 2, 3), MIN(4, 5, 6)) 
LET string_nested = LENGTH(UPPER("hello"))
LET complex_nested = MATH_MULTIPLY(ABS(MIN(-5, -10)), MAX(2, 3, 4))

SAY "Nested function results:"
SAY "  ABS(MIN(-10, -5, -1)) = " || math_nested
SAY "  MATH_ADD(MAX(1, 2, 3), MIN(4, 5, 6)) = " || multi_nested 
SAY "  LENGTH(UPPER('hello')) = " || string_nested
SAY "  MATH_MULTIPLY(ABS(MIN(-5, -10)), MAX(2, 3, 4)) = " || complex_nested

ADDRESS EXPECTATIONS
<<EXPECTATIONS
{math_nested} should equal 10
{multi_nested} should equal 7 
{string_nested} should equal 5
{complex_nested} should equal 40
EXPECTATIONS

SAY "✅ True Nested Function Calls Tests Complete - nested calls work perfectly!"
EXIT 0