/**
 * COPY Function Integration Tests
 * Tests COPY() function integration with CALL pass-by-value semantics
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { TestRexxInterpreter } = require('../src/test-interpreter');
const { parse } = require('../src/parser');
const path = require('path');
const fs = require('fs');

describe('COPY Integration with CALL Semantics', () => {
  let interpreter;
  let consoleSpy;

  beforeEach(() => {
    interpreter = new TestRexxInterpreter();
    // Spy on console.log to capture output
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.log
    consoleSpy.mockRestore();
    // Clean up any temporary test files
    const testFiles = ['copy-test-script.rexx', 'copy-test-modifier.rexx'];
    testFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  });

  // Helper function to run a file and return captured output
  async function runRexxFile(filePath) {
    const scriptContent = fs.readFileSync(filePath, 'utf8');
    const commands = parse(scriptContent);
    await interpreter.run(commands, scriptContent, filePath);
    // Return captured output
    return {
      output: consoleSpy.mock.calls.map(call => call[0]).join('\n')
    };
  }

  describe('COPY() with array pass-by-value', () => {
    test('should pass copied array that can be modified without affecting original', async () => {
      // Create external script that modifies the passed array
      const modifierScript = `
PARSE ARG received_param
SAY "Received type: " || DATATYPE(received_param)
SAY "Received length: " || LENGTH(received_param)
SAY "Original first element: " || ARRAY_GET(received_param, 1)

/* Modify the received array */
LET result1 = ARRAY_SET(received_param, 1, "MODIFIED")
LET result2 = ARRAY_SET(received_param, 2, "CHANGED")

SAY "After modification first element: " || ARRAY_GET(received_param, 1)
SAY "After modification second element: " || ARRAY_GET(received_param, 2)
RETURN
`;

      const modifierPath = path.join(__dirname, 'copy-test-modifier.rexx');
      fs.writeFileSync(modifierPath, modifierScript);
      const modifierRel = './' + path.relative(process.cwd(), modifierPath).replace(/\\/g, '/');

      // Main script that uses COPY to pass a copy
      const mainScript = `
LET myArray = ["original", "data", "values"]
SAY "Before COPY - first element: " || ARRAY_GET(myArray, 1)

/* Make a copy and pass it to external script */
LET arrayCopy = COPY(myArray)
CALL "${modifierRel}" arrayCopy

/* Original should be unchanged */
SAY "After CALL with COPY - first element: " || ARRAY_GET(myArray, 1)
SAY "After CALL with COPY - second element: " || ARRAY_GET(myArray, 2)

/* The copy should be modified */
SAY "Copy after CALL - first element: " || ARRAY_GET(arrayCopy, 1)
SAY "Copy after CALL - second element: " || ARRAY_GET(arrayCopy, 2)
`;

      fs.writeFileSync(path.join(__dirname, 'copy-test-script.rexx'), mainScript);

      const result = await runRexxFile(path.join(__dirname, 'copy-test-script.rexx'));
      
      expect(result.output).toContain('Before COPY - first element: original');
      expect(result.output).toContain('Received type: ARRAY');
      expect(result.output).toContain('Received length: 3');
      expect(result.output).toContain('Original first element: original');
      expect(result.output).toContain('After modification first element: MODIFIED');
      expect(result.output).toContain('After CALL with COPY - first element: original'); // Original unchanged
      expect(result.output).toContain('Copy after CALL - first element: MODIFIED'); // Copy was modified
    });

    test('should pass copied array by reference when not using COPY', async () => {
      // Create external script that modifies the passed array
      const modifierScript = `
PARSE ARG received_param
LET result1 = ARRAY_SET(received_param, 1, "MODIFIED_ORIGINAL")
RETURN
`;

      const modifierPath2 = path.join(__dirname, 'copy-test-modifier.rexx');
      fs.writeFileSync(modifierPath2, modifierScript);
      const modifierRel2 = './' + path.relative(process.cwd(), modifierPath2).replace(/\\/g, '/');

      // Main script that passes original array directly (by reference)
      const mainScript = `
