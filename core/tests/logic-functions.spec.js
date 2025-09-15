/**
 * Logic Functions Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { logicFunctions } = require('../src/logic-functions');

describe('Logic Functions', () => {
  describe('IF', () => {
    test('should return trueValue when condition is true', () => {
      expect(logicFunctions.IF(true, 'A', 'B')).toBe('A');
    });

    test('should return falseValue when condition is false', () => {
      expect(logicFunctions.IF(false, 'A', 'B')).toBe('B');
    });

    test('should handle non-boolean conditions', () => {
      expect(logicFunctions.IF(1, 'A', 'B')).toBe('A');
      expect(logicFunctions.IF(0, 'A', 'B')).toBe('B');
      expect(logicFunctions.IF('true', 'A', 'B')).toBe('A');
      expect(logicFunctions.IF('', 'A', 'B')).toBe('B');
    });
  });

  describe('AND', () => {
    test('should return true if all values are true', () => {
      expect(logicFunctions.AND(true, true, true)).toBe(true);
      expect(logicFunctions.AND('true', 'true')).toBe(true);
    });

    test('should return false if any value is false', () => {
      expect(logicFunctions.AND(true, false, true)).toBe(false);
      expect(logicFunctions.AND('true', 'false')).toBe(false);
    });
  });

  describe('OR', () => {
    test('should return true if any value is true', () => {
      expect(logicFunctions.OR(false, true, false)).toBe(true);
      expect(logicFunctions.OR('false', 'true')).toBe(true);
    });

    test('should return false if all values are false', () => {
      expect(logicFunctions.OR(false, false, false)).toBe(false);
      expect(logicFunctions.OR('false', 'false')).toBe(false);
    });
  });

  describe('NOT', () => {
    test('should return false for true values', () => {
      expect(logicFunctions.NOT(true)).toBe(false);
      expect(logicFunctions.NOT('true')).toBe(false);
    });

    test('should return true for false values', () => {
      expect(logicFunctions.NOT(false)).toBe(true);
      expect(logicFunctions.NOT('false')).toBe(true);
    });
  });

  describe('IFS', () => {
    test('should return the value of the first true condition', () => {
      expect(logicFunctions.IFS(false, 'A', true, 'B', true, 'C')).toBe('B');
    });

    test('should return the default value if no condition is true', () => {
      expect(logicFunctions.IFS(false, 'A', false, 'B', 'C')).toBe('C');
    });

    test('should return an empty string if no condition is true and no default is provided', () => {
      expect(logicFunctions.IFS(false, 'A', false, 'B')).toBe('');
    });
  });
});
