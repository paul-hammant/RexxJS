#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags call-syntax, simple-demo, educational, dogfood */
/* @description Simple CALL Syntax Demonstration - Function vs CALL Differences */

REQUIRE "./src/expectations-address.js"

/* ============= SETUP SECTION ============= */
SAY "🧪 Simple CALL Syntax Demonstration Starting..."
SAY "📝 Comparing function() syntax vs CALL syntax"

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

SAY "✅ Simple CALL Syntax Demonstration Complete"
// Final summary handled by TestRexxInterpreter
EXIT 0

/* ============= CALL SYNTAX DEMO ============= */
CallSyntaxTest  :
  SAY ""
  SAY "🔍 REXX Function Call Methods:"
  
  /* ============= Method 1: Function Syntax (WORKS) ============= */
  SAY ""
  SAY "✅ Method 1: Function Syntax (Recommended for built-ins)"
  
  LET text1 = "hello world"
  LET result1 = UPPER(text1)
  ADDRESS EXPECTATIONS "{result1} should equal 'HELLO WORLD'"
  SAY "   UPPER('hello world') = '" || result1 || "'"
  
  LET result2 = REPEAT("test", 3)
  ADDRESS EXPECTATIONS "{result2} should equal 'testtesttest'"
  SAY "   REPEAT('test', 3) = '" || result2 || "'"
  
  LET result3 = SUBSTR("hello world", 1, 5)
  ADDRESS EXPECTATIONS "{result3} should equal 'hello'"
  SAY "   SUBSTR('hello world', 1, 5) = '" || result3 || "'"
  
  /* ============= Method 2: CALL Syntax Limitations ============= */
  SAY ""
  SAY "❌ Method 2: CALL Syntax (Limited to user subroutines)"
  SAY "   The following CALL statements would fail:"
  SAY "   • CALL UPPER 'hello world'"
  SAY "   • CALL REPEAT 'test' 3"
  SAY "   • CALL SUBSTR 'hello world' 1 5"
  SAY ""
  SAY "   Error: Subroutine 'FUNCTION_NAME' not found"
  
  /* ============= Method 3: User Subroutines with CALL (WORKS) ============= */
  SAY ""
  SAY "✅ Method 3: User Subroutines with CALL"
  
  CALL SimpleTest
  SAY "   CALL SimpleTest → Executed successfully"
  
  /* ============= Summary ============= */
  SAY ""
  SAY "📋 Summary:"
  SAY "   ✅ Built-in functions: Use FUNCTION(param) syntax"
  SAY "   ❌ Built-in functions: CALL FUNCTION param doesn't work"
  SAY "   ✅ User subroutines: CALL SUBROUTINE param works"
  SAY ""
  SAY "💡 Recommendation: Use function() syntax for all built-in functions"
  
RETURN

/* ============= USER-DEFINED SUBROUTINE ============= */
SimpleTest:
  SAY "   → Inside SimpleTest subroutine"
  RETURN