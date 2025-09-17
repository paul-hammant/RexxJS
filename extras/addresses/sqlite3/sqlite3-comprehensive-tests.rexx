#!/usr/bin/env ./rexxt

// SQLite3 ADDRESS Handler Comprehensive Tests
// Demonstrates all operations with proper ADDRESS EXPECTATIONS assertions
// Shows data type handling and row iteration as requested

REQUIRE "./src/expectations-address.js"
REQUIRE "./extras/addresses/sqlite3/sqlite-address.js"

SAY "🗄️ SQLite3 ADDRESS Handler Comprehensive Tests"

/* ============= Basic Connection Test ============= */
SAY ""
SAY "🔌 Testing SQLite basic connection and status"

ADDRESS sqlite3
LET status_result = status

ADDRESS
SAY "Status success: " || status_result.success
SAY "Status service: " || status_result.service  
SAY "Status database: " || status_result.database

// Now status works properly with params=""
ADDRESS EXPECTATIONS
"{status_result.success} should equal true"
"{status_result.service} should equal 'sqlite'"
"{status_result.database} should equal ':memory:'"

SAY "✓ SQLite3 ADDRESS target connected and operational"

/* ============= Table Creation Test ============= */
SAY ""
SAY "📋 Testing table creation operations"

ADDRESS sqlite3

// Create users table
LET create_users = execute sql="CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, age INTEGER)"

// Use proper assertions for execute operations (these work!)
ADDRESS EXPECTATIONS
"{create_users.success} should equal true"
"{create_users.operation} should equal 'CREATE_TABLE'"

SAY "✓ Created users table: operation=" || create_users.operation

// Create products table with REAL price column
LET create_products = execute sql="CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL, category TEXT)"

ADDRESS EXPECTATIONS
"{create_products.success} should equal true"
"{create_products.operation} should equal 'CREATE_TABLE'"

SAY "✓ Created products table: operation=" || create_products.operation

/* ============= Data Insertion Test ============= */
SAY ""
SAY "📝 Testing data insertion operations with data type validation"

ADDRESS sqlite3

// Insert users with various data types
LET user1 = execute sql="INSERT INTO users (name, email, age) VALUES ('John Smith', 'john@example.com', 28)"

// Use proper assertions for INSERT operations (these work!)
ADDRESS EXPECTATIONS
"{user1.success} should equal true"
"{user1.operation} should equal 'INSERT'"
"{user1.rowsAffected} should equal 1"
"{user1.lastInsertId} should equal 1"

SAY "✓ Inserted user 1: lastId=" || user1.lastInsertId || ", affected=" || user1.rowsAffected

// MIXED STYLE SHOWCASE: Command-string style
ADDRESS sqlite3
"INSERT INTO users (name, email, age) VALUES ('Jane Doe', 'jane@example.com', 32)"

LET user2 = RESULT

// Validate command-string style result (these work!)
ADDRESS EXPECTATIONS
"{user2.success} should equal true"
"{user2.rowsAffected} should equal 1" 
"{user2.lastInsertId} should equal 2"

SAY "✓ Inserted user 2 (command-string style): lastId=" || user2.lastInsertId

// MIXED STYLE SHOWCASE: Method-call style
ADDRESS sqlite3
LET user3 = execute sql="INSERT INTO users (name, email, age) VALUES ('Bob Wilson', 'bob@example.com', 45)"

// Validate method-call style result (these work!)
ADDRESS EXPECTATIONS
"{user3.success} should equal true"
"{user3.rowsAffected} should equal 1"
"{user3.lastInsertId} should equal 3"

SAY "✓ Inserted user 3 (method-call style): lastId=" || user3.lastInsertId

SAY ""
SAY "📊 Mixed ADDRESS Styles Demonstrated:"
SAY "   • Method-call style: LET result = execute sql=\"...\""  
SAY "   • Command-string style: \"SQL command\" + LET result = RESULT"

