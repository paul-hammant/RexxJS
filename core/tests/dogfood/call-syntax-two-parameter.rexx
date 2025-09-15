#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags call-syntax, two-parameter, functions, dogfood */
/* @description CALL FUNCTION_NAME Syntax Tests - Two Parameter Functions */

REQUIRE "expectations-address"

/* ============= SETUP SECTION ============= */
SAY "🧪 CALL Syntax Test Suite Starting (Two Parameters)..."
SAY "Testing: CALL FUNCTION_NAME param0 param1"

/* ============= STRING FUNCTIONS ============= */
CALL StringFunctionTest

/* ============= MATH FUNCTIONS ============= */  
CALL MathFunctionTest

SAY "✅ CALL Syntax Two Parameter Tests Complete"
SAY "📝 Note: CALL syntax allows functions to be invoked as procedures with multiple parameters"
EXIT 0

/* ============= STRING FUNCTION TESTS ============= */
StringFunctionTest:
  SAY "📝 Testing CALL Syntax with Two Parameter String Functions..."
  
  /* REPEAT function with CALL syntax */
  LET text1 = "hello"
  CALL REPEAT text1 3
  LET result1 = RESULT
  ADDRESS EXPECTATIONS "{result1} should equal 'hellohellohello'"
  
  /* COPIES function with CALL syntax */
  LET text2 = "test"
  CALL COPIES text2 2
  LET result2 = RESULT
  ADDRESS EXPECTATIONS "{result2} should equal 'testtest'"
  
  /* INCLUDES function with CALL syntax */
  LET haystack1 = "hello world"
  CALL INCLUDES haystack1 "world"
  LET result3 = RESULT
  ADDRESS EXPECTATIONS "{result3} should equal true"
  
  LET haystack2 = "test string"
  CALL INCLUDES haystack2 "xyz"
  LET result4 = RESULT
  ADDRESS EXPECTATIONS "{result4} should equal false"
  
  /* STARTS_WITH function with CALL syntax */
  LET text5 = "hello world"
  CALL STARTS_WITH text5 "hello"
  LET result5 = RESULT
  ADDRESS EXPECTATIONS "{result5} should equal true"
  
  LET text6 = "test string"
  CALL STARTS_WITH text6 "string"
  LET result6 = RESULT
  ADDRESS EXPECTATIONS "{result6} should equal false"
  
  /* ENDS_WITH function with CALL syntax */
  LET text7 = "hello world"
  CALL ENDS_WITH text7 "world"
  LET result7 = RESULT
  ADDRESS EXPECTATIONS "{result7} should equal true"
  
  LET text8 = "test string"
  CALL ENDS_WITH text8 "test"
  LET result8 = RESULT
  ADDRESS EXPECTATIONS "{result8} should equal false"
  
RETURN

/* ============= MATH FUNCTION TESTS ============= */
MathFunctionTest:
  SAY "🔢 Testing CALL Syntax with Two Parameter Math Functions..."
  
  /* MATH_POWER function with CALL syntax */
  CALL MATH_POWER 2 3
  LET result1 = RESULT
  ADDRESS EXPECTATIONS "{result1} should equal 8"
  
  CALL MATH_POWER 5 2
  LET result2 = RESULT
  ADDRESS EXPECTATIONS "{result2} should equal 25"
  
  /* MATH_LOG function with CALL syntax */
  CALL MATH_LOG 8 2
  LET result3 = RESULT
  ADDRESS EXPECTATIONS "{result3} should equal 3"
  
  CALL MATH_LOG 100 10
  LET result4 = RESULT
  ADDRESS EXPECTATIONS "{result4} should equal 2"
  
  /* MATH_PERCENTAGE function with CALL syntax */
  CALL MATH_PERCENTAGE 25 100
  LET result5 = RESULT
  ADDRESS EXPECTATIONS "{result5} should equal 25"
  
  CALL MATH_PERCENTAGE 3 4
  LET result6 = RESULT
  ADDRESS EXPECTATIONS "{result6} should equal 75"
  
  /* MATH_GCD function with CALL syntax */
  CALL MATH_GCD 12 8
  LET result7 = RESULT
  ADDRESS EXPECTATIONS "{result7} should equal 4"
  
  CALL MATH_GCD 15 25
  LET result8 = RESULT
  ADDRESS EXPECTATIONS "{result8} should equal 5"
  
  /* MATH_LCM function with CALL syntax */
  CALL MATH_LCM 4 6
  LET result9 = RESULT
  ADDRESS EXPECTATIONS "{result9} should equal 12"
  
  CALL MATH_LCM 15 25
  LET result10 = RESULT
  ADDRESS EXPECTATIONS "{result10} should equal 75"
  
  /* MATH_RANDOM function with CALL syntax (bounds checking) */
  CALL MATH_RANDOM 1 10
  LET result11 = RESULT
  ADDRESS EXPECTATIONS "{result11} should be greater than or equal to 1"
  ADDRESS EXPECTATIONS "{result11} should be less than or equal to 10"
  
  /* MATH_RANDOM_INT function with CALL syntax (bounds and integer checking) */
  CALL MATH_RANDOM_INT 1 10
  LET result12 = RESULT
  ADDRESS EXPECTATIONS "{result12} should be greater than or equal to 1"
  ADDRESS EXPECTATIONS "{result12} should be less than or equal to 10"
  ADDRESS EXPECTATIONS "{MATH_FLOOR(result12)} should equal {result12}"
  
RETURN