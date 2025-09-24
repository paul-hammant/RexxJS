LET original = [1, 2, 3]
SAY "Original before: " || ARRAY_GET(original, 1)

/* Modify original directly */
ARRAY_SET(original, 1, "MODIFIED")
SAY "After ARRAY_SET - original: " || ARRAY_GET(original, 1)

/* Test if assignment creates a copy */
LET copy_ref = original
SAY "Copy reference: " || ARRAY_GET(copy_ref, 1)

ARRAY_SET(copy_ref, 2, "MODIFIED_REF")
SAY "After modifying copy_ref - original[2]: " || ARRAY_GET(original, 2)
SAY "After modifying copy_ref - copy_ref[2]: " || ARRAY_GET(copy_ref, 2)
