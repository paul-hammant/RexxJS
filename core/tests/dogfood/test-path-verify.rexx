/* Verify path resolution from test file */
LET resolved = PATH_RESOLVE("../../src/expectations-address.js")
SAY "Resolved: " || resolved
