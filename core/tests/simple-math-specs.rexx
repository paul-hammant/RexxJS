#!/usr/bin/env ./rexxt

/*
 * @test-tags math, simple
 * @description Simple math test for debugging
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */
REQUIRE "./src/expectations-address.js"

SAY "🧮 Simple Math Test Starting..."

CALL START_DESCRIBE "Simple Math"

CALL START_TEST "should add 2 plus 3"
LET result = 2 + 3
ADDRESS EXPECTATIONS "{result} should be 5"
CALL PASS

CALL END_DESCRIBE

SAY "🏁 Simple Math Test Complete"