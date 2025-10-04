#!/usr/bin/env ../../rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags published-modules, sqlite-address, registry, integration */
/* @description Test loading sqlite-address from published registry */

REQUIRE "../core/src/expectations-address.js"

SAY "🧪 Testing Published Module: org.rexxjs/sqlite-address"
SAY "Loading module from registry..."

// Load sqlite-address from the published registry
REQUIRE "registry:org.rexxjs/sqlite-address"

SAY "✓ Module loaded successfully"

// Test: Create in-memory database and query it
SAY "Test 1: Create and query in-memory SQLite database"

ADDRESS SQLITE <<-SQL
  CREATE TABLE test_users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER);
  INSERT INTO test_users (name, age) VALUES ('Alice', 30);
  INSERT INTO test_users (name, age) VALUES ('Bob', 25);
  SELECT name FROM test_users WHERE age > 26;
SQL

LET result = RESULT

ADDRESS EXPECTATIONS "EXPECT" result "Alice"
SAY "✓ Test 1 passed: Got user = " || result

SAY ""
SAY "🎉 All tests passed for org.rexxjs/sqlite-address!"

EXIT 0
