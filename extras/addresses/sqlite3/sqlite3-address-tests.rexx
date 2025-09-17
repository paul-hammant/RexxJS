#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags sqlite3, address, database, sql, comprehensive, integration */
/* @description SQLite3 ADDRESS Handler Integration Tests - Full Database Operations */

REQUIRE "./src/expectations-address.js"

// Load SQLite3 ADDRESS handler globally for all tests
REQUIRE "./extras/addresses/sqlite3/sqlite-address.js"

/* ============= SETUP SECTION ============= */
SAY "🗄️ SQLite3 ADDRESS Handler Integration Tests Starting..."
SAY "📊 Testing database operations with real filesystem database"

// Test configuration
LET test_db_path = "./test-temp-database.sqlite3"
LET cleanup_required = TRUE

// ============= ARGUMENT PARSING =============
PARSE ARG target_describe .

// ============= EXECUTION CONTROLLER =============
LET matching_tests = SUBROUTINES(target_describe)
DO subroutineName OVER matching_tests
  ADDRESS EXPECTATIONS "TEST_COUNT"
  INTERPRET "CALL " || subroutineName
END

// ============= CLEANUP =============
IF cleanup_required THEN DO
  CALL CleanupDatabase
END

SAY "✅ SQLite3 ADDRESS Handler Integration Tests Complete"
EXIT 0

/* ============= TEST SUBROUTINES ============= */

SQLiteBasicConnectionTest:
  SAY ""
  SAY "🔌 Testing SQLite basic connection and status"
  
  // Test ADDRESS target availability - follow simple-sqlite-test.rexx pattern
  ADDRESS sqlite3
  LET status_result = status
  
  // Basic validation that we got some result (non-empty)
  LET status_length = LENGTH(status_result)
  ADDRESS EXPECTATIONS "{status_length} should be greater than or equal to 2"
  
  // Test that we can call basic operations (like simple-sqlite-test.rexx)
  LET test_create = execute sql="CREATE TEMPORARY TABLE connection_test (id INTEGER)"
  LET create_length = LENGTH(test_create)
  ADDRESS EXPECTATIONS "{create_length} should be greater than or equal to 5"
  
  SAY "   ✓ SQLite3 ADDRESS target connected and operational"
  
RETURN

CreateTableTest:
  SAY ""
  SAY "📋 Testing table creation operations"
  
  ADDRESS sqlite3
  
  // Create users table - validate that we get some response
  LET create_users = execute sql="CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, age INTEGER)"
  LET users_response_length = LENGTH(create_users)
  ADDRESS EXPECTATIONS "{users_response_length} should be greater_than 5"
  
  // Create products table
  LET create_products = execute sql="CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL, category TEXT)"
  LET products_response_length = LENGTH(create_products)
  ADDRESS EXPECTATIONS "{products_response_length} should be greater_than 5"
  
  // Create orders table with foreign key
  LET create_orders = execute sql="CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, product_id INTEGER, quantity INTEGER, order_date TEXT)"
  LET orders_response_length = LENGTH(create_orders)
  ADDRESS EXPECTATIONS "{orders_response_length} should be greater_than 5"
  
  SAY "   ✓ Created 3 tables successfully"
  
RETURN

