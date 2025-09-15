#!/usr/bin/env ./rexxt

// @test-tags string, validation, text
// @description String validation and text processing specifications
//
// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

REQUIRE "./src/expectations-address.js"

// ============= SETUP SECTION =============

SAY "🧮 Math Operations Test Suite Starting..."
LET test_count = 0
LET pass_count = 0
LET fail_count = 0

// Shared test data
LET pi = 3.14159
LET e = 2.71828
LET test_numbers = [1, 2, 3, 4, 5, -1, -2, 0]

// ============= ARGUMENT PARSING =============

PARSE ARG target_describe .
IF LENGTH(target_describe) = 0 THEN DO
  LET target_describe = "all"
END

// ============= EXECUTION CONTROLLER =============

IF target_describe = "all" THEN DO
  LET all_subroutines = SUBROUTINES()
  DO subroutineName OVER all_subroutines
    IF RIGHT(subroutineName, 5) = "TESTS" THEN DO
      INTERPRET "CALL " || subroutineName
    END
  END
END
ELSE DO
  INTERPRET "CALL " || target_describe
END

// Final summary handled by TestRexxInterpreter
EXIT 0

// ============= Tests =============

BasicArithmeticTests:
  CALL START_DESCRIBE "Basic Arithmetic Operations"
  
  // Setup local test data
  LET x = 10
  LET y = 5
  LET zero = 0
  
  CALL START_TEST "should add positive numbers correctly"
  ADDRESS EXPECTATIONS "{x + y} should be 15"
  CALL PASS
  
  CALL START_TEST "should subtract numbers correctly"
  ADDRESS EXPECTATIONS "{x - y} should be 5"
  CALL PASS
  
  CALL START_TEST "should multiply numbers correctly"
  ADDRESS EXPECTATIONS "{x * y} should be 50"
  CALL PASS
  
  CALL START_TEST "should divide numbers correctly"
  ADDRESS EXPECTATIONS "{x / y} should be 2"
  CALL PASS
  
  CALL START_TEST "should handle integer division"
  LET result = x % y  // Integer division in REXX
  ADDRESS EXPECTATIONS "{result} should be 0"
  CALL PASS
  
  CALL START_TEST "should handle addition with zero"
  ADDRESS EXPECTATIONS "{x + zero} should be 10"
  CALL PASS
  
  CALL END_DESCRIBE
RETURN

AdvancedMathTests:
  CALL START_DESCRIBE "Advanced Mathematical Functions"
  
  LET base = 2
  LET exponent = 3
  LET negative = -7
  
  CALL START_TEST "should handle absolute values"
  ADDRESS EXPECTATIONS "{ABS(negative)} should be 7"
  CALL PASS
  
  CALL START_TEST "should calculate power correctly"
  LET power_result = base ** exponent
  ADDRESS EXPECTATIONS "{power_result} should be 8"
  CALL PASS
  
  CALL START_TEST "should handle square operations"
  LET square = 4 * 4
  ADDRESS EXPECTATIONS "{square} should be 16"
  CALL PASS
  
  CALL START_TEST "should work with mathematical constants"
  ADDRESS EXPECTATIONS "{pi} should be greater than 3"
  CALL PASS
  
  ADDRESS EXPECTATIONS "{pi} should be less than 4"
  CALL PASS
  
  CALL START_TEST "should compare constants correctly"
  ADDRESS EXPECTATIONS "{pi} should be greater than {e}"
  CALL PASS
  
  CALL END_DESCRIBE
RETURN

EdgeCaseTests:
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

ConstantValidationTests:
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

