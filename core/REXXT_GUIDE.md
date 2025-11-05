# rexxt - RexxJS Test Runner Guide

## Overview

`rexxt` is the native test runner for RexxJS, providing a powerful and elegant way to write and execute tests for REXX scripts. It combines the simplicity of REXX with modern testing features inspired by Jest, pytest, and RSpec.

## Quick Start

```bash
# Run all tests in current directory
./rexxt

# Run specific test file
./rexxt tests/my-test.rexx

# Run tests matching a pattern
./rexxt --pattern "tests/*-test.rexx"

# Run tests with specific tags
./rexxt --tags math,integration

# Show live output while tests run
./rexxt --live-output tests/my-test.rexx
```

## Installation & Setup

The `rexxt` test runner is included in the core RexxJS distribution. From the `core/` directory:

```bash
# Make rexxt executable (if needed)
chmod +x rexxt

# Run tests
./rexxt tests/dogfood/*
```

## Writing Tests

### Basic Test Structure

A typical test file looks like this:

```rexx
#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Your Name
// Licensed under the MIT License

/* @test-tags math, basic */
/* @description Basic Math Operations Test */

REQUIRE "../../src/expectations-address.js"

SAY "🧪 Math Tests Starting..."

// Call your test subroutines
CALL AdditionTest
CALL SubtractionTest

EXIT 0

// ============= Tests =============

AdditionTest:
  SAY "Testing addition..."
  LET result = 2 + 2
  ADDRESS EXPECTATIONS "result should equal 4"
RETURN

SubtractionTest:
  SAY "Testing subtraction..."
  LET result = 10 - 3
  ADDRESS EXPECTATIONS "result should equal 7"
RETURN
```

### Test Naming Convention

- Test subroutines **must** end with `Test` (case-insensitive)
- Examples: `AdditionTest`, `ValidationTest`, `EdgeCaseHandlingTest`
- The test runner automatically counts and tracks subroutines ending in `Test`

### Using Expectations

The `ADDRESS EXPECTATIONS` command provides a readable way to write assertions:

```rexx
// Equality checks
ADDRESS EXPECTATIONS "result should equal 42"
ADDRESS EXPECTATIONS "name should equal 'Alice'"

// Type checks
ADDRESS EXPECTATIONS "value should be a number"
ADDRESS EXPECTATIONS "data should be an array"

// Comparisons
ADDRESS EXPECTATIONS "age should be greater than 18"
ADDRESS EXPECTATIONS "score should be less than 100"

// Boolean checks
ADDRESS EXPECTATIONS "isValid should be true"
ADDRESS EXPECTATIONS "hasError should be false"

// String operations
ADDRESS EXPECTATIONS "message should contain 'success'"
ADDRESS EXPECTATIONS "filename should start with 'test_'"
ADDRESS EXPECTATIONS "url should end with '.com'"
```

## Test Organization

### Test Tags

Use `@test-tags` to categorize your tests:

```rexx
/* @test-tags math, integration, slow */
```

Run tests by tag:

```bash
./rexxt --tags math
./rexxt --tags integration,slow
```

### Test Descriptions

Add descriptions for clarity:

```rexx
/* @description Comprehensive test of string manipulation functions */
```

### File Organization

```
tests/
  ├── dogfood/              # Self-testing tests
  │   ├── basic-math.rexx
  │   └── string-ops.rexx
  ├── integration/
  │   └── database-tests.rexx
  └── unit/
      └── function-tests.rexx
```

## Skipping Tests

### Skip Annotation

Mark tests to skip with the `@skip` annotation:

```rexx
/* @skip This test is temporarily disabled */
FailingTest:
  SAY "This test would fail"
  ADDRESS EXPECTATIONS "1 should equal 2"
RETURN

/* @skip Known bug - waiting for upstream fix */
BuggyFeatureTest:
  SAY "Testing buggy feature"
  // Test code here
RETURN

/* @skip */
IncompleteTest:
  SAY "Test not finished yet"
RETURN
```

### Skip Control Flags

By default, rexxt honors `@skip` annotations:

```bash
# Honor skip annotations (default)
./rexxt tests/my-test.rexx
./rexxt --honor-skip tests/my-test.rexx

# Run ALL tests, ignoring skip annotations
./rexxt --no-honor-skip tests/my-test.rexx
```

### Skip Output

Skipped tests are shown with the ⏭️ emoji:

```
✅ PassingTest
⏭️  SKIPPEDTEST - SKIPPED (Known bug - waiting for fix)
✅ AnotherPassingTest
```

### When to Use Skip

Use `@skip` for:
- **Temporarily failing tests** during refactoring
- **Known bugs** waiting for fixes
- **Incomplete tests** under development
- **Platform-specific tests** that don't apply to current environment
- **Slow tests** to speed up development cycles

