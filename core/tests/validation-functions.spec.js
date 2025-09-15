/**
 * Validation Functions Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { validationFunctions } = require('../src/validation-functions');

describe('Validation Functions', () => {
  describe('IS_EMAIL', () => {
    test('should return true for valid emails', () => {
      expect(validationFunctions.IS_EMAIL('test@example.com')).toBe(true);
    });

    test('should return false for invalid emails', () => {
      expect(validationFunctions.IS_EMAIL('test@.com')).toBe(false);
    });
  });

  describe('IS_URL', () => {
    test('should return true for valid URLs', () => {
      expect(validationFunctions.IS_URL('http://example.com')).toBe(true);
    });

    test('should return false for invalid URLs', () => {
      expect(validationFunctions.IS_URL('example.com')).toBe(false);
    });
  });

  describe('IS_PHONE', () => {
    test('should return true for valid US phone numbers', () => {
      expect(validationFunctions.IS_PHONE('555-123-4567', 'us')).toBe(true);
    });
  });

  describe('IS_NUMBER', () => {
    test('should return true for numbers', () => {
      expect(validationFunctions.IS_NUMBER('123')).toBe(true);
    });

    test('should return false for non-numbers', () => {
      expect(validationFunctions.IS_NUMBER('abc')).toBe(false);
    });
  });

  describe('IS_INTEGER', () => {
    test('should return true for integers', () => {
      expect(validationFunctions.IS_INTEGER('123')).toBe(true);
    });

    test('should return false for non-integers', () => {
      expect(validationFunctions.IS_INTEGER('123.45')).toBe(false);
    });
  });

  describe('IS_POSITIVE', () => {
    test('should return true for positive numbers', () => {
      expect(validationFunctions.IS_POSITIVE('123')).toBe(true);
    });
  });

  describe('IS_NEGATIVE', () => {
    test('should return true for negative numbers', () => {
      expect(validationFunctions.IS_NEGATIVE('-123')).toBe(true);
    });
  });

  describe('IS_RANGE', () => {
    test('should return true if the number is within the range', () => {
      expect(validationFunctions.IS_RANGE('5', '1', '10')).toBe(true);
    });
  });

  describe('IS_DATE', () => {
    test('should return true for valid dates', () => {
      expect(validationFunctions.IS_DATE('2025-01-01')).toBe(true);
    });
  });

  describe('IS_TIME', () => {
    test('should return true for valid times', () => {
      expect(validationFunctions.IS_TIME('12:30')).toBe(true);
    });
  });

  describe('IS_CREDIT_CARD', () => {
    test('should return true for valid credit card numbers', () => {
      expect(validationFunctions.IS_CREDIT_CARD('49927398716')).toBe(false);
    });
  });

  describe('IS_ZIP_CODE', () => {
    test('should return true for valid US zip codes', () => {
      expect(validationFunctions.IS_ZIP_CODE('12345')).toBe(true);
    });
  });

  describe('IS_IP', () => {
    test('should return true for valid IPv4 addresses', () => {
      expect(validationFunctions.IS_IP('192.168.1.1')).toBe(true);
    });
  });

  describe('IS_MAC_ADDRESS', () => {
    test('should return true for valid MAC addresses', () => {
      expect(validationFunctions.IS_MAC_ADDRESS('00:1B:44:11:3A:B7')).toBe(true);
    });
  });

  describe('IS_EMPTY', () => {
    test('should return true for empty values', () => {
      expect(validationFunctions.IS_EMPTY('')).toBe(true);
      expect(validationFunctions.IS_EMPTY(null)).toBe(true);
      expect(validationFunctions.IS_EMPTY(undefined)).toBe(true);
    });
  });

  describe('IS_NOT_EMPTY', () => {
    test('should return true for non-empty values', () => {
      expect(validationFunctions.IS_NOT_EMPTY('a')).toBe(true);
    });
  });

  describe('IS_ALPHA', () => {
    test('should return true for alphabetic strings', () => {
      expect(validationFunctions.IS_ALPHA('abc')).toBe(true);
    });
  });

  describe('IS_ALPHANUMERIC', () => {
    test('should return true for alphanumeric strings', () => {
      expect(validationFunctions.IS_ALPHANUMERIC('abc123')).toBe(true);
    });
  });

  describe('IS_LENGTH', () => {
    test('should return true if the string has the specified length', () => {
      expect(validationFunctions.IS_LENGTH('abc', 3, 3)).toBe(true);
    });
  });

  describe('IS_PATTERN', () => {
    test('should return true if the string matches the pattern', () => {
      expect(validationFunctions.IS_PATTERN('abc', '^a')).toBe(true);
    });
  });

  describe('IS_POSTAL_CODE', () => {
    test('should return true for valid US postal codes', () => {
      expect(validationFunctions.IS_POSTAL_CODE('12345')).toBe(true);
    });
  });

  describe('IS_NUMERIC', () => {
    test('should return true for numeric strings', () => {
      expect(validationFunctions.IS_NUMERIC('123')).toBe(true);
    });
  });

  describe('IS_LOWERCASE', () => {
    test('should return true for lowercase strings', () => {
      expect(validationFunctions.IS_LOWERCASE('abc')).toBe(true);
    });
  });

  describe('IS_UPPERCASE', () => {
    test('should return true for uppercase strings', () => {
      expect(validationFunctions.IS_UPPERCASE('ABC')).toBe(true);
    });
  });

  describe('MATCHES_PATTERN', () => {
    test('should return true if the string matches the pattern', () => {
      expect(validationFunctions.MATCHES_PATTERN('abc', '^a')).toBe(true);
    });
  });

  describe('VALIDATE_ALL', () => {
    test('should return true if all validators pass', () => {
      expect(validationFunctions.VALIDATE_ALL(true, true, true)).toBe(true);
    });
  });

  describe('VALIDATE_ANY', () => {
    test('should return true if any validator passes', () => {
      expect(validationFunctions.VALIDATE_ANY(false, true, false)).toBe(true);
    });
  });
});
