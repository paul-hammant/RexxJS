#!/usr/bin/env ../../rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags published-modules, jq-functions, registry, integration, native */
/* @description Test loading jq-functions (native) from published registry */

REQUIRE "../core/src/expectations-address.js"
REQUIRE "registry:org.rexxjs/jq-functions"

SAY "🧪 Testing Published Module: org.rexxjs/jq-functions (Native)"

// Test 1: Simple string extraction (alternate source variable)
SAY "Test 1: Extract string value"
LET jsonInput = <<JSON
{"name": "RexxJS", "version": "1.0.0"}
JSON
LET name = jqQuery(jsonInput, ".name")
ADDRESS EXPECTATIONS "EXPECT" name "RexxJS"

// Test 2: Extract numeric value (different source variable)
SAY "Test 2: Extract numeric value"
LET config = <<JSON
{"port": 8080, "timeout": 30}
JSON
LET port = jqQuery(config, ".port")
ADDRESS EXPECTATIONS "EXPECT" port "8080"

// Test 3: Extract array (returns array object, not string)
SAY "Test 3: Extract array object"
LET document = <<JSON
{"features": ["REXX", "JavaScript", "JSON"]}
JSON
LET features = jqQuery(document, ".features")
LET firstFeature = jqQuery(features, ".[0]")
ADDRESS EXPECTATIONS "EXPECT" firstFeature "REXX"

// Test 4: Extract nested object (returns object, not string)
SAY "Test 4: Extract nested object"
LET userJson = <<JSON
{"user": {"name": "Alice", "age": 30}, "active": true}
JSON
LET userObj = jqQuery(userJson, ".user")
LET userName = jqQuery(userObj, ".name")
ADDRESS EXPECTATIONS "EXPECT" userName "Alice"

// Test 5: Array length
SAY "Test 5: Count array elements"
LET items = <<JSON
{"list": [1, 2, 3, 4, 5]}
JSON
LET count = jqQuery(items, ".list | length")
ADDRESS EXPECTATIONS "EXPECT" count "5"

// Test 6: Keys extraction (returns array)
SAY "Test 6: Extract object keys"
LET metadata = <<JSON
{"author": "Paul", "year": 2025, "license": "MIT"}
JSON
LET keys = jqKeys(metadata)
LET keyCount = jqQuery(keys, "length")
ADDRESS EXPECTATIONS "EXPECT" keyCount "3"

SAY ""
SAY "🎉 All tests passed for org.rexxjs/jq-functions (Native)!"

EXIT 0
