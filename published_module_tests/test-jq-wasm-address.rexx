#!/usr/bin/env ../../rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags published-modules, jq-wasm-address, registry, integration */
/* @description Test loading jq-wasm-address from published registry */

REQUIRE "../core/src/expectations-address.js"

SAY "🧪 Testing Published Module: org.rexxjs/jq-wasm-address"
SAY "Loading module from registry..."

// Load jq-wasm-address from the published registry
REQUIRE "registry:org.rexxjs/jq-wasm-address"

SAY "✓ Module loaded successfully"

// Test 1: Simple JQ query
SAY "Test 1: Simple JQ query on JSON data"
LET data = '{"name": "RexxJS", "version": "1.0.0", "features": ["REXX", "JavaScript"]}'
LET query = ".name"

ADDRESS JQ "query"
LET result1 = RESULT

ADDRESS EXPECTATIONS "EXPECT" result1 "RexxJS"
SAY "✓ Test 1 passed: Got .name = " || result1

// Test 2: Array access with JQ
SAY "Test 2: Array access with JQ"
LET query = ".features[0]"

ADDRESS JQ "query"
LET result2 = RESULT

ADDRESS EXPECTATIONS "EXPECT" result2 "REXX"
SAY "✓ Test 2 passed: Got .features[0] = " || result2

// Test 3: Count array elements
SAY "Test 3: Count array elements"
LET query = ".features | length"

ADDRESS JQ "query"
LET result3 = RESULT

ADDRESS EXPECTATIONS "EXPECT" result3 "2"
SAY "✓ Test 3 passed: Array length = " || result3

SAY ""
SAY "🎉 All tests passed for org.rexxjs/jq-wasm-address!"

EXIT 0
