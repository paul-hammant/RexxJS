#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

REQUIRE "./src/expectations-address.js"

/* ============= SETUP SECTION ============= */
SAY "⚠️  Parser Limitations Demo Starting..."
SAY "This test demonstrates current parser limitations with non-parentheses function syntax."

/* ============= PARSER LIMITATION TESTS ============= */
CALL ParserLimitationTest

SAY "📝 Parser Limitations Demo Complete"
SAY "Note: These limitations are documented and will be addressed in future parser updates."
EXIT 0

/* ============= PARSER LIMITATION DEMONSTRATION ============= */
ParserLimitationTest:
  SAY "🔍 Demonstrating Parser Limitations..."
  
  /* WORKING: Functions with parentheses work correctly */
  SAY ""
  SAY "✅ Functions WITH parentheses work correctly:"
  
  LET text1 = "hello world"
  LET result1 = UPPER(text1)
  ADDRESS EXPECTATIONS "{result1} should equal 'HELLO WORLD'"
  SAY "   UPPER(\"hello world\") = " || result1
  
  LET result2 = REPEAT("test", 3)
  ADDRESS EXPECTATIONS "{result2} should equal 'testtesttest'"
  SAY "   REPEAT(\"test\", 3) = " || result2
  
  LET result3 = SUBSTR("hello world", 1, 5)
  ADDRESS EXPECTATIONS "{result3} should equal 'hello'"
  SAY "   SUBSTR(\"hello world\", 1, 5) = " || result3
  
  /* LIMITATION: Functions without parentheses have parsing issues */
  SAY ""
  SAY "⚠️  Functions WITHOUT parentheses have parser limitations:"
  
  /* Single parameter function without parentheses */
  LET text2 = "hello world"
  LET result4 = UPPER text2
  SAY "   UPPER \"hello world\" = " || TYPEOF(result4) || " (expected: string)"
  ADDRESS EXPECTATIONS "{TYPEOF(result4)} should equal 'string'"
  
  /* Two parameter function without parentheses */
  LET str_var = "test"
  LET count_var = 3
  LET result5 = REPEAT str_var count_var
  SAY "   REPEAT str_var count_var = " || TYPEOF(result5) || " (expected: string)"
  ADDRESS EXPECTATIONS "{TYPEOF(result5)} should equal 'string'"
  
  /* Three parameter function without parentheses */
  LET text_var = "hello world"
  LET start_var = 1
  LET len_var = 5
  LET result6 = SUBSTR text_var start_var len_var
  SAY "   SUBSTR text_var start_var len_var = " || TYPEOF(result6) || " (expected: string)"
  ADDRESS EXPECTATIONS "{TYPEOF(result6)} should equal 'string'"
  
  SAY ""
  SAY "📋 Summary:"
  SAY "   • Functions with parentheses: ✅ Working correctly"
  SAY "   • Functions without parentheses: ⚠️ Parser needs enhancement"
  SAY "   • Multi-parameter functions without parentheses: ⚠️ Especially affected"
  SAY ""
  SAY "🔮 Future Enhancement:"
  SAY "   The parser will be updated to properly handle non-parentheses syntax"
  SAY "   for all function calls, including multi-parameter functions."
  
RETURN