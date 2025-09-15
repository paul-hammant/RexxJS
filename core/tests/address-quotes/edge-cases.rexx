-- Test edge cases for quote forms in ADDRESS commands
-- 
-- Copyright (c) 2025 Paul Hammant
-- Licensed under the MIT License
REQUIRE "./src/sqlite-address.js"

SAY "=== Testing Quote Edge Cases for ADDRESS Commands ==="

ADDRESS sql

SAY ""
SAY "1. Empty Strings:"
-- Test if empty strings are handled
""
SAY "   Empty double quotes RC:" RC

SAY ""
SAY "2. Nested Quotes (Double outer, Single inner):"
"CREATE TABLE mixed_quotes (id INTEGER, data TEXT DEFAULT 'default_value')"
SAY "   Mixed quotes RC:" RC

SAY ""  
SAY "3. Nested Quotes (Single outer, Double inner):"
'CREATE TABLE mixed_quotes2 (id INTEGER, data TEXT DEFAULT "another_default")'
SAY "   Mixed quotes 2 RC:" RC

SAY ""
SAY "4. Back-tick with nested quotes:"
`CREATE TABLE mixed_quotes3 (id INTEGER, note TEXT DEFAULT 'back-tick test')`
SAY "   Back-tick mixed RC:" RC

SAY ""
SAY "5. Variable interpolation edge cases:"
LET empty_var = ""
LET quote_var = "its"
"CREATE TABLE edge_test (id INTEGER, description TEXT DEFAULT '{quote_var} working')"
SAY "   Variable with quotes RC:" RC

SAY ""
SAY "6. Complex HEREDOC with various quotes:"
<<MIXED_QUOTES
CREATE TABLE complex_test (
  id INTEGER PRIMARY KEY,
  single_quote_col TEXT DEFAULT 'single',
  double_quote_col TEXT DEFAULT "double", 
  mixed_col TEXT DEFAULT 'it"s complex'
)
MIXED_QUOTES
SAY "   Complex HEREDOC RC:" RC

SAY ""
SAY "=== Edge Case Testing Complete ==="