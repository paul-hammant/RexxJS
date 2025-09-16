# SQLite3 ADDRESS Library for RexxJS

This library provides SQLite database operations for RexxJS through the ADDRESS mechanism, allowing REXX programs to interact with SQLite databases using SQL commands.

## Quick Start

```rexx
REQUIRE "../extras/addresses/sqlite3/sqlite-address.js"

ADDRESS sqlite3
LET create_result = execute sql="CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)"
LET insert_result = execute sql="INSERT INTO users (name) VALUES ('Alice')"
LET query_result = query sql="SELECT * FROM users"

SAY "Created table: " || create_result.success
SAY "Inserted user: " || insert_result.lastInsertId  
SAY "Query returned: " || query_result.count || " rows"
```

## Installation

**Dependencies:** This library requires the `sqlite3` npm package for Node.js environments.

```bash
npm install sqlite3  # Required dependency
```

## ADDRESS Target: `sqlite3`

Once loaded, this library registers the `sqlite3` ADDRESS target with these capabilities:
- Execute SQL DDL commands (CREATE, DROP, ALTER)
- Perform DML operations (INSERT, UPDATE, DELETE) 
- Query data with SELECT statements
- Handle database transactions (BEGIN, COMMIT, ROLLBACK)
- Get connection status information

## Core Methods

### `execute sql="<SQL>"`
Execute SQL statements (CREATE, INSERT, UPDATE, DELETE, etc.)

**Returns:** Object with:
- `success` (boolean) - Operation success status
- `operation` (string) - Type of operation performed  
- `rowsAffected` (number) - Number of rows affected (for INSERT/UPDATE/DELETE)
- `lastInsertId` (number) - ID of last inserted row (for INSERT)

```rexx
ADDRESS sqlite3
LET result = execute sql="INSERT INTO users (name) VALUES ('Bob')"
SAY "Success: " || result.success
SAY "New ID: " || result.lastInsertId
SAY "Rows affected: " || result.rowsAffected
```

### `query sql="<SELECT>"`
Execute SELECT queries and return data.

**Returns:** Object with:
- `success` (boolean) - Query success status
- `operation` (string) - Always "QUERY"
- `count` (number) - Number of rows returned
- `rows` (array) - Array of row objects with column data

```rexx
ADDRESS sqlite3
LET users = query sql="SELECT id, name FROM users ORDER BY id"
SAY "Found " || users.count || " users"

DO user_row OVER users.rows
  SAY "User: id=" || user_row.id || ", name='" || user_row.name || "'"
END
```

### `status`
Get database connection information.

**Returns:** Object with:
- `success` (boolean) - Always true for active connections
- `service` (string) - Always "sqlite"
- `database` (string) - Database path (":memory:" for in-memory)
- `version` (string) - SQLite version info

```rexx
ADDRESS sqlite3  
LET info = status
SAY "Database: " || info.database
SAY "Service: " || info.service
```

## Data Types

SQLite data types map to Rexx as follows:

| SQLite Type | Rexx Type | Example Usage |
|-------------|-----------|---------------|
| INTEGER | Number | `id_value + 0`, `age > 21` |
| TEXT | String | `LENGTH(name)`, `INDEX(email, "@")` |
| REAL | Number | `price * 1.1`, `total > 100.00` |
| BLOB | String | Binary data as string |

### Data Type Examples

```rexx
ADDRESS sqlite3
LET create_table = execute sql="CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT,
  price REAL, 
  active INTEGER,
  created_date TEXT
)"

LET insert_data = execute sql="INSERT INTO products 
  (name, price, active, created_date) 
  VALUES ('Widget', 19.99, 1, '2025-01-15')"

LET products = query sql="SELECT * FROM products"

DO product OVER products.rows
  // INTEGER: Use as number
  LET id_num = product.id + 0
  SAY "ID: " || product.id || " (numeric: " || id_num || ")"
  
  // TEXT: Use as string  
  LET name_len = LENGTH(product.name)
  SAY "Name: '" || product.name || "' (length: " || name_len || ")"
  
  // REAL: Use as number with decimals
  LET price_total = product.price * 1.2
  SAY "Price: " || product.price || " (with tax: " || price_total || ")"
  
  // INTEGER boolean: Test 0/1 values
  LET is_active = product.active = 1
  SAY "Active: " || product.active || " (boolean: " || is_active || ")"
  
  // TEXT date: Use string functions
  LET date_valid = LENGTH(product.created_date) = 10
  SAY "Date: '" || product.created_date || "' (valid format: " || date_valid || ")"
END
```

## Working with Multiple ADDRESS Handlers

You can combine SQLite operations with other ADDRESS handlers like EXPECTATIONS:

```rexx
REQUIRE "./src/expectations-address.js"
REQUIRE "../extras/addresses/sqlite3/sqlite-address.js"

ADDRESS sqlite3
LET result = execute sql="CREATE TABLE test (id INTEGER)"

// Switch to EXPECTATIONS for validation
ADDRESS EXPECTATIONS
"{result.success} should equal true"
"{result.operation} should equal 'CREATE_TABLE'"

// Back to SQLite for more operations
ADDRESS sqlite3
LET insert_result = execute sql="INSERT INTO test (id) VALUES (42)"

// Validate again
ADDRESS EXPECTATIONS  
"{insert_result.rowsAffected} should equal 1"
"{insert_result.lastInsertId} should equal 1"
```

