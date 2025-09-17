#!/usr/bin/env ./rexxt

// Simple SQLite test WITHOUT ADDRESS MATCHING - single line SQL
// Copyright (c) 2025 Paul Hammant

REQUIRE "../../../core/src/expectations-address.js"
REQUIRE "./sqlite-address.js"

SAY "🗄️ Simple SQLite3 Test (No Address Matching)"

// Test 1: Status check with expectations
ADDRESS sqlite3
LET status_result = status

ADDRESS EXPECTATIONS
"{status_result.success} should equal true"
"{status_result.service} should equal 'sqlite'"

SAY "✓ Status check passed"

// Test 2: CREATE TABLE - single line SQL
ADDRESS sqlite3
"CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT NOT NULL)"

ADDRESS EXPECTATIONS
"{RESULT.success} should equal true"
"{RESULT.operation} should equal 'CREATE_TABLE'"

SAY "✓ CREATE TABLE passed"

// Test 3: INSERT - single line SQL
ADDRESS sqlite3
"INSERT INTO test (name) VALUES ('hello')"

ADDRESS EXPECTATIONS
"{RESULT.success} should equal true"
"{RESULT.operation} should equal 'INSERT'"
"{RESULT.lastInsertId} should equal 1"
"{RESULT.rowsAffected} should equal 1"

SAY "✓ INSERT passed"

// Test 4: SELECT - single line SQL
ADDRESS sqlite3
"SELECT * FROM test"

// Debug the SELECT result structure
ADDRESS default
SAY "📊 RESULT structure: " || RESULT

ADDRESS EXPECTATIONS  
"{RESULT.success} should equal true"
"{RESULT.operation} should equal 'SELECT'"

SAY "✓ SELECT passed"

// Test 5: Validate row content from SELECT
ADDRESS default

// Debug RESULT.rows before DO...OVER
INTERPRET_JS "console.log('=== DEBUGGING RESULT.rows (NO MATCHING) ===')"
INTERPRET_JS "console.log('RESULT type:', typeof RESULT)"
INTERPRET_JS "console.log('RESULT structure:', JSON.stringify(RESULT, null, 2))"
INTERPRET_JS "console.log('RESULT.rows type:', typeof RESULT.rows)"
INTERPRET_JS "console.log('RESULT.rows is array:', Array.isArray(RESULT.rows))"
INTERPRET_JS "console.log('RESULT.rows length:', RESULT.rows ? RESULT.rows.length : 'undefined')"
INTERPRET_JS "console.log('RESULT.rows content:', JSON.stringify(RESULT.rows, null, 2))"

DO test_row OVER RESULT.rows
  // Debug what test_row actually contains
  INTERPRET_JS "console.log('test_row variable:', test_row)"
  INTERPRET_JS "console.log('test_row type:', typeof test_row)"
  INTERPRET_JS "if (typeof test_row === 'object' && test_row !== null) { console.log('test_row keys:', Object.keys(test_row)); console.log('test_row.id:', test_row.id); console.log('test_row.name:', test_row.name); }"
  
  LET row_id = test_row.id
  LET row_name = test_row.name
  
  SAY "📊 Retrieved row: id=" || row_id || ", name='" || row_name || "'"
  
  ADDRESS EXPECTATIONS
  "{row_id} should equal '1'"
  "{row_name} should equal 'hello'"
  "{LENGTH(row_name)} should equal 5"
  
  SAY "✓ Row content validation passed"
END

SAY "🎯 All SQLite3 tests passed - Single line SQL working!"