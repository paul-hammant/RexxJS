#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

REQUIRE "expectations-address"

/* ============= SETUP SECTION ============= */
SAY "🧪 CALL Syntax Test Suite Starting (One Parameter)..."
SAY "Testing: CALL FUNCTION_NAME param0"

/* ============= STRING FUNCTIONS ============= */
CALL StringFunctionTest

/* ============= MATH FUNCTIONS ============= */
CALL MathFunctionTest

SAY "✅ CALL Syntax One Parameter Tests Complete"
SAY "📝 Note: CALL syntax allows functions to be invoked as procedures"
EXIT 0

/* ============= STRING FUNCTION TESTS ============= */
StringFunctionTest:
  SAY "📝 Testing CALL Syntax with Single Parameter String Functions..."
  
  /* UPPER function with CALL syntax */
  LET text1 = "hello world"
  CALL UPPER text1
  LET result1 = RESULT
  ADDRESS EXPECTATIONS "{result1} should equal 'HELLO WORLD'"
  
  /* LOWER function with CALL syntax */
  LET text2 = "HELLO WORLD"
  CALL LOWER text2
  LET result2 = RESULT
  ADDRESS EXPECTATIONS "{result2} should equal 'hello world'"
  
  /* LENGTH function with CALL syntax */
  LET text3 = "hello"
  CALL LENGTH text3
  LET result3 = RESULT
  ADDRESS EXPECTATIONS "{result3} should equal 5"
  
  /* TRIM function with CALL syntax */
  LET text4 = "  hello world  "
  CALL TRIM text4
  LET result4 = RESULT
  ADDRESS EXPECTATIONS "{result4} should equal 'hello world'"
  
  /* REVERSE function with CALL syntax */
  LET text5 = "hello"
  CALL REVERSE text5
  LET result5 = RESULT
  ADDRESS EXPECTATIONS "{result5} should equal 'olleh'"
  
  /* WORDS function with CALL syntax */
  LET text6 = "hello world test"
  CALL WORDS text6
  LET result6 = RESULT
  ADDRESS EXPECTATIONS "{result6} should equal 3"
  
  /* SLUG function with CALL syntax */
  LET text7 = "Hello World!"
  CALL SLUG text7
  LET result7 = RESULT
  ADDRESS EXPECTATIONS "{result7} should equal 'hello-world'"
  
RETURN

/* ============= MATH FUNCTION TESTS ============= */
MathFunctionTest:
  SAY "🔢 Testing CALL Syntax with Single Parameter Math Functions..."
  
  /* ABS function with CALL syntax */
  LET num1 = -42
  CALL ABS num1
  LET result1 = RESULT
  ADDRESS EXPECTATIONS "{result1} should equal 42"
  
  /* MATH_ABS function with CALL syntax */
  LET num2 = -7.5
  CALL MATH_ABS num2
  LET result2 = RESULT
  ADDRESS EXPECTATIONS "{result2} should equal 7.5"
  
  /* MATH_CEIL function with CALL syntax */
  LET num3 = 4.2
  CALL MATH_CEIL num3
  LET result3 = RESULT
  ADDRESS EXPECTATIONS "{result3} should equal 5"
  
  /* MATH_FLOOR function with CALL syntax */
  LET num4 = 4.9
  CALL MATH_FLOOR num4
  LET result4 = RESULT
  ADDRESS EXPECTATIONS "{result4} should equal 4"
  
  /* MATH_SQRT function with CALL syntax */
  LET num5 = 16
  CALL MATH_SQRT num5
  LET result5 = RESULT
  ADDRESS EXPECTATIONS "{result5} should equal 4"
  
  /* MATH_FACTORIAL function with CALL syntax */
  LET num6 = 5
  CALL MATH_FACTORIAL num6
  LET result6 = RESULT
  ADDRESS EXPECTATIONS "{result6} should equal 120"
  
RETURN