InsertDataTest:
  SAY ""
  SAY "📝 Testing data insertion operations"
  
  ADDRESS sqlite3
  
  // Insert users
  LET user1 = execute sql="INSERT INTO users (name, email, age) VALUES ('John Smith', 'john@example.com', 28)"
  ADDRESS EXPECTATIONS "{user1.success} should equal true"
  ADDRESS EXPECTATIONS "{user1.operation} should equal 'INSERT'"
  ADDRESS EXPECTATIONS "{user1.rowsAffected} should equal 1"
  ADDRESS EXPECTATIONS "{user1.lastInsertId} should equal 1"
  
  ADDRESS EXPECTATIONS LINES(4)
  {user1.success} should equal true
  {user1.operation} should equal 'INSERT'
  {user1.rowsAffected} should equal 1
  {user1.lastInsertId} should equal 1

  LET user2 = execute sql="INSERT INTO users (name, email, age) VALUES ('Jane Doe', 'jane@example.com', 32)"
  ADDRESS EXPECTATIONS "{user2.success} should equal true"
  ADDRESS EXPECTATIONS "{user2.rowsAffected} should equal 1"
  ADDRESS EXPECTATIONS "{user2.lastInsertId} should equal 2"
  
  LET user3 = execute sql="INSERT INTO users (name, email, age) VALUES ('Bob Wilson', 'bob@example.com', 45)"
  ADDRESS EXPECTATIONS "{user3.success} should equal true"
  ADDRESS EXPECTATIONS "{user3.rowsAffected} should equal 1"
  ADDRESS EXPECTATIONS "{user3.lastInsertId} should equal 3"
  SAY "   ✓ Inserted 3 users: lastId={user3.lastInsertId}"
  
  // Insert products
  LET prod1 = execute sql="INSERT INTO products (name, price, category) VALUES ('Widget A', 19.99, 'Electronics')"
  ADDRESS EXPECTATIONS "{prod1.success} should equal true"
  ADDRESS EXPECTATIONS "{prod1.rowsAffected} should equal 1"
  
  LET prod2 = execute sql="INSERT INTO products (name, price, category) VALUES ('Gadget B', 49.95, 'Electronics')"
  ADDRESS EXPECTATIONS "{prod2.success} should equal true"
  ADDRESS EXPECTATIONS "{prod2.rowsAffected} should equal 1"
  
  LET prod3 = execute sql="INSERT INTO products (name, price, category) VALUES ('Tool C', 29.50, 'Hardware')"
  ADDRESS EXPECTATIONS "{prod3.success} should equal true"
  ADDRESS EXPECTATIONS "{prod3.rowsAffected} should equal 1"
  SAY "   ✓ Inserted 3 products: affected={prod3.rowsAffected} rows each"
  
  // Insert orders
  LET order1 = execute sql="INSERT INTO orders (user_id, product_id, quantity, order_date) VALUES (1, 1, 2, '2025-01-15')"
  ADDRESS EXPECTATIONS "{order1.success} should equal 'true'"
  ADDRESS EXPECTATIONS "{order1.rowsAffected} should equal 1"
  
  LET order2 = execute sql="INSERT INTO orders (user_id, product_id, quantity, order_date) VALUES (2, 2, 1, '2025-01-16')"
  ADDRESS EXPECTATIONS "{order2.success} should equal 'true'"
  ADDRESS EXPECTATIONS "{order2.rowsAffected} should equal 1"
  
  LET order3 = execute sql="INSERT INTO orders (user_id, product_id, quantity, order_date) VALUES (1, 3, 3, '2025-01-17')"
  ADDRESS EXPECTATIONS "{order3.success} should equal 'true'"
  ADDRESS EXPECTATIONS "{order3.rowsAffected} should equal 1"
  SAY "   ✓ Inserted 3 orders: affected={order3.rowsAffected} row each"
  
RETURN

