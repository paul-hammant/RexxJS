# ADDRESS Quote Forms Test Suite

This directory contains comprehensive tests for all quote forms supported in ADDRESS commands.

## Test Files

### `all-quote-forms.rexx` - Primary comprehensive test
Tests all four quote forms with realistic SQL operations:
- **Double quotes**: `"CREATE TABLE..."` 
- **Single quotes**: `'CREATE TABLE...'`
- **Back-ticks**: `` `CREATE TABLE...` ``
- **HEREDOC**: `<<DELIMITER...DELIMITER` (multiline)

Features tested:
- Variable interpolation with `{variable}` patterns
- Complex multiline SQL with formatting
- CREATE, INSERT, and SELECT operations
- RC and RESULT variable setting

### `comprehensive-permutations.rexx` - All permutation coverage
Tests every possible string permutation:
- Basic quote forms (4 types)
- Nested quote combinations (4 combinations)
- Edge cases (empty strings, minimal SQL)
- Variable interpolation in all forms
- HEREDOC variations

### `edge-cases.rexx` - Edge case testing
Focuses on boundary conditions:
- Empty strings in all quote forms
- Nested quotes (inner vs outer)
- Variable interpolation edge cases
- Complex HEREDOC with mixed quotes

### `simple-heredoc.rexx` - Basic HEREDOC validation
Minimal test for HEREDOC functionality:
- Simple single-table creation
- Basic multiline SQL validation

## Running the Tests

From the project root:

```bash
# Run individual tests
node src/cli.js tests/address-quotes/all-quote-forms.rexx
node src/cli.js tests/address-quotes/comprehensive-permutations.rexx
node src/cli.js tests/address-quotes/edge-cases.rexx  
node src/cli.js tests/address-quotes/simple-heredoc.rexx

# Run all tests in sequence
for test in tests/address-quotes/*.rexx; do
  echo "=== Running $test ==="
  node src/cli.js "$test"
  echo
done
```

## Coverage Summary

These tests provide 100% coverage of:
- ✅ All 4 supported quote forms
- ✅ All nested quote combinations  
- ✅ Variable interpolation scenarios
- ✅ Edge cases and boundary conditions
- ✅ HEREDOC multiline support
- ✅ Empty string handling
- ✅ Complex SQL formatting

Total: **18+ distinct string permutation scenarios tested**

## Implementation Details

All tests use the SQLite ADDRESS target (`ADDRESS SQLITE3`) which demonstrates:
- Traditional Rexx ADDRESS syntax where quoted strings are automatically routed
- Variable interpolation with `{variable}` patterns
- Proper RC (return code) and RESULT variable setting
- Error handling for edge cases