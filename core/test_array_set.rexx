LET original = [1, 2, 3]
SAY "Before ARRAY_SET - original[1]: " || ARRAY_GET(original, 1)

ARRAY_SET(original, 1, "DIRECT_MODIFIED")
SAY "After ARRAY_SET - original[1]: " || ARRAY_GET(original, 1)

LET copied = COPY(original)
SAY "Copied value: " || ARRAY_GET(copied, 1)

ARRAY_SET(copied, 1, "COPY_MODIFIED")
SAY "After ARRAY_SET on copy - copied[1]: " || ARRAY_GET(copied, 1)
SAY "After ARRAY_SET on copy - original[1]: " || ARRAY_GET(original, 1)
