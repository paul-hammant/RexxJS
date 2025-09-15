#!/usr/bin/env ./rexxt
/*
 * RexxJS Assertions Demo Script
 * Demonstrates the Plain English Assertion DSL in a real REXX script
 *
 * This .rexx script is invoked by a JS test in <root>/tests/ by node, and
 * as such the current dir will be <root> and the REQUIRE a few lines below
 * is versus that dir.
 * 
 * For this script. all assertions are going to pass. Yout could temporarily change one
 * to see a failure, but don't commit that.
 *
 * Also, all assertions are one-liners: ADDRESS EXPECTATIONS "<assertion>"
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

// Load the assertions ADDRESS library
REQUIRE "./src/expectations-address.js"

SAY "=== RexxJS Assertions Demo ==="
SAY ""

// Test data setup
LET user_age = 25
LET user_name = "John Doe"
LET scores = [85, 92, 78, 95]

// Complex user profile using HEREDOC auto-parsing
LET user_profile = <<JSON
{
  "name": "Alice Smith",
  "age": 30,
  "email": "alice@example.com",
  "active": true,
  "roles": ["admin", "user"],
  "settings": {
    "theme": "dark",
    "notifications": true
  }
}
JSON

SAY "Testing basic number assertions..."

// Basic number tests
ADDRESS EXPECTATIONS "{25} should be 25"
SAY "✓ Literal number equality passed"

ADDRESS EXPECTATIONS "{user_age} should be greater than 18"
SAY "✓ Age validation passed"

ADDRESS EXPECTATIONS "{user_age} should be at least 21"
SAY "✓ Legal age check passed"

SAY ""
SAY "Testing string assertions..."

// String tests
ADDRESS EXPECTATIONS "{user_name} should contain 'John'"
SAY "✓ Name contains check passed"

ADDRESS EXPECTATIONS '{"hello@example.com"} should contain "@"'
SAY "✓ Email format check passed"

ADDRESS EXPECTATIONS '{"password123"} should match /^[a-zA-Z0-9]+$/'
SAY "✓ Password pattern check passed"

SAY ""
SAY "Testing array assertions..."

// Array tests  
ADDRESS EXPECTATIONS "{scores} should be an array"
SAY "✓ Array type check passed"

ADDRESS EXPECTATIONS "{scores} should have length 4"
SAY "✓ Array length check passed"

ADDRESS EXPECTATIONS "{scores} should contain 95"
SAY "✓ Array contains check passed"

ADDRESS EXPECTATIONS "{scores} should not be empty"
SAY "✓ Array not empty check passed"

SAY ""
SAY "Testing object and nested property assertions..."

// Object and nested property tests
ADDRESS EXPECTATIONS "{user_profile} should be an object"
SAY "✓ Object type check passed"

ADDRESS EXPECTATIONS "{user_profile.name} should be 'Alice Smith'"
SAY "✓ Nested property equality passed"

ADDRESS EXPECTATIONS "{user_profile.age} should be greater than 25"
SAY "✓ Nested number comparison passed"

ADDRESS EXPECTATIONS "{user_profile.email} should end with '.com'"
SAY "✓ Email domain check passed"

ADDRESS EXPECTATIONS "{user_profile.active} should be truthy"
SAY "✓ Boolean check passed"

ADDRESS EXPECTATIONS "{user_profile.roles} should contain 'admin'"
SAY "✓ Role permission check passed"

ADDRESS EXPECTATIONS "{user_profile.settings.theme} should be 'dark'"
SAY "✓ Deep nested property check passed"

SAY ""
SAY "Testing basic value assertions..."

// Basic value tests (avoiding DOM-dependent type checking)
ADDRESS EXPECTATIONS "{user_profile.settings} should be defined"
SAY "✓ Defined value check passed"

SAY ""
SAY "Testing negation assertions..."

// Negation tests
ADDRESS EXPECTATIONS "{user_age} should not be 30"
SAY "✓ Negated equality check passed"

ADDRESS EXPECTATIONS "{user_name} should not contain 'Jane'"
SAY "✓ Negated string contains check passed"

ADDRESS EXPECTATIONS "{scores} should not be empty"
SAY "✓ Negated empty check passed"

ADDRESS EXPECTATIONS "{user_profile.active} should not be falsy"
SAY "✓ Negated falsy check passed"

SAY ""
SAY "Testing range and comparison assertions..."

// Range and comparison tests
ADDRESS EXPECTATIONS "{user_age} should be between 20 and 40"
SAY "✓ Age range check passed"

LET temperature = 25
ADDRESS EXPECTATIONS "{temperature} should be between 20 and 30"
SAY "✓ Temperature range check passed"

LET max_score = 100
ADDRESS EXPECTATIONS "{max_score} should be at most 100"
SAY "✓ Maximum value check passed"

SAY ""
SAY "=== All Assertions Passed! ==="
SAY "RexxJS Assertions ADDRESS library is working correctly."

// Return success code
EXIT 0