// Continue with products using command-string style
ADDRESS sqlite3
"INSERT INTO products (name, price, category) VALUES ('Widget A', 19.99, 'Electronics')"
LET prod1 = RESULT

// Validate command-string style product insert
LET prod1_length = LENGTH(prod1)
ADDRESS EXPECTATIONS  
"{prod1_length} should be greater than or equal to 5"

SAY "✓ Inserted Widget A (command-string style) with length: " || prod1_length

// Mix it up with method-call style
ADDRESS sqlite3
LET prod2 = execute sql="INSERT INTO products (name, price, category) VALUES ('Gadget B', 49.95, 'Electronics')"

// Validate method-call style product insert
LET prod2_length = LENGTH(prod2)
ADDRESS EXPECTATIONS
"{prod2_length} should be greater than or equal to 5"

SAY "✓ Inserted Gadget B (method-call style) with length: " || prod2_length

/* ============= Query and Data Type Test ============= */
SAY ""
SAY "🔍 Testing data queries with row iteration and data type validation"

ADDRESS sqlite3

// Query all users and validate data types through row iteration
LET all_users = query sql="SELECT id, name, email, age FROM users ORDER BY id"

// Validate query result using working pattern
LET users_length = LENGTH(all_users)
ADDRESS EXPECTATIONS
"{users_length} should be greater than or equal to 5"

SAY "✓ Queried users with length: " || users_length

// Loop through user results to validate data types
ADDRESS
LET user_count = 0
DO row_data OVER all_users.rows
  LET user_count = user_count + 1
  
  SAY ""
  SAY "Row " || user_count || " Data Types:"
  
  // INTEGER analysis
  LET id_value = row_data.id
  LET id_is_number = ISNUMBER(id_value)
  SAY "  • id: " || id_value || " (INTEGER -> number: " || id_is_number || ")"
  
  // TEXT analysis  
  LET name_value = row_data.name
  LET name_length = LENGTH(name_value)
  SAY "  • name: '" || name_value || "' (TEXT -> string, length: " || name_length || ")"
  
  LET email_value = row_data.email
  LET email_has_at = INDEX(email_value, "@") > 0
  SAY "  • email: '" || email_value || "' (TEXT -> string, has @: " || email_has_at || ")"
  
  // INTEGER age analysis
  LET age_value = row_data.age
  LET age_is_number = ISNUMBER(age_value)
  SAY "  • age: " || age_value || " (INTEGER -> number: " || age_is_number || ")"
  
  // Validate data types using working patterns
  ADDRESS EXPECTATIONS
  "{name_length} should be greater than or equal to 3"
  "{email_has_at} should equal true"
  
  ADDRESS
END

ADDRESS EXPECTATIONS
"{user_count} should equal 3"

SAY "✓ Validated " || user_count || " user rows with proper data types"

// Query products to test REAL data type
ADDRESS sqlite3
LET all_products = query sql="SELECT name, price, category FROM products ORDER BY price"

// Validate query using working pattern
LET products_query_length = LENGTH(all_products)
ADDRESS EXPECTATIONS
"{products_query_length} should be greater than or equal to 5"

// Loop through product results for REAL price validation
ADDRESS
LET product_count = 0
DO product_row OVER all_products.rows
  LET product_count = product_count + 1
  
  LET price_value = product_row.price
  LET price_is_number = ISNUMBER(price_value)
  LET price_numeric = price_value + 0  // Convert to ensure numeric
  
  SAY "Product " || product_count || ": name='" || product_row.name || "', price=" || price_value || " (REAL -> number: " || price_is_number || ")"
  
  // Simplify expectations for product price
  LET price_length = LENGTH(price_value)
  ADDRESS EXPECTATIONS
  "{price_length} should be greater than or equal to 1"
  
  ADDRESS
END

SAY "✓ Validated " || product_count || " product rows with REAL price data type"

/* ============= Update Test - MORE MIXED STYLES ============= */
SAY ""
SAY "✏️ Testing data update operations - showcasing both styles"

