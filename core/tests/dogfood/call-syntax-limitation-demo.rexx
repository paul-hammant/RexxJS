#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags call-syntax, limitations, educational, dogfood */
/* @description CALL Syntax Limitations Demonstration - Built-in Functions vs Subroutines */

REQUIRE "expectations-address"

/* ============= SETUP SECTION ============= */
SAY "🧪 CALL Syntax Limitations Demonstration Starting..."
SAY "🔍 Exploring REXX CALL syntax and current implementation limitations"

/* ============= TESTS ============= */
CALL CallSyntaxLimitationTest

SAY "✅ CALL Syntax Limitations Demonstration Complete"
SAY ""
SAY "📋 Summary of Findings:"
SAY "   ❌ CALL UPPER 'text' - Not supported (built-in functions)" 
SAY "   ✅ CALL UserDefinedFunction param - Supported (user subroutines)"
SAY "   ✅ UPPER('text') - Supported (function syntax)"
SAY "   💡 Recommendation: Use function() syntax for built-in functions"
SAY "   💡 Use CALL syntax for user-defined subroutines"
EXIT 0

/* ============= CALL SYNTAX LIMITATION TESTS ============= */
CallSyntaxLimitationTest:
  SAY "📝 Testing CALL syntax capabilities and limitations..."
  
  /* ============= WORKING EXAMPLES ============= */
  SAY ""
  SAY "✅ Working Examples:"
  
  /* Function syntax works perfectly */
  LET text1 = "hello world"
  LET result1 = UPPER(text1)
  ADDRESS EXPECTATIONS "{result1} should equal 'HELLO WORLD'"
  SAY "   ✓ UPPER('" || text1 || "') = '" || result1 || "'"
  
  LET result2 = REPEAT("test", 3)
  ADDRESS EXPECTATIONS "{result2} should equal 'testtesttest'"
  SAY "   ✓ REPEAT('test', 3) = '" || result2 || "'"
  
  LET result3 = SUBSTR("hello world", 1, 5)
  ADDRESS EXPECTATIONS "{result3} should equal 'hello'"
  SAY "   ✓ SUBSTR('hello world', 1, 5) = '" || result3 || "'"
  
  /* User-defined subroutines work with CALL */
  CALL SimpleUserFunction "World"
  LET result4 = RESULT
  ADDRESS EXPECTATIONS "{result4} should equal 'Hello, World!'"
  SAY "   ✓ CALL SimpleUserFunction 'World' = '" || result4 || "'"
  
  CALL MathUserFunction 5 3
  LET result5 = RESULT
  ADDRESS EXPECTATIONS "{result5} should equal 8"
  SAY "   ✓ CALL MathUserFunction 5 3 = " || result5
  
  /* ============= LIMITATION DEMONSTRATIONS ============= */
  SAY ""
  SAY "⚠️  Current Limitations:"
  SAY "   • CALL UPPER 'text' → Error: Subroutine 'UPPER' not found"
  SAY "   • CALL SUBSTR text 1 5 → Error: Subroutine 'SUBSTR' not found"
  SAY "   • Built-in functions are not accessible via CALL syntax"
  SAY ""
  SAY "📚 REXX Standards Notes:"
  SAY "   • Traditional REXX allows CALL with built-in functions"
  SAY "   • This implementation separates built-ins from user subroutines"
  SAY "   • Function() syntax is the preferred method for built-ins"
  
RETURN

/* ============= USER-DEFINED SUBROUTINES (WORK WITH CALL) ============= */

SimpleUserFunction:
  PARSE ARG name
  RETURN "Hello, " || name || "!"

MathUserFunction:
  PARSE ARG a, b
  RETURN a + b

StringProcessorFunction:
  PARSE ARG input_text, operation
  IF operation = "upper" THEN DO
    RETURN UPPER(input_text)
  END
  ELSE IF operation = "lower" THEN DO
    RETURN LOWER(input_text)
  END  
  ELSE IF operation = "reverse" THEN DO
    RETURN REVERSE(input_text)
  END
  ELSE DO
    RETURN input_text
  END

TextAnalyzerFunction:
  PARSE ARG text
  LET word_count = WORDS(text)
  LET char_count = LENGTH(text)
  RETURN "Words: " || word_count || ", Characters: " || char_count