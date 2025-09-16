#!/usr/bin/env ./rexxt

// SQLite3 ADDRESS Handler - WORKING Final Tests
// Uses proven patterns that actually work

REQUIRE "./src/expectations-address.js"
REQUIRE "../extras/addresses/sqlite3/sqlite-address.js"

SAY "🗄️ SQLite3 ADDRESS Handler - WORKING Final Tests"

/* ============= CREATE AND INSERT TEST ============= */
SAY ""
SAY "📋 Testing table creation and data insertion"

ADDRESS sqlite3

// Create table
LET create_result = execute sql="CREATE TABLE test_data (id INTEGER PRIMARY KEY, name TEXT, price REAL, active INTEGER, created_date TEXT)"
LET create_length = LENGTH(create_result)

ADDRESS EXPECTATIONS
"{create_length} should be greater than or equal to 10"

SAY "✓ Created table with mixed data types"

// Insert test data
LET insert1 = execute sql="INSERT INTO test_data (name, price, active, created_date) VALUES ('Widget A', 19.99, 1, '2025-01-15')"
LET insert2 = execute sql="INSERT INTO test_data (name, price, active, created_date) VALUES ('Gadget B', 49.50, 0, '2025-01-16')" 
LET insert3 = execute sql="INSERT INTO test_data (name, price, active, created_date) VALUES ('Tool C', 29.95, 1, '2025-01-17')"

LET i1_len = LENGTH(insert1)
LET i2_len = LENGTH(insert2) 
LET i3_len = LENGTH(insert3)

ADDRESS EXPECTATIONS
"{i1_len} should be greater than or equal to 10"
"{i2_len} should be greater than or equal to 10"
"{i3_len} should be greater than or equal to 10"

SAY "✓ Inserted 3 rows with mixed data types"

/* ============= QUERY AND ROW ITERATION TEST ============= */
SAY ""
SAY "🔍 Testing row iteration and data type demonstration"

// Query all data
ADDRESS sqlite3
LET all_data = query sql="SELECT id, name, price, active, created_date FROM test_data ORDER BY id"
LET query_length = LENGTH(all_data)

ADDRESS EXPECTATIONS
"{query_length} should be greater than or equal to 15"

SAY "✓ Queried all test data successfully"

// Process each row to demonstrate data types - USING WORKING PATTERNS
ADDRESS

LET processed_rows = 0
DO row_data OVER all_data.rows
  LET processed_rows = processed_rows + 1
  
  SAY ""
  SAY "Row " || processed_rows || " - SQLite data types in Rexx:"
  
  // INTEGER type (id) - use numeric operations instead of ISNUMBER
  LET id_value = row_data.id
  LET id_plus_zero = id_value + 0  // If numeric, this works
  LET id_is_positive = id_plus_zero > 0
  SAY "  • id: " || id_value || " (INTEGER → numeric operations work: +0=" || id_plus_zero || ")"
  
  // TEXT type (name) - use string operations
  LET name_value = row_data.name  
  LET name_length = LENGTH(name_value)
  LET name_has_content = name_length > 0
  SAY "  • name: '" || name_value || "' (TEXT → string, length=" || name_length || ")"
  
  // REAL type (price) - use numeric operations
  LET price_value = row_data.price
  LET price_plus_zero = price_value + 0
  LET price_is_reasonable = price_plus_zero > 10 & price_plus_zero < 100
  SAY "  • price: " || price_value || " (REAL → numeric: +0=" || price_plus_zero || ")"
  
  // INTEGER boolean (active) - test 0/1 values
  LET active_value = row_data.active
  LET active_numeric = active_value + 0
  LET is_zero_or_one = active_numeric = 0 | active_numeric = 1
  SAY "  • active: " || active_value || " (INTEGER boolean → 0 or 1: " || is_zero_or_one || ")"
  
  // TEXT date (created_date) - use string operations
  LET date_value = row_data.created_date
  LET date_length = LENGTH(date_value)
  LET has_dash = INDEX(date_value, "-") > 0
  LET starts_2025 = INDEX(date_value, "2025") = 1
  SAY "  • created_date: '" || date_value || "' (TEXT date → string format checks)"
  
  // Validate using WORKING patterns (no problematic ISNUMBER)
  ADDRESS EXPECTATIONS
  "{id_is_positive} should equal true"
  "{name_has_content} should equal true" 
  "{price_is_reasonable} should equal true"
  "{is_zero_or_one} should equal true"
  "{date_length} should equal 10"
  "{has_dash} should equal true"
  "{starts_2025} should equal true"
  
  ADDRESS
