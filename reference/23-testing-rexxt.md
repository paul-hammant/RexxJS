# Testing with rexxt - RexxJS Test Runner

The native test runner for RexxJS code, designed around execution sets and collections rather than formal test suites.

## Overview

`rexxt` is the command-line test runner for RexxJS that:
- Discovers and executes test files (any `.rexx` files)
- Counts test execution via `CALL *Test` subroutines
- Tracks expectations via `ADDRESS EXPECTATIONS` statements
- Provides detailed reporting and navigation tools
- **Does not use formal "suite" concepts** - instead works with execution sets/collections

## Basic Usage

### Running Tests

```bash
# Run all .rexx files in current directory and subdirectories
./rexxt

# Run specific test file
./rexxt tests/math-functions.rexx

# Run files matching pattern
./rexxt --pattern "tests/*-specs.rexx"

# Filter by tags
./rexxt --tags math,basic

# Verbose output
./rexxt --verbose-output tests/string-tests.rexx
```

### Navigation and Results

```bash
# Run tests then launch TUI navigator
./rexxt --run-and-navigate tests/*.rexx

# Launch navigator for previous results
./rexxt --navigate
```

## Test File Structure

### Basic Test File Template

```rexx
#!/usr/bin/env ./rexxt

/* @test-tags math, basic, dogfood */
/* @description Basic math operations testing */

REQUIRE "expectations-address"

SAY "🧮 Math Operations Tests Starting..."

CALL SimpleArithmeticTest
CALL AdvancedMathTest

SAY "✅ Math Operations Tests Complete"
EXIT 0

/* Test subroutines - must end with "Test" */
SimpleArithmeticTest:
  LET result = 2 + 3
  ADDRESS EXPECTATIONS "{result} should be 5"
  
  LET product = 4 * 5
  ADDRESS EXPECTATIONS "{product} should be 20"
RETURN

AdvancedMathTest:
  LET sqrt_result = SQRT(16)
  ADDRESS EXPECTATIONS "{sqrt_result} should be 4"
  
  LET power_result = POWER(2, 3)
  ADDRESS EXPECTATIONS "{power_result} should be 8"
RETURN
```

## Key Architecture Concepts

### Tests vs Expectations

- **Tests**: Counted by `CALL *Test` subroutine invocations
- **Expectations**: Counted by `ADDRESS EXPECTATIONS` statement executions
- Tests typically contain multiple expectations

### No Formal Suites

Unlike traditional testing frameworks, rexxt does **not** have formal test suites. Instead:
- Each `.rexx` file is an execution collection
- Tests are organized by `CALL *Test` subroutines within files
- The runner groups files into execution sets based on patterns/tags

### Expectation Patterns

#### Single-line expectations
```rexx
ADDRESS EXPECTATIONS "{value} should be 42"
```

#### Multi-line expectations
```rexx
ADDRESS EXPECTATIONS
"{name} should be 'John'"
"{age} should be greater than 18"
"{email} should contain '@'"
```

## Test Organization Patterns

### File Naming Conventions

Any `.rexx` file can be a test file, but common patterns:
- `*-test.rexx` - Basic test files
- `*-specs.rexx` - Specification tests  
- `dogfood/*` - Self-testing files ("dogfooding")
- `integration/*` - Integration tests

### Tag-based Organization

Use `@test-tags` for categorization:
```rexx
/* @test-tags math, functions, comprehensive */
/* @test-tags integration, web, api */
/* @test-tags dogfood, internal */
```

### Test Subroutine Patterns

```rexx
/* Basic pattern - subroutine must end with "Test" */
SimpleTest:
  ADDRESS EXPECTATIONS "{2} should be 2"
RETURN

/* Complex testing with setup */
DatabaseConnectionTest:
  CALL DatabaseSetup
  
  LET connection = ConnectToDatabase("test_db")
  ADDRESS EXPECTATIONS "{connection} should not be null"
  
  LET result = QueryDatabase(connection, "SELECT COUNT(*) FROM users")
  ADDRESS EXPECTATIONS "{result} should be greater than 0"
  
  CALL DatabaseTeardown
RETURN
```

## Reporting and Output

### Test Execution Counting

rexxt counts three distinct metrics:

1. **Test Sources**: Number of `.rexx` files executed
2. **Tests**: Number of `CALL *Test` subroutines executed  
3. **Expectations**: Number of `ADDRESS EXPECTATIONS` statements executed

Example output:
```
🏁 Summary:
   16 test sources executed (6 passed, 10 failed)
   40 tests (17 passed, 23 failed)
   113 expectations executed (113 passed)
```

### Static Analysis vs Execution

- **Static analysis**: Pre-execution counting of test structure
- **Execution counting**: Runtime tracking of actual executions
- Failed files still contribute static test counts to totals

### JSON Output

Results are saved to `test-results.json` for the TUI navigator:
```json
{
  "startTime": "2025-01-01T12:00:00.000Z",
  "endTime": "2025-01-01T12:00:05.000Z", 
  "totalTests": 40,
  "passedTests": 17,
  "failedTests": 23,
  "files": [
    {
      "file": "tests/math-test.rexx",
      "tags": ["math", "basic"],
      "totalTests": 5,
      "passedTests": 5,
      "failedTests": 0,
      "totalExpectations": 15,
      "passedExpectations": 15
    }
  ],
  "hierarchy": [
    {
      "type": "file",
      "name": "tests/math-test.rexx",
      "tags": ["math", "basic"],
      "children": []
    }
  ]
}
```

## Integration with ADDRESS EXPECTATIONS

### Plain English Assertions

rexxt integrates seamlessly with the ADDRESS EXPECTATIONS library:

