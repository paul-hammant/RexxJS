/**
 * ARRAY_MAP Enhancement Tests
 * Tests for enhanced object array mapping capabilities
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { arrayFunctions } = require('../src/array-functions');
const { Interpreter } = require('../src/interpreter');
const { MockKitchenService } = require('./mocks/kitchen-service');

describe('ARRAY_MAP Enhancement', () => {
  let interpreter;
  let addressSender;
  let kitchenService;
  
  beforeEach(() => {
    kitchenService = new MockKitchenService();
    addressSender = kitchenService.createRpcClient();
    interpreter = new Interpreter(addressSender);
  });

  describe('Backward Compatibility', () => {
    test('should return identity copy without mapExpression', () => {
      const input = [1, 2, 3, 4];
      const result = arrayFunctions.ARRAY_MAP(input);
      expect(result).toEqual([1, 2, 3, 4]);
      expect(result).not.toBe(input); // Should be a copy
    });

    test('should handle JSON string arrays', () => {
      const input = JSON.stringify(['a', 'b', 'c']);
      const result = arrayFunctions.ARRAY_MAP(input);
      expect(result).toEqual(['a', 'b', 'c']);
    });

    test('should handle string array transformations', () => {
      const input = ['hello', 'world'];
      const upperResult = arrayFunctions.ARRAY_MAP(input, 'toUpperCase');
      const lowerResult = arrayFunctions.ARRAY_MAP(input, 'toLowerCase');
      const lengthResult = arrayFunctions.ARRAY_MAP(input, 'length');
      
      expect(upperResult).toEqual(['HELLO', 'WORLD']);
      expect(lowerResult).toEqual(['hello', 'world']);
      expect(lengthResult).toEqual([5, 5]);
    });

    test('should handle string array expressions', () => {
      const input = [1, 2, 3, 4];
      const result = arrayFunctions.ARRAY_MAP(input, 'item * 2');
      expect(result).toEqual([2, 4, 6, 8]);
    });
  });

  describe('Object Array Property Extraction', () => {
    const users = [
      { name: 'Alice', age: 30, active: true },
      { name: 'Bob', age: 25, active: false },
      { name: 'Charlie', age: 35, active: true }
    ];

    test('should extract property by name', () => {
      const names = arrayFunctions.ARRAY_MAP(users, 'name');
      expect(names).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    test('should extract property by name (via Rexx interpreter)', async () => {
      const script = `
        LET users = '[{"name":"Alice","age":30},{"name":"Bob","age":25}]'
        LET names = ARRAY_MAP array=users mapExpression="name"
      `;
      
      const commands = require('../src/parser').parse(script);
      await interpreter.run(commands);
      
      const result = interpreter.getVariable('names');
      expect(result).toEqual(['Alice', 'Bob']);
    });

    test('should extract numeric properties', () => {
      const ages = arrayFunctions.ARRAY_MAP(users, 'age');
      expect(ages).toEqual([30, 25, 35]);
    });

    test('should extract boolean properties', () => {
      const activeStates = arrayFunctions.ARRAY_MAP(users, 'active');
      expect(activeStates).toEqual([true, false, true]);
    });
  });

  describe('Object Array Transformations', () => {
    const users = [
      { name: 'Alice', age: 30, active: true },
      { name: 'Bob', age: 25, active: false },
      { name: 'Charlie', age: 35, active: true }
    ];

    test('should create formatted strings', () => {
      const result = arrayFunctions.ARRAY_MAP(users, 'name + " (" + age + ")"');
      expect(result).toEqual(['Alice (30)', 'Bob (25)', 'Charlie (35)']);
    });

    test('should create formatted strings (via Rexx interpreter)', async () => {
      const script = `
        LET users = '[{"name":"Alice","age":30,"active":true},{"name":"Bob","age":25,"active":false},{"name":"Charlie","age":35,"active":true}]'
        LET result = ARRAY_MAP array=users mapExpression="name + \\" (\\" + age + \\")\\""
      `;
      
      const commands = require('../src/parser').parse(script);
      await interpreter.run(commands);
      
      const result = interpreter.getVariable('result');
      expect(result).toEqual(['Alice (30)', 'Bob (25)', 'Charlie (35)']);
    });

    test('should perform numeric calculations', () => {
      const result = arrayFunctions.ARRAY_MAP(users, 'age * 12'); // Age in months
      expect(result).toEqual([360, 300, 420]);
    });

    test('should handle string operations', () => {
      const result = arrayFunctions.ARRAY_MAP(users, 'name.toUpperCase()');
      expect(result).toEqual(['ALICE', 'BOB', 'CHARLIE']);
    });

    test('should handle conditional expressions', () => {
      const result = arrayFunctions.ARRAY_MAP(users, 'active ? "Active" : "Inactive"');
      expect(result).toEqual(['Active', 'Inactive', 'Active']);
    });

    test('should handle complex expressions', () => {
      const result = arrayFunctions.ARRAY_MAP(users, 'name.substring(0, 3) + "-" + age');
      expect(result).toEqual(['Ali-30', 'Bob-25', 'Cha-35']);
    });
  });

  describe('JSON String Object Arrays', () => {
    test('should handle JSON string object arrays', () => {
      const jsonUsers = JSON.stringify([
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 }
      ]);
      
      const names = arrayFunctions.ARRAY_MAP(jsonUsers, 'name');
      expect(names).toEqual(['Alice', 'Bob']);
    });

    test('should handle JSON string transformations', () => {
      const jsonUsers = JSON.stringify([
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 }
      ]);
      
      const result = arrayFunctions.ARRAY_MAP(jsonUsers, 'name + " is " + age + " years old"');
      expect(result).toEqual(['Alice is 30 years old', 'Bob is 25 years old']);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid expressions gracefully', () => {
      const users = [{ name: 'Alice', age: 30 }];
      const result = arrayFunctions.ARRAY_MAP(users, 'invalid.property.chain()');
      // Should return original objects if expression fails
      expect(result).toEqual([{ name: 'Alice', age: 30 }]);
    });

    test('should handle mixed array types', () => {
      const mixed = [{ age: 30 }, 'string', null, { age: 25 }];
      const result = arrayFunctions.ARRAY_MAP(mixed, 'age');
      // Should extract age where possible, return original otherwise
      expect(result).toEqual([30, 'string', null, 25]);
    });

    test('should handle empty arrays', () => {
      const result = arrayFunctions.ARRAY_MAP([], 'name');
      expect(result).toEqual([]);
    });

    test('should handle malformed JSON', () => {
      const result = arrayFunctions.ARRAY_MAP('invalid json', 'name');
      expect(result).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    test('should handle objects with null/undefined properties', () => {
      const users = [
        { name: 'Alice', age: null },
        { name: 'Bob', age: undefined },
        { name: 'Charlie', age: 30 }
      ];
      
      const ages = arrayFunctions.ARRAY_MAP(users, 'age');
      expect(ages).toEqual([null, undefined, 30]);
    });

    test('should handle special characters in property names', () => {
      const items = [
        { 'full-name': 'Alice Smith' },
        { 'full-name': 'Bob Jones' }
      ];
      
      // Property names with special characters won't work with variable extraction
      // but the original objects should be returned
      const result = arrayFunctions.ARRAY_MAP(items, 'full-name');
      expect(result).toEqual([{ 'full-name': 'Alice Smith' }, { 'full-name': 'Bob Jones' }]);
    });

    test('should handle arrays as property values', () => {
      const users = [
        { name: 'Alice', tags: ['admin', 'user'] },
        { name: 'Bob', tags: ['user'] }
      ];
      
      const tagCounts = arrayFunctions.ARRAY_MAP(users, 'tags.length');
      expect(tagCounts).toEqual([2, 1]);
    });

    test('should handle nested object access', () => {
      const users = [
        { name: 'Alice', profile: { city: 'New York' } },
        { name: 'Bob', profile: { city: 'San Francisco' } }
      ];
      
      const cities = arrayFunctions.ARRAY_MAP(users, 'profile.city');
      expect(cities).toEqual(['New York', 'San Francisco']);
    });
  });

  describe('Type Conversions', () => {
    test('should handle string to number conversion', () => {
      const items = ['1', '2', '3'];
      const result = arrayFunctions.ARRAY_MAP(items, 'toNumber');
      expect(result).toEqual([1, 2, 3]);
    });

    test('should handle number to string conversion', () => {
      const items = [1, 2, 3];
      const result = arrayFunctions.ARRAY_MAP(items, 'toString');
      expect(result).toEqual(['1', '2', '3']);
    });
  });
});