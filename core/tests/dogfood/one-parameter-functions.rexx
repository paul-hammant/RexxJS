#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

REQUIRE "../../src/expectations-address.js"

/* @test-tags functions, one-parameter, string-functions, math-functions, dogfood */
/* @description Single Parameter Function Test - Functions with Parentheses */

/* ============= SETUP SECTION ============= */
SAY "🧪 Single Parameter Function Test Suite Starting..."
SAY "Focus: Testing functions WITH parentheses (reliable syntax)"

// Shared test data
LET test_count = 0
LET pass_count = 0

// ============= ARGUMENT PARSING =============
PARSE ARG target_describe .

// ============= EXECUTION CONTROLLER =============
// rexxt automatically passes .*Test$ when no arguments provided
LET matching_tests = SUBROUTINES(target_describe)
DO subroutineName OVER matching_tests
  // Each test subroutine execution counts as one test
  ADDRESS EXPECTATIONS "TEST_COUNT"
  INTERPRET "CALL " || subroutineName
END

SAY "✅ Single Parameter Function Tests Complete"
SAY "📝 Note: Functions with parentheses work reliably across all implementations"
// Final summary handled by TestRexxInterpreter
EXIT 0

/* ============= STRING FUNCTION TESTS ============= */
StringFunctionTest:
  SAY "📝 Testing Single Parameter String Functions (WITH PARENTHESES)..."
  
  /* UPPER function with parentheses */
  LET text1 = "hello world"
  LET result1 = UPPER(text1)
  ADDRESS EXPECTATIONS "{result1} should equal 'HELLO WORLD'"
  
  /* LOWER function with parentheses */
  LET text2 = "HELLO WORLD"  
  LET result2 = LOWER(text2)
  ADDRESS EXPECTATIONS "{result2} should equal 'hello world'"
  
  /* LENGTH function with parentheses */
  LET text3 = "hello"
  LET result3 = LENGTH(text3)
  ADDRESS EXPECTATIONS "{result3} should equal 5"
  
  /* TRIM function with parentheses */
  LET text4 = "  hello world  "
  LET result4 = TRIM(text4)
  ADDRESS EXPECTATIONS "{result4} should equal 'hello world'"
  
  /* REVERSE function with parentheses */
  LET text5 = "hello"
  LET result5 = REVERSE(text5)
  ADDRESS EXPECTATIONS "{result5} should equal 'olleh'"
  
  /* WORDS function with parentheses */
  LET text6 = "hello world test"
  LET result6 = WORDS(text6)
  ADDRESS EXPECTATIONS "{result6} should equal 3"
  
  /* SLUG function with parentheses */
  LET text7 = "Hello World!"
  LET result7 = SLUG(text7)
  ADDRESS EXPECTATIONS "{result7} should equal 'hello-world'"
  
RETURN

/* ============= MATH FUNCTION TESTS ============= */
MathFunctionTest:
  SAY "🔢 Testing Single Parameter Math Functions (WITH PARENTHESES)..."
  
  /* ABS function with parentheses */
  LET num1 = -42
  LET result1 = ABS(num1)
  ADDRESS EXPECTATIONS "{result1} should equal 42"
  
  /* MATH_ABS function with parentheses */
  LET num2 = -7.5
  LET result2 = MATH_ABS(num2)
  ADDRESS EXPECTATIONS "{result2} should equal 7.5"
  
  /* MATH_CEIL function with parentheses */
  LET num3 = 4.2
  LET result3 = MATH_CEIL(num3)
  ADDRESS EXPECTATIONS "{result3} should equal 5"
  
  /* MATH_FLOOR function with parentheses */
  LET num4 = 4.9
  LET result4 = MATH_FLOOR(num4)
  ADDRESS EXPECTATIONS "{result4} should equal 4"
  
  /* MATH_SQRT function with parentheses */
  LET num5 = 16
  LET result5 = MATH_SQRT(num5)
  ADDRESS EXPECTATIONS "{result5} should equal 4"
  
  /* MATH_FACTORIAL function with parentheses */
  LET num6 = 5
  LET result6 = MATH_FACTORIAL(num6)
  ADDRESS EXPECTATIONS "{result6} should equal 120"
  
RETURN