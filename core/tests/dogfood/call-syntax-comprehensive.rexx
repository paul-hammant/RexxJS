#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags call-syntax, comprehensive, functions, dogfood */
/* @description Comprehensive CALL FUNCTION_NAME Syntax Tests - All Parameter Counts */

REQUIRE "./core/src/expectations-address.js"

/* ============= SETUP SECTION ============= */
SAY "🧪 Comprehensive CALL Syntax Test Suite Starting..."
SAY "Testing: CALL FUNCTION_NAME param0 [param1] [param2]"
SAY "Demonstrates REXX procedure call syntax for function invocation"

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

SAY "✅ Comprehensive CALL Syntax Tests Complete"
SAY "📋 Summary: CALL syntax allows functions to be invoked as procedures"
SAY "   • Results are stored in the RESULT special variable"
SAY "   • Syntax: CALL FUNCTION_NAME param1 param2 ..."
SAY "   • Alternative to function(param1, param2) syntax"
// Final summary handled by TestRexxInterpreter
EXIT 0

/* ============= ONE PARAMETER FUNCTION TESTS ============= */
OneParameterTest:
  SAY "1️⃣  Testing CALL Syntax with One Parameter Functions..."
  
  /* String functions */
  LET text1 = "hello world"
  CALL UPPER text1
  ADDRESS EXPECTATIONS "{RESULT} should equal 'HELLO WORLD'"
  
  LET text2 = "HELLO WORLD"
  CALL LOWER text2
  ADDRESS EXPECTATIONS "{RESULT} should equal 'hello world'"
  
  LET text3 = "hello"
  CALL LENGTH text3
  ADDRESS EXPECTATIONS "{RESULT} should equal 5"
  
  LET text4 = "  hello world  "
  CALL TRIM text4
  ADDRESS EXPECTATIONS "{RESULT} should equal 'hello world'"
  
  LET text5 = "hello"
  CALL REVERSE text5
  ADDRESS EXPECTATIONS "{RESULT} should equal 'olleh'"
  
  LET text6 = "hello world test"
  CALL WORDS text6
  ADDRESS EXPECTATIONS "{RESULT} should equal 3"
  
  /* Math functions */
  LET num1 = -42
  CALL ABS num1
  ADDRESS EXPECTATIONS "{RESULT} should equal 42"
  
  LET num2 = 4.2
  CALL MATH_CEIL num2
  ADDRESS EXPECTATIONS "{RESULT} should equal 5"
  
  LET num3 = 4.9
  CALL MATH_FLOOR num3
  ADDRESS EXPECTATIONS "{RESULT} should equal 4"
  
  LET num4 = 16
  CALL MATH_SQRT num4
  ADDRESS EXPECTATIONS "{RESULT} should equal 4"
  
  LET num5 = 5
  CALL MATH_FACTORIAL num5
  ADDRESS EXPECTATIONS "{RESULT} should equal 120"
  
RETURN

/* ============= TWO PARAMETER FUNCTION TESTS ============= */
TwoParameterTest:
  SAY "2️⃣  Testing CALL Syntax with Two Parameter Functions..."
  
  /* String functions */
  LET text1 = "hello"
  CALL REPEAT text1 3
  ADDRESS EXPECTATIONS "{RESULT} should equal 'hellohellohello'"
  
  LET text2 = "test"
  CALL COPIES text2 2
  ADDRESS EXPECTATIONS "{RESULT} should equal 'testtest'"
  
  LET haystack1 = "hello world"
  CALL INCLUDES haystack1 "world"
  ADDRESS EXPECTATIONS "{RESULT} should equal true"
  
  LET haystack2 = "hello world"
  CALL STARTS_WITH haystack2 "hello"
  ADDRESS EXPECTATIONS "{RESULT} should equal true"
  
  LET haystack3 = "hello world"
  CALL ENDS_WITH haystack3 "world"
  ADDRESS EXPECTATIONS "{RESULT} should equal true"
  
  /* Math functions */
  CALL MATH_POWER 2 3
  ADDRESS EXPECTATIONS "{RESULT} should equal 8"
  
  CALL MATH_LOG 8 2
  ADDRESS EXPECTATIONS "{RESULT} should equal 3"
  
  CALL MATH_PERCENTAGE 25 100
  ADDRESS EXPECTATIONS "{RESULT} should equal 25"
  
  CALL MATH_GCD 12 8
  ADDRESS EXPECTATIONS "{RESULT} should equal 4"
  
  CALL MATH_LCM 4 6
  ADDRESS EXPECTATIONS "{RESULT} should equal 12"
  
  /* Random function tests (bounds checking) */
  CALL MATH_RANDOM 1 10
  ADDRESS EXPECTATIONS "{RESULT} should be greater than or equal to 1"
  ADDRESS EXPECTATIONS "{RESULT} should be less than or equal to 10"
  
RETURN

/* ============= THREE PARAMETER FUNCTION TESTS ============= */
ThreeParameterTest:
  SAY "3️⃣  Testing CALL Syntax with Three Parameter Functions..."
  
  /* String functions */
  LET text1 = "hello world"
  CALL SUBSTR text1 1 5
  ADDRESS EXPECTATIONS "{RESULT} should equal 'hello'"
  
  CALL POS "world" "hello world" 1
  ADDRESS EXPECTATIONS "{RESULT} should equal 7"
  
  /* Math functions */
  CALL MATH_CLAMP 5 1 10
  ADDRESS EXPECTATIONS "{RESULT} should equal 5"
  
  CALL MATH_CLAMP 15 1 10
  ADDRESS EXPECTATIONS "{RESULT} should equal 10"
  
  CALL MATH_CLAMP -5 1 10
  ADDRESS EXPECTATIONS "{RESULT} should equal 1"
  
  CALL MATH_DISTANCE_2D 0 0 3 4
  ADDRESS EXPECTATIONS "{RESULT} should equal 5"
  
  /* Logic functions */
  CALL IF true "yes" "no"
  ADDRESS EXPECTATIONS "{RESULT} should equal 'yes'"
  
  CALL IF (5 > 3) "greater" "less"
  ADDRESS EXPECTATIONS "{RESULT} should equal 'greater'"
  
  /* Validation functions */
  CALL IS_NUMBER "123" 1 999
  ADDRESS EXPECTATIONS "{RESULT} should equal true"
  
  CALL IS_NUMBER "abc" 1 999
  ADDRESS EXPECTATIONS "{RESULT} should equal false"
  
  CALL IS_RANGE 5 1 10
  ADDRESS EXPECTATIONS "{RESULT} should equal true"
  
  CALL IS_RANGE 15 1 10
  ADDRESS EXPECTATIONS "{RESULT} should equal false"
  
  CALL IS_LENGTH "hello" 3 10
  ADDRESS EXPECTATIONS "{RESULT} should equal true"
  
  CALL IS_LENGTH "hi" 3 10
  ADDRESS EXPECTATIONS "{RESULT} should equal false"
  
  /* Regex functions */
  CALL REGEX_MATCH "hello123" "[0-9]+" ""
  ADDRESS EXPECTATIONS "{RESULT} should equal '123'"
  
  CALL REGEX_MATCH "test" "[0-9]+" ""
  ADDRESS EXPECTATIONS "{RESULT} should equal ''"
  
  CALL REGEX_REPLACE "hello123world" "[0-9]+" "XXX"
  ADDRESS EXPECTATIONS "{RESULT} should equal 'helloXXXworld'"
  
RETURN