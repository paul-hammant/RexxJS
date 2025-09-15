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

IF LENGTH(target_describe) = 0 THEN DO
  // No arguments provided - run all subroutines ending in Test
  LET test_subroutines = SUBROUTINES(".*Test$")
  DO subroutineName OVER test_subroutines
    INTERPRET "CALL " || subroutineName
  END
END
ELSE DO
  // Specific test name provided - run only matching tests
  LET matching_tests = SUBROUTINES(target_describe)
  DO subroutineName OVER matching_tests
    INTERPRET "CALL " || subroutineName
  END
END

// Final summary handled by TestRexxInterpreter
EXIT 0

// ============= Tests =============

StringLengthTest:
  CALL START_DESCRIBE "String Length Validation"
  
  CALL START_TEST "should calculate length of normal string"
  LET string_len = LENGTH(test_string)
  ADDRESS EXPECTATIONS "{string_len} should be 11"
  CALL PASS
  
  CALL START_TEST "should handle empty string length"
  LET empty_len = LENGTH(empty_string)
  ADDRESS EXPECTATIONS "{empty_len} should be 0"
  CALL PASS
  
  CALL START_TEST "should calculate length of numeric string"
  LET numeric_len = LENGTH(numeric_string)
  ADDRESS EXPECTATIONS "{numeric_len} should be 5"
  CALL PASS
  
  CALL START_TEST "should calculate length of mixed string"
  LET mixed_len = LENGTH(mixed_string)
  ADDRESS EXPECTATIONS "{mixed_len} should be 7"
  CALL PASS
  
  CALL END_DESCRIBE
RETURN

StringCaseTest:
  CALL START_DESCRIBE "String Case Conversion"
  
  LET lower_text = "hello world"
  LET upper_text = "HELLO WORLD"
  LET mixed_case = "Hello World"
  
  CALL START_TEST "should convert to uppercase"
  LET upper_result = UPPER(lower_text)
  ADDRESS EXPECTATIONS "{upper_result} should be HELLO WORLD"
  CALL PASS
  
  CALL START_TEST "should convert to lowercase"
  LET lower_result = LOWER(upper_text)
  ADDRESS EXPECTATIONS "{lower_result} should be hello world"
  CALL PASS
  
  CALL START_TEST "should handle mixed case to upper"
  LET mixed_upper = UPPER(mixed_case)
  ADDRESS EXPECTATIONS "{mixed_upper} should be HELLO WORLD"
  CALL PASS
  
  CALL START_TEST "should handle mixed case to lower"
  LET mixed_lower = LOWER(mixed_case)
  ADDRESS EXPECTATIONS "{mixed_lower} should be hello world"
  CALL PASS
  
  CALL END_DESCRIBE
RETURN

EdgeCaseTest:
  CALL START_DESCRIBE "Edge Cases and Error Handling"
  
  LET large_number = 999999
  LET small_number = 0.001
  LET negative_number = -42
  
  CALL START_TEST "should handle very large numbers"
  ADDRESS EXPECTATIONS "{large_number} should be greater than 999998"
  CALL PASS
  
  CALL START_TEST "should handle very small positive numbers"
  ADDRESS EXPECTATIONS "{small_number} should be greater than 0"
  CALL PASS
  
  ADDRESS EXPECTATIONS "{small_number} should be less than 1"
  CALL PASS
  
  CALL START_TEST "should handle negative numbers properly"
  ADDRESS EXPECTATIONS "{negative_number} should be less than 0"
  CALL PASS
  
  ADDRESS EXPECTATIONS "{negative_number} should not be greater than 0"
  CALL PASS
  
  CALL START_TEST "should handle zero edge cases"
  LET zero_test = 0
  ADDRESS EXPECTATIONS "{zero_test} should be 0"
  CALL PASS
  
  ADDRESS EXPECTATIONS "{zero_test} should not be greater than 1"
  CALL PASS
  
  ADDRESS EXPECTATIONS "{zero_test} should not be less than 0"
  CALL PASS
  
  CALL END_DESCRIBE
RETURN

ConstantValidationTest:
  CALL START_DESCRIBE "Mathematical Constants Validation"
  
  CALL START_TEST "should validate PI approximation"
  ADDRESS EXPECTATIONS "{pi} should be between 3.1 and 3.2"
  CALL PASS
  
  CALL START_TEST "should validate E approximation" 
  ADDRESS EXPECTATIONS "{e} should be between 2.7 and 2.8"
  CALL PASS
  
  CALL START_TEST "should validate constants are positive"
  ADDRESS EXPECTATIONS "{pi} should be greater than 0"
  CALL PASS
  
  ADDRESS EXPECTATIONS "{e} should be greater than 0"
  CALL PASS
  
  CALL START_TEST "should validate constants relationships"
  // π > e
  ADDRESS EXPECTATIONS "{pi} should be greater than {e}"
  CALL PASS
  
  CALL END_DESCRIBE
RETURN

