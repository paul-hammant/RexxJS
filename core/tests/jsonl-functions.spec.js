/**
 * JSONL Functions Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

/* eslint-env jest */
'use strict';

const { jsonFunctions } = require('../src/json-functions');

describe('JSONL (JSON Lines) Functions', () => {
  const sampleJsonl = '{"name":"Alice","age":30}\n{"name":"Bob","age":25}\n{"name":"Charlie","age":35}';
  const sampleObjects = [
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
    { name: "Charlie", age: 35 }
  ];

  describe('JSONL_PARSE', () => {
    test('should parse valid JSONL string', () => {
      const result = jsonFunctions.JSONL_PARSE(sampleJsonl);
      expect(result).toEqual(sampleObjects);
    });

    test('should handle empty lines', () => {
      const jsonlWithEmpty = '{"a":1}\n\n{"b":2}\n\n';
      const result = jsonFunctions.JSONL_PARSE(jsonlWithEmpty);
      expect(result).toEqual([{a: 1}, {b: 2}]);
    });

    test('should handle single line', () => {
      const result = jsonFunctions.JSONL_PARSE('{"single":true}');
      expect(result).toEqual([{single: true}]);
    });

    test('should throw error for invalid JSON line', () => {
      const invalidJsonl = '{"valid":true}\n{invalid json}\n{"also":"valid"}';
      expect(() => jsonFunctions.JSONL_PARSE(invalidJsonl)).toThrow('Invalid JSONL');
    });

    test('should handle empty string', () => {
      const result = jsonFunctions.JSONL_PARSE('');
      expect(result).toEqual([]);
    });
  });

  describe('JSONL_STRINGIFY', () => {
    test('should convert array to JSONL string', () => {
      const result = jsonFunctions.JSONL_STRINGIFY(sampleObjects);
      expect(result).toBe(sampleJsonl);
    });

    test('should handle empty array', () => {
      const result = jsonFunctions.JSONL_STRINGIFY([]);
      expect(result).toBe('');
    });

    test('should handle single object', () => {
      const result = jsonFunctions.JSONL_STRINGIFY([{test: 'value'}]);
      expect(result).toBe('{"test":"value"}');
    });

    test('should throw error for non-array input', () => {
      expect(() => jsonFunctions.JSONL_STRINGIFY({not: 'array'})).toThrow('Input must be an array');
    });

    test('should handle complex objects', () => {
      const complexObjects = [
        {id: 1, data: {nested: true}, tags: ['a', 'b']},
        {id: 2, data: {nested: false}, tags: ['c']}
      ];
      const result = jsonFunctions.JSONL_STRINGIFY(complexObjects);
      const lines = result.split('\n');
      expect(lines).toHaveLength(2);
      expect(JSON.parse(lines[0])).toEqual(complexObjects[0]);
      expect(JSON.parse(lines[1])).toEqual(complexObjects[1]);
    });
  });

  describe('JSONL_ADD_LINE', () => {
    test('should add line to existing JSONL', () => {
      const newObject = {name: "David", age: 40};
      const result = jsonFunctions.JSONL_ADD_LINE(sampleJsonl, newObject);
      const expected = sampleJsonl + '\n' + JSON.stringify(newObject);
      expect(result).toBe(expected);
    });

    test('should create first line when JSONL is empty', () => {
      const newObject = {first: true};
      const result = jsonFunctions.JSONL_ADD_LINE('', newObject);
      expect(result).toBe('{"first":true}');
    });

    test('should handle null/undefined JSONL', () => {
      const newObject = {test: 'value'};
      const result1 = jsonFunctions.JSONL_ADD_LINE(null, newObject);
      const result2 = jsonFunctions.JSONL_ADD_LINE(undefined, newObject);
      expect(result1).toBe('{"test":"value"}');
      expect(result2).toBe('{"test":"value"}');
    });

    test('should throw error for unstringifiable object', () => {
      const circular = {};
      circular.self = circular;
      expect(() => jsonFunctions.JSONL_ADD_LINE('', circular)).toThrow('Cannot add line to JSONL');
    });
  });

  describe('JSONL_COUNT', () => {
    test('should count lines in JSONL', () => {
      const result = jsonFunctions.JSONL_COUNT(sampleJsonl);
      expect(result).toBe(3);
    });

    test('should handle empty JSONL', () => {
      const result = jsonFunctions.JSONL_COUNT('');
      expect(result).toBe(0);
    });

    test('should ignore empty lines', () => {
      const jsonlWithEmpty = '{"a":1}\n\n{"b":2}\n\n{"c":3}';
      const result = jsonFunctions.JSONL_COUNT(jsonlWithEmpty);
      expect(result).toBe(3);
    });

    test('should return 0 for invalid input', () => {
      const result = jsonFunctions.JSONL_COUNT(null);
      expect(result).toBe(0);
    });
  });

  describe('JSONL_GET_LINE', () => {
    test('should get line by 1-based index', () => {
      const result = jsonFunctions.JSONL_GET_LINE(sampleJsonl, 2);
      expect(result).toEqual({name: "Bob", age: 25});
    });

    test('should return first line for index 1', () => {
      const result = jsonFunctions.JSONL_GET_LINE(sampleJsonl, 1);
      expect(result).toEqual({name: "Alice", age: 30});
    });

    test('should return last line for valid index', () => {
      const result = jsonFunctions.JSONL_GET_LINE(sampleJsonl, 3);
      expect(result).toEqual({name: "Charlie", age: 35});
    });

    test('should return null for out of bounds index', () => {
      const result1 = jsonFunctions.JSONL_GET_LINE(sampleJsonl, 0);
      const result2 = jsonFunctions.JSONL_GET_LINE(sampleJsonl, 4);
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    test('should return null for invalid JSON line', () => {
      const invalidJsonl = '{"valid":true}\n{invalid json}';
      const result = jsonFunctions.JSONL_GET_LINE(invalidJsonl, 2);
      expect(result).toBeNull();
    });

    test('should handle string line number', () => {
      const result = jsonFunctions.JSONL_GET_LINE(sampleJsonl, '2');
      expect(result).toEqual({name: "Bob", age: 25});
    });
  });

  describe('JSONL_FILTER', () => {
    test('should filter by key-value match', () => {
      const result = jsonFunctions.JSONL_FILTER(sampleJsonl, 'name', 'Bob');
      expect(result).toBe('{"name":"Bob","age":25}');
    });

    test('should filter by numeric value', () => {
      const result = jsonFunctions.JSONL_FILTER(sampleJsonl, 'age', 30);
      expect(result).toBe('{"name":"Alice","age":30}');
    });

    test('should return empty string when no matches', () => {
      const result = jsonFunctions.JSONL_FILTER(sampleJsonl, 'name', 'Eve');
      expect(result).toBe('');
    });

    test('should handle multiple matches', () => {
      const jsonlWithDuplicates = sampleJsonl + '\n{"name":"Alice","age":31}';
      const result = jsonFunctions.JSONL_FILTER(jsonlWithDuplicates, 'name', 'Alice');
      const lines = result.split('\n');
      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe('{"name":"Alice","age":30}');
      expect(lines[1]).toBe('{"name":"Alice","age":31}');
    });

    test('should handle invalid JSON lines gracefully', () => {
      const invalidJsonl = '{"name":"Alice","age":30}\n{invalid json}\n{"name":"Bob","age":25}';
      const result = jsonFunctions.JSONL_FILTER(invalidJsonl, 'name', 'Bob');
      expect(result).toBe('{"name":"Bob","age":25}');
    });
  });

  describe('JSONL_MAP', () => {
    test('should extract values by key', () => {
      const result = jsonFunctions.JSONL_MAP(sampleJsonl, 'name');
      expect(result).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    test('should extract numeric values', () => {
      const result = jsonFunctions.JSONL_MAP(sampleJsonl, 'age');
      expect(result).toEqual([30, 25, 35]);
    });

    test('should handle missing keys', () => {
      const jsonlMixed = '{"name":"Alice","age":30}\n{"name":"Bob"}\n{"age":35}';
      const result = jsonFunctions.JSONL_MAP(jsonlMixed, 'name');
      expect(result).toEqual(['Alice', 'Bob']);
    });

    test('should return empty array for non-existent key', () => {
      const result = jsonFunctions.JSONL_MAP(sampleJsonl, 'nonexistent');
      expect(result).toEqual([]);
    });

    test('should handle invalid JSON lines', () => {
      const invalidJsonl = '{"name":"Alice"}\n{invalid json}\n{"name":"Bob"}';
      const result = jsonFunctions.JSONL_MAP(invalidJsonl, 'name');
      expect(result).toEqual(['Alice', 'Bob']);
    });
  });

  describe('JSONL_SLICE', () => {
    test('should slice from start to end (1-based)', () => {
      const result = jsonFunctions.JSONL_SLICE(sampleJsonl, 2, 3);
      const expected = '{"name":"Bob","age":25}\n{"name":"Charlie","age":35}';
      expect(result).toBe(expected);
    });

    test('should slice from start to end of string', () => {
      const result = jsonFunctions.JSONL_SLICE(sampleJsonl, 2);
      const expected = '{"name":"Bob","age":25}\n{"name":"Charlie","age":35}';
      expect(result).toBe(expected);
    });

    test('should handle start at 1', () => {
      const result = jsonFunctions.JSONL_SLICE(sampleJsonl, 1, 2);
      const expected = '{"name":"Alice","age":30}\n{"name":"Bob","age":25}';
      expect(result).toBe(expected);
    });

    test('should handle out of bounds gracefully', () => {
      const result1 = jsonFunctions.JSONL_SLICE(sampleJsonl, 10, 20);
      const result2 = jsonFunctions.JSONL_SLICE(sampleJsonl, -5, 2);
      expect(result1).toBe('');
      expect(result2).toBe('{"name":"Alice","age":30}\n{"name":"Bob","age":25}');
    });

    test('should handle single line slice', () => {
      const result = jsonFunctions.JSONL_SLICE(sampleJsonl, 2, 2);
      expect(result).toBe('{"name":"Bob","age":25}');
    });
  });

  describe('JSONL_MERGE', () => {
    test('should merge two JSONL strings', () => {
      const jsonl1 = '{"a":1}\n{"b":2}';
      const jsonl2 = '{"c":3}\n{"d":4}';
      const result = jsonFunctions.JSONL_MERGE(jsonl1, jsonl2);
      expect(result).toBe('{"a":1}\n{"b":2}\n{"c":3}\n{"d":4}');
    });

    test('should handle empty first JSONL', () => {
      const jsonl2 = '{"c":3}\n{"d":4}';
      const result = jsonFunctions.JSONL_MERGE('', jsonl2);
      expect(result).toBe(jsonl2);
    });

    test('should handle empty second JSONL', () => {
      const jsonl1 = '{"a":1}\n{"b":2}';
      const result = jsonFunctions.JSONL_MERGE(jsonl1, '');
      expect(result).toBe(jsonl1);
    });

    test('should handle both empty', () => {
      const result = jsonFunctions.JSONL_MERGE('', '');
      expect(result).toBe('');
    });

    test('should handle null/undefined inputs', () => {
      const jsonl = '{"test":true}';
      const result1 = jsonFunctions.JSONL_MERGE(null, jsonl);
      const result2 = jsonFunctions.JSONL_MERGE(jsonl, null);
      expect(result1).toBe(jsonl);
      expect(result2).toBe(jsonl);
    });
  });

  describe('JSONL_DISTINCT', () => {
    test('should remove duplicates by key', () => {
      const jsonlWithDuplicates = '{"name":"Alice","age":30}\n{"name":"Bob","age":25}\n{"name":"Alice","age":31}';
      const result = jsonFunctions.JSONL_DISTINCT(jsonlWithDuplicates, 'name');
      const lines = result.split('\n');
      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe('{"name":"Alice","age":30}');
      expect(lines[1]).toBe('{"name":"Bob","age":25}');
    });

    test('should remove complete duplicates when no key specified', () => {
      const jsonlWithDuplicates = '{"name":"Alice","age":30}\n{"name":"Bob","age":25}\n{"name":"Alice","age":30}';
      const result = jsonFunctions.JSONL_DISTINCT(jsonlWithDuplicates);
      const lines = result.split('\n');
      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe('{"name":"Alice","age":30}');
      expect(lines[1]).toBe('{"name":"Bob","age":25}');
    });

    test('should handle no duplicates', () => {
      const result = jsonFunctions.JSONL_DISTINCT(sampleJsonl, 'name');
      expect(result).toBe(sampleJsonl);
    });

    test('should handle invalid JSON lines', () => {
      const invalidJsonl = '{"name":"Alice"}\n{invalid json}\n{"name":"Alice"}';
      const result = jsonFunctions.JSONL_DISTINCT(invalidJsonl, 'name');
      expect(result).toBe('{"name":"Alice"}');
    });
  });

  describe('JSONL_SORT', () => {
    test('should sort by key ascending', () => {
      const result = jsonFunctions.JSONL_SORT(sampleJsonl, 'age', true);
      const lines = result.split('\n');
      expect(lines).toHaveLength(3);
      expect(JSON.parse(lines[0]).age).toBe(25);
      expect(JSON.parse(lines[1]).age).toBe(30);
      expect(JSON.parse(lines[2]).age).toBe(35);
    });

    test('should sort by key descending', () => {
      const result = jsonFunctions.JSONL_SORT(sampleJsonl, 'age', false);
      const lines = result.split('\n');
      expect(lines).toHaveLength(3);
      expect(JSON.parse(lines[0]).age).toBe(35);
      expect(JSON.parse(lines[1]).age).toBe(30);
      expect(JSON.parse(lines[2]).age).toBe(25);
    });

    test('should sort by string key', () => {
      const result = jsonFunctions.JSONL_SORT(sampleJsonl, 'name', true);
      const lines = result.split('\n');
      expect(lines).toHaveLength(3);
      expect(JSON.parse(lines[0]).name).toBe('Alice');
      expect(JSON.parse(lines[1]).name).toBe('Bob');
      expect(JSON.parse(lines[2]).name).toBe('Charlie');
    });

    test('should default to ascending when not specified', () => {
      const result = jsonFunctions.JSONL_SORT(sampleJsonl, 'age');
      const lines = result.split('\n');
      expect(JSON.parse(lines[0]).age).toBe(25);
      expect(JSON.parse(lines[2]).age).toBe(35);
    });

    test('should handle string "true"/"false" for ascending parameter', () => {
      const result1 = jsonFunctions.JSONL_SORT(sampleJsonl, 'age', 'true');
      const result2 = jsonFunctions.JSONL_SORT(sampleJsonl, 'age', 'false');
      expect(JSON.parse(result1.split('\n')[0]).age).toBe(25);
      expect(JSON.parse(result2.split('\n')[0]).age).toBe(35);
    });

    test('should return original on error', () => {
      const invalidJsonl = '{"age":30}\n{invalid json}';
      const result = jsonFunctions.JSONL_SORT(invalidJsonl, 'age');
      expect(result).toBe(invalidJsonl);
    });
  });

  describe('JSONL_VALID', () => {
    test('should return true for valid JSONL', () => {
      const result = jsonFunctions.JSONL_VALID(sampleJsonl);
      expect(result).toBe(true);
    });

    test('should return false for invalid JSON line', () => {
      const invalidJsonl = '{"valid":true}\n{invalid json}';
      const result = jsonFunctions.JSONL_VALID(invalidJsonl);
      expect(result).toBe(false);
    });

    test('should return true for empty JSONL', () => {
      const result = jsonFunctions.JSONL_VALID('');
      expect(result).toBe(true);
    });

    test('should handle single valid line', () => {
      const result = jsonFunctions.JSONL_VALID('{"single":true}');
      expect(result).toBe(true);
    });

    test('should ignore empty lines', () => {
      const jsonlWithEmpty = '{"a":1}\n\n{"b":2}\n\n';
      const result = jsonFunctions.JSONL_VALID(jsonlWithEmpty);
      expect(result).toBe(true);
    });

    test('should return false for mixed valid/invalid', () => {
      const mixedJsonl = '{"valid":true}\n{"also":"valid"}\n{invalid}';
      const result = jsonFunctions.JSONL_VALID(mixedJsonl);
      expect(result).toBe(false);
    });
  });
});