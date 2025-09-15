#!/usr/bin/env .rexxt

-- Copyright (c) 2025 Paul Hammant
-- Licensed under the MIT License

REQUIRE "./src/expectations-address.js"

SAY "Testing context variables..."

// Define test data
LET user = {"name": "Bob", "age": 42, "scores": [100, 95, 88]}

// Test context-based expectations
ADDRESS EXPECTATIONS "{user.name} should be 'Bob'"
SAY "✓ Context name check passed"

ADDRESS EXPECTATIONS "{user.age} should be greater than 40"  
SAY "✓ Context age check passed"

ADDRESS EXPECTATIONS "{user.scores} should contain 100"
SAY "✓ Context array contains check passed"

SAY "Context variable tests completed!"
EXIT 0