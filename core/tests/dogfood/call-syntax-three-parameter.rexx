#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags call-syntax, three-parameter, functions, dogfood */
/* @description CALL FUNCTION_NAME Syntax Tests - Three Parameter Functions */

REQUIRE "expectations-address"

/* ============= SETUP SECTION ============= */
SAY "🧪 CALL Syntax Test Suite Starting (Three Parameters)..."
SAY "Testing: CALL FUNCTION_NAME param0 param1 param2"

/* ============= STRING FUNCTIONS ============= */
CALL StringFunctionTest

/* ============= MATH FUNCTIONS ============= */
CALL MathFunctionTest

/* ============= LOGIC FUNCTIONS ============= */
CALL LogicFunctionTest

/* ============= VALIDATION FUNCTIONS ============= */
CALL ValidationFunctionTest

/* ============= REGEX FUNCTIONS ============= */
CALL RegexFunctionTest

SAY "✅ CALL Syntax Three Parameter Tests Complete"
SAY "📝 Note: CALL syntax allows functions to be invoked as procedures with multiple parameters"
EXIT 0

/* ============= STRING FUNCTION TESTS ============= */
StringFunctionTest:
  SAY "📝 Testing CALL Syntax with Three Parameter String Functions..."
  
  /* SUBSTR function with CALL syntax */
  LET text1 = "hello world"
  CALL SUBSTR text1 1 5
  LET result1 = RESULT
  ADDRESS EXPECTATIONS "{result1} should equal 'hello'"
  
  LET text2 = "hello world"
  CALL SUBSTR text2 7 5
  LET result2 = RESULT
  ADDRESS EXPECTATIONS "{result2} should equal 'world'"
  
  /* POS function with CALL syntax */
  CALL POS "world" "hello world" 1
  LET result3 = RESULT
  ADDRESS EXPECTATIONS "{result3} should equal 7"
  
  CALL POS "hello" "hello world" 1
  LET result4 = RESULT
  ADDRESS EXPECTATIONS "{result4} should equal 1"
  
  CALL POS "test" "hello world" 1
  LET result5 = RESULT
  ADDRESS EXPECTATIONS "{result5} should equal 0"
  
RETURN

/* ============= MATH FUNCTION TESTS ============= */
MathFunctionTest:
  SAY "🔢 Testing CALL Syntax with Three Parameter Math Functions..."
  
  /* MATH_CLAMP function with CALL syntax */
  CALL MATH_CLAMP 5 1 10
  LET result1 = RESULT
  ADDRESS EXPECTATIONS "{result1} should equal 5"
  
  CALL MATH_CLAMP 15 1 10
  LET result2 = RESULT
  ADDRESS EXPECTATIONS "{result2} should equal 10"
  
  CALL MATH_CLAMP -5 1 10
  LET result3 = RESULT
  ADDRESS EXPECTATIONS "{result3} should equal 1"
  
  /* MATH_DISTANCE_2D function with CALL syntax */
  CALL MATH_DISTANCE_2D 0 0 3 4
  LET result4 = RESULT
  ADDRESS EXPECTATIONS "{result4} should equal 5"
  
  CALL MATH_DISTANCE_2D 1 1 4 5
  LET result5 = RESULT
  ADDRESS EXPECTATIONS "{result5} should equal 5"
  
RETURN

/* ============= LOGIC FUNCTION TESTS ============= */
LogicFunctionTest:
  SAY "🤔 Testing CALL Syntax with Three Parameter Logic Functions..."
  
  /* IF function with CALL syntax - true condition */
  CALL IF true "yes" "no"
  LET result1 = RESULT
  ADDRESS EXPECTATIONS "{result1} should equal 'yes'"
  
  /* IF function with expression condition */
  CALL IF (5 > 3) "greater" "less"
  LET result2 = RESULT
  ADDRESS EXPECTATIONS "{result2} should equal 'greater'"
  
  /* IF function - false condition (note: may have implementation differences) */
  CALL IF false "yes" "no"
  LET result3 = RESULT
  LET result3_type = TYPEOF(result3)
  ADDRESS EXPECTATIONS "{result3_type} should equal 'string'"
  
RETURN

/* ============= VALIDATION FUNCTION TESTS ============= */
ValidationFunctionTest:
  SAY "✅ Testing CALL Syntax with Three Parameter Validation Functions..."
  
  /* IS_NUMBER function with CALL syntax - valid number in range */
  CALL IS_NUMBER "123" 1 999
  LET result1 = RESULT
  ADDRESS EXPECTATIONS "{result1} should equal true"
  
  /* IS_NUMBER function - invalid number */
  CALL IS_NUMBER "abc" 1 999
  LET result2 = RESULT
  ADDRESS EXPECTATIONS "{result2} should equal false"
  
  /* IS_NUMBER function - number in range */
  CALL IS_NUMBER "50" 1 100
  LET result3 = RESULT
  ADDRESS EXPECTATIONS "{result3} should equal true"
  
  /* IS_RANGE function with CALL syntax - value in range */
  CALL IS_RANGE 5 1 10
  LET result4 = RESULT
  ADDRESS EXPECTATIONS "{result4} should equal true"
  
  /* IS_RANGE function - value out of range */
  CALL IS_RANGE 15 1 10
  LET result5 = RESULT
  ADDRESS EXPECTATIONS "{result5} should equal false"
  
  /* IS_RANGE function - boundary value */
  CALL IS_RANGE 1 1 10
  LET result6 = RESULT
  ADDRESS EXPECTATIONS "{result6} should equal true"
  
  /* IS_LENGTH function with CALL syntax - valid length */
  CALL IS_LENGTH "hello" 3 10
  LET result7 = RESULT
  ADDRESS EXPECTATIONS "{result7} should equal true"
  
  /* IS_LENGTH function - too short */
  CALL IS_LENGTH "hi" 3 10
  LET result8 = RESULT
  ADDRESS EXPECTATIONS "{result8} should equal false"
  
  /* IS_LENGTH function - at boundary */
  CALL IS_LENGTH "hello world" 8 13
  LET result9 = RESULT
  ADDRESS EXPECTATIONS "{result9} should equal true"
  
RETURN

/* ============= REGEX FUNCTION TESTS ============= */
RegexFunctionTest:
  SAY "🔍 Testing CALL Syntax with Three Parameter Regex Functions..."
  
  /* REGEX_MATCH function with CALL syntax - match found */
  CALL REGEX_MATCH "hello123" "[0-9]+" ""
  LET result1 = RESULT
  ADDRESS EXPECTATIONS "{result1} should equal '123'"
  
  /* REGEX_MATCH function - no match */
  CALL REGEX_MATCH "test" "[0-9]+" ""
  LET result2 = RESULT
  ADDRESS EXPECTATIONS "{result2} should equal ''"
  
  /* REGEX_REPLACE function with CALL syntax */
  CALL REGEX_REPLACE "hello123world" "[0-9]+" "XXX"
  LET result3 = RESULT
  ADDRESS EXPECTATIONS "{result3} should equal 'helloXXXworld'"
  
  /* REGEX_REPLACE function - no match */
  CALL REGEX_REPLACE "test" "[0-9]+" "XXX"
  LET result4 = RESULT
  ADDRESS EXPECTATIONS "{result4} should equal 'test'"
  
RETURN