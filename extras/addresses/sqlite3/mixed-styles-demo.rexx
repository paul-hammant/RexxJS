#!/usr/bin/env ./rexxt

// SQLite3 ADDRESS Mixed Styles Demonstration  
// Shows "execute=" method calls, "whole string" commands, and elegant multiline styles

REQUIRE "./src/expectations-address.js"
REQUIRE "./extras/addresses/sqlite3/sqlite-address.js"

SAY "🎭 SQLite3 ADDRESS Mixed Styles Demonstration"

/* ============= Setup ============= */

// ELEGANT MULTILINE STYLE: Create table with clean syntax
ADDRESS sqlite3 MATCHING MULTILINE "^  (.*)"

  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER CHECK (age > 0)
  )

ADDRESS EXPECTATIONS
"{RESULT.success} should equal true"
"{RESULT.operation} should equal 'CREATE_TABLE'"

SAY "✓ Created users table (elegant multiline style): " || RESULT.operation

/* ============= Mixed Insertion Styles ============= */
SAY ""
SAY "📝 Demonstrating Mixed Insertion Styles"

// METHOD-CALL STYLE INSERT
ADDRESS sqlite3
LET user1 = execute sql="INSERT INTO users (name, age) VALUES ('Alice', 25)"

ADDRESS EXPECTATIONS
"{user1.success} should equal true"
"{user1.operation} should equal 'INSERT'"
"{user1.lastInsertId} should equal 1"

SAY "✓ Inserted Alice (method-call style): id=" || user1.lastInsertId

// COMMAND-STRING STYLE INSERT  
ADDRESS sqlite3
LET user2 = execute sql="INSERT INTO users (name, age) VALUES ('Bob', 30)"

ADDRESS EXPECTATIONS
"{user2.success} should equal true"
"{user2.operation} should equal 'INSERT'"
"{user2.lastInsertId} should equal 2"

SAY "✓ Inserted Bob (command-string style): id=" || user2.lastInsertId

/* ============= Mixed Query Styles ============= */
SAY ""
SAY "🔍 Demonstrating Mixed Query Styles"

// METHOD-CALL STYLE QUERY
ADDRESS sqlite3
LET all_users = query sql="SELECT * FROM users ORDER BY id"

ADDRESS EXPECTATIONS
"{all_users.success} should equal true"
"{all_users.operation} should equal 'QUERY'"
"{all_users.count} should equal 2"

SAY "✓ Queried all users (method-call style): count=" || all_users.count

// Show data iteration as requested
ADDRESS
SAY ""
SAY "📊 Row iteration through SELECT results:"
DO user_row OVER all_users.rows
  LET name_value = user_row.name
  LET age_value = user_row.age
  LET id_value = user_row.id
  
  SAY "  • User: id=" || id_value || ", name='" || name_value || "', age=" || age_value
  
  // Show data type validation as requested
  LET name_length = LENGTH(name_value)
  LET age_is_number = ISNUMBER(age_value)
  SAY "    Data types: name (TEXT, length=" || name_length || "), age (INTEGER, number=" || age_is_number || ")"
  
  ADDRESS EXPECTATIONS
  "{name_length} should be greater than or equal to 3"
  "{age_is_number} should equal true"
  
  ADDRESS
END

/* ============= Mixed Update Styles ============= */
SAY ""
SAY "✏️ Demonstrating Mixed Update Styles"

// COMMAND-STRING STYLE UPDATE
ADDRESS sqlite3
"UPDATE users SET age = 26 WHERE name = 'Alice'"
LET update1 = RESULT

ADDRESS EXPECTATIONS
"{update1.success} should equal true"
"{update1.operation} should equal 'EXECUTE'"
"{update1.rowsAffected} should equal 1"

SAY "✓ Updated Alice (command-string style): affected=" || update1.rowsAffected

// METHOD-CALL STYLE UPDATE
ADDRESS sqlite3
LET update2 = execute sql="UPDATE users SET age = 31 WHERE name = 'Bob'"

ADDRESS EXPECTATIONS
"{update2.success} should equal true"
"{update2.operation} should equal 'EXECUTE'"
"{update2.rowsAffected} should equal 1"

SAY "✓ Updated Bob (method-call style): affected=" || update2.rowsAffected

// ELEGANT MULTILINE STYLE: Complex query with joins and aggregation
SAY ""
SAY "🎨 Elegant Multiline Complex Query"

ADDRESS sqlite3 MATCHING MULTILINE "^  (.*)"

  SELECT 
    name,
    age,
    CASE 
      WHEN age < 30 THEN 'Young'
      WHEN age < 50 THEN 'Middle-aged'
      ELSE 'Senior'
    END as age_category,
    LENGTH(name) as name_length
  FROM users
  WHERE age > 20
  ORDER BY age DESC, name ASC

ADDRESS EXPECTATIONS
"{RESULT.success} should equal true"
"{RESULT.count} should equal 2"

SAY "✓ Complex query (elegant multiline style): " || RESULT.count || " results"

/* ============= Style Summary ============= */
SAY ""
SAY "📋 Three ADDRESS Styles Successfully Demonstrated:"
SAY "   • Command-string style:  \"SQL statement\" + LET result = RESULT"
SAY "   • Method-call style:     LET result = execute sql=\"SQL statement\""
SAY "   • Elegant multiline:     ADDRESS sqlite3 MATCHING MULTILINE \"  (.*)\""
SAY "                            with clean, unquoted SQL statements"
SAY ""
SAY "✅ All three styles work seamlessly together!"

/* ============= Cleanup ============= */
ADDRESS sqlite3
LET cleanup = execute sql="DROP TABLE users"

ADDRESS EXPECTATIONS
"{cleanup.success} should equal true"

SAY "✓ Cleanup completed"