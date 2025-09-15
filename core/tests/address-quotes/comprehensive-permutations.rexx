-- Comprehensive test for ALL string permutations in ADDRESS commands
-- 
-- Copyright (c) 2025 Paul Hammant
-- Licensed under the MIT License
REQUIRE "./src/sqlite-address.js"

SAY "=== Comprehensive String Permutation Tests ==="

ADDRESS sql

SAY ""
SAY "Testing basic quote forms:"
-- Basic forms
"CREATE TABLE perm_double (id INTEGER)"
SAY "✓ Double quotes"

'CREATE TABLE perm_single (id INTEGER)'  
SAY "✓ Single quotes"

`CREATE TABLE perm_backtick (id INTEGER)`
SAY "✓ Back-ticks"

SAY ""
SAY "Testing nested quotes:"
-- Nested quotes
"CREATE TABLE nest1 (data TEXT DEFAULT 'inner single')"
SAY "✓ Double outer, single inner"

'CREATE TABLE nest2 (data TEXT DEFAULT "inner double")'
SAY "✓ Single outer, double inner"

`CREATE TABLE nest3 (note TEXT DEFAULT 'backtick with single')`
SAY "✓ Backtick outer, single inner"

`CREATE TABLE nest4 (note TEXT DEFAULT "backtick with double")`
SAY "✓ Backtick outer, double inner"

SAY ""
SAY "Testing empty and minimal cases:"
""
SAY "✓ Empty double quotes"

''
SAY "✓ Empty single quotes"

``
SAY "✓ Empty back-ticks"

";"
SAY "✓ Minimal SQL (semicolon only)"

SAY ""
SAY "Testing variable interpolation in all quote forms:"
LET test_var = "interpolated"

"SELECT '{test_var}' as double_interpolation"
SAY "✓ Variable in double quotes"

'SELECT "{test_var}" as single_interpolation' 
SAY "✓ Variable in single quotes"

`SELECT '{test_var}' as backtick_interpolation`
SAY "✓ Variable in back-ticks"

SAY ""
SAY "Testing HEREDOC variations:"
<<SIMPLE
SELECT 1 as simple_heredoc
SIMPLE
SAY "✓ Simple HEREDOC"

<<EMPTY_CONTENT

EMPTY_CONTENT  
SAY "✓ Empty HEREDOC content"

<<WITH_QUOTES
SELECT 'single' as single_quoted, "double" as double_quoted, 'backtick' as mixed_quotes
WITH_QUOTES
SAY "✓ HEREDOC with mixed quotes"

<<WITH_INTERPOLATION
SELECT '{test_var}' as heredoc_interpolation
WITH_INTERPOLATION
SAY "✓ HEREDOC with interpolation"

SAY ""
SAY "=== All String Permutations Tested Successfully ==="