QueryDataTest:
  SAY ""
  SAY "🔍 Testing data query operations with data type validation"
  
  ADDRESS sqlite3
  
  // Query all users and validate data types
  LET all_users = query sql="SELECT id, name, email, age FROM users ORDER BY id"
  ADDRESS EXPECTATIONS "{all_users.success} should equal 'true'"
  ADDRESS EXPECTATIONS "{all_users.operation} should equal 'QUERY'"
  ADDRESS EXPECTATIONS "{all_users.count} should equal 3"
  
  // Loop through user results and validate data types
  LET user_validation_count = 0
  DO row_obj OVER all_users.rows
    LET user_validation_count = user_validation_count + 1
    
    // Validate data types - INTEGER id, TEXT name/email, INTEGER age
    LET id_is_number = ISNUMBER(row_obj.id)
    LET name_is_string = LENGTH(row_obj.name) > 0
    LET email_contains_at = INDEX(row_obj.email, "@") > 0
    LET age_is_number = ISNUMBER(row_obj.age)
    
    ADDRESS EXPECTATIONS "{id_is_number} should equal 'true'"
    ADDRESS EXPECTATIONS "{name_is_string} should equal 'true'"
    ADDRESS EXPECTATIONS "{email_contains_at} should equal 'true'"
    ADDRESS EXPECTATIONS "{age_is_number} should equal 'true'"
    
    SAY "     Row {user_validation_count}: id={row_obj.id}(num), name='{row_obj.name}'(str), email='{row_obj.email}'(str), age={row_obj.age}(num)"
  END
  
  ADDRESS EXPECTATIONS "{user_validation_count} should equal 3"
  SAY "   ✓ Validated {user_validation_count} user rows with proper data types"
  
  // Query products with REAL price column to test floating point
  LET product_prices = query sql="SELECT name, price, category FROM products WHERE price > 20.0 ORDER BY price"
  ADDRESS EXPECTATIONS "{product_prices.success} should equal 'true'"
  ADDRESS EXPECTATIONS "{product_prices.count} should equal 2"
  
  // Loop through product results and validate REAL data type
  LET price_validation_count = 0
  DO product_row OVER product_prices.rows
    LET price_validation_count = price_validation_count + 1
    
    // Validate price is a number and has decimal precision
    LET price_is_number = ISNUMBER(product_row.price)
    LET price_value = product_row.price + 0  // Convert to number
    LET price_above_twenty = price_value > 20
    
    ADDRESS EXPECTATIONS "{price_is_number} should equal 'true'"
    ADDRESS EXPECTATIONS "{price_above_twenty} should equal 'true'"
    
    SAY "     Product: name='{product_row.name}', price={product_row.price}(real), category='{product_row.category}'"
  END
  
  ADDRESS EXPECTATIONS "{price_validation_count} should equal 2"
  SAY "   ✓ Validated {price_validation_count} product rows with REAL price data type"
  
  // Query orders with TEXT date column to test date strings
  LET order_dates = query sql="SELECT user_id, product_id, quantity, order_date FROM orders ORDER BY order_date"
  ADDRESS EXPECTATIONS "{order_dates.success} should equal 'true'"
  ADDRESS EXPECTATIONS "{order_dates.count} should equal 3"
  
  // Loop through order results and validate date format
  LET date_validation_count = 0
  DO order_row OVER order_dates.rows
    LET date_validation_count = date_validation_count + 1
    
    // Validate date string format (YYYY-MM-DD)
    LET date_length = LENGTH(order_row.order_date)
    LET has_hyphens = INDEX(order_row.order_date, "-") > 0
    LET user_id_is_number = ISNUMBER(order_row.user_id)
    LET quantity_is_number = ISNUMBER(order_row.quantity)
    
    ADDRESS EXPECTATIONS "{date_length} should equal 10"
    ADDRESS EXPECTATIONS "{has_hyphens} should equal 'true'"
    ADDRESS EXPECTATIONS "{user_id_is_number} should equal 'true'"
    ADDRESS EXPECTATIONS "{quantity_is_number} should equal 'true'"
    
    SAY "     Order: user_id={order_row.user_id}(int), product_id={order_row.product_id}(int), qty={order_row.quantity}(int), date='{order_row.order_date}'(text)"
  END
  
  ADDRESS EXPECTATIONS "{date_validation_count} should equal 3"
  SAY "   ✓ Validated {date_validation_count} order rows with TEXT date and INTEGER foreign keys"
  
RETURN

