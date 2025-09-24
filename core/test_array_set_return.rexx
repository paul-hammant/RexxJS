LET original = [1, 2, 3]
SAY "Before: " || ARRAY_GET(original, 1)

LET result = ARRAY_SET(original, 1, "MODIFIED")
SAY "ARRAY_SET returned: " || result
SAY "After: " || ARRAY_GET(original, 1)
