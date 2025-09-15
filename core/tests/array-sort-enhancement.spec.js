/**
 * ARRAY_SORT Enhancement Tests
 * Tests for enhanced object array sorting capabilities
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { arrayFunctions } = require('../src/array-functions');
const { Interpreter } = require('../src/interpreter');
const { MockKitchenService } = require('./mocks/kitchen-service');

describe('ARRAY_SORT Enhancement', () => {
  let interpreter;
  let addressSender;
  let kitchenService;
  
  beforeEach(() => {
    kitchenService = new MockKitchenService();
    addressSender = kitchenService.createRpcClient();
    interpreter = new Interpreter(addressSender);
  });

  describe('Backward Compatibility', () => {
    test('should sort string arrays ascending by default', () => {
      const input = ['banana', 'apple', 'cherry'];
      const result = arrayFunctions.ARRAY_SORT(input);
      expect(result).toEqual(['apple', 'banana', 'cherry']);
      expect(result).not.toBe(input); // Should be a copy
    });

    test('should sort string arrays descending with "desc" as second parameter', () => {
      const input = ['banana', 'apple', 'cherry'];
      const result = arrayFunctions.ARRAY_SORT(input, 'desc');
      expect(result).toEqual(['cherry', 'banana', 'apple']);
    });

    test('should sort string arrays ascending with "asc" as second parameter', () => {
      const input = ['banana', 'apple', 'cherry'];
      const result = arrayFunctions.ARRAY_SORT(input, 'asc');
      expect(result).toEqual(['apple', 'banana', 'cherry']);
    });

    test('should handle JSON string arrays', () => {
      const input = JSON.stringify([3, 1, 4, 1, 5]);
      const result = arrayFunctions.ARRAY_SORT(input);
      // Sort as numbers, not strings, based on actual implementation
      expect(result).toEqual([1, 1, 3, 4, 5]);
    });

    test('should sort numeric arrays as numbers (current behavior)', () => {
      const input = [3, 1, 4, 1, 5];
      const result = arrayFunctions.ARRAY_SORT(input);
      // Current implementation sorts numerically when possible
      expect(result).toEqual([1, 1, 3, 4, 5]);
    });

    test('should handle empty arrays', () => {
      const result = arrayFunctions.ARRAY_SORT([]);
      expect(result).toEqual([]);
    });

    test('should handle arrays with null/undefined values', () => {
      const input = ['banana', null, 'apple', undefined, 'cherry'];
      const result = arrayFunctions.ARRAY_SORT(input);
      // null/undefined get coerced to strings in localeCompare
      expect(result).toEqual(['apple', 'banana', 'cherry', null, undefined]);
    });
  });

  describe('Object Array Sorting', () => {
    const users = [
      { name: 'Bob', age: 25, score: 85.5 },
      { name: 'Alice', age: 30, score: 92.0 },
      { name: 'Charlie', age: 25, score: 78.5 },
      { name: 'Diana', age: 35, score: 88.0 }
    ];

    test('should sort object arrays by string property ascending', () => {
      const result = arrayFunctions.ARRAY_SORT(users, 'name');
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Charlie');
      expect(result[3].name).toBe('Diana');
    });

    test('should sort object arrays by string property descending', () => {
      const result = arrayFunctions.ARRAY_SORT(users, 'name', 'desc');
      expect(result[0].name).toBe('Diana');
      expect(result[1].name).toBe('Charlie');
      expect(result[2].name).toBe('Bob');
      expect(result[3].name).toBe('Alice');
    });

    test('should sort object arrays by numeric property ascending', () => {
      const result = arrayFunctions.ARRAY_SORT(users, 'age');
      expect(result[0].age).toBe(25);
      expect(result[1].age).toBe(25);
      expect(result[2].age).toBe(30);
      expect(result[3].age).toBe(35);
    });

    test('should sort object arrays by numeric property descending', () => {
      const result = arrayFunctions.ARRAY_SORT(users, 'age', 'desc');
      expect(result[0].age).toBe(35);
      expect(result[1].age).toBe(30);
      expect(result[2].age).toBe(25);
      expect(result[3].age).toBe(25);
    });

    test('should sort object arrays by float property', () => {
      const result = arrayFunctions.ARRAY_SORT(users, 'score', 'desc');
      expect(result[0].score).toBe(92.0);
      expect(result[1].score).toBe(88.0);
      expect(result[2].score).toBe(85.5);
      expect(result[3].score).toBe(78.5);
    });

    test('should handle mixed type properties (coerced to string)', () => {
      const mixed = [
        { value: 10 },
        { value: '2' },
        { value: 100 },
        { value: '20' }
      ];
      const result = arrayFunctions.ARRAY_SORT(mixed, 'value');
      // Numeric comparison should work
      expect(result[0].value).toBe('2');
      expect(result[1].value).toBe(10);
      expect(result[2].value).toBe('20');
      expect(result[3].value).toBe(100);
    });

    test('should handle objects with missing properties', () => {
      const incomplete = [
        { name: 'Bob', age: 25 },
        { name: 'Alice' }, // missing age
        { name: 'Charlie', age: 30 },
        { age: 35 } // missing name
      ];
      
      const byName = arrayFunctions.ARRAY_SORT(incomplete, 'name');
      expect(byName[3].name).toBeUndefined(); // null/undefined goes to end
      
      const byAge = arrayFunctions.ARRAY_SORT(incomplete, 'age');
      expect(byAge[3].age).toBeUndefined(); // null/undefined goes to end
    });

    test('should preserve object structure', () => {
      const result = arrayFunctions.ARRAY_SORT(users, 'name');
      expect(result[0]).toEqual({ name: 'Alice', age: 30, score: 92.0 });
      expect(result).not.toBe(users); // Should be a copy
      // Note: Current implementation doesn't deep copy objects, just creates new array
      expect(result[0]).toBe(users.find(u => u.name === 'Alice')); // Shallow copy of objects
    });
  });

  describe('JSON String Object Arrays', () => {
    test('should sort JSON string object arrays', () => {
      const jsonUsers = JSON.stringify([
        { name: 'Bob', age: 25 },
        { name: 'Alice', age: 30 },
        { name: 'Charlie', age: 20 }
      ]);
      
      const result = arrayFunctions.ARRAY_SORT(jsonUsers, 'name');
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Charlie');
    });

    test('should sort JSON string object arrays by numeric property', () => {
      const jsonUsers = JSON.stringify([
        { name: 'Bob', age: 25 },
        { name: 'Alice', age: 30 },
        { name: 'Charlie', age: 20 }
      ]);
      
      const result = arrayFunctions.ARRAY_SORT(jsonUsers, 'age');
      expect(result[0].age).toBe(20);
      expect(result[1].age).toBe(25);
      expect(result[2].age).toBe(30);
    });
  });

  describe('REXX Integration Tests', () => {
    const { parse } = require('../src/parser');
    
    test('should work with REXX LET statements for object arrays', async () => {
      const script = `
        LET users = '[{"name":"Bob","age":25},{"name":"Alice","age":30},{"name":"Charlie","age":20}]'
        LET byName = ARRAY_SORT(users, "name")
        LET byAge = ARRAY_SORT(users, "age", "desc")
      `;
      
      await interpreter.run(parse(script));
      const byName = interpreter.getVariable('byName');
      const byAge = interpreter.getVariable('byAge');
      
      expect(byName.length).toBe(3);
      expect(byName[0].name).toBe('Alice');
      expect(byAge[0].age).toBe(30);
    });

    test('should work with REXX named parameters', async () => {
      const script = `
        LET users = '[{"name":"Bob","age":25},{"name":"Alice","age":30}]'
        LET sorted = ARRAY_SORT array=users property="age" order="desc"
      `;
      
      await interpreter.run(parse(script));
      const sorted = interpreter.getVariable('sorted');
      expect(sorted[0].name).toBe('Alice');
    });

    test('should maintain backward compatibility in REXX', async () => {
      const script = `
        LET fruits = '["banana","apple","cherry"]'
        LET ascending = ARRAY_SORT(fruits)
        LET descending = ARRAY_SORT(fruits, "desc")
      `;
      
      await interpreter.run(parse(script));
      const ascending = interpreter.getVariable('ascending');
      const descending = interpreter.getVariable('descending');
      
      expect(ascending[0]).toBe('apple');
      expect(descending[0]).toBe('cherry');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid JSON gracefully', () => {
      const result = arrayFunctions.ARRAY_SORT('invalid json', 'name');
      expect(result).toEqual([]);
    });

    test('should handle non-object arrays with property parameter', () => {
      const input = ['a', 'b', 'c'];
      const result = arrayFunctions.ARRAY_SORT(input, 'name');
      expect(result).toEqual(['a', 'b', 'c']); // Should treat 'name' as order, fallback to asc
    });

    test('should handle mixed arrays (objects and primitives)', () => {
      const mixed = [
        { name: 'Alice', age: 30 },
        'string',
        { name: 'Bob', age: 25 },
        42
      ];
      const result = arrayFunctions.ARRAY_SORT(mixed, 'name');
      // Should keep non-objects in original positions and sort objects
      expect(result.find(item => item.name === 'Alice')).toBeDefined();
      expect(result.find(item => item.name === 'Bob')).toBeDefined();
      expect(result.includes('string')).toBe(true);
      expect(result.includes(42)).toBe(true);
    });

    test('should handle null and undefined inputs', () => {
      expect(arrayFunctions.ARRAY_SORT(null)).toEqual([]);
      expect(arrayFunctions.ARRAY_SORT(undefined)).toEqual([]);
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle large object arrays', () => {
      const largeArray = Array(1000).fill(0).map((_, i) => ({
        id: i,
        name: `User${1000 - i}`,
        value: Math.random()
      }));
      
      const result = arrayFunctions.ARRAY_SORT(largeArray, 'name');
      expect(result.length).toBe(1000);
      expect(result[0].name).toBe('User1');
      expect(result[999].name).toBe('User999');
    });

    test('should handle single element arrays', () => {
      const single = [{ name: 'Alice', age: 30 }];
      const result = arrayFunctions.ARRAY_SORT(single, 'name');
      expect(result).toEqual(single);
      expect(result).not.toBe(single);
    });

    test('should handle arrays with duplicate property values', () => {
      const duplicates = [
        { name: 'Alice', group: 'A' },
        { name: 'Bob', group: 'A' },
        { name: 'Charlie', group: 'B' },
        { name: 'Diana', group: 'A' }
      ];
      
      const result = arrayFunctions.ARRAY_SORT(duplicates, 'group');
      const groupACount = result.filter(item => item.group === 'A').length;
      const groupBCount = result.filter(item => item.group === 'B').length;
      
      expect(groupACount).toBe(3);
      expect(groupBCount).toBe(1);
    });
  });
});