Use `--no-honor-skip` to:
- **Verify skipped tests** still fail as expected
- **Check if bugs are fixed** and tests can be re-enabled
- **Run complete test suite** for comprehensive coverage

## Conditional Test Execution

### The @requires Annotation

The `@requires` annotation provides **deterministic, system-based test skipping**. Tests are automatically skipped if required system capabilities are not available.

This is the **canonical RexxJS way** to conditionally run tests based on system state (e.g., Docker installed, Podman available, etc.)

#### Basic Usage

```rexx
/* @requires docker */
DockerTest:
  SAY "This test requires Docker"
  // Docker-specific test code
RETURN

/* @requires podman */
PodmanTest:
  SAY "This test requires Podman"
  // Podman-specific test code
RETURN

/* @requires git */
GitIntegrationTest:
  SAY "This test requires git"
  // Git integration test code
RETURN
```

#### Multiple Requirements

Tests can require multiple capabilities - **ALL must be present** for the test to run:

```rexx
/* @requires docker, curl */
DockerWithCurlTest:
  SAY "This test needs both Docker AND curl"
  // Test code that uses both Docker and curl
RETURN
```

#### Open Capability System

**The @requires system is OPEN and extensible** - it works with ANY capability name, not just a pre-defined list.

**Default behavior**: Checks if a command with that name exists on the system

```rexx
/* @requires docker */     // Checks if 'docker' command exists
/* @requires podman */     // Checks if 'podman' command exists
/* @requires git */        // Checks if 'git' command exists
/* @requires doofus */     // Checks if 'doofus' command exists
/* @requires anything */   // Checks if 'anything' command exists
```

**How it works:**
1. Takes the capability name (e.g., "docker")
2. Uses `which` (Unix) or `where` (Windows) to check if that command exists
3. Caches the result to avoid repeated checks
4. Skips the test if command not found

**Common capabilities** (not exhaustive - any name works!):
- Container engines: `docker`, `podman`
- Virtualization: `qemu`, `virtualbox`, `vboxmanage`
- Version control: `git`, `hg`, `svn`
- Package managers: `npm`, `pip`, `cargo`, `maven`
- Tools: `curl`, `wget`, `ssh`, `jq`, `awk`, `sed`
- Databases: `psql`, `mysql`, `redis-cli`, `mongo`
- Your custom tools: `doofus`, `foobar`, `anything`

**The system is agnostic** - no hard-coded technology list!

#### Custom Capability Logic

For more complex checks beyond "does command exist", you can define custom checker functions:

```javascript
// In your test file or a shared library
function HAS_DOCKER() {
  // Check if docker daemon is actually running
  try {
    execSync('docker info', { stdio: 'ignore', timeout: 2000 });
    return true;
  } catch (error) {
    return false;
  }
}

function HAS_DOOFUS() {
  // Check environment variable, file existence, API endpoint, etc.
  return process.env.DOOFUS_ENABLED === 'true';
}
```

See `tests/dogfood/custom-capability-checkers.js` for examples.

#### Skip Messages

Tests skipped due to unmet requirements show clear messages:

```
✅ BasicTest
⏭️  DOCKERTEST - SKIPPED (Missing required: docker)
⏭️  DOCKERANDCURLTEST - SKIPPED (Missing required: docker, curl)
✅ AnotherBasicTest
```

#### Real-World Example

```rexx
#!/usr/bin/env ./rexxt

/* @test-tags docker, containers, integration */

REQUIRE "../../src/expectations-address.js"

SAY "🧪 Container Tests Starting..."

CALL AlwaysRunsTest
CALL DockerContainerTest
CALL PodmanContainerTest

EXIT 0

AlwaysRunsTest:
  SAY "✅ Test with no requirements"
  ADDRESS EXPECTATIONS "1 should equal 1"
RETURN

/* @requires docker */
DockerContainerTest:
  SAY "🐳 Testing Docker containers"
  // This only runs if Docker is available
  // Docker-specific test code here
  ADDRESS EXPECTATIONS "2 should equal 2"
RETURN

/* @requires podman */
PodmanContainerTest:
  SAY "🦭 Testing Podman containers"
  // This only runs if Podman is available
  // Podman-specific test code here
  ADDRESS EXPECTATIONS "3 should equal 3"
RETURN
```

### Comparison: @skip vs @requires

| Feature | @skip | @requires |
|---------|-------|-----------|
| **Purpose** | Manual skip during development | Automatic skip based on system state |
| **Decision** | Developer's choice | System capabilities |
| **Deterministic** | No (subjective) | Yes (checks actual system) |
| **Override** | `--no-honor-skip` | Always checks system (no override) |
| **Use Case** | Broken tests, WIP | Platform/tool dependencies |

**Use @skip when:**
- Test is temporarily broken
- Feature is incomplete
- Waiting for bug fixes

