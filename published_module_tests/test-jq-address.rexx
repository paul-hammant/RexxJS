#!/usr/bin/env ../../rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags published-modules, jq-address, registry, integration */
/* @description Test loading jq-address from published registry */

REQUIRE "../../src/expectations-address.js"

SAY "🧪 Testing Published Module: org.rexxjs/jq-address"
SAY "Loading module from registry..."

// Load jq-address from the published registry
REQUIRE "registry:org.rexxjs/jq-address"

SAY "✓ Module loaded successfully"

// Test 1: Simple JQ query
SAY "Test 1: Simple JQ query on JSON data"
LET json_data = '{"name": "RexxJS", "version": "1.0.0", "features": ["REXX", "JavaScript"]}'
LET result1 = ""

ADDRESS JQ <<-EOF
  ${json_data}
  .name
EOF
result1 = RESULT

ADDRESS EXPECTATIONS "EXPECT" result1 "RexxJS"
SAY "✓ Test 1 passed: Got .name = " || result1

// Test 2: Array access with JQ
SAY "Test 2: Array access with JQ"
LET result2 = ""

ADDRESS JQ <<-EOF
  ${json_data}
  .features[0]
EOF
result2 = RESULT

ADDRESS EXPECTATIONS "EXPECT" result2 "REXX"
SAY "✓ Test 2 passed: Got .features[0] = " || result2

// Test 3: Count array elements
SAY "Test 3: Count array elements"
LET result3 = ""

ADDRESS JQ <<-EOF
  ${json_data}
  .features | length
EOF
result3 = RESULT

ADDRESS EXPECTATIONS "EXPECT" result3 "2"
SAY "✓ Test 3 passed: Array length = " || result3

SAY ""
SAY "🎉 All tests passed for org.rexxjs/jq-address!"

EXIT 0
