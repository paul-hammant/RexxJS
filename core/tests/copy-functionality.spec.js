/**
 * COPY Function Direct Tests
 * Tests COPY() function without relying on external script calling
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { TestRexxInterpreter } = require('../src/test-interpreter');
const { parse } = require('../src/parser');

describe('COPY Function Direct Testing', () => {
  let interpreter;
  let consoleSpy;

  beforeEach(() => {
    interpreter = new TestRexxInterpreter();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  // Helper function to run script and return captured output
  async function runScript(scriptContent) {
    const commands = parse(scriptContent);
    await interpreter.run(commands, scriptContent);
    return {
      output: consoleSpy.mock.calls.map(call => call[0]).join('\n')
    };
  }

  test('COPY should create deep copy of arrays', async () => {
    const script = `
LET original = [1, 2, 3]
SAY "Original before: " || ARRAY_GET(original, 1)

/* Create a copy */
LET copied = COPY(original)

/* Modify the copy */
LET copied = ARRAY_SET(copied, 1, "MODIFIED")

SAY "After copy modification - original: " || ARRAY_GET(original, 1)
SAY "After copy modification - copy: " || ARRAY_GET(copied, 1)
`;

    const result = await runScript(script);
    
    expect(result.output).toContain('Original before: 1');
    expect(result.output).toContain('After copy modification - original: 1'); // Original unchanged
    expect(result.output).toContain('After copy modification - copy: MODIFIED'); // Copy changed
  });

  test('COPY should create deep copy of objects', async () => {
    const script = `
LET original = {"name": "original", "value": 42}
SAY "Original name before: " || ARRAY_GET(original, "name")
SAY "Original value before: " || ARRAY_GET(original, "value")

/* Create a copy */
LET copied = COPY(original)

/* Modify the copy */
LET copied = ARRAY_SET(copied, "name", "MODIFIED")  
LET copied = ARRAY_SET(copied, "value", 999)

SAY "After copy modification - original name: " || ARRAY_GET(original, "name")
SAY "After copy modification - original value: " || ARRAY_GET(original, "value")
SAY "After copy modification - copy name: " || ARRAY_GET(copied, "name")
SAY "After copy modification - copy value: " || ARRAY_GET(copied, "value")
`;

    const result = await runScript(script);
    
    expect(result.output).toContain('Original name before: original');
    expect(result.output).toContain('Original value before: 42');
    expect(result.output).toContain('After copy modification - original name: original'); // Original unchanged
    expect(result.output).toContain('After copy modification - original value: 42'); // Original unchanged
    expect(result.output).toContain('After copy modification - copy name: MODIFIED'); // Copy changed
    expect(result.output).toContain('After copy modification - copy value: 999'); // Copy changed
  });

  test('COPY should create deep copy of nested structures', async () => {
    const script = `
LET original = {"items": ["item1", "item2"], "name": "original"}
LET items = ARRAY_GET(original, "items")
SAY "Original name before: " || ARRAY_GET(original, "name")
SAY "Original first item before: " || ARRAY_GET(items, 1)

/* Create a copy */
LET copied = COPY(original)
LET copied_items = ARRAY_GET(copied, "items")

/* Modify the copy's nested structures */
LET copied = ARRAY_SET(copied, "name", "MODIFIED_NAME")
LET copied_items = ARRAY_SET(copied_items, 1, "MODIFIED_ITEM")

/* Check original is unchanged */
LET original_items = ARRAY_GET(original, "items")
SAY "After copy modification - original name: " || ARRAY_GET(original, "name")
SAY "After copy modification - original first item: " || ARRAY_GET(original_items, 1)

/* Check copy is changed */
SAY "After copy modification - copy name: " || ARRAY_GET(copied, "name")
SAY "After copy modification - copy first item: " || ARRAY_GET(copied_items, 1)
`;

    const result = await runScript(script);
    
    expect(result.output).toContain('Original name before: original');
    expect(result.output).toContain('Original first item before: item1');
    expect(result.output).toContain('After copy modification - original name: original'); // Original unchanged
    expect(result.output).toContain('After copy modification - original first item: item1'); // Original nested unchanged
    expect(result.output).toContain('After copy modification - copy name: MODIFIED_NAME'); // Copy changed
    expect(result.output).toContain('After copy modification - copy first item: MODIFIED_ITEM'); // Copy nested changed
  });

  test('COPY should handle primitives correctly', async () => {
    const script = `
LET str = "hello"
LET num = 42
LET bool = "true"

LET copied_str = COPY(str)
LET copied_num = COPY(num)  
LET copied_bool = COPY(bool)