LET myArray = ["original", "data"]
SAY "Before CALL - first element: " || ARRAY_GET(myArray, 1)

/* Pass original array directly (by reference) */
CALL "${modifierRel2}" myArray

/* Original should be modified due to pass-by-reference */
SAY "After CALL without COPY - first element: " || ARRAY_GET(myArray, 1)
`;

      fs.writeFileSync(path.join(__dirname, 'copy-test-script.rexx'), mainScript);

      const result = await runRexxFile(path.join(__dirname, 'copy-test-script.rexx'));
      
      expect(result.output).toContain('Before CALL - first element: original');
      expect(result.output).toContain('After CALL without COPY - first element: MODIFIED_ORIGINAL');
    });
  });

  describe('COPY() with object pass-by-value', () => {
    test('should pass copied object that can be modified without affecting original', async () => {
      // Create external script that modifies the passed object
      const modifierScript = `
PARSE ARG received_param
SAY "Received type: " || DATATYPE(received_param)
SAY "Original name: " || ARRAY_GET(received_param, "name")
SAY "Original value: " || ARRAY_GET(received_param, "value")

/* Modify the received object */
LET result1 = ARRAY_SET(received_param, "name", "MODIFIED_NAME")
LET result2 = ARRAY_SET(received_param, "value", 999)

SAY "After modification name: " || ARRAY_GET(received_param, "name")
SAY "After modification value: " || ARRAY_GET(received_param, "value")
RETURN
`;

      const modifierPath3 = path.join(__dirname, 'copy-test-modifier.rexx');
      fs.writeFileSync(modifierPath3, modifierScript);
      const modifierRel3 = './' + path.relative(process.cwd(), modifierPath3).replace(/\\/g, '/');

      // Main script that uses COPY to pass a copy
      const mainScript = `
LET myObject = {"name": "original", "value": 42}
SAY "Before COPY - name: " || ARRAY_GET(myObject, "name")
SAY "Before COPY - value: " || ARRAY_GET(myObject, "value")

/* Make a copy and pass it to external script */
LET objectCopy = COPY(myObject)
CALL "${modifierRel3}" objectCopy

/* Original should be unchanged */
SAY "After CALL with COPY - name: " || ARRAY_GET(myObject, "name")
SAY "After CALL with COPY - value: " || ARRAY_GET(myObject, "value")

/* The copy should be modified */
SAY "Copy after CALL - name: " || ARRAY_GET(objectCopy, "name")
SAY "Copy after CALL - value: " || ARRAY_GET(objectCopy, "value")
`;

      fs.writeFileSync(path.join(__dirname, 'copy-test-script.rexx'), mainScript);

      const result = await runRexxFile(path.join(__dirname, 'copy-test-script.rexx'));
      
      expect(result.output).toContain('Before COPY - name: original');
      expect(result.output).toContain('Before COPY - value: 42');
      expect(result.output).toContain('Received type: OBJECT');
      expect(result.output).toContain('Original name: original');
      expect(result.output).toContain('After CALL with COPY - name: original'); // Original unchanged
      expect(result.output).toContain('Copy after CALL - name: MODIFIED_NAME'); // Copy was modified
    });
  });

  describe('COPY() with nested structures', () => {
    test('should deep copy complex nested structures', async () => {
      // Create external script that modifies nested structures
      const modifierScript = `
PARSE ARG received_param
/* Modify nested array within object */
LET nested_array = ARRAY_GET(received_param, "items")
LET result1 = ARRAY_SET(nested_array, 1, "MODIFIED_ITEM")

/* Modify nested object properties */  
LET result2 = ARRAY_SET(received_param, "name", "MODIFIED_NAME")
RETURN
`;

      const modifierPath4 = path.join(__dirname, 'copy-test-modifier.rexx');
      fs.writeFileSync(modifierPath4, modifierScript);
      const modifierRel4 = './' + path.relative(process.cwd(), modifierPath4).replace(/\\/g, '/');

      // Main script with nested structure
      const mainScript = `
