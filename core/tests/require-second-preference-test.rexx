/* REQUIRE Preference List Tests */

SAY "Testing REQUIRE with comma-separated preference list..."

/* Test 1: Single valid path */
SAY "Test 1: Single valid path"
REQUIRE "./test-libs/calculator-service.js"
SAY "✓ Single path works"

/* Test 2: Second preference */
SAY ""
SAY "Test 2: Second preference when first fails"
REQUIRE "./nonexistent/first/path,./test-libs/calculator-service.js"
SAY "✓ Second preference works"

/* Test 3: Multiple preferences */
SAY ""
SAY "Test 3: Multiple preference paths"
REQUIRE "./invalid/first,./invalid/second,./test-libs/calculator-service.js"
SAY "✓ Multiple preferences work"

/* Test 4: Whitespace handling */
SAY ""
SAY "Test 4: Whitespace in paths"
REQUIRE "  ./invalid/path  ,  ./test-libs/calculator-service.js  "
SAY "✓ Whitespace handling works"

SAY ""
SAY "All REQUIRE preference list tests passed!"