SAY "String copy: " || copied_str
SAY "Number copy: " || copied_num
SAY "Boolean copy: " || copied_bool
`;

    const result = await runScript(script);
    
    expect(result.output).toContain('String copy: hello');
    expect(result.output).toContain('Number copy: 42');
    expect(result.output).toContain('Boolean copy: true');
  });

  test('COPY should handle arrays deeply nested within objects', async () => {
    const script = `
/* Build nested structure step by step to avoid parsing issues */
LET inner_array = ["personal", "work", "admin"]  
LET user_obj = JSON_PARSE('{"name": "John", "tags": ["personal", "work", "admin"]}')
LET outer_obj = JSON_PARSE('{"user": {}}')
LET outer_obj = ARRAY_SET(outer_obj, "user", user_obj)

SAY "Original user name: " || ARRAY_GET(ARRAY_GET(outer_obj, "user"), "name")
LET original_tags = ARRAY_GET(ARRAY_GET(outer_obj, "user"), "tags")
SAY "Original first tag: " || ARRAY_GET(original_tags, 1)

/* Make a deep copy */
LET copied = COPY(outer_obj)

/* Modify the deeply nested array in the copy */
LET copied_user = ARRAY_GET(copied, "user")
LET copied_tags = ARRAY_GET(copied_user, "tags")
LET copied_tags = ARRAY_SET(copied_tags, 1, "MODIFIED_TAG")
LET copied_user = ARRAY_SET(copied_user, "tags", copied_tags)
LET copied = ARRAY_SET(copied, "user", copied_user)

/* Verify original array deep in object is unchanged */
LET check_original_tags = ARRAY_GET(ARRAY_GET(outer_obj, "user"), "tags")
SAY "After modification - original first tag: " || ARRAY_GET(check_original_tags, 1)

/* Verify copy array deep in object was modified */
LET check_copied_user = ARRAY_GET(copied, "user")
LET check_copied_tags = ARRAY_GET(check_copied_user, "tags")
SAY "After modification - copy first tag: " || ARRAY_GET(check_copied_tags, 1)
`;

    const result = await runScript(script);
    
    expect(result.output).toContain('Original user name: John');
    expect(result.output).toContain('Original first tag: personal');
    
    // The key test: original deeply nested array should be unchanged
    expect(result.output).toContain('After modification - original first tag: personal');
    
    // The copy's deeply nested array should be modified
    expect(result.output).toContain('After modification - copy first tag: MODIFIED_TAG');
  });

  test('COPY should work with reasonably sized arrays', async () => {
    const script = `
/* Create a moderately sized array manually */
LET largeArray = []
LET largeArray = ARRAY_SET(largeArray, 1, "item_0")
LET largeArray = ARRAY_SET(largeArray, 2, "item_1")
LET largeArray = ARRAY_SET(largeArray, 3, "item_2")
LET largeArray = ARRAY_SET(largeArray, 4, "item_3")
LET largeArray = ARRAY_SET(largeArray, 5, "item_4")

SAY "Original array length: " || LENGTH(largeArray)
SAY "Original first item: " || ARRAY_GET(largeArray, 1)
SAY "Original last item: " || ARRAY_GET(largeArray, 5)

/* Make a copy */
LET copiedArray = COPY(largeArray)

SAY "Copied array length: " || LENGTH(copiedArray)
SAY "Copied first item: " || ARRAY_GET(copiedArray, 1)
SAY "Copied last item: " || ARRAY_GET(copiedArray, 5)

/* Modify copy */
LET copiedArray = ARRAY_SET(copiedArray, 1, "MODIFIED_FIRST")
LET copiedArray = ARRAY_SET(copiedArray, 5, "MODIFIED_LAST")

/* Verify original is unchanged */
SAY "After modification - original first: " || ARRAY_GET(largeArray, 1)
SAY "After modification - original last: " || ARRAY_GET(largeArray, 5)
SAY "After modification - copy first: " || ARRAY_GET(copiedArray, 1)
SAY "After modification - copy last: " || ARRAY_GET(copiedArray, 5)
`;

    const result = await runScript(script);
    
    expect(result.output).toContain('Original array length: 5');
    expect(result.output).toContain('Copied array length: 5');
    expect(result.output).toContain('Original first item: item_0');
    expect(result.output).toContain('Copied first item: item_0');
    expect(result.output).toContain('After modification - original first: item_0'); // Original unchanged
    expect(result.output).toContain('After modification - copy first: MODIFIED_FIRST'); // Copy changed
  });
});