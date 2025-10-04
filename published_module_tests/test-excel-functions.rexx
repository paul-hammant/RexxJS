#!/usr/bin/env ../../rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags published-modules, excel-functions, registry, integration */
/* @description Test loading excel-functions from published registry */

REQUIRE "../../src/expectations-address.js"

SAY "🧪 Testing Published Module: org.rexxjs/excel-functions"
SAY "Loading module from registry..."

// Load excel-functions from the published registry
REQUIRE "registry:org.rexxjs/excel-functions"

SAY "✓ Module loaded successfully"

// Test 1: COLUMN function - convert number to Excel column
SAY "Test 1: COLUMN function"
LET col1 = COLUMN(1)
ADDRESS EXPECTATIONS "EXPECT" col1 "A"
SAY "✓ Test 1 passed: COLUMN(1) = " || col1

// Test 2: COLUMN function with larger number
SAY "Test 2: COLUMN with larger number"
LET col27 = COLUMN(27)
ADDRESS EXPECTATIONS "EXPECT" col27 "AA"
SAY "✓ Test 2 passed: COLUMN(27) = " || col27

// Test 3: COLUMN_NUMBER - convert Excel column to number
SAY "Test 3: COLUMN_NUMBER function"
LET num = COLUMN_NUMBER("AA")
ADDRESS EXPECTATIONS "EXPECT" num "27"
SAY "✓ Test 3 passed: COLUMN_NUMBER('AA') = " || num

SAY ""
SAY "🎉 All tests passed for org.rexxjs/excel-functions!"

EXIT 0
