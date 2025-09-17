# SQLite3 ADDRESS Library for RexxJS

This library provides SQLite database operations for RexxJS through the ADDRESS mechanism, allowing REXX programs to interact with SQLite databases using elegant, unquoted SQL statements.

## Installation

**Dependencies:** This library requires the `sqlite3` npm package for Node.js environments.

```bash
npm install sqlite3  # Required dependency
```

## Quick Start

The SQLite3 ADDRESS library supports three distinct styles for maximum flexibility:

### Style 1: Elegant Multiline (⭐ Recommended)
```rexx
REQUIRE "./extras/addresses/sqlite3/sqlite-address.js"

ADDRESS sqlite3 MATCHING MULTILINE "^  (.*)"

  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE
  )

  INSERT INTO users (name, email) VALUES 
    ('Alice Smith', 'alice@example.com'),
    ('Bob Jones', 'bob@example.com')

  SELECT * FROM users 
  ORDER BY name
```

### Style 2: Method Calls
```rexx
ADDRESS sqlite3
LET create_result = execute sql="CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)"
LET insert_result = execute sql="INSERT INTO users (name) VALUES ('Alice')"
LET query_result = query sql="SELECT * FROM users"
```

### Style 3: Command Strings
```rexx
ADDRESS sqlite3
"CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)"
LET create_result = RESULT
```

## Example Scripts

We provide three demonstration scripts showcasing different aspects:

### 📖 `simple-sqlite-test.rexx` - Basic Example
**Purpose:** Simple proof that ADDRESS MATCHING MULTILINE works  
**Best for:** Quick verification and basic understanding

```bash
./rexxt extras/addresses/sqlite3/simple-sqlite-test.rexx
```

Shows the core functionality with clean multiline CREATE TABLE and INSERT statements.

### 🎨 `elegant-sqlite-demo.rexx` - Best Practices
**Purpose:** Elegant patterns and real-world usage examples  
**Best for:** Learning how to write production-quality SQLite code

```bash
./rexxt extras/addresses/sqlite3/elegant-sqlite-demo.rexx
```

Demonstrates:
- Clean multiline table creation with constraints
- Multi-value inserts with proper formatting
- Query operations and result handling
- Proper cleanup patterns

### 🔄 `mixed-styles-demo.rexx` - Style Comparison
**Purpose:** Side-by-side comparison of all three ADDRESS styles  
**Best for:** Understanding when to use each approach

```bash
./rexxt extras/addresses/sqlite3/mixed-styles-demo.rexx
```

Shows the same operations implemented in:
- Command-string style
- Method-call style  
- Elegant multiline style

## ADDRESS MATCHING MULTILINE Reference

The new elegant multiline syntax provides the cleanest way to write complex SQL:

### Basic Syntax
```rexx
ADDRESS sqlite3 MATCHING MULTILINE "^  (.*)"
  
  -- Your SQL statements here (indented with 2+ spaces)
  -- Each matching line becomes part of the SQL
  -- Non-matching lines flush the collected SQL

ADDRESS sqlite3  -- or ADDRESS default
```

### Multiline SQL Examples

#### Complex CREATE TABLE
```rexx
ADDRESS sqlite3 MATCHING MULTILINE "^  (.*)"

  CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK (status IN ('pending', 'shipped', 'delivered')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  ) -- table end
```

#### Multi-Value INSERT
```rexx
ADDRESS sqlite3 MATCHING MULTILINE "^  (.*)"

  INSERT INTO products (name, price, category) VALUES
    ('Laptop Computer', 999.99, 'Electronics'),
    ('Office Chair', 299.50, 'Furniture'), 
    ('Coffee Maker', 89.99, 'Appliances'),
    ('Desk Lamp', 45.00, 'Furniture')
```