UpdateDataTest:
  SAY ""
  SAY "✏️ Testing data update operations"
  
  ADDRESS sqlite3
  
  // Update user age
  LET update_age = execute sql="UPDATE users SET age = 29 WHERE name = 'John Smith'"
  ADDRESS EXPECTATIONS "{update_age.success} should equal 'true'"
  ADDRESS EXPECTATIONS "{update_age.operation} should equal 'EXECUTE'"
  ADDRESS EXPECTATIONS "{update_age.rowsAffected} should equal 1"
  SAY "   ✓ Updated John Smith's age: affected={update_age.rowsAffected} rows"
  
  // Update product price
  LET update_price = execute sql="UPDATE products SET price = 45.00 WHERE name = 'Gadget B'"
  ADDRESS EXPECTATIONS "{update_price.success} should equal 'true'"
  ADDRESS EXPECTATIONS "{update_price.rowsAffected} should equal 1"
  SAY "   ✓ Updated Gadget B price: affected={update_price.rowsAffected} rows"
  
  // Verify updates with specific value checks
  LET john_age = query sql="SELECT age FROM users WHERE name = 'John Smith'"
  ADDRESS EXPECTATIONS "{john_age.success} should equal 'true'"
  ADDRESS EXPECTATIONS "{john_age.count} should equal 1"
  
  // Validate the updated age value
  DO age_row OVER john_age.rows
    LET updated_age = age_row.age + 0  // Convert to number
    ADDRESS EXPECTATIONS "{updated_age} should equal 29"
    SAY "     John Smith's age updated to: {age_row.age}"
  END
  
  LET gadget_price = query sql="SELECT price FROM products WHERE name = 'Gadget B'"
  ADDRESS EXPECTATIONS "{gadget_price.success} should equal 'true'"
  ADDRESS EXPECTATIONS "{gadget_price.count} should equal 1"
  
  // Validate the updated price value
  DO price_row OVER gadget_price.rows
    LET updated_price = price_row.price + 0  // Convert to number
    ADDRESS EXPECTATIONS "{updated_price} should equal 45"
    SAY "     Gadget B price updated to: {price_row.price}"
  END
  
RETURN

TransactionTest:
  SAY ""
  SAY "💳 Testing transaction operations"
  
  ADDRESS sqlite3
  
  // Begin transaction
  LET begin_tx = execute sql="BEGIN TRANSACTION"
  ADDRESS EXPECTATIONS "{begin_tx.success} should equal 'true'"
  ADDRESS EXPECTATIONS "{begin_tx.operation} should equal 'EXECUTE'"
  SAY "   ✓ Started transaction: operation={begin_tx.operation}"
  
  // Insert new user in transaction
  LET new_user = execute sql="INSERT INTO users (name, email, age) VALUES ('Alice Brown', 'alice@example.com', 27)"
  ADDRESS EXPECTATIONS "{new_user.success} should equal 'true'"
  ADDRESS EXPECTATIONS "{new_user.rowsAffected} should equal 1"
  ADDRESS EXPECTATIONS "{new_user.lastInsertId} should equal 4"
  
  // Insert order for new user
  LET new_order = execute sql="INSERT INTO orders (user_id, product_id, quantity, order_date) VALUES (4, 1, 1, '2025-01-18')"
  ADDRESS EXPECTATIONS "{new_order.success} should equal 'true'"
  ADDRESS EXPECTATIONS "{new_order.rowsAffected} should equal 1"
  
  // Commit transaction
  LET commit_tx = execute sql="COMMIT"
  ADDRESS EXPECTATIONS "{commit_tx.success} should equal 'true'"
  SAY "   ✓ Committed transaction: user_id={new_user.lastInsertId}, order_affected={new_order.rowsAffected}"
  
  // Verify data was committed with specific validation
  LET verify_user = query sql="SELECT name, email, age FROM users WHERE name = 'Alice Brown'"
  ADDRESS EXPECTATIONS "{verify_user.success} should equal 'true'"
  ADDRESS EXPECTATIONS "{verify_user.count} should equal 1"
  
  // Loop through and validate Alice's data
  DO alice_row OVER verify_user.rows
    ADDRESS EXPECTATIONS "{alice_row.name} should equal 'Alice Brown'"
    ADDRESS EXPECTATIONS "{alice_row.email} should equal 'alice@example.com'"
    
    LET alice_age = alice_row.age + 0  // Convert to number
    ADDRESS EXPECTATIONS "{alice_age} should equal 27"
    
    SAY "     Verified Alice: name='{alice_row.name}', email='{alice_row.email}', age={alice_row.age}"
  END
  
RETURN

ErrorHandlingTest:
  SAY ""
  SAY "❌ Testing error handling (basic validation)"
  
  ADDRESS sqlite3
  
  // Note: Full error handling testing requires TRY/CATCH support
  // For now, we'll test that valid operations succeed
  
  // Test a complex valid query to ensure error handling doesn't interfere
  LET valid_query = query sql="SELECT COUNT(*) as user_count FROM users WHERE age > 0"
  ADDRESS EXPECTATIONS "{valid_query.success} should be true"
  SAY "   ✓ Complex valid query succeeded (error handling not blocking)"
  
