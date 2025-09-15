/**
 * Tests for Phase 5 Enhancements - Additional Array Functions, Mathematical Functions, and Validation Functions
 * 
 * Tests the new functions added in Phase 5:
 * - ARRAY_REDUCE: Advanced array reduction with expressions
 * - ARRAY_UNIQUE: Enhanced uniqueness with comparison expressions
 * - ARRAY_FLATTEN: Flattening nested arrays and object structures
 * - REGRESSION: Linear and polynomial regression analysis
 * - FORECAST: Time series forecasting with multiple methods
 * - VALIDATE_SCHEMA: Data validation against defined schemas
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 * - CHECK_TYPES: Type checking for data structures
 */

const { arrayFunctions } = require('../src/array-functions');
const { statisticsFunctions } = require('../src/statistics-functions');
const { stringFunctions } = require('../src/string-functions');

describe('Phase 5 Enhancements', () => {
  
  describe('ARRAY_REDUCE Enhancement', () => {
    test('should reduce numeric array with default sum behavior', () => {
      const result = arrayFunctions.ARRAY_REDUCE([1, 2, 3, 4, 5]);
      expect(result).toBe(15);
    });

    test('should reduce string array with default concatenation', () => {
      const result = arrayFunctions.ARRAY_REDUCE(['a', 'b', 'c']);
      expect(result).toBe('abc');
    });

    test('should reduce with custom expression for simple arrays', () => {
      const result = arrayFunctions.ARRAY_REDUCE([1, 2, 3, 4], 'acc * item', 1);
      expect(result).toBe(24); // 1 * 1 * 2 * 3 * 4 = 24
    });

    test('should reduce object arrays with property-based expressions', () => {
      const users = [
        { name: 'Alice', salary: 50000 },
        { name: 'Bob', salary: 60000 },
        { name: 'Carol', salary: 55000 }
      ];
      
      const totalSalary = arrayFunctions.ARRAY_REDUCE(users, 'acc + salary', 0);
      expect(totalSalary).toBe(165000);
    });

    test('should reduce object arrays with complex expressions', () => {
      const products = [
        { name: 'Widget', price: 10.50, quantity: 5 },
        { name: 'Gadget', price: 25.75, quantity: 3 },
        { name: 'Tool', price: 15.00, quantity: 2 }
      ];
      
      const totalValue = arrayFunctions.ARRAY_REDUCE(products, 'acc + (price * quantity)', 0);
      expect(totalValue).toBe(159.75); // 52.5 + 77.25 + 30 = 159.75
    });

    test('should handle JSON string input', () => {
      const result = arrayFunctions.ARRAY_REDUCE('[{"value": 10}, {"value": 20}, {"value": 30}]', 'acc + value', 0);
      expect(result).toBe(60);
    });

    test('should handle empty arrays', () => {
      const result = arrayFunctions.ARRAY_REDUCE([], 'acc + item', 100);
      expect(result).toBe(100); // Returns initial value
    });

    test('should use index in expressions', () => {
      const result = arrayFunctions.ARRAY_REDUCE([10, 20, 30], 'acc + (item * index)', 0);
      expect(result).toBe(80); // 10*0 + 20*1 + 30*2 = 0 + 20 + 60 = 80
    });
  });

  describe('ARRAY_UNIQUE Enhancement', () => {
    test('should return unique values for simple arrays', () => {
      const result = arrayFunctions.ARRAY_UNIQUE([1, 2, 2, 3, 3, 3, 4]);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    test('should handle unique by property for object arrays', () => {
      const users = [
        { id: 1, name: 'Alice', department: 'Engineering' },
        { id: 2, name: 'Bob', department: 'Sales' },
        { id: 3, name: 'Carol', department: 'Engineering' },
        { id: 4, name: 'David', department: 'Marketing' }
      ];
      
      const uniqueByDept = arrayFunctions.ARRAY_UNIQUE(users, 'department');
      expect(uniqueByDept).toHaveLength(3);
      expect(uniqueByDept.map(u => u.department)).toEqual(['Engineering', 'Sales', 'Marketing']);
    });

    test('should handle unique by complex expressions', () => {
      const products = [
        { name: 'Widget A', category: 'widgets', price: 10 },
        { name: 'Widget B', category: 'widgets', price: 15 },
        { name: 'Gadget A', category: 'gadgets', price: 20 },
        { name: 'Widget C', category: 'widgets', price: 10 }
      ];
      
      // Unique by price range (low: <15, high: >=15)
      const uniqueByPriceRange = arrayFunctions.ARRAY_UNIQUE(products, 'price >= 15 ? "high" : "low"');
      expect(uniqueByPriceRange).toHaveLength(2);
    });

    test('should handle custom comparison expressions for simple arrays', () => {
      const numbers = [1.1, 1.9, 2.1, 2.9, 3.1];
      const uniqueByFloor = arrayFunctions.ARRAY_UNIQUE(numbers, 'Math.floor(item)');
      expect(uniqueByFloor).toEqual([1.1, 2.1, 3.1]); // Unique by floor value
    });

    test('should handle JSON string input', () => {
      const result = arrayFunctions.ARRAY_UNIQUE('[{"type": "A"}, {"type": "B"}, {"type": "A"}]', 'type');
      expect(result).toHaveLength(2);
    });
  });

  describe('ARRAY_FLATTEN Enhancement', () => {
    test('should flatten nested arrays with default depth 1', () => {
      const nested = [1, [2, 3], [4, [5, 6]]];
      const result = arrayFunctions.ARRAY_FLATTEN(nested);
      expect(result).toEqual([1, 2, 3, 4, [5, 6]]);
    });

    test('should flatten with custom depth', () => {
      const nested = [1, [2, [3, [4, 5]]]];
      const result = arrayFunctions.ARRAY_FLATTEN(nested, 2);
      expect(result).toEqual([1, 2, 3, [4, 5]]);
    });

    test('should flatten objects containing arrays', () => {
      const objWithArrays = [
        { values: [1, 2] },
        { values: [3, 4] }
      ];
      const result = arrayFunctions.ARRAY_FLATTEN(objWithArrays);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    test('should handle deeply nested structures', () => {
      const deepNested = [1, [2, [3, [4, [5]]]]];
      const result = arrayFunctions.ARRAY_FLATTEN(deepNested, 10);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    test('should handle JSON string input', () => {
      const result = arrayFunctions.ARRAY_FLATTEN('[[1, 2], [3, [4, 5]]]', 1);
      expect(result).toEqual([1, 2, 3, [4, 5]]);
    });
  });

  describe('REGRESSION Function', () => {
    test('should perform linear regression', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10]; // Perfect linear relationship y = 2x
      
      const result = statisticsFunctions.REGRESSION(x, y, 'linear');
      expect(result.type).toBe('linear');
      expect(result.slope).toBeCloseTo(2, 2);
      expect(result.intercept).toBeCloseTo(0, 2);
      expect(result.correlation).toBeCloseTo(1, 2);
      expect(result.rSquared).toBeCloseTo(1, 2);
      expect(result.equation).toMatch(/y = 2\.0000x \+ 0\.0000/);
    });

    test('should perform polynomial regression', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [1, 4, 9, 16, 25]; // Quadratic relationship y = x²
      
      const result = statisticsFunctions.REGRESSION(x, y, 'polynomial');
      expect(result.type).toBe('polynomial');
      expect(result.coefficients).toHaveLength(3); // [constant, linear, quadratic]
      expect(result.coefficients[2]).toBeCloseTo(1, 1); // Quadratic coefficient should be ~1
      expect(result.rSquared).toBeGreaterThan(0.9);
    });

    test('should handle JSON string inputs', () => {
      const result = statisticsFunctions.REGRESSION('[1,2,3,4]', '[2,4,6,8]');
      expect(result.slope).toBeCloseTo(2, 2);
      expect(result.intercept).toBeCloseTo(0, 2);
    });

    test('should handle insufficient data gracefully', () => {
      const result = statisticsFunctions.REGRESSION([1], [2]);
      expect(result.slope).toBe(0);
      expect(result.intercept).toBe(0);
      expect(result.correlation).toBe(0);
    });

    test('should generate predictions', () => {
      const x = [1, 2, 3];
      const y = [10, 20, 30];
      
      const result = statisticsFunctions.REGRESSION(x, y);
      expect(result.predictions).toHaveLength(3);
      expect(result.predictions[0]).toBeCloseTo(10, 1);
      expect(result.predictions[1]).toBeCloseTo(20, 1);
      expect(result.predictions[2]).toBeCloseTo(30, 1);
    });
  });

  describe('FORECAST Function', () => {
    test('should forecast using linear trend', () => {
      const historical = [10, 12, 14, 16, 18]; // Linear increase of 2
      
      const result = statisticsFunctions.FORECAST(historical, 3, 'linear');
      expect(result.method).toBe('linear');
      expect(result.forecasts).toHaveLength(3);
      expect(result.forecasts[0]).toBeCloseTo(20, 1);
      expect(result.forecasts[1]).toBeCloseTo(22, 1);
      expect(result.forecasts[2]).toBeCloseTo(24, 1);
      expect(result.trend).toBe('increasing');
    });

    test('should forecast using mean method', () => {
      const historical = [10, 15, 12, 18, 13];
      
      const result = statisticsFunctions.FORECAST(historical, 2, 'mean');
      expect(result.method).toBe('mean');
      expect(result.forecasts).toHaveLength(2);
      const mean = (10 + 15 + 12 + 18 + 13) / 5;
      expect(result.forecasts[0]).toBeCloseTo(mean, 1);
      expect(result.forecasts[1]).toBeCloseTo(mean, 1);
    });

    test('should forecast using exponential smoothing', () => {
      const historical = [10, 12, 11, 13, 12];
      
      const result = statisticsFunctions.FORECAST(historical, 2, 'exponential');
      expect(result.method).toBe('exponential');
      expect(result.forecasts).toHaveLength(2);
      expect(result.confidence).toBe(0.6);
    });

    test('should forecast using moving average', () => {
      const historical = [10, 12, 14, 16, 18];
      
      const result = statisticsFunctions.FORECAST(historical, 1, 'moving_average');
      expect(result.method).toBe('moving_average');
      expect(result.forecasts).toHaveLength(1);
      // Should be average of last 3 values: (14 + 16 + 18) / 3 = 16
      expect(result.forecasts[0]).toBeCloseTo(16, 1);
    });

    test('should handle JSON string input', () => {
      const result = statisticsFunctions.FORECAST('[10, 12, 14]', 1, 'linear');
      expect(result.forecasts).toHaveLength(1);
      expect(result.forecasts[0]).toBeCloseTo(16, 1);
    });

    test('should handle empty data', () => {
      const result = statisticsFunctions.FORECAST([], 1);
      expect(result.forecasts).toEqual([]);
      expect(result.confidence).toBe(0);
    });
  });

  describe('VALIDATE_SCHEMA Function', () => {
    test('should validate object against schema', () => {
      const data = { name: 'John', age: 30, email: 'john@example.com' };
      const schema = {
        name: { type: 'string', required: true },
        age: { type: 'number', required: true, min: 0 },
        email: { type: 'string', required: false }
      };
      
      const result = stringFunctions.VALIDATE_SCHEMA(data, schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.details.validFields).toBe(3);
    });

    test('should detect validation errors', () => {
      const data = { name: 'John', age: -5 }; // Missing required email, age below minimum
      const schema = {
        name: { type: 'string', required: true },
        age: { type: 'number', required: true, min: 0 },
        email: { type: 'string', required: true }
      };
      
      const result = stringFunctions.VALIDATE_SCHEMA(data, schema);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(err => err.includes('email'))).toBe(true);
      expect(result.errors.some(err => err.includes('minimum'))).toBe(true);
    });

    test('should validate array of objects', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];
      const schema = {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true, minLength: 2 }
      };
      
      const result = stringFunctions.VALIDATE_SCHEMA(data, schema);
      expect(result.valid).toBe(true);
    });

    test('should handle JSON string inputs', () => {
      const dataStr = '{"name": "John", "age": 30}';
      const schemaStr = '{"name": {"type": "string", "required": true}, "age": {"type": "number", "required": true}}';
      
      const result = stringFunctions.VALIDATE_SCHEMA(dataStr, schemaStr);
      expect(result.valid).toBe(true);
    });

    test('should validate with enum constraints', () => {
      const data = { status: 'active', priority: 'medium' };
      const schema = {
        status: { type: 'string', required: true, enum: ['active', 'inactive', 'pending'] },
        priority: { type: 'string', required: true, enum: ['low', 'medium', 'high'] }
      };
      
      const result = stringFunctions.VALIDATE_SCHEMA(data, schema);
      expect(result.valid).toBe(true);
    });

    test('should validate string length constraints', () => {
      const data = { username: 'john123', password: 'short' };
      const schema = {
        username: { type: 'string', required: true, minLength: 3, maxLength: 20 },
        password: { type: 'string', required: true, minLength: 8 }
      };
      
      const result = stringFunctions.VALIDATE_SCHEMA(data, schema);
      expect(result.valid).toBe(false);
      expect(result.errors.some(err => err.includes('password') && err.includes('minimum'))).toBe(true);
    });
  });

  describe('CHECK_TYPES Function', () => {
    test('should validate single value type', () => {
      const result = stringFunctions.CHECK_TYPES('hello', 'string');
      expect(result.valid).toBe(true);
      expect(result.actualType).toBe('string');
      expect(result.matches).toContain('value');
    });

    test('should validate array item types', () => {
      const data = [1, 2, 3, 4];
      const result = stringFunctions.CHECK_TYPES(data, ['number']);
      
      expect(result.valid).toBe(true);
      expect(result.actualType).toBe('array');
      expect(result.details.itemCount).toBe(4);
      expect(result.matches).toEqual([0, 1, 2, 3]);
    });

    test('should detect type mismatches in arrays', () => {
      const data = [1, 2, 'three', 4];
      const result = stringFunctions.CHECK_TYPES(data, ['number']);
      
      expect(result.valid).toBe(false);
      expect(result.matches).toEqual([0, 1, 3]); // Index 2 ('three') is mismatch
      expect(result.mismatches).toHaveLength(1);
      expect(result.mismatches[0].index).toBe(2);
      expect(result.mismatches[0].actualType).toBe('string');
    });

    test('should validate object property types', () => {
      const data = { name: 'John', age: 30, active: true };
      const result = stringFunctions.CHECK_TYPES(data, ['string', 'number', 'boolean']);
      
      expect(result.valid).toBe(true);
      expect(result.actualType).toBe('object');
    });

    test('should handle multiple expected types', () => {
      const result = stringFunctions.CHECK_TYPES('123', ['string', 'number']);
      expect(result.valid).toBe(true); // String '123' is valid as either string or number
    });

    test('should handle "any" type', () => {
      const result = stringFunctions.CHECK_TYPES({ complex: 'object' }, ['any']);
      expect(result.valid).toBe(true);
    });

    test('should handle JSON string input', () => {
      const result = stringFunctions.CHECK_TYPES('[1, 2, 3]', ['number']);
      expect(result.valid).toBe(true);
      expect(result.actualType).toBe('array');
    });

    test('should handle comma-separated type string', () => {
      const result = stringFunctions.CHECK_TYPES(42, 'string,number,boolean');
      expect(result.valid).toBe(true);
      expect(result.expectedTypes).toEqual(['string', 'number', 'boolean']);
    });
  });

  describe('Integration with Existing Functions', () => {
    test('should work with existing ARRAY_SORT for complex object manipulation', () => {
      const products = [
        { name: 'Widget', price: 25, category: 'tools' },
        { name: 'Gadget', price: 15, category: 'electronics' },
        { name: 'Tool', price: 35, category: 'tools' }
      ];
      
      // Sort by price, then reduce to get total value of tools
      const sorted = arrayFunctions.ARRAY_SORT(products, 'price', 'desc');
      const toolsOnly = arrayFunctions.ARRAY_FILTER(sorted, 'category === "tools"');
      const totalToolsValue = arrayFunctions.ARRAY_REDUCE(toolsOnly, 'acc + price', 0);
      
      expect(totalToolsValue).toBe(60); // 35 + 25 = 60
    });

    test('should integrate new functions with existing SQL-style operations', () => {
      const employees = [
        { name: 'Alice', department: 'Engineering', salary: 80000, skills: ['JavaScript', 'Python'] },
        { name: 'Bob', department: 'Sales', salary: 60000, skills: ['Communication', 'CRM'] },
        { name: 'Carol', department: 'Engineering', salary: 90000, skills: ['Java', 'Python'] }
      ];
      
      // Select engineering employees, flatten their skills, get unique skills
      const engineering = arrayFunctions.SELECT(employees, '*', 'department === "Engineering"');
      const allSkills = arrayFunctions.ARRAY_MAP(engineering, 'skills');
      const flatSkills = arrayFunctions.ARRAY_FLATTEN(allSkills);
      const uniqueSkills = arrayFunctions.ARRAY_UNIQUE(flatSkills);
      
      expect(uniqueSkills).toEqual(['JavaScript', 'Python', 'Java']);
    });

    test('should validate forecasting results with schema validation', () => {
      const historical = [100, 110, 120, 130];
      const forecast = statisticsFunctions.FORECAST(historical, 2, 'linear');
      
      const schema = {
        method: { type: 'string', required: true },
        forecasts: { type: 'array', required: true }, // Arrays should be validated as array type
        confidence: { type: 'number', required: true, min: 0, max: 1 },
        trend: { type: 'string', required: true }
      };
      
      const validation = stringFunctions.VALIDATE_SCHEMA(forecast, schema);
      expect(validation.valid).toBe(true);
    });
  });
});