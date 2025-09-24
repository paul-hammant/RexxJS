/* Create array using JS and test ARRAY_GET */
LET dummy = INTERPRET_JS('this.variables.set("testArray", ["zero", "one", "two", "three"])')

SAY "Testing ARRAY_GET with JS-created array:"
SAY "ARRAY_GET(testArray, 1) should be 'one': " || ARRAY_GET(testArray, 1)
SAY "ARRAY_GET(testArray, 2) should be 'two': " || ARRAY_GET(testArray, 2)
SAY "ARRAY_GET(testArray, 3) should be 'three': " || ARRAY_GET(testArray, 3)

/* Verify array contents directly via JS */
LET js0 = INTERPRET_JS('this.variables.get("testArray")[0]')
LET js1 = INTERPRET_JS('this.variables.get("testArray")[1]')
LET js2 = INTERPRET_JS('this.variables.get("testArray")[2]')
SAY "JS direct access [0]: " || js0
SAY "JS direct access [1]: " || js1  
SAY "JS direct access [2]: " || js2
