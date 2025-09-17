#!/usr/bin/env ./rexxt

// Simple SQLite test to verify basic functionality
// Copyright (c) 2025 Paul Hammant

REQUIRE "./src/expectations-address.js"
REQUIRE "./extras/addresses/sqlite3/sqlite-address.js"

SAY "🗄️ Simple SQLite3 Test"

// Test 1: Status check
ADDRESS sqlite3
LET status_result = status
SAY "Status result: {status_result}"

// Test 2: Simple CREATE TABLE
LET create_result = execute sql="CREATE TABLE test (id INTEGER, name TEXT)"
    SAY "Create result: {create_result}"

// Test 3: Simple INSERT
LET insert_result = execute sql="INSERT INTO test (name) VALUES ('hello')"
SAY "Insert result: {insert_result}"

// Test 4: Simple SELECT
LET query_result = query sql="SELECT * FROM test"
SAY "Query result: {query_result}"

SAY "✅ Simple SQLite3 test complete"