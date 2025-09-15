# SQLite3 ADDRESS Library for RexxJS

This library provides SQLite database operations for RexxJS through the ADDRESS mechanism, allowing REXX programs to interact with SQLite databases using SQL commands and prepared statements.

## Quick Start

```rexx
REQUIRE "sqlite-address.js"
ADDRESS SQLITE3
"CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)"
"INSERT INTO users (name) VALUES ('Alice')"
LET result = query sql="SELECT * FROM users"
SAY "Users:" result
```

## Installation

```bash
npm install  # Installs sqlite3 dependency
npm test
```

**Dependencies:** This library requires the `sqlite3` npm package.

## ADDRESS Target: `sqlite3`

Once loaded, this library registers the `sqlite3` ADDRESS target, allowing you to:
- Execute SQL DDL commands (CREATE, DROP, ALTER)
- Perform DML operations (INSERT, UPDATE, DELETE) 
- Query data with SELECT statements
- Use prepared statements for safe parameter binding
- Handle database transactions
- Manage multiple database connections

## Usage Patterns

### Database Creation and Schema

```rexx
ADDRESS SQLITE3
"CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL)"
"CREATE INDEX idx_name ON products(name)"
SAY "Table created. RC:" RC
```

### Data Insertion

```rexx
ADDRESS SQLITE3
"INSERT INTO products (name, price) VALUES ('Widget', 19.99)"
"INSERT INTO products (name, price) VALUES ('Gadget', 29.99)"
SAY "Records inserted"
```

### Querying Data

```rexx
ADDRESS SQLITE3
LET products = query sql="SELECT * FROM products WHERE price > 20"
SAY "Expensive products:" products.rows.length
```

### Method-Style Operations

```rexx
ADDRESS SQLITE3
LET result = execute sql="INSERT INTO users (name) VALUES (?)" params=["Bob"]
SAY "Insert ID:" result.lastID
```

## Available Methods

### `execute`
Execute SQL commands with optional parameter binding.

**Parameters:**
- `sql` - SQL statement to execute
- `params` - Array of parameters for prepared statements (optional)

**Returns:** Object with `changes`, `lastID`, `success`

### `query`
Execute SELECT queries and return results.

**Parameters:** 
- `sql` - SELECT statement
- `params` - Array of parameters for prepared statements (optional)

**Returns:** Object with `rows`, `columns`, `success`

### `transaction`
Execute multiple statements in a transaction.

**Parameters:**
- `statements` - Array of SQL statements

**Returns:** Object with transaction results

### `status`
Get database connection status and information.

**Returns:** Object with database details

## Prepared Statements

Use prepared statements for safe parameter binding:

```rexx
ADDRESS SQLITE3
LET user = execute sql="INSERT INTO users (name, email) VALUES (?, ?)" params=["John", "john@example.com"]
LET found = query sql="SELECT * FROM users WHERE name = ?" params=["John"]
```

## Transaction Support

```rexx
ADDRESS SQLITE3
LET result = transaction statements=[
    "BEGIN TRANSACTION",
    "INSERT INTO accounts (name, balance) VALUES ('Alice', 1000)",
    "INSERT INTO accounts (name, balance) VALUES ('Bob', 500)",
    "COMMIT"
]
IF result.success THEN SAY "Transaction completed"
```

## Error Handling

```rexx
ADDRESS SQLITE3
"CREATE TABLE duplicate_test (id INTEGER)"
"CREATE TABLE duplicate_test (id INTEGER)"  /* This will fail */
IF RC \= 0 THEN DO
    SAY "SQL Error:" ERRORTEXT
END
```

## Database Connection

The library automatically manages database connections:
- Creates in-memory database by default (`:memory:`)
- Supports file-based databases
- Handles connection pooling
- Provides connection status information

### Using File Database

```rexx
ADDRESS SQLITE3
LET status = connect database="/path/to/mydata.db"
"CREATE TABLE IF NOT EXISTS logs (timestamp TEXT, message TEXT)"
```

## Data Types

SQLite3 supports these data types in REXX:
- **INTEGER** - Whole numbers
- **REAL** - Floating point numbers  
- **TEXT** - Strings
- **BLOB** - Binary data
- **NULL** - Null values

## REXX Integration

The library sets standard REXX variables:
- **RC** - Return code (0 = success, non-zero = error)
- **RESULT** - Query results or success confirmation
- **ERRORTEXT** - Error message if operation failed

## Testing

Run the comprehensive test suite:

```bash
npm test
```

Tests include:
- Database creation and schema operations
- CRUD operations (Create, Read, Update, Delete)
- Prepared statement parameter binding
- Transaction handling
- Error conditions and recovery
- Multiple connection scenarios

**Note:** Tests gracefully handle missing sqlite3 module with appropriate warnings.

## Performance Tips

- Use prepared statements for repeated operations
- Batch operations in transactions for better performance  
- Create appropriate indexes for query optimization
- Use connection pooling for concurrent operations

## Security Notes

- Always use prepared statements for user input
- Sanitize file paths for database connections
- Consider file permissions for database files
- Implement proper backup strategies

## Environment Compatibility

- **Node.js**: Requires sqlite3 native module
- **Browser**: Not supported (native sqlite3 dependency)
- **Testing**: Mock mode available when sqlite3 unavailable

## Integration

This library integrates with:
- RexxJS core interpreter
- Standard REXX ADDRESS mechanism
- REXX variable and error handling systems
- SQLite3 database engine

Part of the RexxJS extras collection.