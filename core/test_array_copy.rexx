LET original = [1, 2, 3]
SAY "Original before: " || ARRAY_GET(original, 1)

LET copied = COPY(original)
SAY "Copied before modification: " || ARRAY_GET(copied, 1)

ARRAY_SET(copied, 1, "MODIFIED")
SAY "After ARRAY_SET - original: " || ARRAY_GET(original, 1)
SAY "After ARRAY_SET - copied: " || ARRAY_GET(copied, 1)
