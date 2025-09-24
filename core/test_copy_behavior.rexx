LET original = [1, 2, 3]
SAY "Original before: " || ARRAY_GET(original, 1)

/* Test 1: Direct modification (should affect original) */
LET directRef = original
LET result = ARRAY_SET(directRef, 1, "MODIFIED_DIRECT")
SAY "After direct modification - original: " || ARRAY_GET(original, 1)
SAY "After direct modification - reference: " || ARRAY_GET(directRef, 1)

/* Reset */
LET result = ARRAY_SET(original, 1, 1)

/* Test 2: Using COPY (should not affect original) */
LET copied = COPY(original)
LET result = ARRAY_SET(copied, 1, "MODIFIED_COPY")
SAY "After copy modification - original: " || ARRAY_GET(original, 1)
SAY "After copy modification - copy: " || ARRAY_GET(copied, 1)
