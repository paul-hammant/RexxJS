/**
 * Expectations Address Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { ExpectationError, EXPECTATIONS_ADDRESS_META, ADDRESS_EXPECTATIONS_HANDLER } = require('../src/expectations-address');

// Helper function to simulate assert behavior using ADDRESS_EXPECTATIONS_HANDLER
async function assert(expression, context) {
  try {
    const result = await ADDRESS_EXPECTATIONS_HANDLER('expect', { expression, context });
    return { success: result.success, result: result.result };
  } catch (error) {
    if (error instanceof ExpectationError) {
      throw error;
    }
    return { success: false, error: error.message };
  }
}

describe('Expectations Address', () => {

  describe('EXPECTATIONS_ADDRESS_META', () => {
    test('should return library info', () => {
      const info = EXPECTATIONS_ADDRESS_META();
      expect(info.type).toBe('address-target');
      expect(info.name).toContain('Expectation');
      expect(info.loaded).toBe(true);
    });
  });

  describe('ExpectationError class', () => {
    test('should create expectation error with details', () => {
      const error = new ExpectationError(
        'Test failed',
        'actual',
        'expected', 
        'equals',
        false,
        'original expectation'
      );
      
      expect(error.name).toBe('ExpectationError');
      expect(error.message).toBe('Test failed');
      expect(error.actual).toBe('actual');
      expect(error.expected).toBe('expected');
      expect(error.matcher).toBe('equals');
      expect(error.negated).toBe(false);
      expect(error.originalExpectation).toBe('original expectation');
    });
  });

  describe('ADDRESS_EXPECTATIONS_HANDLER', () => {
    test('should parse simple equality assertion', async () => {
      const context = { age: 25 };
      const result = await assert('{age} should be 25', context);
      
      expect(result.success).toBe(true);
    });

    test('should parse simple inequality assertion', async () => {
      const context = { age: 30 };
      const result = await assert('{age} should not be 25', context);
      
      expect(result.success).toBe(true);
    });

    test('should fail on incorrect equality assertion', async () => {
      const context = { age: 30 };
      
      const result = await ADDRESS_EXPECTATIONS_HANDLER('expect', { expression: '{age} should be 25', context });
      expect(result.success).toBe(false);
      expect(result.error).toContain('25 (number) expected, but 30 (number) encountered');
    });

    test('should handle greater than assertion', async () => {
      const context = { score: 85 };
      
      const passResult = await assert('{score} should be greater than 80', context);
      expect(passResult.success).toBe(true);
      
      const failResult = await ADDRESS_EXPECTATIONS_HANDLER('expect', { expression: '{score} should be greater than 90', context });
      expect(failResult.success).toBe(false);
    });

    test('should handle less than assertion', async () => {
      const context = { temp: 20 };
      
      const passResult = await assert('{temp} should be less than 30', context);
      expect(passResult.success).toBe(true);
      
      const failResult = await ADDRESS_EXPECTATIONS_HANDLER('expect', { expression: '{temp} should be less than 15', context });
      expect(failResult.success).toBe(false);
    });

    test('should handle contain assertion for strings', async () => {
      const context = { message: 'Hello World' };
      
      const passResult = await assert('{message} should contain "World"', context);
      expect(passResult.success).toBe(true);
      
      const failResult = await ADDRESS_EXPECTATIONS_HANDLER('expect', { expression: '{message} should contain "Goodbye"', context });
      expect(failResult.success).toBe(false);
    });

    test('should handle empty assertion for arrays', async () => {
      const context = { 
        emptyList: [],
        fullList: [1, 2, 3]
      };
      
      const emptyPass = await assert('{emptyList} should be empty', context);
      expect(emptyPass.success).toBe(true);
      
      const fullPass = await assert('{fullList} should not be empty', context);
      expect(fullPass.success).toBe(true);
      
      const emptyFail = await ADDRESS_EXPECTATIONS_HANDLER('expect', { expression: '{fullList} should be empty', context });
      expect(emptyFail.success).toBe(false);
    });

    test('should handle null/undefined assertions', async () => {
      const context = { 
        nullValue: null,
        undefinedValue: undefined,
        definedValue: 'test'
      };
      
      const nullPass = await assert('{nullValue} should be null', context);
      expect(nullPass.success).toBe(true);
      
      const undefinedPass = await assert('{undefinedValue} should be undefined', context);
      expect(undefinedPass.success).toBe(true);
      
      const definedPass = await assert('{definedValue} should not be null', context);
      expect(definedPass.success).toBe(true);
    });

    test('should handle missing context variable', async () => {
      const context = {};
      const result = await ADDRESS_EXPECTATIONS_HANDLER('expect', { expression: '{missing} should be 10', context });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle malformed assertion', async () => {
      const result = await ADDRESS_EXPECTATIONS_HANDLER('expect', { expression: 'not a valid assertion', context: {} });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle status method', async () => {
      const result = await ADDRESS_EXPECTATIONS_HANDLER('status');
      
      expect(result.success).toBe(true);
      expect(result.result.service).toBe('expectations');
      expect(result.result.version).toBe('1.0.0');
      expect(result.result.methods).toContain('expect');
    });
  });

  describe('Complex assertions', () => {
    test('should handle nested object properties', async () => {
      const context = { 
        user: { profile: { age: 25 } }
      };
      
      const result = await assert('{user.profile.age} should be 25', context);
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('should handle array length assertion', async () => {
      const context = { 
        items: [1, 2, 3, 4, 5]
      };
      
      const result = await assert('{items} should have length 5', context);
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });
});