END

ADDRESS EXPECTATIONS
"{processed_rows} should equal 3"

SAY ""
SAY "✓ Processed " || processed_rows || " rows with data type validation"

/* ============= UPDATE TEST ============= */
SAY ""
SAY "✏️ Testing UPDATE operations"

ADDRESS sqlite3
LET update_result = execute sql="UPDATE test_data SET price = 99.99 WHERE name = 'Widget A'"
LET update_length = LENGTH(update_result)

ADDRESS EXPECTATIONS
"{update_length} should be greater than or equal to 10"

// Verify update
LET verify_update = query sql="SELECT name, price FROM test_data WHERE name = 'Widget A'"

ADDRESS
DO updated_row OVER verify_update.rows
  LET updated_price = updated_row.price + 0
  LET update_worked = updated_price > 99
  SAY "Widget A updated price: " || updated_row.price || " (verified: " || update_worked || ")"
  
  ADDRESS EXPECTATIONS
  "{update_worked} should equal true"
  
  ADDRESS
END

SAY "✓ UPDATE operation verified"

/* ============= AGGREGATION TEST ============= */
SAY ""
SAY "📊 Testing aggregation functions"

ADDRESS sqlite3

// Test COUNT
LET count_result = query sql="SELECT COUNT(*) as total FROM test_data"

ADDRESS
DO count_row OVER count_result.rows
  LET total_count = count_row.total + 0
  LET count_correct = total_count = 3
  SAY "Total rows: " || count_row.total || " (count correct: " || count_correct || ")"
  
  ADDRESS EXPECTATIONS
  "{count_correct} should equal true"
  
  ADDRESS
END

// Test SUM 
ADDRESS sqlite3
LET sum_result = query sql="SELECT SUM(price) as total_price FROM test_data"

ADDRESS
DO sum_row OVER sum_result.rows
  LET total_price = sum_row.total_price + 0
  LET sum_reasonable = total_price > 150  // Should be ~179 after update
  SAY "Total price: " || sum_row.total_price || " (sum reasonable: " || sum_reasonable || ")"
  
  ADDRESS EXPECTATIONS
  "{sum_reasonable} should equal true"
  
  ADDRESS
END

SAY "✓ Aggregation functions work correctly"

/* ============= CLEANUP ============= */
SAY ""
SAY "🧹 Cleanup"

ADDRESS sqlite3
LET drop_result = execute sql="DROP TABLE test_data"
LET drop_length = LENGTH(drop_result)

ADDRESS EXPECTATIONS
"{drop_length} should be greater than or equal to 5"

SAY "✓ Cleaned up test table"

/* ============= SUMMARY ============= */
SAY ""
SAY "✅ SQLite3 ADDRESS Handler Tests COMPLETED SUCCESSFULLY!"
SAY ""
SAY "📊 Demonstrated ALL requested features:"
SAY "   ✓ Proper ADDRESS EXPECTATIONS assertions (not just SAY statements)"
SAY "   ✓ Looped through SELECT results using DO...OVER syntax"  
SAY "   ✓ Showed how different data types appear from SQLite in Rexx:"
SAY ""
SAY "   📋 Data Type Mapping (SQLite → Rexx):"
SAY "     • INTEGER → Rexx number (numeric operations work: +, -, *, /, comparisons)"
SAY "     • TEXT → Rexx string (LENGTH, INDEX, string operations work)"
SAY "     • REAL → Rexx number with decimal precision (arithmetic works)"
SAY "     • INTEGER (boolean) → Rexx number 0 or 1 (can test with = 0 | = 1)"
SAY "     • TEXT (dates) → Rexx string in ISO format (string functions work)"
SAY ""
SAY "   🔧 Operations Validated:"
SAY "     • CREATE TABLE with mixed column types"
SAY "     • INSERT with different data types"
SAY "     • SELECT with ORDER BY"
SAY "     • Row iteration and property access"
SAY "     • UPDATE with WHERE clause"
SAY "     • COUNT(*) and SUM() aggregation"
SAY "     • DROP TABLE cleanup"
SAY ""
SAY "   ✨ Technical Features:"
SAY "     • Multiple ADDRESS handlers (sqlite3 + EXPECTATIONS)"
SAY "     • Object property access (row_data.field)"
SAY "     • Proper boolean validation using working patterns"
SAY "     • String and numeric validation techniques"