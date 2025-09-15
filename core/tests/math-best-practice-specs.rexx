#!/usr/bin/env ./rexxt

/*
 * @test-tags math, arithmetic, best-practice
 * @description Mathematical operations testing following rexxt best practices
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */
REQUIRE "./src/expectations-address.js"

SAY "🧮 Math Operations Test Suite Starting..."

// Basic arithmetic operations
CALL START_DESCRIBE "Basic Arithmetic"

CALL START_TEST "should add positive numbers"
LET x = 10
LET y = 5
LET result = x + y
ADDRESS EXPECTATIONS "{result} should be 15"
CALL PASS

CALL START_TEST "should subtract numbers"
LET result = x - y
ADDRESS EXPECTATIONS "{result} should be 5"
CALL PASS

CALL START_TEST "should multiply numbers"
LET result = x * y
ADDRESS EXPECTATIONS "{result} should be 50"
CALL PASS

CALL START_TEST "should divide numbers"
LET result = x / y
ADDRESS EXPECTATIONS "{result} should be 2"
CALL PASS

CALL END_DESCRIBE

// Advanced mathematical functions
CALL START_DESCRIBE "Advanced Math"

CALL START_TEST "should handle absolute values"
LET negative = -7
LET result = ABS(negative)
ADDRESS EXPECTATIONS "{result} should be 7"
CALL PASS

CALL START_TEST "should work with constants"
LET pi = 3.14159
ADDRESS EXPECTATIONS "{pi} should be greater than 3"
ADDRESS EXPECTATIONS "{pi} should be less than 4"
CALL PASS

CALL START_TEST "should handle large numbers"
LET large = 999999
ADDRESS EXPECTATIONS "{large} should be greater than 999998"
CALL PASS

CALL END_DESCRIBE

// Edge cases and validation
CALL START_DESCRIBE "Edge Cases"

CALL START_TEST "should handle zero"
LET zero = 0
LET result = 10 + zero
ADDRESS EXPECTATIONS "{result} should be 10"
ADDRESS EXPECTATIONS "{zero} should be 0"
CALL PASS

CALL START_TEST "should handle negative numbers"
LET negative = -42
ADDRESS EXPECTATIONS "{negative} should be less than 0"
CALL PASS

CALL START_TEST "should handle very small numbers"
LET tiny = 0.001
ADDRESS EXPECTATIONS "{tiny} should be greater than 0"
ADDRESS EXPECTATIONS "{tiny} should be less than 1"
CALL PASS

CALL END_DESCRIBE

SAY "🏁 Math Operations Test Suite Complete"