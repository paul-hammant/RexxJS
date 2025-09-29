#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

REQUIRE "./core/src/expectations-address.js"

/* @test-tags functions, two-parameter, string-functions, math-functions, dogfood */
/* @description Two Parameter Function Test - Functions with Parentheses */

/* ============= SETUP SECTION ============= */
SAY "🧪 Two Parameter Function Test Suite Starting..."
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

SAY "✅ Two Parameter Function Tests Complete"
SAY "📝 Note: Functions with parentheses work reliably across all implementations"
// Final summary handled by TestRexxInterpreter
EXIT 0

/* ============= STRING FUNCTION TESTS ============= */
StringFunctionTest:
  SAY "📝 Testing Two Parameter String Functions (WITH PARENTHESES)..."
  
  /* REPEAT function with parentheses */
  LET text1 = "hello"
  LET result1 = REPEAT(text1, 3)
  ADDRESS EXPECTATIONS "{result1} should equal 'hellohellohello'"
  
  /* COPIES function with parentheses */
  LET text2 = "test"
  LET result2 = COPIES(text2, 2)
  ADDRESS EXPECTATIONS "{result2} should equal 'testtest'"
  
  /* INCLUDES function with parentheses */
  LET haystack1 = "hello world"
  LET result3 = INCLUDES(haystack1, "world")
  ADDRESS EXPECTATIONS "{result3} should equal true"
  
  LET haystack2 = "test string"
  LET result4 = INCLUDES(haystack2, "xyz")
  ADDRESS EXPECTATIONS "{result4} should equal false"
  
  /* STARTS_WITH function with parentheses */
  LET text5 = "hello world"
  LET result5 = STARTS_WITH(text5, "hello")
  ADDRESS EXPECTATIONS "{result5} should equal true"
  
  LET text6 = "test string"
  LET result6 = STARTS_WITH(text6, "string")
  ADDRESS EXPECTATIONS "{result6} should equal false"
  
  /* ENDS_WITH function with parentheses */
  LET text7 = "hello world"
  LET result7 = ENDS_WITH(text7, "world")
  ADDRESS EXPECTATIONS "{result7} should equal true"
  
  LET text8 = "test string"
  LET result8 = ENDS_WITH(text8, "test")
  ADDRESS EXPECTATIONS "{result8} should equal false"
  
RETURN

/* ============= MATH FUNCTION TESTS ============= */
MathFunctionTest:
  SAY "🔢 Testing Two Parameter Math Functions (WITH PARENTHESES)..."
  
  /* MATH_POWER function with parentheses */
  LET result1 = MATH_POWER(2, 3)
  ADDRESS EXPECTATIONS "{result1} should equal 8"
  
  LET result2 = MATH_POWER(5, 2)
  ADDRESS EXPECTATIONS "{result2} should equal 25"
  
  /* MATH_LOG function with parentheses */
  LET result3 = MATH_LOG(8, 2)
  ADDRESS EXPECTATIONS "{result3} should equal 3"
  
  LET result4 = MATH_LOG(100, 10)
  ADDRESS EXPECTATIONS "{result4} should equal 2"
  
  /* MATH_PERCENTAGE function with parentheses */
  LET result5 = MATH_PERCENTAGE(25, 100)
  ADDRESS EXPECTATIONS "{result5} should equal 25"
  
  LET result6 = MATH_PERCENTAGE(3, 4)
  ADDRESS EXPECTATIONS "{result6} should equal 75"
  
  /* MATH_GCD function with parentheses */
  LET result7 = MATH_GCD(12, 8)
  ADDRESS EXPECTATIONS "{result7} should equal 4"
  
  LET result8 = MATH_GCD(15, 25)
  ADDRESS EXPECTATIONS "{result8} should equal 5"
  
  /* MATH_LCM function with parentheses */
  LET result9 = MATH_LCM(4, 6)
  ADDRESS EXPECTATIONS "{result9} should equal 12"
  
  LET result10 = MATH_LCM(15, 25)
  ADDRESS EXPECTATIONS "{result10} should equal 75"
  
  /* MATH_RANDOM function with parentheses (bounds checking) */
  LET result11 = MATH_RANDOM(1, 10)
  ADDRESS EXPECTATIONS "{result11} should be greater than or equal to 1"
  ADDRESS EXPECTATIONS "{result11} should be less than or equal to 10"
  
  /* MATH_RANDOM_INT function with parentheses (bounds and integer checking) */
  LET result12 = MATH_RANDOM_INT(1, 10)
  ADDRESS EXPECTATIONS "{result12} should be greater than or equal to 1"
  ADDRESS EXPECTATIONS "{result12} should be less than or equal to 10"
  ADDRESS EXPECTATIONS "{MATH_FLOOR(result12)} should equal {result12}"
  
RETURN