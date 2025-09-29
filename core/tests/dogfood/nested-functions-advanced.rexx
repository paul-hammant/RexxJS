#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags nested-functions, advanced, comprehensive, dogfood */
/* @description Advanced Nested Function Call Patterns - Complex Multi-Step Chains */

REQUIRE "./core/src/expectations-address.js"

/* ============= SETUP SECTION ============= */
SAY "🧪 Advanced Nested Function Tests Starting..."
SAY "Testing: Complex multi-step function chains and patterns"

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

SAY "✅ Advanced Nested Function Tests Complete"
// Final summary handled by TestRexxInterpreter
EXIT 0

/* ============= ARRAY PROCESSING PATTERNS ============= */
ArrayProcessingTest:
  SAY "📊 Testing Advanced Array Processing with Nested Functions..."
  
  /* Multi-step array processing using intermediate variables */
  LET source_array = "apple banana cherry date elderberry"
  
  /* Step 1: Get word count */
  LET word_count = WORDS(source_array)
  ADDRESS EXPECTATIONS "{word_count} should equal 5"
  
  /* Step 2: Get specific word and transform it */
  LET selected_word = WORD(source_array, 3)
  LET upper_word = UPPER(selected_word)
  ADDRESS EXPECTATIONS "{upper_word} should equal 'CHERRY'"
  
  /* Step 3: Create slug from selected word */
  LET selected_slug = SLUG(selected_word)
  ADDRESS EXPECTATIONS "{selected_slug} should equal 'cherry'"
  
  /* Step 4: Build composite result */
  LET final_result = upper_word || "-" || selected_slug
  ADDRESS EXPECTATIONS "{final_result} should equal 'CHERRY-cherry'"
  
  SAY "   ✓ Array processing chain completed"
RETURN

/* ============= NUMERIC COMPUTATION CHAINS ============= */
NumericComputationTest:
  SAY "🔢 Testing Complex Numeric Computation Chains..."
  
  /* Multi-step mathematical operations */
  LET base_number = -15.7
  
  /* Step 1: Get absolute value */
  LET abs_value = MATH_ABS(base_number)
  ADDRESS EXPECTATIONS "{abs_value} should equal 15.7"
  
  /* Step 2: Apply ceiling to get integer */
  LET ceiling_value = MATH_CEIL(abs_value)
  ADDRESS EXPECTATIONS "{ceiling_value} should equal 16"
  
  /* Step 3: Calculate factorial of result */
  LET factorial_result = MATH_FACTORIAL(ceiling_value)
  ADDRESS EXPECTATIONS "{factorial_result} should equal 20922789888000"
  
  /* Step 4: Get square root of a smaller computation */
  LET sqrt_input = MATH_FLOOR(abs_value)
  LET sqrt_result = MATH_SQRT(sqrt_input)
  ADDRESS EXPECTATIONS "{sqrt_result} should equal 3.872983346207417"
  
  SAY "   ✓ Numeric computation chain completed"
RETURN

/* ============= STRING TRANSFORMATION CHAINS ============= */
StringTransformationTest:
  SAY "📝 Testing Complex String Transformation Patterns..."
  
  /* Multi-step string processing */
  LET input_text = "  Hello, Beautiful World!  "
  
  /* Step 1: Trim whitespace */
  LET trimmed = TRIM(input_text)
  ADDRESS EXPECTATIONS "{trimmed} should equal 'Hello, Beautiful World!'"
  
  /* Step 2: Convert to lowercase for processing */
  LET lowered = LOWER(trimmed)
  ADDRESS EXPECTATIONS "{lowered} should equal 'hello, beautiful world!'"
  
  /* Step 3: Create URL-friendly slug */
  LET slug_version = SLUG(trimmed)
  ADDRESS EXPECTATIONS "{slug_version} should equal 'hello-beautiful-world'"
  
  /* Step 4: Count words in original */
  LET word_count = WORDS(trimmed)
  ADDRESS EXPECTATIONS "{word_count} should equal 3"
  
  /* Step 5: Get length of slug */
  LET slug_length = LENGTH(slug_version)
  ADDRESS EXPECTATIONS "{slug_length} should equal 21"
  
  SAY "   ✓ String transformation chain completed"
RETURN

/* ============= CONDITIONAL CHAIN PATTERNS ============= */
ConditionalChainTest:
  SAY "🔀 Testing Conditional Chains with Nested Function Results..."
  
  /* Chain with conditional logic */
  LET test_string = "Programming"
  
  /* Step 1: Get string length */
  LET str_length = LENGTH(test_string)
  ADDRESS EXPECTATIONS "{str_length} should equal 11"
  
  /* Step 2: Simple transformation sequence */
  LET processed = UPPER(test_string)
  ADDRESS EXPECTATIONS "{processed} should equal 'PROGRAMMING'"
  
  /* Step 3: Reverse the processed string */
  LET final_form = REVERSE(processed)
  ADDRESS EXPECTATIONS "{final_form} should equal 'GNIMMARGORP'"
  
  /* Step 4: Alternative processing for shorter strings */
  LET short_string = "hello"
  LET short_lower = LOWER(short_string)
  ADDRESS EXPECTATIONS "{short_lower} should equal 'hello'"
  
  SAY "   ✓ Conditional chain completed"
RETURN

/* ============= DATA VALIDATION PATTERNS ============= */
DataValidationTest:
  SAY "✅ Testing Data Validation with Nested Function Chains..."
  
  /* Multi-step validation process */
  LET email_candidate = "user@example.com"
  
  /* Step 1: Basic length validation */
  LET email_length = LENGTH(email_candidate)
  ADDRESS EXPECTATIONS "{email_length} should equal 16"
  
  /* Step 2: Check for @ symbol (simulate contains check) */
  LET at_position = POS("@", email_candidate)
  ADDRESS EXPECTATIONS "{at_position} should equal 5"
  
  /* Step 3: Extract domain part */
  LET domain_start = at_position + 1
  LET domain_part = SUBSTR(email_candidate, domain_start)
  ADDRESS EXPECTATIONS "{domain_part} should equal 'example.com'"
  
  /* Step 4: Validate domain length */
  LET domain_length = LENGTH(domain_part)
  ADDRESS EXPECTATIONS "{domain_length} should equal 11"
  
  /* Step 5: Create validation summary */
  LET validation_result = "VALID"
  IF at_position = 0 THEN validation_result = "INVALID"
  IF email_length < 5 THEN validation_result = "INVALID"
  ADDRESS EXPECTATIONS "{validation_result} should equal 'VALID'"
  
  SAY "   ✓ Data validation chain completed"
RETURN