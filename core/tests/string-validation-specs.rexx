#!/usr/bin/env ./rexxt

// @test-tags string, validation, text
// @description String validation and text processing specifications
//
// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

REQUIRE "./src/expectations-address.js"

// ============= SETUP SECTION =============

SAY "📝 String Validation Test Suite Starting..."
LET test_count = 0
LET pass_count = 0
LET fail_count = 0

// Shared test data
LET test_string = "Hello World"
LET empty_string = ""
LET numeric_string = "12345"
LET mixed_string = "Test123"

// Mathematical constants for ConstantValidationTest
LET pi = 3.14159265359
LET e = 2.71828182846

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

// Final summary handled by TestRexxInterpreter
EXIT 0

// ============= Tests =============

StringLengthTest:
  LET string_len = LENGTH(test_string)
  ADDRESS EXPECTATIONS "{string_len} should be 11"
  
  LET empty_len = LENGTH(empty_string)
  ADDRESS EXPECTATIONS "{empty_len} should be 0"
  
  LET numeric_len = LENGTH(numeric_string)
  ADDRESS EXPECTATIONS "{numeric_len} should be 5"
  
  LET mixed_len = LENGTH(mixed_string)
  ADDRESS EXPECTATIONS "{mixed_len} should be 7"
RETURN

StringCaseTest:
  LET lower_text = "hello world"
  LET upper_text = "HELLO WORLD"
  LET mixed_case = "Hello World"
  
  LET upper_result = UPPER(lower_text)
  ADDRESS EXPECTATIONS "{upper_result} should be HELLO WORLD"
  
  LET lower_result = LOWER(upper_text)
  ADDRESS EXPECTATIONS "{lower_result} should be hello world"
  
  LET mixed_upper = UPPER(mixed_case)
  ADDRESS EXPECTATIONS "{mixed_upper} should be HELLO WORLD"
  
  LET mixed_lower = LOWER(mixed_case)
  ADDRESS EXPECTATIONS "{mixed_lower} should be hello world"
RETURN

EdgeCaseTest:
  LET large_number = 999999
  LET small_number = 0.001
  LET negative_number = -42
  LET zero_test = 0
  
  ADDRESS EXPECTATIONS "{large_number} should be greater than 999998"
  ADDRESS EXPECTATIONS "{small_number} should be greater than 0"
  ADDRESS EXPECTATIONS "{small_number} should be less than 1"
  ADDRESS EXPECTATIONS "{negative_number} should be less than 0"
  ADDRESS EXPECTATIONS "{negative_number} should not be greater than 0"
  ADDRESS EXPECTATIONS "{zero_test} should be 0"
  ADDRESS EXPECTATIONS "{zero_test} should not be greater than 1"
  ADDRESS EXPECTATIONS "{zero_test} should not be less than 0"
RETURN

ConstantValidationTest:
  ADDRESS EXPECTATIONS "{pi} should be between 3.1 and 3.2"
  ADDRESS EXPECTATIONS "{e} should be between 2.7 and 2.8"
  ADDRESS EXPECTATIONS "{pi} should be greater than 0"
  ADDRESS EXPECTATIONS "{e} should be greater than 0"
  // π > e
  ADDRESS EXPECTATIONS "{pi} should be greater than {e}"
RETURN

