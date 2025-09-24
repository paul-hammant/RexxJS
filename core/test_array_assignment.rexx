LET original = [1, 2, 3]
SAY "Before: " || ARRAY_GET(original, 1)

LET original = ARRAY_SET(original, 1, "MODIFIED")
SAY "After assignment: " || ARRAY_GET(original, 1)