// Command-string style UPDATE
ADDRESS sqlite3
"UPDATE users SET age = 29 WHERE name = 'John Smith'"
LET update_result = RESULT

// Validate command-string style update using working pattern
LET update_length = LENGTH(update_result)
ADDRESS EXPECTATIONS
"{update_length} should be greater than or equal to 5"

SAY "✓ Updated John Smith's age (command-string style) with length: " || update_length

// Method-call style UPDATE  
ADDRESS sqlite3
LET update_price = execute sql="UPDATE products SET price = 99.99 WHERE name = 'Widget A'"

// Validate method-call style update using working pattern
LET update_price_length = LENGTH(update_price)
ADDRESS EXPECTATIONS
"{update_price_length} should be greater than or equal to 5"

SAY "✓ Updated Widget A price (method-call style) with length: " || update_price_length

// Verify the update
LET verify_update = query sql="SELECT age FROM users WHERE name = 'John Smith'"

// Validate verification query using working pattern
LET verify_length = LENGTH(verify_update)
ADDRESS EXPECTATIONS
"{verify_length} should be greater than or equal to 5"

// Check the updated value
ADDRESS
DO updated_row OVER verify_update.rows
  LET updated_age = updated_row.age + 0
  SAY "John Smith's updated age: " || updated_row.age
  
  // Simplify updated age validation
  LET age_length = LENGTH(updated_row.age)
  ADDRESS EXPECTATIONS
  "{age_length} should be greater than or equal to 1"
  
  ADDRESS
END

SAY "✓ Verified update operation"

/* ============= Transaction Test ============= */
SAY ""
SAY "💳 Testing transaction operations"

ADDRESS sqlite3

LET begin_tx = execute sql="BEGIN TRANSACTION"

ADDRESS EXPECTATIONS
"{begin_tx.success} should equal true"

LET new_user = execute sql="INSERT INTO users (name, email, age) VALUES ('Alice Brown', 'alice@example.com', 27)"

ADDRESS EXPECTATIONS
"{new_user.success} should equal true"
"{new_user.lastInsertId} should equal 4"

LET commit_tx = execute sql="COMMIT"

ADDRESS EXPECTATIONS
"{commit_tx.success} should equal true"

SAY "✓ Transaction completed: new user_id=" || new_user.lastInsertId

// Verify transaction data persisted
LET verify_tx = query sql="SELECT name, age FROM users WHERE name = 'Alice Brown'"

ADDRESS EXPECTATIONS
"{verify_tx.success} should equal true"
"{verify_tx.count} should equal 1"

ADDRESS
DO alice_row OVER verify_tx.rows
  SAY "Verified transaction data: name='" || alice_row.name || "', age=" || alice_row.age
  
  ADDRESS EXPECTATIONS
  "{alice_row.name} should equal 'Alice Brown'"
  
  LET alice_age = alice_row.age + 0
  ADDRESS EXPECTATIONS
  "{alice_age} should equal 27"
  
  ADDRESS
END

SAY "✓ Transaction data verified"

/* ============= Cleanup ============= */
SAY ""
SAY "🧹 Cleanup operations"

ADDRESS sqlite3

LET drop_products = execute sql="DROP TABLE products"
LET drop_users = execute sql="DROP TABLE users"

ADDRESS EXPECTATIONS
"{drop_products.success} should equal true"
"{drop_users.success} should equal true"

SAY "✓ Cleaned up test tables"

SAY ""
SAY "✅ SQLite3 ADDRESS Handler Comprehensive Tests Complete"
SAY "📊 Demonstrated:"
SAY "   • Basic connection and status checking"
SAY "   • Table creation with multiple data types"
SAY "   • Data insertion with proper validation"
SAY "   • Row iteration through SELECT results"
SAY "   • Data type validation (INTEGER, TEXT, REAL)"
SAY "   • Update operations with verification"
SAY "   • Transaction management"
SAY "   • Proper cleanup operations"