```rexx
REQUIRE "expectations-address"

DataValidationTest:
  LET user = JSON_PARSE('{"name": "John", "age": 30, "active": true}')
  
  ADDRESS EXPECTATIONS
  "{user.name} should be 'John'"  
  "{user.age} should be greater than 18"
  "{user.active} should be truthy"
RETURN
```

### Error Handling

When expectations fail:
```rexx
❌ Failed (code: 1)
Error: EXPECTATIONS.execute: 25 expected, but 30 encountered
   at DataValidationTest (user-test.rexx:15)
```

## Advanced Patterns

### Dogfooding Tests

Self-testing files that validate rexxt's own functionality:
```rexx
#!/usr/bin/env ./rexxt

/* @test-tags dogfood, internal, comprehensive */
/* @description Tests rexxt's own counting logic */

REQUIRE "expectations-address"

CallCountingTest:
  SAY "Testing CALL counting logic"
  
  /* This file should detect 3 test calls total */
  ADDRESS EXPECTATIONS "{3} should be 3"
RETURN

ExpectationCountingTest:
  SAY "Testing expectation counting"
  
  /* These should count as 2 separate expectations */  
  ADDRESS EXPECTATIONS
  "{1} should be 1"
  "{2} should be 2"
RETURN

NestedLoopsTest:
  SAY "Testing complex control flow"
  
  LET total = 0
  DO i = 1 TO 3
    DO j = 1 TO 2  
      LET total = total + 1
    END
  END
  
  ADDRESS EXPECTATIONS "{total} should be 6"
RETURN
```

### Test Discovery and Filtering

```bash
# Run only dogfood tests
./rexxt --tags dogfood

# Run math and string tests
./rexxt --tags math,string  

# Run specific patterns
./rexxt tests/integration/*-specs.rexx

# Verbose mode with all SAY output
./rexxt --verbose-output tests/debug-test.rexx
```

## Best Practices

### File Organization

```
tests/
├── unit/
│   ├── math-functions.rexx
│   ├── string-functions.rexx  
│   └── array-functions.rexx
├── integration/
│   ├── api-integration.rexx
│   └── database-integration.rexx
├── dogfood/
│   ├── rexxt-counting.rexx
│   └── expectation-parsing.rexx
└── performance/
    └── benchmark-tests.rexx
```

### Naming Conventions

- Test subroutines: `*Test` (singular, not `*Tests`)
- Files: Descriptive names, any `.rexx` extension
- Tags: Lowercase, hyphenated (`math-functions`, not `MathFunctions`)

### Error Recovery

```rexx
RobustTest:
  /* Test error handling and recovery */
  
  TRY
    LET result = RiskyOperation()
    ADDRESS EXPECTATIONS "{result} should not be null"
  CATCH error
    SAY "Expected error occurred: {error}"
    ADDRESS EXPECTATIONS "{error} should contain 'timeout'"
  END
RETURN
```

### Test Documentation

```rexx
/* @test-tags performance, algorithms, comprehensive */
/* @description Comprehensive algorithm performance validation */

/* Tests sorting algorithms under various data conditions:
 * - Random data sets (10, 100, 1000 elements)  
 * - Already sorted data (best case)
 * - Reverse sorted data (worst case)
 * - Partially sorted data (realistic case)
 */

AlgorithmPerformanceTest:
  /* Implementation here */
RETURN
```

## Migration from Suite-based Frameworks

If coming from traditional testing frameworks with formal suites:

### Old Pattern (Suite-based)
```javascript  
describe('Math Functions', () => {
  it('should add numbers', () => {
    expect(2 + 3).to.equal(5);
  });
  
  it('should multiply numbers', () => {
    expect(4 * 5).to.equal(20);  
  });
});
```

### New Pattern (Execution-based)
```rexx
/* @test-tags math, functions */
/* No formal describe/suite needed */

CALL MathAdditionTest
CALL MathMultiplicationTest

MathAdditionTest:
  LET result = 2 + 3
  ADDRESS EXPECTATIONS "{result} should be 5"
RETURN

MathMultiplicationTest:
  LET result = 4 * 5
  ADDRESS EXPECTATIONS "{result} should be 20"
RETURN
```

## Command Reference

```bash
# Basic execution
./rexxt                          # Run all .rexx files
./rexxt file.rexx               # Run specific file
./rexxt --pattern "tests/*.rexx" # Pattern matching

# Filtering and organization  
./rexxt --tags math,string      # Filter by tags
./rexxt --verbose               # Show parser debug info
./rexxt --verbose-output        # Show all SAY statements

# Navigation and results
./rexxt --navigate              # Launch TUI navigator
./rexxt --run-and-navigate      # Run then navigate
./rexxt --timeout 60000         # Set timeout (ms)

# Help and information
./rexxt --help                  # Show help
./rexxt --version              # Show version info
```

## Integration Examples

### CI/CD Pipeline

```bash
#!/bin/bash
# Run all tests and ensure they pass
./rexxt tests/ || exit 1

# Run specific test categories
./rexxt --tags unit || exit 1
./rexxt --tags integration || exit 1  
./rexxt --tags dogfood || exit 1

echo "All tests passed!"
```

### Development Workflow

```bash
# Quick test during development
./rexxt tests/current-work.rexx --verbose-output

# Full test run with navigation
./rexxt --run-and-navigate

# Test specific functionality
./rexxt --tags math --verbose-output
```

---

**Key Takeaways:**
- No formal "suite" concept - use execution sets/collections
- Tests = `CALL *Test` subroutines, Expectations = `ADDRESS EXPECTATIONS`  
- Any `.rexx` file can contain tests
- Tag-based organization and filtering
- Rich reporting and navigation tools
- Seamless integration with ADDRESS EXPECTATIONS library