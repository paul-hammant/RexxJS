#!/usr/bin/env ./rexxt
/*
 * RexxJS Expectations Multi-line Demo Script  
 * 
 * This demonstrates the traditional multi-line ADDRESS style:
 * - ADDRESS EXPECT on one line
 * - Followed by multiple expectation strings (without ADDRESS EXPECT prefix)
 *
 * This .rexx script is invoked by a JS test in <root>/tests/ by node, and
 * as such the current dir will be <root> and the REQUIRE a few lines below
 * is versus that dir.
 * 
 * All expectations are designed to pass. You could temporarily change one
 * to see a failure, but don't commit that.
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

REQUIRE "./src/expectations-address.js"

SAY "=== RexxJS Multi-line Expectations Demo ==="
SAY ""

// Define test data  
LET user = {"name": "Bob", "age": 42, "scores": [100, 95, 88]}
LET temperature = 25

// Array using HEREDOC JSON auto-parsing
LET items = <<JSON
["apple", "banana", "orange"]
JSON 

// Complex multiline JSON using HEREDOC auto-parsing
LET config = <<JSON
{
  "theme": "dark",
  "enabled": true,
  "timeout": 5000,
  "features": {
    "notifications": true,
    "autoSave": false
  }
}
JSON

SAY "Testing context variables with multi-line ADDRESS style..."

// Traditional REXX multi-line ADDRESS style
ADDRESS EXPECTATIONS

// Context-based expectations (no ADDRESS EXPECT prefix needed)
"{user.name} should be 'Bob'"
SAY "✓ Context name check passed"

"{user.age} should be greater than 40"
SAY "✓ Context age check passed"

"{user.scores} should contain 100"
SAY "✓ Context array contains check passed"

"{user.scores} should have length 3"
SAY "✓ Array length check passed"

"{user.age} should be between 35 and 50"
SAY "✓ Age range check passed"

SAY ""
SAY "Testing various data types..."

// More expectations without ADDRESS EXPECT prefix
"{temperature} should be 25"
SAY "✓ Temperature equality check passed"

"{temperature} should be at least 20"
SAY "✓ Temperature minimum check passed"

"{items} should be an array"
SAY "✓ Items type check passed"

"{items} should not be empty"
SAY "✓ Items not empty check passed"

"{items} should contain 'banana'"
SAY "✓ Items contains check passed"

SAY ""
SAY "Testing nested object properties..."

"{config.theme} should be 'dark'"
SAY "✓ Config theme check passed"

"{config.enabled} should be truthy"
SAY "✓ Config enabled check passed"

"{config.timeout} should be greater than 1000"
SAY "✓ Config timeout check passed"

"{config.features.notifications} should be true"
SAY "✓ Deep nested boolean check passed"

"{config.features.autoSave} should not be truthy"
SAY "✓ Negated deep nested check passed"

SAY ""
SAY "Testing string operations..."

'{"hello@example.com"} should contain "@"'
SAY "✓ Email validation passed"

'{"JavaScript"} should start with "Java"'
SAY "✓ String prefix check passed"

'{"RexxJS"} should end with "JS"'
SAY "✓ String suffix check passed"

'{"test123"} should match /^test\d+$/'
SAY "✓ Regex pattern check passed"

SAY ""
SAY "Testing type validations..."

"{42} should be a number"
SAY "✓ Number type check passed"

'{"text"} should be a string'
SAY "✓ String type check passed"

"{config} should be an object"
SAY "✓ Object type check passed"

"{items} should be an array"
SAY "✓ Array type check passed"

"{null} should be null"
SAY "✓ Null value check passed"

"{config.features} should be defined"
SAY "✓ Defined value check passed"

SAY ""
SAY "=== All Multi-line Expectations Passed! ===
SAY "RexxJS multi-line ADDRESS EXPECTATIONS style is working correctly."

EXIT 0