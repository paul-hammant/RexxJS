#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags call-syntax, documentation, educational, dogfood */
/* @description CALL Syntax Documentation - Implementation Differences */

REQUIRE "expectations-address"

/* ============= SETUP SECTION ============= */
SAY "🧪 CALL Syntax Documentation Starting..."
SAY "📝 Documenting REXX CALL syntax implementation differences"

/* ============= TESTS ============= */
CALL CallSyntaxDocumentation

SAY "✅ CALL Syntax Documentation Complete"
EXIT 0

/* ============= CALL SYNTAX DOCUMENTATION ============= */
CallSyntaxDocumentation:
  SAY ""
  SAY "📋 REXX CALL Syntax Documentation:"
  SAY ""
  
  /* ============= WORKING: Function Syntax ============= */
  SAY "✅ WORKING: Function Syntax (Recommended)"
  
  LET text1 = "hello world"
  LET result1 = UPPER(text1)
  ADDRESS EXPECTATIONS "{result1} should equal 'HELLO WORLD'"
  SAY "   UPPER('" || text1 || "') = '" || result1 || "'"
  
  LET result2 = REPEAT("test", 3)
  ADDRESS EXPECTATIONS "{result2} should equal 'testtesttest'"
  SAY "   REPEAT('test', 3) = '" || result2 || "'"
  
  LET result3 = SUBSTR("hello world", 1, 5)
  ADDRESS EXPECTATIONS "{result3} should equal 'hello'"
  SAY "   SUBSTR('hello world', 1, 5) = '" || result3 || "'"
  
  LET result4 = MATH_POWER(2, 3)
  ADDRESS EXPECTATIONS "{result4} should equal 8"
  SAY "   MATH_POWER(2, 3) = " || result4
  
  /* ============= WORKING: User-defined Subroutines with CALL ============= */
  SAY ""
  SAY "✅ WORKING: User-defined Subroutines with CALL"
  
  CALL TestGreeting "World"
  LET greeting = RESULT
  ADDRESS EXPECTATIONS "{greeting} should equal 'Hello, World!'"
  SAY "   CALL TestGreeting 'World' → RESULT = '" || greeting || "'"
  
  CALL TestAddition 5 3
  LET sum = RESULT
  ADDRESS EXPECTATIONS "{sum} should equal 8"
  SAY "   CALL TestAddition 5 3 → RESULT = " || sum
  
  /* ============= LIMITATION: Built-in Functions with CALL ============= */
  SAY ""
  SAY "❌ LIMITATION: Built-in Functions with CALL"
  SAY "   The following would cause errors:"
  SAY "   • CALL UPPER 'hello world'"
  SAY "   • CALL REPEAT 'test' 3"
  SAY "   • CALL SUBSTR 'hello world' 1 5"
  SAY "   • CALL MATH_POWER 2 3"
  SAY ""
  SAY "   Error: Subroutine 'FUNCTION_NAME' not found"
  
  /* ============= SUMMARY ============= */
  SAY ""
  SAY "📚 Implementation Summary:"
  SAY "   ✅ Built-in functions: Use FUNCTION(param1, param2) syntax"
  SAY "   ✅ User subroutines: Use CALL SUBROUTINE param1 param2 syntax"
  SAY "   ❌ Built-in functions with CALL: Not supported in this implementation"
  SAY ""
  SAY "💡 Best Practices:"
  SAY "   • Use function() syntax for built-in functions"
  SAY "   • Use CALL syntax for user-defined subroutines"
  SAY "   • Access results via RESULT special variable after CALL"
  
RETURN

/* ============= USER-DEFINED SUBROUTINES ============= */

TestGreeting:
  PARSE ARG name
  RETURN "Hello, " || name || "!"

TestAddition:
  PARSE ARG a, b
  LET sum = a + b
  RETURN sum