LET complexObject = JSON_PARSE('{"name": "original", "items": ["item1", "item2", "item3"], "metadata": {"version": 1, "active": true}}')

SAY "Before COPY - name: " || ARRAY_GET(complexObject, "name")
LET items = ARRAY_GET(complexObject, "items")
SAY "Before COPY - first item: " || ARRAY_GET(items, 1)

/* Make a deep copy and pass it to external script */
LET complexCopy = COPY(complexObject)
CALL "${modifierRel4}" complexCopy

/* Original should be unchanged */
SAY "After CALL with COPY - name: " || ARRAY_GET(complexObject, "name")
LET original_items = ARRAY_GET(complexObject, "items")
SAY "After CALL with COPY - first item: " || ARRAY_GET(original_items, 1)

/* The copy should be modified */
SAY "Copy after CALL - name: " || ARRAY_GET(complexCopy, "name")
LET copied_items = ARRAY_GET(complexCopy, "items")
SAY "Copy after CALL - first item: " || ARRAY_GET(copied_items, 1)
`;

      fs.writeFileSync(path.join(__dirname, 'copy-test-script.rexx'), mainScript);

      const result = await runRexxFile(path.join(__dirname, 'copy-test-script.rexx'));
      
      expect(result.output).toContain('Before COPY - name: original');
      expect(result.output).toContain('Before COPY - first item: item1');
      expect(result.output).toContain('After CALL with COPY - name: original'); // Original unchanged
      expect(result.output).toContain('After CALL with COPY - first item: item1'); // Original nested unchanged
      expect(result.output).toContain('Copy after CALL - name: MODIFIED_NAME'); // Copy was modified
      expect(result.output).toContain('Copy after CALL - first item: MODIFIED_ITEM'); // Copy nested was modified
    });
  });

  describe('COPY() performance with large objects', () => {
    test('should handle copying large objects efficiently', async () => {
      const script = `
/* Create a large array */
LET largeArray = JSON_PARSE('[]')
DO i = 1 TO 10
  LET indexMinusOne = i - 1
  LET itemName = "item_" || indexMinusOne
  LET largeArray = ARRAY_SET(largeArray, i, itemName)
END

SAY "Original array length: " || LENGTH(largeArray)
SAY "Original first item: " || ARRAY_GET(largeArray, 1)
SAY "Original last item: " || ARRAY_GET(largeArray, 10)

/* Make a copy */
LET copiedArray = COPY(largeArray)

SAY "Copied array length: " || LENGTH(copiedArray)
SAY "Copied first item: " || ARRAY_GET(copiedArray, 1)
SAY "Copied last item: " || ARRAY_GET(copiedArray, 10)

/* Modify copy */
LET result1 = ARRAY_SET(copiedArray, 1, "MODIFIED_FIRST")
LET result2 = ARRAY_SET(copiedArray, 10, "MODIFIED_LAST")

/* Verify original is unchanged */
SAY "After modification - original first: " || ARRAY_GET(largeArray, 1)
SAY "After modification - original last: " || ARRAY_GET(largeArray, 10)
SAY "After modification - copy first: " || ARRAY_GET(copiedArray, 1)
SAY "After modification - copy last: " || ARRAY_GET(copiedArray, 10)

/* JSON dumps for debugging */
SAY "Original array JSON: " || JSON_STRINGIFY(largeArray)
SAY "Copied array JSON: " || JSON_STRINGIFY(copiedArray)
`;

      const commands = parse(script);
      await interpreter.run(commands);
      // Return captured output
      const result = {
        output: consoleSpy.mock.calls.map(call => call[0]).join('\n')
      };
      
      expect(result.output).toContain('Original array length: 10');
      expect(result.output).toContain('Copied array length: 10');
      expect(result.output).toContain('Original first item: item_0');
      expect(result.output).toContain('Copied first item: item_0');
      expect(result.output).toContain('After modification - original first: item_0'); // Original unchanged
      expect(result.output).toContain('After modification - copy first: MODIFIED_FIRST'); // Copy changed
    });
  });
});