**Use @requires when:**
- Test needs Docker/Podman/etc
- Test requires specific tools
- Test is platform-specific

### Best Practices for @requires

1. **Be specific about requirements**
   ```rexx
   /* @requires docker */          ✅ Clear requirement
   /* @requires docker, curl */    ✅ Multiple clear requirements
   ```

2. **Document why requirements are needed**
   ```rexx
   /* @requires docker */
   // This test validates Docker container networking
   DockerNetworkTest:
     ...
   ```

3. **Combine with skip for extra control**
   ```rexx
   /* @requires docker */
   /* @skip Waiting for Docker 24.0 features */
   Docker24FeatureTest:
     // Skipped even if Docker is present
   ```

4. **Group tests by requirements**
   ```rexx
   // All Docker tests together
   /* @requires docker */
   DockerTest1: ...
   /* @requires docker */
   DockerTest2: ...

   // All Podman tests together
   /* @requires podman */
   PodmanTest1: ...
   /* @requires podman */
   PodmanTest2: ...
   ```

## Command-Line Options

### Basic Options

```bash
--help, -h                    # Show help message
--verbose, -v                 # Verbose output with debug info
--verbose-output              # Show all SAY output from scripts
--live-output                 # Show SAY output in real-time (no debug info)
```

### Test Selection

```bash
--pattern <glob>              # Test file pattern (can specify multiple)
--tags <tags>                 # Filter by tags (comma-separated)
```

Examples:
```bash
./rexxt --pattern "tests/*-integration.rexx"
./rexxt --pattern "tests/unit/*" --pattern "tests/integration/*"
./rexxt --tags math,basic
```

### Test Control

```bash
--honor-skip                  # Honor @skip annotations (default: true)
--no-honor-skip               # Run all tests, ignoring @skip annotations
--timeout <ms>                # Test timeout in milliseconds (default: 30000)
```

### Output Options

```bash
--show-passing-expectations   # Show detailed info for passing expectations
--rerun-failures-with-verbose # Rerun failed tests with verbose output
```

### Navigation & Results

```bash
--navigate                    # Launch TUI navigator only
--run-and-navigate            # Run tests then launch navigator
```

## Advanced Features

### Dynamic Test Selection

Use `SUBROUTINES()` to dynamically discover and run tests:

```rexx
// ============= ARGUMENT PARSING =============
PARSE ARG target_describe .

// ============= EXECUTION CONTROLLER =============
LET matching_tests = SUBROUTINES(target_describe)
DO subroutineName OVER matching_tests
  INTERPRET "CALL " || subroutineName
END

EXIT 0
```

This allows pattern-based test execution:
```bash
./rexxt tests/my-test.rexx ".*Math.*"  # Run only math-related tests
```

### Test Output Control

Control what you see during test execution:

```bash
# Minimal output (default) - just pass/fail
./rexxt tests/my-test.rexx

# Live output - see SAY statements in real-time
./rexxt --live-output tests/my-test.rexx

# Verbose output - see debug info and internals
./rexxt --verbose-output tests/my-test.rexx

# Full verbose - everything including parser details
./rexxt -v tests/my-test.rexx
```

### Debugging Failed Tests

When tests fail, rexxt provides detailed error information:

```bash
# Automatically rerun failures with verbose output
./rexxt --rerun-failures-with-verbose tests/*
```

Output example:
```
❌ Failed: ValidationTest
   Error: EXPECTATIONS.execute: true expected, but false encountered
   at: ADDRESS EXPECTATIONS "isValid should equal true" (test.rexx:42)
```

### Test Results JSON

rexxt generates a `test-results.json` file with detailed results:

```json
{
  "startTime": "2025-11-05T06:00:00.000Z",
  "endTime": "2025-11-05T06:00:05.123Z",
  "totalTests": 15,
  "passedTests": 14,
  "failedTests": 0,
  "skippedTests": 1,
  "files": [
    {
      "file": "tests/math-test.rexx",
      "tags": ["math", "basic"],
      "totalTests": 5,
      "passedTests": 5,
      "failedTests": 0,
      "skippedTests": 0,
      "tests": [...]
    }
  ]
}
```

Use this for:
- **CI/CD integration** - Parse results programmatically
- **Test history tracking** - Track trends over time
- **Custom reporting** - Build your own test reports

## Best Practices

### 1. Clear Test Names

Use descriptive test names that explain what's being tested:

```rexx
✅ Good:
  ValidateEmailFormatTest
  HandleEdgeCaseEmptyArrayTest

❌ Avoid:
  Test1
  MyTest
```

### 2. One Assertion Per Test (When Possible)

Keep tests focused:

