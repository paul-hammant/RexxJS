#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags comparison-operators, conditional-logic, comprehensive, dogfood */
/* @description Comprehensive Comparison Operators Test - All Supported REXX Comparison Operators: =, ==, \=, !=, <>, ¬=, ><, >, <, >=, <= */

REQUIRE "./src/expectations-address.js"

/* ============= SETUP SECTION ============= */
SAY "🧪 Comprehensive Comparison Operators Test Suite Starting..."
SAY "🔍 Testing all REXX comparison operators with various data types"

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

SAY "✅ Comprehensive Comparison Operators Tests Complete"
SAY "📊 All comparison operators tested successfully"
// Final summary handled by TestRexxInterpreter
EXIT 0

/* ============= EQUALITY OPERATORS (=) ============= */
EqualityOperatorsTest:
  SAY "1️⃣  Testing Equality Operators (=)..."
  
  /* Test numeric equality */
  LET a = 42
  LET b = 42
  LET c = 43
  
  IF a = b THEN
    LET equal_numeric_result = "PASS"
  ELSE
    LET equal_numeric_result = "FAIL"
  ENDIF
  
  IF a = c THEN
    LET not_equal_result = "FAIL"
  ELSE
    LET not_equal_result = "PASS"
  ENDIF
  
  /* Test string equality */
  LET str1 = "Hello"
  LET str2 = "Hello"
  LET str3 = "hello"
  
  IF str1 = str2 THEN
    LET equal_string_result = "PASS"
  ELSE
    LET equal_string_result = "FAIL"
  ENDIF
  
  IF str1 = str3 THEN
    LET case_sensitive_result = "FAIL"
  ELSE
    LET case_sensitive_result = "PASS"
  ENDIF
  
  /* Test numeric string coercion */
  LET num = 100
  LET numstr = "100"
  
  IF num = numstr THEN
    LET coercion_result = "PASS"
  ELSE
    LET coercion_result = "FAIL"
  ENDIF
  
  ADDRESS EXPECTATIONS
  <<EXPECTATIONS
  {equal_numeric_result} should equal "PASS"
  {not_equal_result} should equal "PASS"
  {equal_string_result} should equal "PASS"
  {case_sensitive_result} should equal "PASS"
  {coercion_result} should equal "PASS"
  EXPECTATIONS
  
  SAY "   ✓ Equality operators: numeric=" || equal_numeric_result || ", string=" || equal_string_result || ", coercion=" || coercion_result
  
RETURN

/* ============= INEQUALITY OPERATORS (\=, !=, <>, ¬=, ><) ============= */
InequalityOperatorsTest:
  SAY "2️⃣  Testing Inequality Operators (\\=, !=, <>, ¬=, ><)..."
  
  LET x = 10
  LET y = 20
  LET z = 10
  
  /* Test \= (not equal) */
  IF x \= y THEN
    LET not_equal_1 = "PASS"
  ELSE
    LET not_equal_1 = "FAIL"
  ENDIF
  
  IF x \= z THEN
    LET not_equal_2 = "FAIL"
  ELSE
    LET not_equal_2 = "PASS"
  ENDIF
  
  /* Test != (not equal alternative) */
  IF x != y THEN
    LET not_equal_3 = "PASS"
  ELSE
    LET not_equal_3 = "FAIL"
  ENDIF
  
  IF x != z THEN
    LET not_equal_4 = "FAIL"
  ELSE
    LET not_equal_4 = "PASS"
  ENDIF
  
  /* Test <> (not equal alternative 2) */
  IF x <> y THEN
    LET not_equal_5 = "PASS"
  ELSE
    LET not_equal_5 = "FAIL"
  ENDIF
  
  IF x <> z THEN
    LET not_equal_6 = "FAIL"
  ELSE
    LET not_equal_6 = "PASS"
  ENDIF
  
  /* Test ¬= (not equal alternative 3) */
  IF x ¬= y THEN
    LET not_equal_7 = "PASS"
  ELSE
    LET not_equal_7 = "FAIL"
  ENDIF
  
  IF x ¬= z THEN
    LET not_equal_8 = "FAIL"
  ELSE
    LET not_equal_8 = "PASS"
  ENDIF
  
  /* Test >< (greater than or less than) */
  IF x >< y THEN
    LET not_equal_9 = "PASS"
  ELSE
    LET not_equal_9 = "FAIL"
  ENDIF
  
  IF x >< z THEN
    LET not_equal_10 = "FAIL"
  ELSE
    LET not_equal_10 = "PASS"
  ENDIF
  
  ADDRESS EXPECTATIONS
  <<EXPECTATIONS
  {not_equal_1} should equal "PASS"
  {not_equal_2} should equal "PASS"
  {not_equal_3} should equal "PASS"
  {not_equal_4} should equal "PASS"
  {not_equal_5} should equal "PASS"
  {not_equal_6} should equal "PASS"
  {not_equal_7} should equal "PASS"
  {not_equal_8} should equal "PASS"
  {not_equal_9} should equal "PASS"
  {not_equal_10} should equal "PASS"
  EXPECTATIONS
  
  SAY "   ✓ Inequality operators: \\= works, != works, <> works, ¬= works, >< works"
  
