/* Copyright (c) 2025 RexxJS Project ... Licensed under the MIT License */

describe('jq WASM Functions Library', () => {
  let jqQuery, jqRaw, jqKeys, jqValues, jqLength, jqType, JQ_WASM_FUNCTIONS_META;
  let jqWasmAvailable = false;

  beforeAll(() => {
    // Check if jq-wasm is available
    try {
      require('jq-wasm');
      jqWasmAvailable = true;
    } catch (e) {
      console.warn('jq-wasm not found - skipping tests. Install jq-wasm: npm install jq-wasm');
      return;
    }

    // Load the library
    const lib = require('../src/jq-wasm-functions.js');
    JQ_WASM_FUNCTIONS_META = lib.JQ_WASM_FUNCTIONS_META;
    jqQuery = lib.jqQuery;
    jqRaw = lib.jqRaw;
    jqKeys = lib.jqKeys;
    jqValues = lib.jqValues;
    jqLength = lib.jqLength;
    jqType = lib.jqType;
  });

  test('should have correct metadata', () => {
    if (!jqWasmAvailable) return;

    const metadata = JQ_WASM_FUNCTIONS_META();

    expect(metadata.canonical).toBe('org.rexxjs/jq-wasm-functions');
    expect(metadata.type).toBe('functions-library');
    expect(metadata.provides.functions).toContain('jqQuery');
    expect(metadata.provides.functions).toContain('jqRaw');
    expect(metadata.provides.functions).toContain('jqKeys');
    expect(metadata.dependencies['jq-wasm']).toBe('1.1.0-jq-1.8.1');
  });

  test('jqQuery should execute simple query', async () => {
    if (!jqWasmAvailable) return;

    const testData = '{"name": "RexxJS", "version": "1.0.0"}';
    const result = await jqQuery(testData, '.name');

    expect(result).toBe('RexxJS');
  });

  test('jqQuery should execute query on object', async () => {
    if (!jqWasmAvailable) return;

    const testData = { name: "RexxJS", version: "1.0.0" };
    const result = await jqQuery(testData, '.name');

    expect(result).toBe('RexxJS');
  });

  test('jqQuery should handle array queries', async () => {
    if (!jqWasmAvailable) return;

    const testData = '{"items": [1, 2, 3, 4, 5]}';
    const result = await jqQuery(testData, '.items | length');

    expect(result).toBe(5);
  });

  test('jqQuery should handle array access', async () => {
    if (!jqWasmAvailable) return;

    const testData = '{"features": ["REXX", "JavaScript"]}';
    const result = await jqQuery(testData, '.features[0]');

    expect(result).toBe('REXX');
  });

  test('jqQuery should return array for array queries', async () => {
    if (!jqWasmAvailable) return;

    const testData = '{"items": [1, 2, 3]}';
    const result = await jqQuery(testData, '.items');

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([1, 2, 3]);
  });

  test('jqRaw should return raw string output', async () => {
    if (!jqWasmAvailable) return;

    const testData = '{"name": "RexxJS"}';
    const result = await jqRaw(testData, '.name');

    expect(result).toBe('RexxJS');
    expect(typeof result).toBe('string');
  });

  test('jqKeys should return object keys', async () => {
    if (!jqWasmAvailable) return;

    const testData = '{"name": "test", "version": "1.0", "active": true}';
    const result = await jqKeys(testData);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual(['active', 'name', 'version']); // jq returns keys sorted
  });

  test('jqValues should return object values', async () => {
    if (!jqWasmAvailable) return;

    const testData = '{"a": 1, "b": 2, "c": 3}';
    const result = await jqValues(testData);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([1, 2, 3]);
  });

  test('jqLength should return array length', async () => {
    if (!jqWasmAvailable) return;

    const testData = '[1, 2, 3, 4, 5]';
    const result = await jqLength(testData);

    expect(result).toBe(5);
  });

  test('jqLength should return object key count', async () => {
    if (!jqWasmAvailable) return;

    const testData = '{"a": 1, "b": 2, "c": 3}';
    const result = await jqLength(testData);

    expect(result).toBe(3);
  });

  test('jqType should return correct type for object', async () => {
    if (!jqWasmAvailable) return;

    const testData = '{"name": "test"}';
    const result = await jqType(testData);

    expect(result).toBe('object');
  });

  test('jqType should return correct type for array', async () => {
    if (!jqWasmAvailable) return;

    const testData = '[1, 2, 3]';
    const result = await jqType(testData);

    expect(result).toBe('array');
  });

  test('jqType should return correct type for string', async () => {
    if (!jqWasmAvailable) return;

    const testData = '"hello"';
    const result = await jqType(testData);

    expect(result).toBe('string');
  });

  test('jqType should return correct type for number', async () => {
    if (!jqWasmAvailable) return;

    const testData = '42';
    const result = await jqType(testData);

    expect(result).toBe('number');
  });

  test('should handle query errors gracefully', async () => {
    if (!jqWasmAvailable) return;

    const testData = '{"name": "test"}';

    await expect(async () => {
      await jqQuery(testData, '..invalid');
    }).rejects.toThrow();
  });

  test('should throw error when jq-wasm not available', async () => {
    if (jqWasmAvailable) return; // Skip if jq-wasm IS available

    await expect(async () => {
      await jqQuery('{}', '.');
    }).rejects.toThrow(/jq-wasm not available/);
  });

  test('should handle complex nested queries', async () => {
    if (!jqWasmAvailable) return;

    const testData = '{"users": [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]}';
    const result = await jqQuery(testData, '.users[].name');

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual(['Alice', 'Bob']);
  });

  test('should handle filtering', async () => {
    if (!jqWasmAvailable) return;

    const testData = '{"items": [1, 2, 3, 4, 5]}';
    const result = await jqQuery(testData, '.items | map(select(. > 2))');

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([3, 4, 5]);
  });
});
