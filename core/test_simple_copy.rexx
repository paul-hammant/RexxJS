LET original = [1, 2, 3]
LET copied = COPY(original)
LET modified_copy = ARRAY_SET(copied, 1, "TEST")

SAY "Original[1]: " || ARRAY_GET(original, 1)
SAY "Copied[1]: " || ARRAY_GET(copied, 1)  
SAY "Modified[1]: " || ARRAY_GET(modified_copy, 1)
SAY "Modified type: " || DATATYPE(modified_copy)