RETURN

/* ============= RELATIONAL OPERATORS (>, <, >=, <=) ============= */
RelationalOperatorsTest:
  SAY "3️⃣  Testing Relational Operators (>, <, >=, <=)..."
  
  LET num1 = 15
  LET num2 = 25
  LET num3 = 15
  
  /* Test > (greater than) */
  IF num2 > num1 THEN
    LET greater_1 = "PASS"
  ELSE
    LET greater_1 = "FAIL"
  ENDIF
  
  IF num1 > num2 THEN
    LET greater_2 = "FAIL"
  ELSE
    LET greater_2 = "PASS"
  ENDIF
  
  /* Test < (less than) */
  IF num1 < num2 THEN
    LET less_1 = "PASS"
  ELSE
    LET less_1 = "FAIL"
  ENDIF
  
  IF num2 < num1 THEN
    LET less_2 = "FAIL"
  ELSE
    LET less_2 = "PASS"
  ENDIF
  
  /* Test >= (greater than or equal) */
  IF num2 >= num1 THEN
    LET greater_equal_1 = "PASS"
  ELSE
    LET greater_equal_1 = "FAIL"
  ENDIF
  
  IF num1 >= num3 THEN
    LET greater_equal_2 = "PASS"
  ELSE
    LET greater_equal_2 = "FAIL"
  ENDIF
  
  IF num1 >= num2 THEN
    LET greater_equal_3 = "FAIL"
  ELSE
    LET greater_equal_3 = "PASS"
  ENDIF
  
  /* Test <= (less than or equal) */
  IF num1 <= num2 THEN
    LET less_equal_1 = "PASS"
  ELSE
    LET less_equal_1 = "FAIL"
  ENDIF
  
  IF num1 <= num3 THEN
    LET less_equal_2 = "PASS"
  ELSE
    LET less_equal_2 = "FAIL"
  ENDIF
  
  IF num2 <= num1 THEN
    LET less_equal_3 = "FAIL"
  ELSE
    LET less_equal_3 = "PASS"
  ENDIF
  
  ADDRESS EXPECTATIONS
  <<EXPECTATIONS
  {greater_1} should equal "PASS"
  {greater_2} should equal "PASS"
  {less_1} should equal "PASS"
  {less_2} should equal "PASS"
  {greater_equal_1} should equal "PASS"
  {greater_equal_2} should equal "PASS"
  {greater_equal_3} should equal "PASS"
  {less_equal_1} should equal "PASS"
  {less_equal_2} should equal "PASS"
  {less_equal_3} should equal "PASS"
  EXPECTATIONS
  
  SAY "   ✓ Relational operators: > works, < works, >= works, <= works"
  
RETURN

/* ============= ADVANCED COMPARISON PATTERNS ============= */
AdvancedComparisonTest:
  SAY "4️⃣  Testing Advanced Comparison Patterns..."
  
  /* Multiple comparisons in nested conditions */
  LET score = 85
  LET min_pass = 60
  LET excellence = 90
  
  IF score >= min_pass THEN
    IF score < excellence THEN
      LET grade = "B"
    ELSE
      LET grade = "A"  
    ENDIF
  ELSE
    LET grade = "F"
  ENDIF
  
  /* Age categorization */
  LET age = 25
  LET min_adult = 18
  LET senior = 65
  
  IF age >= min_adult THEN
    IF age < senior THEN
      LET status = "Adult"
    ELSE
      LET status = "Senior"
    ENDIF
  ELSE
    LET status = "Minor"
  ENDIF
  
  /* String comparisons (lexicographic) */
  LET str_a = "apple"
  LET str_b = "banana"
  
  IF str_a < str_b THEN
    LET lexic_result = "PASS"
  ELSE
    LET lexic_result = "FAIL"
  ENDIF
  
  /* Zero and negative number comparisons */
  LET zero = 0
  LET positive = 1
  LET negative = -1
  
  IF zero > negative THEN
    IF positive > zero THEN
      LET number_order = "PASS"
    ELSE
      LET number_order = "FAIL"
    ENDIF
  ELSE
    LET number_order = "FAIL"
  ENDIF
  
  ADDRESS EXPECTATIONS
  <<EXPECTATIONS
  {grade} should equal "B"
  {status} should equal "Adult"
  {lexic_result} should equal "PASS"
  {number_order} should equal "PASS"
  EXPECTATIONS
  
  SAY "   ✓ Advanced patterns: grade=" || grade || ", status=" || status || ", lexic=" || lexic_result || ", numbers=" || number_order
  
RETURN