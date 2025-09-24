LET myArray = ["first", "second", "third"]
SAY "Array contents: " || myArray
SAY "Array length: " || LENGTH(myArray)
SAY "Direct JS access myArray[0]: would be first"
SAY "REXX ARRAY_GET(myArray, 1) should be first: " || ARRAY_GET(myArray, 1)
SAY "REXX ARRAY_GET(myArray, 2) should be second: " || ARRAY_GET(myArray, 2)
