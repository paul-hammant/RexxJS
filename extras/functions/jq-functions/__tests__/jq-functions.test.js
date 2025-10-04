/* Copyright (c) 2025 RexxJS Project ... Licensed under the MIT License */

const { execSync } = require('child_process');

describe('jq Functions Library (Native)', () => {
  let jqQuery, jqRaw, jqKeys, jqValues, jqLength, jqType, JQ_FUNCTIONS_META;
  let jqAvailable = false;

  beforeAll(() => {
    // Check if jq is available
    try {
      execSync('which jq', { stdio: 'ignore' });
      jqAvailable = true;
    } catch (e) {
      console.warn('jq binary not found - skipping tests. Install jq: apt install jq / brew install jq');
      return;
    }

    // Load the library
    const lib = require('../src/jq-functions.js');
    JQ_FUNCTIONS_META = lib.JQ_FUNCTIONS_META;
    jqQuery = lib.jqQuery;
    jqRaw = lib.jqRaw;
    jqKeys = lib.jqKeys;
    jqValues = lib.jqValues;
    jqLength = lib.jqLength;
    jqType = lib.jqType;
  });

  test('should have correct metadata', () => {
    if (!jqAvailable) return;

    const metadata = JQ_FUNCTIONS_META();

    expect(metadata.canonical).toBe('org.rexxjs/jq-functions');
    expect(metadata.type).toBe('functions-library');
    expect(metadata.provides.functions).toContain('jqQuery');
    expect(metadata.provides.functions).toContain('jqRaw');
    expect(metadata.provides.functions).toContain('jqKeys');
    expect(metadata.requirements.systemBinaries).toContain('jq');
  });

  test('jqQuery should execute simple query', () => {
    if (!jqAvailable) return;

    const testData = '{"name": "RexxJS", "version": "1.0.0"}';
    const result = jqQuery(testData, '.name');

    expect(result).toBe('RexxJS');
  });

  test('jqQuery should execute query on object', () => {
    if (!jqAvailable) return;

    const testData = { name: "RexxJS", version: "1.0.0" };
    const result = jqQuery(testData, '.name');

    expect(result).toBe('RexxJS');
  });

  test('jqQuery should handle array queries', () => {
    if (!jqAvailable) return;

    const testData = '{"items": [1, 2, 3, 4, 5]}';
    const result = jqQuery(testData, '.items | length');

    expect(result).toBe(5);
  });

  test('jqQuery should handle array access', () => {
    if (!jqAvailable) return;

    const testData = '{"features": ["REXX", "JavaScript"]}';
    const result = jqQuery(testData, '.features[0]');

    expect(result).toBe('REXX');
  });

  test('jqQuery should return array for array queries', () => {
    if (!jqAvailable) return;

    const testData = '{"items": [1, 2, 3]}';
    const result = jqQuery(testData, '.items');

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([1, 2, 3]);
  });

  test('jqRaw should return raw string output', () => {
    if (!jqAvailable) return;

    const testData = '{"name": "RexxJS"}';
    const result = jqRaw(testData, '.name');

    expect(result).toBe('RexxJS');
    expect(typeof result).toBe('string');
  });

  test('jqKeys should return object keys', () => {
    if (!jqAvailable) return;

    const testData = '{"name": "test", "version": "1.0", "active": true}';
    const result = jqKeys(testData);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual(['active', 'name', 'version']); // jq returns keys sorted
  });

  test('jqValues should return object values', () => {
    if (!jqAvailable) return;

    const testData = '{"a": 1, "b": 2, "c": 3}';
    const result = jqValues(testData);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([1, 2, 3]);
  });

  test('jqLength should return array length', () => {
    if (!jqAvailable) return;

    const testData = '[1, 2, 3, 4, 5]';
    const result = jqLength(testData);

    expect(result).toBe(5);
  });

  test('jqLength should return object key count', () => {
    if (!jqAvailable) return;

    const testData = '{"a": 1, "b": 2, "c": 3}';
    const result = jqLength(testData);

    expect(result).toBe(3);
  });

  test('jqType should return correct type for object', () => {
    if (!jqAvailable) return;

    const testData = '{"name": "test"}';
    const result = jqType(testData);

    expect(result).toBe('object');
  });

  test('jqType should return correct type for array', () => {
    if (!jqAvailable) return;

    const testData = '[1, 2, 3]';
    const result = jqType(testData);

    expect(result).toBe('array');
  });

  test('jqType should return correct type for string', () => {
    if (!jqAvailable) return;

    const testData = '"hello"';
    const result = jqType(testData);

    expect(result).toBe('string');
  });

  test('jqType should return correct type for number', () => {
    if (!jqAvailable) return;

    const testData = '42';
    const result = jqType(testData);

    expect(result).toBe('number');
  });

  test('should handle query errors gracefully', () => {
    if (!jqAvailable) return;

    const testData = '{"name": "test"}';

    expect(() => {
      jqQuery(testData, '..invalid');
    }).toThrow();
  });

  test('should throw error when jq not available', () => {
    if (jqAvailable) return; // Skip if jq IS available

    expect(() => {
      jqQuery('{}', '.');
    }).toThrow(/jq binary not found/);
  });

  test('should handle complex nested queries', () => {
    if (!jqAvailable) return;

    const testData = '{"users": [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]}';
    const result = jqQuery(testData, '.users[].name');

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual(['Alice', 'Bob']);
  });

  test('should handle filtering', () => {
    if (!jqAvailable) return;

    const testData = '{"items": [1, 2, 3, 4, 5]}';
    const result = jqQuery(testData, '.items | map(select(. > 2))');

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([3, 4, 5]);
  });
});
