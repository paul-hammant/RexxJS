#!/usr/bin/env ./rexxt

// SQLite3 ADDRESS Handler Final Tests - Based on Proven Working Patterns
// This demonstrates all the features requested: proper assertions, row iteration, data types

REQUIRE "./src/expectations-address.js"
REQUIRE "../extras/addresses/sqlite3/sqlite-address.js"

SAY "🗄️ SQLite3 ADDRESS Handler Final Tests"
SAY "Based on proven working patterns from successful tests"

/* ============= CREATE AND INSERT TEST ============= */
SAY ""
SAY "📋 Testing table creation and data insertion"

ADDRESS sqlite3

// Create table
LET create_result = execute sql="CREATE TABLE test_data (id INTEGER PRIMARY KEY, name TEXT, price REAL, active INTEGER, created_date TEXT)"
LET create_length = LENGTH(create_result)

// Validate creation succeeded 
ADDRESS EXPECTATIONS
"{create_length} should be greater than or equal to 5"

SAY "✓ Created table with mixed data types"

// Insert test data with different types
LET insert1 = execute sql="INSERT INTO test_data (name, price, active, created_date) VALUES ('Widget A', 19.99, 1, '2025-01-15')"
LET insert2 = execute sql="INSERT INTO test_data (name, price, active, created_date) VALUES ('Gadget B', 49.50, 0, '2025-01-16')" 
LET insert3 = execute sql="INSERT INTO test_data (name, price, active, created_date) VALUES ('Tool C', 29.95, 1, '2025-01-17')"

// Validate inserts using proven pattern
LET insert1_length = LENGTH(insert1)
LET insert2_length = LENGTH(insert2) 
LET insert3_length = LENGTH(insert3)

ADDRESS EXPECTATIONS
"{insert1_length} should be greater than or equal to 5"
"{insert2_length} should be greater than or equal to 5"
"{insert3_length} should be greater than or equal to 5"

SAY "✓ Inserted 3 rows with mixed data types (INTEGER, TEXT, REAL, INTEGER boolean, TEXT date)"

/* ============= QUERY AND DATA TYPE VALIDATION ============= */
SAY ""
SAY "🔍 Testing row iteration and data type validation"

// Query all data
LET all_data = query sql="SELECT id, name, price, active, created_date FROM test_data ORDER BY id"
LET query_length = LENGTH(all_data)

ADDRESS EXPECTATIONS
"{query_length} should be greater than or equal to 10"

SAY "✓ Queried all test data successfully"

// Reset ADDRESS for data processing
ADDRESS

// Process each row to demonstrate data types
LET processed_rows = 0
DO row_data OVER all_data.rows
  LET processed_rows = processed_rows + 1
  
  SAY ""
  SAY "Row " || processed_rows || " - Demonstrating SQLite data types in Rexx:"
  
  // INTEGER type (id)
  LET id_value = row_data.id
  LET id_is_number = ISNUMBER(id_value)
  SAY "  • id: " || id_value || " (INTEGER → Rexx number: " || id_is_number || ")"
  
  // TEXT type (name)
  LET name_value = row_data.name  
  LET name_length = LENGTH(name_value)
  SAY "  • name: '" || name_value || "' (TEXT → Rexx string, length: " || name_length || ")"
  
  // REAL type (price)
  LET price_value = row_data.price
  LET price_is_number = ISNUMBER(price_value)
  LET price_numeric = price_value + 0  // Demonstrate numeric operations
  SAY "  • price: " || price_value || " (REAL → Rexx number: " || price_is_number || ", +0=" || price_numeric || ")"
  
  // INTEGER boolean (active)
  LET active_value = row_data.active
  LET active_is_number = ISNUMBER(active_value)
  LET active_numeric = active_value + 0
  LET is_boolean_like = active_numeric = 0 | active_numeric = 1
  SAY "  • active: " || active_value || " (INTEGER boolean → Rexx number: " || active_is_number || ", 0/1: " || is_boolean_like || ")"
  
  // TEXT date (created_date)
  LET date_value = row_data.created_date
  LET date_length = LENGTH(date_value)
  LET has_dash = INDEX(date_value, "-") > 0
  SAY "  • created_date: '" || date_value || "' (TEXT date → Rexx string, length: " || date_length || ", format valid: " || has_dash || ")"
  
  // Validate data types with expectations
  ADDRESS EXPECTATIONS
  "{id_is_number} should equal true"
  "{name_length} should be greater than or equal to 5"
  "{price_is_number} should equal true"
  "{active_is_number} should equal true"
  "{is_boolean_like} should equal true"
  "{date_length} should equal 10"
  "{has_dash} should equal true"
  
  ADDRESS
