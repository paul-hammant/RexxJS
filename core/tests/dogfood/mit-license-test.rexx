#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

REQUIRE "./src/expectations-address.js"

/* @test-tags license, file-operations, validation, dogfood */
/* @description MIT License File Validation Test */

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

// Final summary handled by TestRexxInterpreter
EXIT 0

// ============= Tests =============

LicenseValidationTest:
  SAY "📄 Testing MIT License File Validation..."
  
  /* Read the entire LICENSE file (one directory up from core/) */
  LET license_result = FILE_READ("../LICENSE")
  LET license_content = license_result.content

  /* Split content into lines using MODERN_SPLIT */
  LET license_lines = MODERN_SPLIT(license_content, "\n")

  /* Get first line - canonical array access */
  LET first_line = license_lines[0]

  ADDRESS EXPECTATIONS "{first_line} should equal 'MIT License'"
RETURN
