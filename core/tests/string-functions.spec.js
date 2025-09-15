/**
 * String Functions Tests
 * Dedicated tests for core string functions, particularly SUBSTR
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { stringFunctions } = require('../src/string-functions');

describe('String Functions', () => {
  describe('SUBSTR function', () => {
    test('should extract substring with start and length', () => {
      expect(stringFunctions.SUBSTR('Hello World', 1, 5)).toBe('Hello');
      expect(stringFunctions.SUBSTR('Hello World', 7, 5)).toBe('World');
      expect(stringFunctions.SUBSTR('Hello World', 3, 3)).toBe('llo');
    });

    test('should extract from start to end when length omitted', () => {
      expect(stringFunctions.SUBSTR('Hello World', 7)).toBe('World');
      expect(stringFunctions.SUBSTR('Hello World', 1)).toBe('Hello World');
      expect(stringFunctions.SUBSTR('Hello World', 3)).toBe('llo World');
    });

    test('should use 1-based indexing like standard REXX', () => {
      expect(stringFunctions.SUBSTR('ABCDEF', 1, 1)).toBe('A');
      expect(stringFunctions.SUBSTR('ABCDEF', 2, 1)).toBe('B');
      expect(stringFunctions.SUBSTR('ABCDEF', 6, 1)).toBe('F');
    });

    test('should handle start position beyond string length', () => {
      expect(stringFunctions.SUBSTR('Hello', 10, 3)).toBe('');
      expect(stringFunctions.SUBSTR('Hello', 6)).toBe('');
    });

    test('should handle length longer than remaining string', () => {
      expect(stringFunctions.SUBSTR('Hello', 3, 10)).toBe('llo');
      expect(stringFunctions.SUBSTR('Hello', 1, 10)).toBe('Hello');
    });

    test('should handle zero or negative start positions', () => {
      // REXX SUBSTR with start <= 0 should be treated as 1
      expect(stringFunctions.SUBSTR('Hello', 0, 3)).toBe('Hel');
      expect(stringFunctions.SUBSTR('Hello', -1, 3)).toBe('Hel');
    });

    test('should handle zero or negative lengths', () => {
      expect(stringFunctions.SUBSTR('Hello', 1, 0)).toBe('');
      expect(stringFunctions.SUBSTR('Hello', 1, -1)).toBe('');
    });

    test('should convert non-string input to string', () => {
      expect(stringFunctions.SUBSTR(12345, 2, 3)).toBe('234');
      expect(stringFunctions.SUBSTR(null, 1, 3)).toBe('nul');
      expect(stringFunctions.SUBSTR(undefined, 1, 5)).toBe('undef');
    });

    test('should handle empty string input', () => {
      expect(stringFunctions.SUBSTR('', 1, 5)).toBe('');
      expect(stringFunctions.SUBSTR('', 1)).toBe('');
    });

    test('should handle string parameters that need parsing', () => {
      expect(stringFunctions.SUBSTR('Hello World', '3', '3')).toBe('llo');
      expect(stringFunctions.SUBSTR('Hello World', '7')).toBe('World');
    });

    test('should handle non-numeric start and length gracefully', () => {
      // Should default to 1 for invalid start
      expect(stringFunctions.SUBSTR('Hello', 'abc', 3)).toBe('Hel');
      expect(stringFunctions.SUBSTR('Hello', null, 3)).toBe('Hel');
      
      // Should default to 0 for invalid length
      expect(stringFunctions.SUBSTR('Hello', 1, 'xyz')).toBe('');
      expect(stringFunctions.SUBSTR('Hello', 1, null)).toBe('');
    });
  });

  describe('SUBSTRING function (JavaScript-style)', () => {
    test('should extract substring with 0-based indexing', () => {
      expect(stringFunctions.SUBSTRING('Hello World', 0, 5)).toBe('Hello');
      expect(stringFunctions.SUBSTRING('Hello World', 6, 5)).toBe('World');
    });

    test('should handle start without length', () => {
      expect(stringFunctions.SUBSTRING('Hello World', 6)).toBe('World');
      expect(stringFunctions.SUBSTRING('Hello World', 0)).toBe('Hello World');
    });

    test('should handle errors gracefully', () => {
      expect(stringFunctions.SUBSTRING(null, 0, 3)).toBe('nul');
      expect(stringFunctions.SUBSTRING(undefined, 0)).toBe('undefined');
    });
  });

  describe('Other core string functions', () => {
    test('LENGTH function', () => {
      expect(stringFunctions.LENGTH('Hello')).toBe(5);
      expect(stringFunctions.LENGTH('')).toBe(0);
      expect(stringFunctions.LENGTH('Hello World')).toBe(11);
    });

    test('UPPER function', () => {
      expect(stringFunctions.UPPER('hello')).toBe('HELLO');
      expect(stringFunctions.UPPER('Hello World')).toBe('HELLO WORLD');
    });

    test('LOWER function', () => {
      expect(stringFunctions.LOWER('HELLO')).toBe('hello');
      expect(stringFunctions.LOWER('Hello World')).toBe('hello world');
    });

    test('TRIM function', () => {
      expect(stringFunctions.TRIM('  hello  ')).toBe('hello');
      expect(stringFunctions.TRIM('hello')).toBe('hello');
    });
  });
});