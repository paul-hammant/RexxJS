#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags call-syntax, educational, wrapper-subroutines, dogfood */
/* @description Educational CALL Syntax Demonstration - Wrapper Subroutines for Built-in Functions */

REQUIRE "../../src/expectations-address.js"

/* ============= SETUP SECTION ============= */
SAY "🧪 Educational CALL Syntax Demonstration Starting..."
SAY "🔍 This demonstrates REXX CALL syntax using wrapper subroutines"
SAY "📝 Note: This implementation treats CALL as user-defined subroutines only"
SAY "💡 Solution: Create wrapper subroutines that call built-in functions"

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

SAY "✅ Educational CALL Syntax Demonstration Complete"
SAY ""
SAY "📋 Summary of REXX CALL Syntax:"
SAY "   • Traditional REXX: CALL can invoke built-in functions"
SAY "   • This implementation: CALL works with user-defined subroutines"
SAY "   • Workaround: Create wrapper subroutines for built-in functions"
SAY "   • Built-in functions work best with function() syntax"
// Final summary handled by TestRexxInterpreter
EXIT 0

/* ============= CALL SYNTAX DEMONSTRATION ============= */
CallSyntaxDemonstrationTest:
  SAY "🎭 Demonstrating CALL with wrapper subroutines..."
  
  /* One parameter function demonstration */
  LET text1 = "hello world"
  CALL UpperWrapper text1
  LET result1 = RESULT
  ADDRESS EXPECTATIONS "{result1} should equal 'HELLO WORLD'"
  SAY "   ✓ CALL UpperWrapper '" || text1 || "' = '" || result1 || "'"
  
  /* Two parameter function demonstration */
  LET text2 = "hello"
  CALL RepeatWrapper text2 3
  LET result2 = RESULT
  ADDRESS EXPECTATIONS "{result2} should equal 'hellohellohello'"
  SAY "   ✓ CALL RepeatWrapper '" || text2 || "' 3 = '" || result2 || "'"
  
  /* Three parameter function demonstration */
  LET text3 = "hello world"
  CALL SubstrWrapper text3 1 5
  LET result3 = RESULT
  ADDRESS EXPECTATIONS "{result3} should equal 'hello'"
  SAY "   ✓ CALL SubstrWrapper '" || text3 || "' 1 5 = '" || result3 || "'"
  
  /* Math function demonstration */
  CALL MathPowerWrapper 2 3
  LET result4 = RESULT
  ADDRESS EXPECTATIONS "{result4} should equal 8"
  SAY "   ✓ CALL MathPowerWrapper 2 3 = " || result4
  
  /* Demonstrate accessing RESULT multiple times */
  CALL LengthWrapper "testing"
  LET saved_result = RESULT
  SAY "   ✓ RESULT saved: " || saved_result
  ADDRESS EXPECTATIONS "{saved_result} should equal 7"
  
RETURN

/* ============= WRAPPER SUBROUTINES FOR BUILT-IN FUNCTIONS ============= */

/* Single parameter wrapper subroutines */
UpperWrapper:
  PARSE ARG input_text
  RETURN UPPER(input_text)

LowerWrapper:
  PARSE ARG input_text
  RETURN LOWER(input_text)

LengthWrapper:
  PARSE ARG input_text
  RETURN LENGTH(input_text)

TrimWrapper:
  PARSE ARG input_text
  RETURN TRIM(input_text)

ReverseWrapper:
  PARSE ARG input_text
  RETURN REVERSE(input_text)

AbsWrapper:
  PARSE ARG input_number
  RETURN ABS(input_number)

MathSqrtWrapper:
  PARSE ARG input_number
  RETURN MATH_SQRT(input_number)

/* Two parameter wrapper subroutines */
RepeatWrapper:
  PARSE ARG input_text, count
  RETURN REPEAT(input_text, count)

CopiesWrapper:
  PARSE ARG input_text, count
  RETURN COPIES(input_text, count)

IncludesWrapper:
  PARSE ARG haystack, needle
  RETURN INCLUDES(haystack, needle)

StartsWithWrapper:
  PARSE ARG text, prefix
  RETURN STARTS_WITH(text, prefix)

EndsWithWrapper:
  PARSE ARG text, suffix
  RETURN ENDS_WITH(text, suffix)

MathPowerWrapper:
  PARSE ARG base, exponent
  RETURN MATH_POWER(base, exponent)

MathLogWrapper:
  PARSE ARG number, base
  RETURN MATH_LOG(number, base)

MathGcdWrapper:
  PARSE ARG num1, num2
  RETURN MATH_GCD(num1, num2)

/* Three parameter wrapper subroutines */
SubstrWrapper:
  PARSE ARG text, start, length
  RETURN SUBSTR(text, start, length)

PosWrapper:
  PARSE ARG needle, haystack, start
  RETURN POS(needle, haystack, start)

MathClampWrapper:
  PARSE ARG value, min_val, max_val
  RETURN MATH_CLAMP(value, min_val, max_val)

MathDistance2DWrapper:
  PARSE ARG x1, y1, x2, y2
  RETURN MATH_DISTANCE_2D(x1, y1, x2, y2)

IfWrapper:
  PARSE ARG condition, true_value, false_value
  RETURN IF(condition, true_value, false_value)

IsNumberWrapper:
  PARSE ARG value, min_val, max_val
  RETURN IS_NUMBER(value, min_val, max_val)

IsRangeWrapper:
  PARSE ARG value, min_val, max_val
  RETURN IS_RANGE(value, min_val, max_val)

IsLengthWrapper:
  PARSE ARG text, min_len, max_len
  RETURN IS_LENGTH(text, min_len, max_len)

RegexMatchWrapper:
  PARSE ARG text, pattern, flags
  RETURN REGEX_MATCH(text, pattern, flags)

RegexReplaceWrapper:
  PARSE ARG text, pattern, replacement
  RETURN REGEX_REPLACE(text, pattern, replacement)