## Transaction Support

```rexx
ADDRESS sqlite3

// Begin transaction
LET begin_tx = execute sql="BEGIN TRANSACTION"

// Multiple operations
LET insert1 = execute sql="INSERT INTO accounts (name, balance) VALUES ('Alice', 1000)"
LET insert2 = execute sql="INSERT INTO accounts (name, balance) VALUES ('Bob', 500)"
LET update1 = execute sql="UPDATE accounts SET balance = balance - 100 WHERE name = 'Alice'"
LET update2 = execute sql="UPDATE accounts SET balance = balance + 100 WHERE name = 'Bob'"

// Commit or rollback
IF insert1.success & insert2.success & update1.success & update2.success THEN DO
  LET commit_tx = execute sql="COMMIT"
  SAY "Transaction completed successfully"
ELSE
  LET rollback_tx = execute sql="ROLLBACK"  
  SAY "Transaction rolled back due to error"
END
```

## Aggregation and Advanced Queries

```rexx
ADDRESS sqlite3

// COUNT queries
LET count_result = query sql="SELECT COUNT(*) as total FROM users"
DO count_row OVER count_result.rows
  LET total_users = count_row.total + 0
  SAY "Total users: " || total_users
END

// SUM queries
LET sum_result = query sql="SELECT SUM(price) as total_price FROM products"
DO sum_row OVER sum_result.rows
  LET total_value = sum_row.total_price + 0  
  SAY "Total inventory value: $" || total_value
END

// JOINs
LET join_result = query sql="
  SELECT u.name, p.name as product, o.quantity 
  FROM orders o 
  JOIN users u ON o.user_id = u.id 
  JOIN products p ON o.product_id = p.id
"

DO order_row OVER join_result.rows
  SAY order_row.name || " ordered " || order_row.quantity || " " || order_row.product
END
```

## Testing and Validation

The library includes comprehensive test files:

- **`simple-sqlite-test.rexx`** - Basic functionality verification
- **`sqlite3-proven-tests.rexx`** - Complete operations with ADDRESS EXPECTATIONS
- **`test-direct-object-access.rexx`** - Object property access validation

Run tests:
```bash
./rexxt extras/addresses/sqlite3/sqlite3-proven-tests.rexx
```

Example test with proper validation:
```rexx
REQUIRE "./src/expectations-address.js"  
REQUIRE "../extras/addresses/sqlite3/sqlite-address.js"

ADDRESS sqlite3
LET create_result = execute sql="CREATE TABLE test (id INTEGER, name TEXT)"
LET insert_result = execute sql="INSERT INTO test (name) VALUES ('test')"

// Validate operations succeeded
LET create_length = LENGTH(create_result)
LET insert_length = LENGTH(insert_result)

ADDRESS EXPECTATIONS
"{create_length} should be greater than or equal to 5"
"{insert_length} should be greater than or equal to 5"
"{insert_result.rowsAffected} should equal 1"
"{insert_result.lastInsertId} should equal 1"
```

## Error Handling

SQLite errors are thrown as exceptions. Operations that succeed return objects with `success: true`:

```rexx
ADDRESS sqlite3

// Valid operation  
LET good_result = execute sql="CREATE TABLE valid_table (id INTEGER)"
IF good_result.success THEN SAY "Table created successfully"

// This would throw an error:
// LET bad_result = execute sql="INVALID SQL SYNTAX"
```

## Database Connection

- **Default:** In-memory database (`:memory:`)
- **Automatic:** Connection management handled internally
- **Scope:** Global connection shared across all operations
- **Cleanup:** Use `close` method to close connections

```rexx
ADDRESS sqlite3
LET status_info = status
SAY "Connected to: " || status_info.database

// Close when done
LET close_result = close
```

## Environment Compatibility

- **✅ Node.js Command-line**: Full support with sqlite3 module
- **❌ Browser**: Not supported (requires native sqlite3 module)  
- **🔧 Testing**: Graceful handling when sqlite3 module unavailable

## Performance Tips

1. **Use transactions** for multiple operations:
   ```rexx
   execute sql="BEGIN TRANSACTION"
   // ... multiple operations ...
   execute sql="COMMIT"
   ```

2. **Create indexes** for query performance:
   ```rexx
   execute sql="CREATE INDEX idx_name ON users(name)"
   ```

3. **Check operation success**:
   ```rexx
   IF result.success THEN SAY "Operation completed"
   ```

## Integration Notes

This library:
- ✅ Works with RexxJS core interpreter
- ✅ Supports standard ADDRESS mechanism  
- ✅ Compatible with other ADDRESS handlers (EXPECTATIONS, SYSTEM, etc.)
- ✅ Returns proper REXX-compatible object structures
- ✅ Handles both in-memory and file databases

Part of the RexxJS extras collection providing DATABASE capabilities to REXX programs.