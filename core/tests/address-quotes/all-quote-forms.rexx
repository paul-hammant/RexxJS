-- Comprehensive test of all quote forms for ADDRESS commands
-- 
-- Copyright (c) 2025 Paul Hammant
-- Licensed under the MIT License
REQUIRE "./src/sqlite-address.js"

SAY "=== Testing All Quote Forms for ADDRESS Commands ==="

ADDRESS sql

-- Variables for testing
LET table_prefix = "test"
LET user_name = "Alice"
LET user_age = 25

SAY ""
SAY "1. Double Quotes:"
"CREATE TABLE {table_prefix}_double (id INTEGER, name TEXT, age INTEGER)"
"INSERT INTO {table_prefix}_double (name, age) VALUES ('{user_name}', {user_age})"
SAY "   RC:" RC "LastID:" RESULT.lastInsertId

SAY ""
SAY "2. Single Quotes:"
'CREATE TABLE {table_prefix}_single (id INTEGER, name TEXT, age INTEGER)'
'INSERT INTO {table_prefix}_single (name, age) VALUES ("{user_name}", {user_age})'
SAY "   RC:" RC "LastID:" RESULT.lastInsertId

SAY ""
SAY "3. Back-ticks:"
`CREATE TABLE {table_prefix}_backtick (id INTEGER, name TEXT, age INTEGER)`
`INSERT INTO {table_prefix}_backtick (name, age) VALUES ('{user_name}', {user_age})`
SAY "   RC:" RC "LastID:" RESULT.lastInsertId

SAY ""
SAY "4. HEREDOC (multi-line complex SQL):"
<<SQL_COMMAND
CREATE TABLE {table_prefix}_heredoc (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  age INTEGER CHECK(age >= 0),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)
SQL_COMMAND
SAY "   Create RC:" RC "Operation:" RESULT.operation

<<MULTI_INSERT
INSERT INTO {table_prefix}_heredoc (name, age) 
VALUES 
  ('{user_name}', {user_age}),
  ('Bob', 30),
  ('Carol', 28)
MULTI_INSERT
SAY "   Insert RC:" RC "Affected:" RESULT.rowsAffected

<<COMPLEX_QUERY
SELECT 
  id,
  name,
  age,
  CASE 
    WHEN age < 25 THEN 'Young'
    WHEN age < 35 THEN 'Adult'
    ELSE 'Mature'
  END as age_group,
  created_at
FROM {table_prefix}_heredoc 
WHERE age >= 25
ORDER BY age DESC
COMPLEX_QUERY
SAY "   Query RC:" RC "Rows:" RESULT.count

SAY ""
SAY "=== Quote Form Summary ==="
SAY "✓ Double quotes: \"SQL...\"      (simple, most common)"
SAY "✓ Single quotes: 'SQL...'       (alternative quoting)"  
SAY "✓ Back-ticks:    `SQL...`       (shell-like style)"
SAY "✓ HEREDOC:       multi-line format    (complex SQL)"
SAY ""
SAY "All forms support:"
SAY "  • Variable interpolation with {variable}"
SAY "  • ADDRESS target routing"
SAY "  • RC, RESULT, SQLCODE variables"
SAY "  • Multi-line content (HEREDOC)"
SAY "  • Complex SQL with formatting"