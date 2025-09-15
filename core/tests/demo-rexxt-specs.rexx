#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

REQUIRE "./src/expectations-address.js"

SAY "🎯 Demo Test Suite Starting..."

// Simple describe block with tests
CALL START_DESCRIBE "Basic Math Operations"

CALL START_TEST "should add numbers correctly"
LET result = 2 + 3
ADDRESS EXPECTATIONS "{result} should be 5"
CALL PASS

CALL START_TEST "should multiply numbers correctly" 
LET result = 4 * 5
ADDRESS EXPECTATIONS "{result} should be 20"
CALL PASS

CALL START_TEST "should handle division"
LET result = 15 / 3
ADDRESS EXPECTATIONS "{result} should be 5"
CALL PASS

CALL END_DESCRIBE

// Another describe block
CALL START_DESCRIBE "String Operations"

CALL START_TEST "should concatenate strings"
LET result = "Hello" || " " || "World"
ADDRESS EXPECTATIONS "{result} should be 'Hello World'"
CALL PASS

CALL START_TEST "should get string length"
LET result = LENGTH("test")
ADDRESS EXPECTATIONS "{result} should be 4"  
CALL PASS

CALL END_DESCRIBE

SAY "🏁 Demo Test Suite Complete"