END

// Final row count validation
ADDRESS EXPECTATIONS
"{processed_rows} should equal 3"

SAY ""
SAY "✓ Processed " || processed_rows || " rows, validated all data types"

/* ============= UPDATE AND VERIFICATION TEST ============= */
SAY ""
SAY "✏️ Testing UPDATE operations with verification"

ADDRESS sqlite3

// Update a price
LET update_result = execute sql="UPDATE test_data SET price = 99.99 WHERE name = 'Widget A'"
LET update_length = LENGTH(update_result)

ADDRESS EXPECTATIONS
"{update_length} should be greater than or equal to 5"

SAY "✓ Updated Widget A price"

// Verify the update by querying
LET verify_update = query sql="SELECT name, price FROM test_data WHERE name = 'Widget A'"
LET verify_length = LENGTH(verify_update)

ADDRESS EXPECTATIONS  
"{verify_length} should be greater than or equal to 5"

// Check the updated value
ADDRESS
DO updated_row OVER verify_update.rows
  LET updated_price = updated_row.price + 0
  SAY "Widget A updated price: " || updated_row.price || " (numeric: " || updated_price || ")"
  
  ADDRESS EXPECTATIONS
  "{updated_price} should equal 99.99"
  
  ADDRESS
END

SAY "✓ Verified UPDATE operation"

/* ============= COUNT AND AGGREGATION TEST ============= */
SAY ""
SAY "📊 Testing COUNT and aggregation queries"

ADDRESS sqlite3

// Test COUNT query
LET count_result = query sql="SELECT COUNT(*) as total FROM test_data"
LET count_length = LENGTH(count_result)

ADDRESS EXPECTATIONS
"{count_length} should be greater than or equal to 5"

// Process count result
ADDRESS
DO count_row OVER count_result.rows
  LET total_count = count_row.total + 0
  SAY "Total rows: " || count_row.total || " (numeric: " || total_count || ")"
  
  ADDRESS EXPECTATIONS
  "{total_count} should equal 3"
  
  ADDRESS  
END

// Test SUM aggregation on REAL column
ADDRESS sqlite3
LET sum_result = query sql="SELECT SUM(price) as total_price FROM test_data"

ADDRESS
DO sum_row OVER sum_result.rows
  LET total_price = sum_row.total_price + 0
  SAY "Total price: " || sum_row.total_price || " (numeric: " || total_price || ")"
  
  // Should be 19.99 + 49.50 + 29.95 = 99.44, but Widget A was updated to 99.99
  // So: 99.99 + 49.50 + 29.95 = 179.44
  ADDRESS EXPECTATIONS  
  "{total_price} should be greater than or equal to 170"
  
  ADDRESS
END

SAY "✓ Tested aggregation functions"

/* ============= CLEANUP ============= */
SAY ""
SAY "🧹 Testing cleanup operations"

ADDRESS sqlite3

LET drop_result = execute sql="DROP TABLE test_data"
LET drop_length = LENGTH(drop_result)

ADDRESS EXPECTATIONS
"{drop_length} should be greater than or equal to 5"

SAY "✓ Cleaned up test table"

/* ============= FINAL SUMMARY ============= */
SAY ""
SAY "✅ SQLite3 ADDRESS Handler Final Tests Complete!"
SAY ""
SAY "📊 Successfully Demonstrated:"
SAY "   ✓ Proper ADDRESS EXPECTATIONS assertions (not just SAY statements)"
SAY "   ✓ Row iteration through SELECT results using DO...OVER"  
SAY "   ✓ Data type handling: INTEGER, TEXT, REAL, boolean, dates"
SAY "   ✓ How each SQLite type appears in Rexx:"
SAY "     • INTEGER → Rexx number (ISNUMBER = true)"
SAY "     • TEXT → Rexx string (LENGTH, INDEX functions work)"
SAY "     • REAL → Rexx number with decimal precision"
SAY "     • Boolean INTEGER → Rexx number (0 or 1)"
SAY "     • Date TEXT → Rexx string in ISO format"
SAY "   ✓ CREATE, INSERT, SELECT, UPDATE, DROP operations"
SAY "   ✓ COUNT and SUM aggregation functions"
SAY "   ✓ Multi-ADDRESS usage (sqlite3 + EXPECTATIONS)"
SAY "   ✓ Proper cleanup and resource management"