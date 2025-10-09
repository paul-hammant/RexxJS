#!/usr/bin/env rexx
/**
 * Test systemd-nspawn ADDRESS handler
 */

SAY "=== systemd-nspawn Test ==="
SAY ""

REQUIRE "cwd:nspawn-address.js"
ADDRESS NSPAWN

/* Test 1: Check status */
SAY "Test 1: Check status..."
"status"
LET result = RESULT
IF result.success THEN DO
  SAY "  ✓ Handler ready"
  SAY "  Runtime:" result.runtime
END
SAY ""

/* Test 2: List containers */
SAY "Test 2: List containers..."
"list"
LET list_result = RESULT
IF list_result.success THEN DO
  SAY "  ✓ Found" list_result.count "containers"
END
SAY ""

SAY "=== Test Complete ==="
SAY ""
SAY "Note: systemd-nspawn is built into systemd"
SAY "No installation needed, works on any filesystem!"
