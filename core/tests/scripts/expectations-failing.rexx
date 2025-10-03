#!/usr/bin/env ./rexxt

-- Copyright (c) 2025 Paul Hammant
-- Licensed under the MIT License

REQUIRE "../../src/expectations-address.js"

SAY "Testing failing expectation..."

// This should fail - using literal values to avoid variable issues
ADDRESS EXPECTATIONS
"5 should be 10"

SAY "This should not appear"
EXIT 0