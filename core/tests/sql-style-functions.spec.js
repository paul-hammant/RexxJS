/**
 * SQL-Style Functions Tests
 * Tests for SELECT, GROUP_BY, JOIN, and DISTINCT functions for object arrays
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { arrayFunctions } = require('../src/array-functions');
const { Interpreter } = require('../src/interpreter');
const { MockKitchenService } = require('./mocks/kitchen-service');

describe('SQL-Style Functions', () => {
  let interpreter;
  let addressSender;
  let kitchenService;
  
  // Sample data for testing
  const users = [
    { id: 1, name: 'Alice', age: 30, department: 'Engineering', salary: 85000 },
    { id: 2, name: 'Bob', age: 25, department: 'Marketing', salary: 55000 },
    { id: 3, name: 'Charlie', age: 35, department: 'Engineering', salary: 95000 },
    { id: 4, name: 'Diana', age: 28, department: 'Marketing', salary: 60000 },
    { id: 5, name: 'Eve', age: 32, department: 'Sales', salary: 70000 }
  ];

  const orders = [
    { orderId: 101, userId: 1, amount: 250.00, product: 'Laptop' },
    { orderId: 102, userId: 2, amount: 150.00, product: 'Mouse' },
    { orderId: 103, userId: 1, amount: 800.00, product: 'Monitor' },
    { orderId: 104, userId: 3, amount: 300.00, product: 'Keyboard' },
    { orderId: 105, userId: 5, amount: 200.00, product: 'Headset' }
  ];
  
  beforeEach(() => {
    kitchenService = new MockKitchenService();
    addressSender = kitchenService.createRpcClient();
    interpreter = new Interpreter(addressSender);
  });

  describe('SELECT Function', () => {
    test('should return all rows when no conditions specified', () => {
      const result = arrayFunctions.SELECT(users);
      expect(result).toHaveLength(5);
      expect(result[0]).toEqual(users[0]);
    });

    test('should select specific columns', () => {
      const result = arrayFunctions.SELECT(users, 'name,age');
      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({ name: 'Alice', age: 30 });
      expect(result[0]).not.toHaveProperty('id');
      expect(result[0]).not.toHaveProperty('department');
    });

    test('should handle single column selection', () => {
      const result = arrayFunctions.SELECT(users, 'name');
      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({ name: 'Alice' });
    });

    test('should apply WHERE clause with numeric comparison', () => {
      const result = arrayFunctions.SELECT(users, '*', 'age >= 30');
      expect(result).toHaveLength(3);
      expect(result.map(u => u.name)).toEqual(['Alice', 'Charlie', 'Eve']);
    });

    test('should apply WHERE clause with string comparison', () => {
      const result = arrayFunctions.SELECT(users, '*', 'department === "Engineering"');
      expect(result).toHaveLength(2);
      expect(result.map(u => u.name)).toEqual(['Alice', 'Charlie']);
    });

    test('should combine column selection with WHERE clause', () => {
      const result = arrayFunctions.SELECT(users, 'name,salary', 'salary > 60000');
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ name: 'Alice', salary: 85000 });
      expect(result[1]).toEqual({ name: 'Charlie', salary: 95000 });
      expect(result[2]).toEqual({ name: 'Eve', salary: 70000 });
    });

    test('should handle complex WHERE expressions', () => {
      const result = arrayFunctions.SELECT(users, 'name,age,department', 
        'age > 25 && department === "Engineering"');
      expect(result).toHaveLength(2);
      expect(result.map(u => u.name)).toEqual(['Alice', 'Charlie']);
    });

    test('should handle JSON string input', () => {
      const jsonUsers = JSON.stringify(users);
      const result = arrayFunctions.SELECT(jsonUsers, 'name', 'age < 30');
      expect(result).toHaveLength(2);
      expect(result.map(u => u.name)).toEqual(['Bob', 'Diana']);
    });

    test('should return original array for non-object arrays', () => {
      const simpleArray = [1, 2, 3, 4, 5];
      const result = arrayFunctions.SELECT(simpleArray, 'name', 'age > 25');
      expect(result).toEqual(simpleArray);
    });

    test('should handle empty arrays', () => {
      const result = arrayFunctions.SELECT([], 'name', 'age > 25');
      expect(result).toEqual([]);
    });

    test('should handle invalid WHERE clauses gracefully', () => {
      const result = arrayFunctions.SELECT(users, 'name', 'invalid.syntax.here');
      expect(result).toEqual([]);
    });
  });

  describe('GROUP_BY Function', () => {
    test('should group objects by property', () => {
      const result = arrayFunctions.GROUP_BY(users, 'department');
      expect(Object.keys(result)).toHaveLength(3);
      expect(result['Engineering']).toHaveLength(2);
      expect(result['Marketing']).toHaveLength(2);
      expect(result['Sales']).toHaveLength(1);
    });

    test('should handle numeric grouping', () => {
      const data = [
        { name: 'Alice', score: 85 },
        { name: 'Bob', score: 85 },
        { name: 'Charlie', score: 90 },
        { name: 'Diana', score: 85 }
      ];
      
      const result = arrayFunctions.GROUP_BY(data, 'score');
      expect(result['85']).toHaveLength(3);
      expect(result['90']).toHaveLength(1);
    });

    test('should handle JSON string input', () => {
      const jsonUsers = JSON.stringify(users);
      const result = arrayFunctions.GROUP_BY(jsonUsers, 'department');
      expect(Object.keys(result)).toHaveLength(3);
      expect(result['Engineering']).toHaveLength(2);
    });

    test('should return empty object for non-object arrays', () => {
      const result = arrayFunctions.GROUP_BY([1, 2, 3], 'value');
      expect(result).toEqual({});
    });

    test('should handle missing properties', () => {
      const incompleteData = [
        { name: 'Alice', department: 'Engineering' },
        { name: 'Bob' }, // missing department
        { name: 'Charlie', department: 'Engineering' }
      ];
      
      const result = arrayFunctions.GROUP_BY(incompleteData, 'department');
      expect(result['Engineering']).toHaveLength(2);
      expect(result['undefined']).toHaveLength(1);
    });
  });

  describe('ARRAY_JOIN Function', () => {
    test('should perform inner join on matching keys', () => {
      const result = arrayFunctions.ARRAY_JOIN(users, orders, 'id', 'userId');
      expect(result).toHaveLength(5); // 5 orders total
      
      // Check that Alice appears twice (has 2 orders)
      const aliceOrders = result.filter(r => r.name === 'Alice');
      expect(aliceOrders).toHaveLength(2);
      expect(aliceOrders[0]).toHaveProperty('amount');
      expect(aliceOrders[0]).toHaveProperty('product');
    });

    test('should merge properties correctly', () => {
      const result = arrayFunctions.ARRAY_JOIN(users, orders, 'id', 'userId');
      const aliceOrder = result.find(r => r.name === 'Alice' && r.product === 'Laptop');
      
      expect(aliceOrder).toMatchObject({
        id: 1,
        name: 'Alice',
        age: 30,
        department: 'Engineering',
        salary: 85000,
        orderId: 101,
        userId: 1,
        amount: 250.00,
        product: 'Laptop'
      });
    });

    test('should handle different key names', () => {
      // Create test data with different key names
      const customers = [
        { customerId: 1, customerName: 'Alice' },
        { customerId: 2, customerName: 'Bob' }
      ];
      const purchases = [
        { purchaseId: 101, customerId: 1, item: 'Book' },
        { purchaseId: 102, customerId: 2, item: 'Pen' }
      ];
      
      const result = arrayFunctions.ARRAY_JOIN(customers, purchases, 'customerId', 'customerId');
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        customerId: 1,
        customerName: 'Alice',
        purchaseId: 101,
        item: 'Book'
      });
    });

    test('should handle same key name (default behavior)', () => {
      const departments = [
        { id: 1, deptName: 'Engineering', budget: 100000 },
        { id: 2, deptName: 'Marketing', budget: 50000 }
      ];
      const employees = [
        { id: 101, name: 'Alice', deptId: 1 },
        { id: 102, name: 'Bob', deptId: 2 }
      ];
      
      // Join on different property names but same concept
      const result = arrayFunctions.ARRAY_JOIN(departments, employees, 'id', 'deptId');
      expect(result).toHaveLength(2);
    });

    test('should handle JSON string inputs', () => {
      const jsonUsers = JSON.stringify(users.slice(0, 2));
      const jsonOrders = JSON.stringify(orders.slice(0, 2));
      
      const result = arrayFunctions.ARRAY_JOIN(jsonUsers, jsonOrders, 'id', 'userId');
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('product');
    });

    test('should return empty array for non-object arrays', () => {
      const result = arrayFunctions.ARRAY_JOIN([1, 2, 3], [4, 5, 6], 'id', 'userId');
      expect(result).toEqual([]);
    });

    test('should handle no matches', () => {
      const noMatchOrders = [
        { orderId: 999, userId: 999, amount: 100.00, product: 'Nothing' }
      ];
      
      const result = arrayFunctions.ARRAY_JOIN(users, noMatchOrders, 'id', 'userId');
      expect(result).toEqual([]);
    });

    test('should handle mixed type matching with string conversion', () => {
      const mixedUsers = [
        { id: '1', name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];
      const mixedOrders = [
        { userId: 1, product: 'Laptop' },
        { userId: '2', product: 'Mouse' }
      ];
      
      const result = arrayFunctions.ARRAY_JOIN(mixedUsers, mixedOrders, 'id', 'userId');
      expect(result).toHaveLength(2);
    });
  });

  describe('DISTINCT Function', () => {
    test('should remove duplicate values from simple arrays', () => {
      const simpleArray = [1, 2, 2, 3, 3, 3, 4];
      const result = arrayFunctions.DISTINCT(simpleArray);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    test('should remove duplicates by property in object arrays', () => {
      const duplicateUsers = [
        { id: 1, name: 'Alice', department: 'Engineering' },
        { id: 2, name: 'Bob', department: 'Marketing' },
        { id: 3, name: 'Charlie', department: 'Engineering' },
        { id: 4, name: 'Diana', department: 'Marketing' },
        { id: 5, name: 'Eve', department: 'Engineering' }
      ];
      
      const result = arrayFunctions.DISTINCT(duplicateUsers, 'department');
      expect(result).toHaveLength(2); // Only unique departments: Engineering, Marketing
      const departments = result.map(u => u.department);
      expect(departments).toEqual(['Engineering', 'Marketing']); // First occurrence of each kept
    });

    test('should handle numeric properties', () => {
      const ageData = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
        { name: 'Charlie', age: 25 },
        { name: 'Diana', age: 30 },
        { name: 'Eve', age: 35 }
      ];
      
      const result = arrayFunctions.DISTINCT(ageData, 'age');
      expect(result).toHaveLength(3); // 25, 30, 35
      const ages = result.map(u => u.age);
      expect(ages).toEqual([25, 30, 35]);
    });

    test('should handle JSON string input', () => {
      const jsonData = JSON.stringify([
        { type: 'A', value: 1 },
        { type: 'B', value: 2 },
        { type: 'A', value: 3 },
        { type: 'C', value: 4 }
      ]);
      
      const result = arrayFunctions.DISTINCT(jsonData, 'type');
      expect(result).toHaveLength(3); // A, B, C
    });

    test('should handle missing properties', () => {
      const incompleteData = [
        { name: 'Alice', category: 'A' },
        { name: 'Bob' }, // missing category
        { name: 'Charlie', category: 'A' },
        { name: 'Diana' } // missing category
      ];
      
      const result = arrayFunctions.DISTINCT(incompleteData, 'category');
      expect(result).toHaveLength(2); // 'A' and undefined (only first of each kept)
    });

    test('should handle string arrays without property', () => {
      const strings = ['apple', 'banana', 'apple', 'cherry', 'banana', 'date'];
      const result = arrayFunctions.DISTINCT(strings);
      expect(result).toEqual(['apple', 'banana', 'cherry', 'date']);
    });
  });

  describe('REXX Integration Tests', () => {
    const { parse } = require('../src/parser');
    
    test('should work with REXX SELECT function', async () => {
      const script = `
        LET users = '[{"name":"Alice","age":30,"dept":"Engineering"},{"name":"Bob","age":25,"dept":"Marketing"}]'
        LET engineers = SELECT(users, "name,age", "dept === 'Engineering'")
      `;
      
      await interpreter.run(parse(script));
      const engineers = interpreter.getVariable('engineers');
      expect(engineers).toHaveLength(1);
      expect(engineers[0]).toEqual({ name: 'Alice', age: 30 });
    });

    test('should work with REXX GROUP_BY function', async () => {
      const script = `
        LET users = '[{"name":"Alice","dept":"Engineering"},{"name":"Bob","dept":"Marketing"},{"name":"Charlie","dept":"Engineering"}]'
        LET byDept = GROUP_BY(users, "dept")
      `;
      
      await interpreter.run(parse(script));
      const byDept = interpreter.getVariable('byDept');
      expect(byDept['Engineering']).toHaveLength(2);
      expect(byDept['Marketing']).toHaveLength(1);
    });

    test('should work with REXX JOIN function', async () => {
      const script = `
        LET users = '[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]'
        LET orders = '[{"userId":1,"product":"Laptop"},{"userId":2,"product":"Mouse"}]'
        LET joined = ARRAY_JOIN(users, orders, "id", "userId")
      `;
      
      await interpreter.run(parse(script));
      const joined = interpreter.getVariable('joined');
      expect(joined).toHaveLength(2);
      expect(joined[0]).toHaveProperty('name');
      expect(joined[0]).toHaveProperty('product');
    });

    test('should work with REXX DISTINCT function', async () => {
      const script = `
        LET data = '[{"name":"Alice","dept":"Engineering"},{"name":"Bob","dept":"Marketing"},{"name":"Charlie","dept":"Engineering"}]'
        LET unique = DISTINCT(data, "dept")
      `;
      
      await interpreter.run(parse(script));
      const unique = interpreter.getVariable('unique');
      expect(unique).toHaveLength(2);
    });

    test('should work with named parameters', async () => {
      const script = `
        LET users = '[{"name":"Alice","age":30},{"name":"Bob","age":25},{"name":"Charlie","age":35}]'
        LET filtered = SELECT array=users columns="name" where="age > 25"
        LET grouped = GROUP_BY array=users key="age"
      `;
      
      await interpreter.run(parse(script));
      const filtered = interpreter.getVariable('filtered');
      const grouped = interpreter.getVariable('grouped');
      
      expect(filtered).toHaveLength(2);
      expect(filtered[0]).toEqual({ name: 'Alice' });
      expect(Object.keys(grouped)).toHaveLength(3);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid JSON gracefully', () => {
      expect(arrayFunctions.SELECT('invalid json')).toEqual([]);
      expect(arrayFunctions.GROUP_BY('invalid json', 'key')).toEqual({});
      expect(arrayFunctions.ARRAY_JOIN('invalid json', '[]', 'id', 'id')).toEqual([]);
      expect(arrayFunctions.DISTINCT('invalid json')).toEqual([]);
    });

    test('should handle null/undefined inputs', () => {
      expect(arrayFunctions.SELECT(null)).toEqual([]);
      expect(arrayFunctions.GROUP_BY(undefined, 'key')).toEqual({});
      expect(arrayFunctions.ARRAY_JOIN(null, null, 'id', 'id')).toEqual([]);
      expect(arrayFunctions.DISTINCT(null)).toEqual([]);
    });

    test('should handle empty arrays', () => {
      expect(arrayFunctions.SELECT([])).toEqual([]);
      expect(arrayFunctions.GROUP_BY([], 'key')).toEqual({});
      expect(arrayFunctions.ARRAY_JOIN([], [], 'id', 'id')).toEqual([]);
      expect(arrayFunctions.DISTINCT([])).toEqual([]);
    });
  });

  describe('Performance Tests', () => {
    test('should handle large datasets efficiently', () => {
      // Generate large dataset
      const largeDataset = Array(1000).fill(0).map((_, i) => ({
        id: i,
        name: `User${i}`,
        department: i % 5 === 0 ? 'Engineering' : i % 3 === 0 ? 'Marketing' : 'Sales',
        age: 20 + (i % 40)
      }));
      
      // Test SELECT performance
      const selectResult = arrayFunctions.SELECT(largeDataset, 'name,age', 'age > 40');
      expect(selectResult.length).toBeGreaterThan(0);
      
      // Test GROUP_BY performance
      const groupResult = arrayFunctions.GROUP_BY(largeDataset, 'department');
      expect(Object.keys(groupResult)).toHaveLength(3);
      
      // Test DISTINCT performance
      const distinctResult = arrayFunctions.DISTINCT(largeDataset, 'department');
      expect(distinctResult).toHaveLength(3);
    });
  });
});