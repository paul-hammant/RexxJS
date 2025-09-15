/**
 * ARRAY_FIND Enhancement Tests
 * Tests for enhanced object array searching capabilities
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { arrayFunctions } = require('../src/array-functions');
const { Interpreter } = require('../src/interpreter');
const { MockKitchenService } = require('./mocks/kitchen-service');

describe('ARRAY_FIND Enhancement', () => {
  let interpreter;
  let addressSender;
  let kitchenService;
  
  beforeEach(() => {
    kitchenService = new MockKitchenService();
    addressSender = kitchenService.createRpcClient();
    interpreter = new Interpreter(addressSender);
  });

  describe('Backward Compatibility', () => {
    test('should find simple values in string arrays', () => {
      const input = ['apple', 'banana', 'orange'];
      const result = arrayFunctions.ARRAY_FIND(input, 'banana');
      expect(result).toBe('banana');
    });

    test('should return null when value not found in string array', () => {
      const input = ['apple', 'banana', 'orange'];
      const result = arrayFunctions.ARRAY_FIND(input, 'grape');
      expect(result).toBeNull();
    });

    test('should handle JSON string arrays', () => {
      const input = JSON.stringify(['a', 'b', 'c']);
      const result = arrayFunctions.ARRAY_FIND(input, 'b');
      expect(result).toBe('b');
    });

    test('should find numeric values', () => {
      const input = [1, 2, 3, 4];
      const result = arrayFunctions.ARRAY_FIND(input, 3);
      expect(result).toBe(3);
    });

    test('should find boolean values', () => {
      const input = [true, false, true];
      const result = arrayFunctions.ARRAY_FIND(input, false);
      expect(result).toBe(false);
    });
  });

  describe('Object Array Search by Property', () => {
    const users = [
      { id: 1, name: 'Alice', age: 30, active: true },
      { id: 2, name: 'Bob', age: 25, active: false },
      { id: 3, name: 'Charlie', age: 35, active: true }
    ];

    test('should find object by numeric property', () => {
      const result = arrayFunctions.ARRAY_FIND(users, 'id', 2);
      expect(result).toEqual({ id: 2, name: 'Bob', age: 25, active: false });
    });

    test('should find object by numeric property (via Rexx interpreter)', async () => {
      const script = `
        LET users = '[{"id":1,"name":"Alice","age":30,"active":true},{"id":2,"name":"Bob","age":25,"active":false},{"id":3,"name":"Charlie","age":35,"active":true}]'
        LET result = ARRAY_FIND array=users searchProperty="id" searchValue=2
      `;
      
      const commands = require('../src/parser').parse(script);
      await interpreter.run(commands);
      
      const result = interpreter.getVariable('result');
      expect(result).toEqual({ id: 2, name: 'Bob', age: 25, active: false });
    });

    test('should find object by string property', () => {
      const result = arrayFunctions.ARRAY_FIND(users, 'name', 'Alice');
      expect(result).toEqual({ id: 1, name: 'Alice', age: 30, active: true });
    });

    test('should find object by string property (via Rexx interpreter)', async () => {
      const script = `
        LET users = '[{"id":1,"name":"Alice","age":30,"active":true},{"id":2,"name":"Bob","age":25,"active":false},{"id":3,"name":"Charlie","age":35,"active":true}]'
        LET result = ARRAY_FIND array=users searchProperty="name" searchValue="Alice"
      `;
      
      const commands = require('../src/parser').parse(script);
      await interpreter.run(commands);
      
      const result = interpreter.getVariable('result');
      expect(result).toEqual({ id: 1, name: 'Alice', age: 30, active: true });
    });

    test('should find object by boolean property', () => {
      const result = arrayFunctions.ARRAY_FIND(users, 'active', false);
      expect(result).toEqual({ id: 2, name: 'Bob', age: 25, active: false });
    });

    test('should return null when property value not found', () => {
      const result = arrayFunctions.ARRAY_FIND(users, 'name', 'Diana');
      expect(result).toBeNull();
    });

    test('should return null when property does not exist', () => {
      const result = arrayFunctions.ARRAY_FIND(users, 'email', 'alice@example.com');
      expect(result).toBeNull();
    });

    test('should find first matching object when multiple matches exist', () => {
      const result = arrayFunctions.ARRAY_FIND(users, 'active', true);
      // Should return Alice (first match), not Charlie
      expect(result).toEqual({ id: 1, name: 'Alice', age: 30, active: true });
    });
  });

  describe('Type Coercion Handling', () => {
    const items = [
      { id: 1, value: '100', flag: 'true' },
      { id: '2', value: 200, flag: true },
      { id: 3, value: 300, flag: false }
    ];

    test('should handle string to number coercion', () => {
      const result = arrayFunctions.ARRAY_FIND(items, 'id', '2');
      expect(result).toEqual({ id: '2', value: 200, flag: true });
    });

    test('should handle number to string coercion', () => {
      const result = arrayFunctions.ARRAY_FIND(items, 'value', '100');
      expect(result).toEqual({ id: 1, value: '100', flag: 'true' });
    });

    test('should handle boolean to string coercion', () => {
      const result = arrayFunctions.ARRAY_FIND(items, 'flag', 'true');
      expect(result).toEqual({ id: 1, value: '100', flag: 'true' });
    });

    test('should handle exact type matching when types are same', () => {
      const result = arrayFunctions.ARRAY_FIND(items, 'flag', true);
      expect(result).toEqual({ id: '2', value: 200, flag: true });
    });
  });

  describe('JSON String Object Arrays', () => {
    test('should handle JSON string object arrays', () => {
      const jsonUsers = JSON.stringify([
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 }
      ]);
      
      const result = arrayFunctions.ARRAY_FIND(jsonUsers, 'name', 'Bob');
      expect(result).toEqual({ name: 'Bob', age: 25 });
    });

    test('should return null for not found in JSON string', () => {
      const jsonUsers = JSON.stringify([
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 }
      ]);
      
      const result = arrayFunctions.ARRAY_FIND(jsonUsers, 'name', 'Charlie');
      expect(result).toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('should handle empty arrays', () => {
      const result = arrayFunctions.ARRAY_FIND([], 'name', 'Alice');
      expect(result).toBeNull();
    });

    test('should handle malformed JSON', () => {
      const result = arrayFunctions.ARRAY_FIND('invalid json', 'name', 'Alice');
      expect(result).toBeNull();
    });

    test('should handle mixed array types', () => {
      const mixed = [{ name: 'Alice' }, 'string', null, { name: 'Bob' }];
      const result = arrayFunctions.ARRAY_FIND(mixed, 'name', 'Bob');
      expect(result).toEqual({ name: 'Bob' });
    });

    test('should handle null and undefined in object properties', () => {
      const items = [
        { name: 'Alice', value: null },
        { name: 'Bob', value: undefined },
        { name: 'Charlie', value: 'test' }
      ];
      
      // Should not match null/undefined values
      const result1 = arrayFunctions.ARRAY_FIND(items, 'value', null);
      const result2 = arrayFunctions.ARRAY_FIND(items, 'value', undefined);
      expect(result1).toBeNull();
      expect(result2).toBeNull();
      
      // Should find the valid value
      const result3 = arrayFunctions.ARRAY_FIND(items, 'value', 'test');
      expect(result3).toEqual({ name: 'Charlie', value: 'test' });
    });
  });

  describe('Edge Cases', () => {
    test('should handle objects with numeric property names', () => {
      const items = [
        { '0': 'zero', '1': 'one' },
        { '0': 'zero2', '1': 'two' }
      ];
      
      const result = arrayFunctions.ARRAY_FIND(items, '1', 'two');
      expect(result).toEqual({ '0': 'zero2', '1': 'two' });
    });

    test('should handle objects with special characters in property names', () => {
      const items = [
        { 'full-name': 'Alice Smith', 'email@domain': 'alice@test.com' },
        { 'full-name': 'Bob Jones', 'email@domain': 'bob@test.com' }
      ];
      
      const result = arrayFunctions.ARRAY_FIND(items, 'full-name', 'Bob Jones');
      expect(result).toEqual({ 'full-name': 'Bob Jones', 'email@domain': 'bob@test.com' });
    });

    test('should handle arrays as property values', () => {
      const items = [
        { name: 'Alice', tags: ['admin', 'user'] },
        { name: 'Bob', tags: ['user'] }
      ];
      
      // This won't match because we're comparing array to string
      const result = arrayFunctions.ARRAY_FIND(items, 'tags', 'admin');
      expect(result).toBeNull();
    });

    test('should handle nested objects', () => {
      const items = [
        { name: 'Alice', profile: { city: 'New York' } },
        { name: 'Bob', profile: { city: 'San Francisco' } }
      ];
      
      // Direct object comparison won't work
      const result = arrayFunctions.ARRAY_FIND(items, 'profile', { city: 'New York' });
      expect(result).toBeNull();
      
      // But we can find by the nested property itself if it were a primitive
      // This is expected behavior - nested searches would need more complex implementation
    });

    test('should handle zero values correctly', () => {
      const items = [
        { name: 'Alice', count: 0 },
        { name: 'Bob', count: 5 }
      ];
      
      const result = arrayFunctions.ARRAY_FIND(items, 'count', 0);
      expect(result).toEqual({ name: 'Alice', count: 0 });
    });

    test('should handle empty string values', () => {
      const items = [
        { name: 'Alice', description: '' },
        { name: 'Bob', description: 'test' }
      ];
      
      const result = arrayFunctions.ARRAY_FIND(items, 'description', '');
      expect(result).toEqual({ name: 'Alice', description: '' });
    });
  });

  describe('Real-world Usage Examples', () => {
    const products = [
      { id: 1, name: 'Laptop', category: 'Electronics', price: 999.99 },
      { id: 2, name: 'Book', category: 'Education', price: 29.99 },
      { id: 3, name: 'Phone', category: 'Electronics', price: 699.99 }
    ];

    test('should find product by ID', () => {
      const result = arrayFunctions.ARRAY_FIND(products, 'id', 2);
      expect(result).toEqual({ id: 2, name: 'Book', category: 'Education', price: 29.99 });
    });

    test('should find product by category', () => {
      const result = arrayFunctions.ARRAY_FIND(products, 'category', 'Education');
      expect(result).toEqual({ id: 2, name: 'Book', category: 'Education', price: 29.99 });
    });

    test('should find product by price', () => {
      const result = arrayFunctions.ARRAY_FIND(products, 'price', 699.99);
      expect(result).toEqual({ id: 3, name: 'Phone', category: 'Electronics', price: 699.99 });
    });
  });
});