#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags nested-loops, control-flow, comprehensive, dogfood */
/* @description Comprehensive Nested Loops Test - Multiple Loop Patterns */

REQUIRE "./core/src/expectations-address.js"

/* ============= SETUP SECTION ============= */
SAY "🧪 Comprehensive Nested Loops Test Suite Starting..."
SAY "🔄 Testing various nested loop patterns and combinations"

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

SAY "✅ Comprehensive Nested Loops Tests Complete"
SAY "📊 All nested loop patterns executed successfully"
// Final summary handled by TestRexxInterpreter
EXIT 0

/* ============= SIMPLE NESTED LOOPS ============= */
SimpleNestedLoopsTest:
  SAY "1️⃣  Testing Simple Nested Loops (2 levels)..."
  
  LET outer_total = 0
  LET execution_count = 0
  
  DO i = 1 TO 3
    DO j = 1 TO 2
      LET outer_total = outer_total + (i * j)
      LET execution_count = execution_count + 1
    END
  END
  
  /* Expected: (1*1 + 1*2) + (2*1 + 2*2) + (3*1 + 3*2) = 3 + 6 + 9 = 18 */
  ADDRESS EXPECTATIONS "{outer_total} should equal 18"
  ADDRESS EXPECTATIONS "{execution_count} should equal 6"
  
  SAY "   ✓ Simple nested loops: outer_total=" || outer_total || ", executions=" || execution_count
  
RETURN

/* ============= TRIPLE NESTED LOOPS ============= */
TripleNestedLoopsTest:
  SAY "2️⃣  Testing Triple Nested Loops (3 levels)..."
  
  LET triple_sum = 0
  LET triple_count = 0
  LET max_product = 0
  
  DO x = 1 TO 2
    DO y = 1 TO 2  
      DO z = 1 TO 2
        LET product = x * y * z
        LET triple_sum = triple_sum + product
        LET triple_count = triple_count + 1
        
        IF product > max_product THEN DO
          LET max_product = product
        END
      END
    END
  END
  
  /* Expected: 8 iterations, sum = 1+2+2+4+2+4+4+8 = 27 */
  ADDRESS EXPECTATIONS "{triple_sum} should equal 27"
  ADDRESS EXPECTATIONS "{triple_count} should equal 8"
  ADDRESS EXPECTATIONS "{max_product} should equal 8"
  
  SAY "   ✓ Triple nested loops: sum=" || triple_sum || ", count=" || triple_count || ", max=" || max_product
  
RETURN

/* ============= NESTED LOOPS WITH ARRAYS ============= */
NestedLoopsWithArraysTest:
  SAY "3️⃣  Testing Nested Loops with Array Processing..."
  
  /* Use basic addition in nested loops */
  LET matrix_sum = 0
  LET processed_elements = 0
  
  DO row = 1 TO 2
    DO col = 1 TO 2
      LET matrix_sum = matrix_sum + 10
      LET processed_elements = processed_elements + 1
    END
  END
  
  /* Expected: 10 + 10 + 10 + 10 = 40 */
  ADDRESS EXPECTATIONS "{matrix_sum} should equal 40"
  ADDRESS EXPECTATIONS "{processed_elements} should equal 4"
  
  SAY "   ✓ Matrix processing: sum=" || matrix_sum || ", elements=" || processed_elements
  
RETURN

/* ============= MULTIPLICATION TABLE ============= */
MultiplicationTableTest:
  SAY "4️⃣  Testing Multiplication Table Generation..."
  
  LET table_sum = 0
  LET table_entries = 0
  LET max_result = 0
  
  /* Generate 5x5 multiplication table */
  DO multiplicand = 1 TO 5
    DO multiplier = 1 TO 5
      LET result = multiplicand * multiplier
      LET table_sum = table_sum + result
      LET table_entries = table_entries + 1
      
      IF result > max_result THEN DO
        LET max_result = result
      END
    END
  END

  ADDRESS EXPECTATIONS
  "{table_entries} should equal 25"
  "{max_result} should equal 25"
  "{table_sum} should equal 225"

  ADDRESS EXPECTATIONS
  <<expcts
  {table_entries} should equal 25
  {max_result} should equal 25
  {table_sum} should equal 225
  expcts

  SAY "13 expectations to here after the heredoc trio"

  ADDRESS EXPECTATIONS
  <<EXPECTATIONS
  {table_entries} should equal 25
  {max_result} should equal 25
  {table_sum} should equal 225
  EXPECTATIONS

  SAY "16 expectations to here after the heredoc trio"

  SAY "   ✓ Multiplication table: entries=" || table_entries || ", max=" || max_result || ", sum=" || table_sum
  
RETURN