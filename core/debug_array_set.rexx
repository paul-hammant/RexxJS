LET original = [1, 2, 3]
SAY "Original type: " || DATATYPE(original)
SAY "Original length: " || LENGTH(original)
SAY "Before: " || ARRAY_GET(original, 1)

LET result = ARRAY_SET(original, 1, "MODIFIED")
SAY "Result type: " || DATATYPE(result)
SAY "Result length: " || LENGTH(result)
SAY "Result as string: " || result

/* Try to parse result back */
LET parsed = JSON_PARSE(result)
SAY "Parsed type: " || DATATYPE(parsed)
IF DATATYPE(parsed) = "ARRAY" THEN DO
  SAY "Parsed first element: " || ARRAY_GET(parsed, 1)
END
