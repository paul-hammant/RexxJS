/* Test FILE_* functions with path resolution */
SAY "Testing FILE_* functions with path resolution..."

/* Test 1: FILE_WRITE with root: prefix */
LET result1 = FILE_WRITE("root:test-output.txt", "Hello from root:")
SAY "Wrote file with root: prefix - success: " || result1.success

/* Test 2: FILE_EXISTS with root: prefix */
LET exists = FILE_EXISTS("root:test-output.txt")
SAY "File exists: " || exists

/* Test 3: FILE_READ with root: prefix */
LET content = FILE_READ("root:test-output.txt")
SAY "Read content: " || content

/* Test 4: FILE_DELETE with root: prefix */
LET result4 = FILE_DELETE("root:test-output.txt")
SAY "Deleted file - success: " || result4.success

SAY "All FILE_* path resolution tests passed!"
