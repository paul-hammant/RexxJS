#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags nested-functions, edge-cases, boundary-testing, dogfood */
/* @description Nested Function Edge Cases - Boundary Conditions and Error Scenarios */

REQUIRE "../../src/expectations-address.js"

/* ============= SETUP SECTION ============= */
SAY "🧪 Nested Function Edge Cases Testing..."
SAY "Testing: Boundary conditions and edge scenarios"

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

SAY "✅ Nested Function Edge Cases Complete"
// Final summary handled by TestRexxInterpreter
EXIT 0

/* ============= EMPTY DATA HANDLING ============= */
EmptyDataTest:
  SAY "🗂️ Testing Empty Data Edge Cases..."
  
  /* Empty string processing */
  LET empty_string = ""
  
  /* Step 1: Length of empty string */
  LET empty_length = LENGTH(empty_string)
  ADDRESS EXPECTATIONS "{empty_length} should equal 0"
  
  /* Step 2: Words count of empty string */
  LET empty_words = WORDS(empty_string)
  ADDRESS EXPECTATIONS "{empty_words} should equal 0"
  
  /* Step 3: Upper case of empty string */
  LET empty_upper = UPPER(empty_string)
  ADDRESS EXPECTATIONS "{empty_upper} should equal ''"
  
  /* Step 4: Trimming empty string */
  LET empty_trimmed = TRIM(empty_string)
  ADDRESS EXPECTATIONS "{empty_trimmed} should equal ''"
  
  /* Step 5: Chain operations on empty result */
  LET chained_empty = REVERSE(empty_upper)
  ADDRESS EXPECTATIONS "{chained_empty} should equal ''"
  
  SAY "   ✓ Empty data edge cases handled"
RETURN

/* ============= BOUNDARY VALUE TESTING ============= */
BoundaryValueTest:
  SAY "📏 Testing Boundary Value Edge Cases..."
  
  /* Single character operations */
  LET single_char = "A"
  
  /* Step 1: Single character length */
  LET char_length = LENGTH(single_char)
  ADDRESS EXPECTATIONS "{char_length} should equal 1"
  
  /* Step 2: Single character word count */
  LET char_words = WORDS(single_char)
  ADDRESS EXPECTATIONS "{char_words} should equal 1"
  
  /* Step 3: Single character transformations */
  LET char_lower = LOWER(single_char)
  LET char_reversed = REVERSE(char_lower)
  ADDRESS EXPECTATIONS "{char_reversed} should equal 'a'"
  
  /* Minimum numeric values */
  LET zero_value = 0
  LET zero_abs = MATH_ABS(zero_value)
  ADDRESS EXPECTATIONS "{zero_abs} should equal 0"
  
  /* Single digit factorial */
  LET one_factorial = MATH_FACTORIAL(1)
  ADDRESS EXPECTATIONS "{one_factorial} should equal 1"
  
  SAY "   ✓ Boundary value cases handled"
RETURN

/* ============= LARGE DATA PROCESSING ============= */
LargeDataTest:
  SAY "📈 Testing Large Data Edge Cases..."
  
  /* Long string processing */
  LET long_base = "Lorem ipsum dolor sit amet consectetur adipiscing elit"
  
  /* Step 1: Process long string */
  LET long_length = LENGTH(long_base)
  ADDRESS EXPECTATIONS "{long_length} should equal 54"
  
  /* Step 2: Word count of long string */
  LET long_words = WORDS(long_base)
  ADDRESS EXPECTATIONS "{long_words} should equal 8"
  
  /* Step 3: Transform and measure */
  LET long_upper = UPPER(long_base)
  LET upper_length = LENGTH(long_upper)
  ADDRESS EXPECTATIONS "{upper_length} should equal 54"
  
  /* Step 4: Extract and process parts */
  LET first_word = WORD(long_base, 1)
  LET last_word = WORD(long_base, 8)
  LET combined = first_word || "-" || last_word
  ADDRESS EXPECTATIONS "{combined} should equal 'Lorem-elit'"
  
  /* Large numeric boundary */
  LET large_sqrt_input = 100
  LET large_sqrt = MATH_SQRT(large_sqrt_input)
  ADDRESS EXPECTATIONS "{large_sqrt} should equal 10"
  
  SAY "   ✓ Large data cases handled"
RETURN

/* ============= TYPE CONVERSION EDGE CASES ============= */
TypeConversionTest:
  SAY "🔄 Testing Type Conversion Edge Cases..."
  
  /* String-to-number conversions in chains */
  LET numeric_string = "42"
  
  /* Step 1: String operations on numeric string */
  LET str_length = LENGTH(numeric_string)
  ADDRESS EXPECTATIONS "{str_length} should equal 2"
  
  /* Step 2: Reverse the numeric string */
  LET reversed_num = REVERSE(numeric_string)
  ADDRESS EXPECTATIONS "{reversed_num} should equal '24'"
  
  /* Step 3: Apply string functions to result */
  LET reversed_upper = UPPER(reversed_num)
  ADDRESS EXPECTATIONS "{reversed_upper} should equal '24'"
  
  /* Negative number string processing */
  LET negative_str = "-15"
  LET neg_length = LENGTH(negative_str)
  LET neg_abs_str = SUBSTR(negative_str, 2)  /* Remove minus sign */
  LET neg_result = "ABS:" || neg_abs_str
  ADDRESS EXPECTATIONS "{neg_result} should equal 'ABS:15'"
  
  SAY "   ✓ Type conversion edge cases handled"
RETURN

/* ============= COMPLEX NESTED CONDITIONALS ============= */
ComplexNestedTest:
  SAY "🌀 Testing Complex Nested Patterns..."
  
  /* Complex decision tree with nested function results */
  LET test_input = "Hello123World"
  
  /* Step 1: Basic analysis */
  LET input_length = LENGTH(test_input)
  LET input_words = WORDS(test_input)
  ADDRESS EXPECTATIONS "{input_length} should equal 13"
  ADDRESS EXPECTATIONS "{input_words} should equal 1"
  
  /* Step 2: Complex conditional processing */
  IF input_length > 10 THEN DO
    IF input_words = 1 THEN DO
      /* Single long word processing */
      LET processed = UPPER(test_input)
      LET final_length = LENGTH(processed)
      ADDRESS EXPECTATIONS "{final_length} should equal 13"
      
      /* Further nested processing */
      LET slug_version = SLUG(processed)
      LET slug_length = LENGTH(slug_version)
      ADDRESS EXPECTATIONS "{slug_length} should equal 13"
    END
    ELSE DO
      /* Multiple word processing */
      LET processed = LOWER(test_input)
    END
  END
  ELSE DO
    /* Short input processing */
    LET processed = TRIM(test_input)
  END
  
  /* Final validation chain */
  LET validation_input = processed
  LET validation_length = LENGTH(validation_input)
  LET validation_status = "PROCESSED"
  IF validation_length = 0 THEN validation_status = "EMPTY"
  ADDRESS EXPECTATIONS "{validation_status} should equal 'PROCESSED'"
  
  SAY "   ✓ Complex nested patterns handled"
RETURN