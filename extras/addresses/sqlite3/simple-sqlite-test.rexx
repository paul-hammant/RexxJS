#!/usr/bin/env ./rexxt

// Simple SQLite test to verify basic functionality
// Copyright (c) 2025 Paul Hammant

REQUIRE "../../../core/src/expectations-address.js"
REQUIRE "./sqlite-address.js"

SAY "🗄️ Simple SQLite3 Test"

// Test 1: Status check with expectations
ADDRESS sqlite3
"status"

ADDRESS EXPECTATIONS
"{RESULT.success} should equal true"
"{RESULT.service} should equal 'sqlite'"

SAY "✓ Status check passed"

// Test 2: CREATE TABLE with clean multiline syntax
ADDRESS sqlite3 MATCHING("^  (.*)")

  CREATE TABLE test (
    id INTEGER PRIMARY KEY, 
    name TEXT NOT NULL
  ) -- end table

ADDRESS EXPECTATIONS
"{RESULT.success} should equal true"
"{RESULT.operation} should equal 'CREATE_TABLE'"

SAY "✓ CREATE TABLE passed"

// Test 3: INSERT with multiline syntax
ADDRESS sqlite3 MATCHING("^  (.*)")

  INSERT INTO test (name) 
  VALUES ('hello')

ADDRESS EXPECTATIONS
"{RESULT.success} should equal true"
"{RESULT.operation} should equal 'INSERT'"
"{RESULT.lastInsertId} should equal 1"
"{RESULT.rowsAffected} should equal 1"

SAY "✓ INSERT passed"

// Test 4: SELECT with multiline syntax and row content validation
ADDRESS sqlite3 MATCHING("^  (.*)")

  SELECT * FROM test

// Debug the SELECT result structure
ADDRESS default
SAY "📊 RESULT structure: " || RESULT

ADDRESS EXPECTATIONS  
"{RESULT.success} should equal true"
"{RESULT.operation} should equal 'SELECT'"

SAY "✓ SELECT passed"

// Test 5: Validate row content from SELECT
ADDRESS default

LET foo = RESULT.rows

DO test_row OVER foo
  
  LET row_id = test_row.id
  LET row_name = test_row.name
  
  SAY "📊 Retrieved row: id=" || row_id || ", name='" || row_name || "'"
  
  ADDRESS EXPECTATIONS
  "{row_name} should equal 'hello'"
  "{row_id} should equal 1"
  "{LENGTH(row_name)} should equal 5"
  
  SAY "✓ Row content validation passed"
END

SAY "🎯 All SQLite3 tests passed - ADDRESS MATCHING MULTILINE working perfectly!"