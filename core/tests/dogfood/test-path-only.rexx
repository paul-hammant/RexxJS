/* Test just PATH_RESOLVE to verify it works */
SAY "Testing PATH_RESOLVE..."

LET resolved = PATH_RESOLVE("root:test-output.txt")
SAY "Resolved path: " || resolved

SAY "Test complete"
