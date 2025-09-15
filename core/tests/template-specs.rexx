#!/usr/bin/env ./rexxt

// @test-tags template, demo, best-practice
// @description String validation and text processing specifications
//
// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

REQUIRE "./src/expectations-address.js"

SAY "🎯 [TestName] Test Suite Starting..."

// First describe block  
CALL START_DESCRIBE "First Feature"

CALL START_TEST "should do something basic"
LET result = 2 + 2
ADDRESS EXPECTATIONS "{result} should be 4"
CALL PASS

CALL START_TEST "should handle another case"
LET text = "Hello"
ADDRESS EXPECTATIONS "{text} should be 'Hello'"
CALL PASS

CALL END_DESCRIBE

// Second describe block
CALL START_DESCRIBE "Second Feature"

CALL START_TEST "should work with strings"
LET combined = "A" || "B"
ADDRESS EXPECTATIONS "{combined} should be 'AB'"
CALL PASS

CALL START_TEST "should work with numbers"
LET product = 3 * 4
ADDRESS EXPECTATIONS "{product} should be 12"
CALL PASS

CALL END_DESCRIBE

SAY "🏁 [TestName] Test Suite Complete"

/* 
=== REXXT BEST PRACTICES TEMPLATE ===

1. Use #!/usr/bin/env ./rexxt shebang
2. Add @test-tags and @description comments
3. REQUIRE "./src/expectations-address.js"
4. Use descriptive suite names with START_DESCRIBE/END_DESCRIBE
5. Use descriptive test names with START_TEST
6. Use ADDRESS EXPECTATIONS with clear assertions
7. Always call PASS or FAIL to conclude tests
8. Use meaningful variable names
9. Group related tests in describe blocks
10. Add setup SAY statements for visibility

This pattern gives you:
✅ Detailed test output with suite/test/expectation counts
✅ Individual test tracking and pass/fail status
✅ Proper hierarchical test structure
✅ JSON output for test navigation
✅ Clean, readable test organization
*/