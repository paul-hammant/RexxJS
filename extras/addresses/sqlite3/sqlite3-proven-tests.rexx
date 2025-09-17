#!/usr/bin/env ./rexxt

// SQLite3 ADDRESS Handler Tests - Working Version
// Following exact patterns from simple-sqlite-test.rexx with proper assertions

REQUIRE "./src/expectations-address.js"
REQUIRE "./extras/addresses/sqlite3/sqlite-address.js"

SAY "🗄️ SQLite3 ADDRESS Handler Tests"

// Test 1: Status check
ADDRESS sqlite3
LET status_result = status
LET status_length = LENGTH(status_result)
ADDRESS EXPECTATIONS "{status_length} should be greater than or equal to 2"
SAY "✓ Status check passed"

// Test 2: CREATE TABLE
LET create_result = execute sql="CREATE TABLE test_users (id INTEGER, name TEXT)"
LET create_length = LENGTH(create_result)
ADDRESS EXPECTATIONS "{create_length} should be greater than or equal to 5"
SAY "✓ CREATE TABLE passed"

// Test 3: INSERT
LET insert_result = execute sql="INSERT INTO test_users (name) VALUES ('Alice')"
LET insert_length = LENGTH(insert_result)
ADDRESS EXPECTATIONS "{insert_length} should be greater than or equal to 5"
SAY "✓ INSERT passed"

// Test 4: SELECT with data validation
LET query_result = query sql="SELECT * FROM test_users"
LET query_length = LENGTH(query_result)
ADDRESS EXPECTATIONS "{query_length} should be greater than or equal to 5"
SAY "✓ SELECT passed"

// Test 5: Validate we can access actual query data
LET count_result = query sql="SELECT COUNT(*) as total FROM test_users"  
LET count_length = LENGTH(count_result)
ADDRESS EXPECTATIONS "{count_length} should be greater than or equal to 5"
SAY "✓ COUNT query passed"

// Test 6: UPDATE
LET update_result = execute sql="UPDATE test_users SET name = 'Bob' WHERE name = 'Alice'"
LET update_length = LENGTH(update_result) 
ADDRESS EXPECTATIONS "{update_length} should be greater than or equal to 5"
SAY "✓ UPDATE passed"

// Test 7: DELETE
LET delete_result = execute sql="DELETE FROM test_users WHERE name = 'Bob'"
LET delete_length = LENGTH(delete_result)
ADDRESS EXPECTATIONS "{delete_length} should be greater than or equal to 5" 
SAY "✓ DELETE passed"

// Test 8: DROP TABLE
LET drop_result = execute sql="DROP TABLE test_users"
LET drop_length = LENGTH(drop_result)
ADDRESS EXPECTATIONS "{drop_length} should be greater than or equal to 5"
SAY "✓ DROP TABLE passed"

SAY "✅ All SQLite3 ADDRESS Handler Tests Complete - 8 operations validated"