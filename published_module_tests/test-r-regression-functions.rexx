#!/usr/bin/env ../../rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags published-modules, r-regression-functions, registry, integration, statistics */
/* @description Test loading r-regression-functions from published registry */

SAY "🧪 Testing Published Module: org.rexxjs/r-regression-functions"
SAY "Loading module from registry..."

// Load r-regression-functions from the published registry
REQUIRE "registry:org.rexxjs/r-regression-functions"

SAY "✓ Module loaded successfully"
SAY ""

// Test 1: Linear regression
SAY "Test 1: Linear regression"

LET x = [1, 2, 3, 4, 5]
LET y = [2, 4, 6, 8, 10]

LET model = LM(y, x)

IF model <> "" THEN DO
  SAY "✓ Linear model created"
  SAY "  Model: " || model
END
ELSE DO
  SAY "❌ Failed to create linear model"
  EXIT 1
END

SAY ""

// Test 2: Correlation
SAY "Test 2: Calculate correlation"

LET corr = COR(x, y)

IF corr = 1 THEN DO
  SAY "✓ Perfect correlation: " || corr
END
ELSE DO
  SAY "❌ Unexpected correlation: " || corr
  EXIT 1
END

SAY ""
SAY "🎉 All tests passed for org.rexxjs/r-regression-functions!"