#### Complex SELECT with JOINs
```rexx
ADDRESS sqlite3 MATCHING MULTILINE "^  (.*)"

  SELECT 
    u.name as customer_name,
    p.name as product_name,
    o.quantity,
    o.order_date,
    (p.price * o.quantity) as total_cost
  FROM orders o
  JOIN users u ON o.user_id = u.id
  JOIN products p ON o.product_id = p.id
  WHERE o.order_date >= '2025-01-01'
  ORDER BY o.order_date DESC, total_cost DESC
```

### Separating SQL Statements

To send multiple separate SQL statements, use non-matching lines:

```rexx
ADDRESS sqlite3 MATCHING MULTILINE "^  (.*)"

  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT
  ) -- end

SAY "✓ Table created"  -- This line doesn't match, so it flushes the CREATE

  INSERT INTO users (name) VALUES 
    ('Alice'),
    ('Bob')

ADDRESS default  -- This flushes the INSERT
```

## Core Methods Reference

### `execute sql="<SQL>"`
Execute DDL/DML statements (CREATE, INSERT, UPDATE, DELETE, etc.)

**Returns:**
- `success` (boolean) - Operation success
- `operation` (string) - Type of operation  
- `rowsAffected` (number) - Rows affected
- `lastInsertId` (number) - Last insert ID

### `query sql="<SELECT>"`
Execute SELECT queries and return data

**Returns:**
- `success` (boolean) - Query success
- `operation` (string) - Always "QUERY"
- `count` (number) - Number of rows
- `rows` (array) - Row objects with column data

### `status`
Get database connection information

**Returns:**
- `success` (boolean) - Connection status
- `service` (string) - Always "sqlite"
- `database` (string) - Database path
- `version` (string) - SQLite version

### `close`
Close database connection

## Data Types

| SQLite Type | Rexx Type | Example Usage |
|-------------|-----------|---------------|
| INTEGER | Number | `id_value + 0`, `age > 21` |
| TEXT | String | `LENGTH(name)`, `INDEX(email, "@")` |
| REAL | Number | `price * 1.1`, `total > 100.00` |
| BLOB | String | Binary data as string |

## Integration with Other ADDRESS Handlers

Combine with EXPECTATIONS for testing:

```rexx
REQUIRE "./src/expectations-address.js"
REQUIRE "./extras/addresses/sqlite3/sqlite-address.js"

ADDRESS sqlite3 MATCHING MULTILINE "^  (.*)"

  CREATE TABLE test (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
  ) -- end

ADDRESS EXPECTATIONS
"{RESULT.success} should equal true"
"{RESULT.operation} should equal 'CREATE_TABLE'"
```

## Error Handling

SQLite errors are thrown as exceptions. Successful operations return objects with `success: true`:

```rexx
ADDRESS sqlite3
LET result = execute sql="CREATE TABLE users (id INTEGER)"

IF result.success THEN
  SAY "✓ Table created successfully"
ELSE  
  SAY "❌ Create failed: " || result.error
```

## Environment Compatibility

- **✅ Node.js Command-line**: Full support with sqlite3 module
- **❌ Browser**: Not supported (requires native sqlite3 module)
- **🔧 Testing**: Graceful handling when sqlite3 unavailable

## Performance Tips

1. **Use transactions for multiple operations:**
   ```rexx
   execute sql="BEGIN TRANSACTION"
   -- multiple operations
   execute sql="COMMIT"
   ```

2. **Create indexes for query performance:**
   ```rexx
   execute sql="CREATE INDEX idx_name ON users(name)"
   ```

3. **Use multiline style for complex SQL** - cleaner and more maintainable

## Best Practices

### ✅ Do:
- Use ADDRESS MATCHING MULTILINE for complex SQL
- Validate operations with EXPECTATIONS
- Use transactions for data consistency
- Close connections when done

### ❌ Don't:  
- Mix SQL styles unnecessarily in the same script
- Forget to handle operation results
- Skip validation for critical operations

---

**Part of the RexxJS extras collection** - providing elegant database capabilities to REXX programs with clean, readable syntax.