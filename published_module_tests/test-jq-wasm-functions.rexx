#!/usr/bin/env ../../rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags published-modules, jq-wasm-functions, registry, integration */
/* @description Test loading jq-wasm-functions from published registry */

SAY "🧪 Testing Published Module: org.rexxjs/jq-wasm-functions"
SAY "Loading module from registry..."

// Load jq-wasm-functions from the published registry
REQUIRE "registry:org.rexxjs/jq-wasm-functions"

SAY "✓ Module loaded successfully"

// Test 1: Simple JQ query
SAY "Test 1: Simple JQ query on JSON data"
LET data = '{"name": "RexxJS", "version": "1.0.0", "features": ["REXX", "JavaScript"]}'
LET result1 = jqQuery(data, ".name")

IF result1 <> "RexxJS" THEN DO
  SAY "❌ Test 1 failed: Expected 'RexxJS', got '" || result1 || "'"
  EXIT 1
END
SAY "✓ Test 1 passed: Got .name = " || result1

// Test 2: Array access with JQ
SAY "Test 2: Array access with JQ"
LET result2 = jqQuery(data, ".features[0]")

IF result2 <> "REXX" THEN DO
  SAY "❌ Test 2 failed: Expected 'REXX', got '" || result2 || "'"
  EXIT 1
END
SAY "✓ Test 2 passed: Got .features[0] = " || result2

// Test 3: Count array elements
SAY "Test 3: Count array elements"
LET result3 = jqQuery(data, ".features | length")

IF result3 <> 2 THEN DO
  SAY "❌ Test 3 failed: Expected 2, got " || result3
  EXIT 1
END
SAY "✓ Test 3 passed: Array length = " || result3

SAY ""
SAY "🎉 All tests passed for org.rexxjs/jq-wasm-functions!"

EXIT 0
