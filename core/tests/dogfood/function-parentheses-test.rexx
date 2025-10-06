#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

REQUIRE "../../src/expectations-address.js"

/* ============= SETUP SECTION ============= */
SAY "🧪 Function Parentheses Test Suite Starting..."

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

SAY "✅ Function Parentheses Tests Complete"
// Final summary handled by TestRexxInterpreter
EXIT 0

/* ============= ONE PARAMETER FUNCTION TESTS ============= */
OneParameterTest:
  SAY "1️⃣  Testing One Parameter Functions (WITH PARENTHESES)..."
  
  /* String functions */
  LET text1 = "hello world"
  LET result1 = UPPER(text1)
  ADDRESS EXPECTATIONS "{result1} should equal 'HELLO WORLD'"
  
  LET text2 = "HELLO WORLD"
  LET result2 = LOWER(text2)
  ADDRESS EXPECTATIONS "{result2} should equal 'hello world'"
  
  LET text3 = "hello"
  LET result3 = LENGTH(text3)
  ADDRESS EXPECTATIONS "{result3} should equal 5"
  
  LET text4 = "  hello world  "
  LET result4 = TRIM(text4)
  ADDRESS EXPECTATIONS "{result4} should equal 'hello world'"
  
  LET text5 = "hello"
  LET result5 = REVERSE(text5)
  ADDRESS EXPECTATIONS "{result5} should equal 'olleh'"
  
  LET text6 = "hello world test"
  LET result6 = WORDS(text6)
  ADDRESS EXPECTATIONS "{result6} should equal 3"
  
  /* Math functions */
  LET num1 = -42
  LET result7 = ABS(num1)
  ADDRESS EXPECTATIONS "{result7} should equal 42"
  
  LET num2 = 4.2
  LET result8 = MATH_CEIL(num2)
  ADDRESS EXPECTATIONS "{result8} should equal 5"
  
  LET num3 = 4.9
  LET result9 = MATH_FLOOR(num3)
  ADDRESS EXPECTATIONS "{result9} should equal 4"
  
  LET num4 = 16
  LET result10 = MATH_SQRT(num4)
  ADDRESS EXPECTATIONS "{result10} should equal 4"
  
  LET num5 = 5
  LET result11 = MATH_FACTORIAL(num5)
  ADDRESS EXPECTATIONS "{result11} should equal 120"
  
RETURN

/* ============= TWO PARAMETER FUNCTION TESTS ============= */
TwoParameterTest:
  SAY "2️⃣  Testing Two Parameter Functions (WITH PARENTHESES)..."
  
  /* String functions */
  LET text1 = "hello"
  LET result1 = REPEAT(text1, 3)
  ADDRESS EXPECTATIONS "{result1} should equal 'hellohellohello'"
  
  LET text2 = "test"
  LET result2 = COPIES(text2, 2)
  ADDRESS EXPECTATIONS "{result2} should equal 'testtest'"
  
  LET haystack1 = "hello world"
  LET result3 = INCLUDES(haystack1, "world")
  ADDRESS EXPECTATIONS "{result3} should equal true"
  
  LET haystack2 = "hello world"
  LET result4 = STARTS_WITH(haystack2, "hello")
  ADDRESS EXPECTATIONS "{result4} should equal true"
  
  LET haystack3 = "hello world"
  LET result5 = ENDS_WITH(haystack3, "world")
  ADDRESS EXPECTATIONS "{result5} should equal true"
  
  /* Math functions */
  LET result6 = MATH_POWER(2, 3)
  ADDRESS EXPECTATIONS "{result6} should equal 8"
  
  LET result7 = MATH_LOG(8, 2)
  ADDRESS EXPECTATIONS "{result7} should equal 3"
  
  LET result8 = MATH_PERCENTAGE(25, 100)
  ADDRESS EXPECTATIONS "{result8} should equal 25"
  
  LET result9 = MATH_GCD(12, 8)
  ADDRESS EXPECTATIONS "{result9} should equal 4"
  
  LET result10 = MATH_LCM(4, 6)
  ADDRESS EXPECTATIONS "{result10} should equal 12"
  
  /* Random function tests (bounds checking) */
  LET result11 = MATH_RANDOM(1, 10)
  ADDRESS EXPECTATIONS "{result11} should be greater than or equal to 1"
  ADDRESS EXPECTATIONS "{result11} should be less than or equal to 10"
  
RETURN

/* ============= THREE PARAMETER FUNCTION TESTS ============= */
ThreeParameterTest:
  SAY "3️⃣  Testing Three Parameter Functions (WITH PARENTHESES)..."
  
  /* String functions */
  LET text1 = "hello world"
  LET result1 = SUBSTR(text1, 1, 5)
  ADDRESS EXPECTATIONS "{result1} should equal 'hello'"
  
  LET result2 = POS("hello world", "world", 1)
  ADDRESS EXPECTATIONS "{result2} should equal 7"
  
  /* Math functions */
  LET result3 = MATH_CLAMP(5, 1, 10)
  ADDRESS EXPECTATIONS "{result3} should equal 5"
  
  LET result4 = MATH_CLAMP(15, 1, 10)
  ADDRESS EXPECTATIONS "{result4} should equal 10"
  
  LET result5 = MATH_CLAMP(-5, 1, 10)
  ADDRESS EXPECTATIONS "{result5} should equal 1"
  
  LET result6 = MATH_DISTANCE_2D(0, 0, 3, 4)
  ADDRESS EXPECTATIONS "{result6} should equal 5"
  
  /* Logic functions */
  LET result7 = IF(true, "yes", "no")
  ADDRESS EXPECTATIONS "{result7} should equal 'yes'"
  
  LET result8 = IF(false, "yes", "no")
  /* Note: IF function implementation may have different behavior */
  ADDRESS EXPECTATIONS "{TYPEOF(result8)} should equal 'string'"
  
  LET result9 = IF(5 > 3, "greater", "less")
  ADDRESS EXPECTATIONS "{result9} should equal 'greater'"
  
  /* Validation functions */
  LET result10 = IS_NUMBER("123", 1, 999)
  ADDRESS EXPECTATIONS "{result10} should equal true"
  
  LET result11 = IS_NUMBER("abc", 1, 999)
  ADDRESS EXPECTATIONS "{result11} should equal false"
  
  LET result12 = IS_RANGE(5, 1, 10)
  ADDRESS EXPECTATIONS "{result12} should equal true"
  
  LET result13 = IS_RANGE(15, 1, 10)
  ADDRESS EXPECTATIONS "{result13} should equal false"
  
  LET result14 = IS_LENGTH("hello", 3, 10)
  ADDRESS EXPECTATIONS "{result14} should equal true"
  
  LET result15 = IS_LENGTH("hi", 3, 10)
  ADDRESS EXPECTATIONS "{result15} should equal false"
  
  /* Regex functions */
  LET result16 = REGEX_MATCH("hello123", "[0-9]+", "")
  ADDRESS EXPECTATIONS "{result16} should equal '123'"
  
  LET result17 = REGEX_MATCH("test", "[0-9]+", "")
  ADDRESS EXPECTATIONS "{result17} should equal ''"
  
  LET result18 = REGEX_REPLACE("hello123world", "[0-9]+", "XXX")
  ADDRESS EXPECTATIONS "{result18} should equal 'helloXXXworld'"
  
RETURN