```rexx
✅ Good:
AdditionWithPositiveNumbersTest:
  LET result = 2 + 3
  ADDRESS EXPECTATIONS "result should equal 5"
RETURN

AdditionWithNegativeNumbersTest:
  LET result = -2 + (-3)
  ADDRESS EXPECTATIONS "result should equal -5"
RETURN

❌ Avoid:
MathTest:
  // Testing too many things at once
  LET result1 = 2 + 3
  LET result2 = -2 + (-3)
  LET result3 = 2 * 3
  ADDRESS EXPECTATIONS "result1 should equal 5"
  ADDRESS EXPECTATIONS "result2 should equal -5"
  ADDRESS EXPECTATIONS "result3 should equal 6"
RETURN
```

### 3. Use Tags for Organization

Organize tests with meaningful tags:

```rexx
/* @test-tags unit, math, fast */           # Unit tests that run quickly
/* @test-tags integration, database, slow */ # Integration tests
/* @test-tags regression, bug-fix */        # Regression tests
```

### 4. Document Skip Reasons

Always provide a reason when skipping:

```rexx
✅ Good:
/* @skip Waiting for API endpoint to be deployed */
/* @skip Known issue #123 - fix in progress */

❌ Avoid:
/* @skip */  // No context for why it's skipped
```

### 5. Test File Organization

```rexx
#!/usr/bin/env ./rexxt

// Copyright notice
// License

/* @test-tags ... */
/* @description ... */

REQUIRE "../../src/expectations-address.js"

SAY "Test suite starting..."

// Main execution
CALL Test1
CALL Test2

EXIT 0

// ============= Tests =============
// All test subroutines below here
```

## Integration with npm

Add to your `package.json`:

```json
{
  "scripts": {
    "test": "jest && ./rexxt tests/dogfood/*",
    "test:rexx": "./rexxt tests/dogfood/*",
    "test:rexx:verbose": "./rexxt --verbose-output tests/dogfood/*",
    "test:rexx:tags": "./rexxt --tags",
    "test:web": "PLAYWRIGHT_HTML_OPEN=never npx playwright test"
  }
}
```

Usage:
```bash
npm test                    # Run all tests
npm run test:rexx          # Run only rexxt tests
npm run test:rexx:verbose  # Run with verbose output
npm run test:rexx:tags unit # Run tagged tests
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results.json
```

## Troubleshooting

### Tests Not Found

```
ℹ️  No test files found
```

**Solution:**
- Check you're in the `core/` directory
- Verify test files end with `.rexx`
- Check file paths are correct

### Skipped Tests Running

If skipped tests are executing:

```bash
# Make sure you're NOT using --no-honor-skip
./rexxt tests/my-test.rexx  # Correct - honors skip

# This WILL run skipped tests:
./rexxt --no-honor-skip tests/my-test.rexx
```

### Test Timeout

```
Error: Test timeout after 30000ms
```

**Solution:**
```bash
# Increase timeout for slow tests
./rexxt --timeout 60000 tests/slow-test.rexx
```

### Expectations Not Working

Make sure you:
1. REQUIRE the expectations address: `REQUIRE "../../src/expectations-address.js"`
2. Use correct syntax: `ADDRESS EXPECTATIONS "value should equal 42"`
3. Test subroutines end with `Test`

## Examples

See the `tests/dogfood/` directory for comprehensive examples:

- `skip-simple-demo.rexx` - Basic skip functionality
- `skip-multiple-demo.rexx` - Multiple skipped tests
- `requires-docker-demo.rexx` - Docker requirement example
- `requires-podman-demo.rexx` - Podman requirement example
- `requires-multiple-demo.rexx` - Multiple requirements example
- `requires-open-system-demo.rexx` - **Open system demo (arbitrary capability names!)**
- `custom-capability-checkers.js` - Custom checker functions example
- `mit-license-test.rexx` - File operations testing
- `comment-styles-comprehensive.rexx` - Syntax testing
- `two-parameter-functions.rexx` - Function testing

## Summary

rexxt provides a modern, elegant testing experience for RexxJS:

- ✅ Simple, readable test syntax
- ✅ Manual skip annotations with `@skip`
- ✅ **Open conditional execution with `@requires`** (canonical RexxJS way)
  - Works with ANY capability name - no hard-coded list
  - Default: checks if command exists
  - Extensible: define custom checker functions
- ✅ Flexible test selection with tags and patterns
- ✅ Rich output options from minimal to verbose
- ✅ JSON results for automation
- ✅ CI/CD friendly
- ✅ Inspired by Jest, pytest, and RSpec

Write tests that are:
- **Clear** - Descriptive names and expectations
- **Focused** - One concept per test
- **Organized** - Tags and file structure
- **Maintainable** - Skip annotations with reasons
- **Portable** - Use `@requires` for platform/tool dependencies (docker, podman, git, or YOUR tools)

Happy testing! 🧪