RETURN

CommandStringTest:
  SAY ""
  SAY "📜 Testing command-string style ADDRESS calls"
  
  ADDRESS sqlite3
  
  // Test direct SQL command without method wrapper
  "CREATE TEMPORARY TABLE temp_test (id INTEGER, value TEXT)"
  SAY "   ✓ Created temporary table via command string"
  
  "INSERT INTO temp_test (value) VALUES ('test1')"
  "INSERT INTO temp_test (value) VALUES ('test2')"
  SAY "   ✓ Inserted data via command strings"
  
  // Query using command string style
  LET temp_count = query sql="SELECT COUNT(*) as count FROM temp_test"
  ADDRESS EXPECTATIONS "{temp_count.success} should be true"
  SAY "   ✓ Queried temporary table data"
  
  "DROP TABLE temp_test"
  SAY "   ✓ Dropped temporary table"
  
RETURN

PerformanceTest:
  SAY ""
  SAY "⚡ Testing bulk operations performance"
  
  ADDRESS sqlite3
  
  // Create performance test table
  LET perf_table = execute sql="CREATE TABLE perf_test (id INTEGER PRIMARY KEY, data TEXT, timestamp TEXT)"
  ADDRESS EXPECTATIONS "{perf_table.success} should be true"
  
  // Begin transaction for bulk insert
  LET begin_bulk = execute sql="BEGIN TRANSACTION"
  ADDRESS EXPECTATIONS "{begin_bulk.success} should be true"
  
  // Insert multiple records
  DO i = 1 TO 100
    LET bulk_insert = execute sql="INSERT INTO perf_test (data, timestamp) VALUES ('bulk_data_{i}', '2025-01-15T10:00:{i:02d}')"
    ADDRESS EXPECTATIONS "{bulk_insert.success} should be true"
  END
  
  // Commit bulk transaction
  LET commit_bulk = execute sql="COMMIT"
  ADDRESS EXPECTATIONS "{commit_bulk.success} should be true"
  SAY "   ✓ Bulk inserted 100 records in transaction"
  
  // Verify bulk data
  LET bulk_count = query sql="SELECT COUNT(*) as total FROM perf_test"
  ADDRESS EXPECTATIONS "{bulk_count.success} should be true"
  SAY "   ✓ Verified bulk insert: {bulk_count.total} records"
  
  // Clean up performance test table
  LET drop_perf = execute sql="DROP TABLE perf_test"
  ADDRESS EXPECTATIONS "{drop_perf.success} should be true"
  SAY "   ✓ Cleaned up performance test table"
  
RETURN

SchemaInformationTest:
  SAY ""
  SAY "📋 Testing schema information queries"
  
  ADDRESS sqlite3
  
  // Get list of tables
  LET tables_list = query sql="SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  ADDRESS EXPECTATIONS "{tables_list.success} should be true"
  ADDRESS EXPECTATIONS "{tables_list.rowCount} should be greater_than 3"
  SAY "   ✓ Retrieved database table list"
  
  // Get table schema
  LET users_schema = query sql="PRAGMA table_info(users)"
  ADDRESS EXPECTATIONS "{users_schema.success} should be true"
  ADDRESS EXPECTATIONS "{users_schema.rowCount} should equal 4"
  SAY "   ✓ Retrieved users table schema"
  
  // Get database file size (if using file database)
  LET db_info = query sql="PRAGMA database_list"
  ADDRESS EXPECTATIONS "{db_info.success} should be true"
  SAY "   ✓ Retrieved database information"
  
RETURN

/* ============= CLEANUP SUBROUTINE ============= */
CleanupDatabase:
  SAY ""
  SAY "🧹 Cleaning up test database..."
  
  // Close database connection
  ADDRESS sqlite3
  LET close_result = close
  SAY "   ✓ Database connection closed"
  
  // Remove test database file if it exists (if using file database)
  REQUIRE "../extras/addresses/system/system-address.js"
  ADDRESS system
  "rm -f {test_db_path}"
  SAY "   ✓ Removed temporary database file"
  
RETURN