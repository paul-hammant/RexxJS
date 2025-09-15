/**
 * Cryptography Functions Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { cryptoFunctions } = require('../src/cryptography-functions');

describe('Cryptography Functions', () => {

  describe('RANDOM_STRING', () => {
    test('should generate random string of specified length', () => {
      const result = cryptoFunctions.RANDOM_STRING(10);
      expect(typeof result).toBe('string');
      expect(result.length).toBe(10);
    });

    test('should generate alphanumeric string by default', () => {
      const result = cryptoFunctions.RANDOM_STRING(20);
      expect(result).toMatch(/^[a-zA-Z0-9]+$/);
    });

    test('should generate alphabetic string when specified', () => {
      const result = cryptoFunctions.RANDOM_STRING(10, 'alphabetic');
      expect(result).toMatch(/^[a-zA-Z]+$/);
    });

    test('should generate numeric string when specified', () => {
      const result = cryptoFunctions.RANDOM_STRING(10, 'numeric');
      expect(result).toMatch(/^[0-9]+$/);
    });

    test('should generate hex string when specified', () => {
      const result = cryptoFunctions.RANDOM_STRING(10, 'hex');
      expect(result).toMatch(/^[0-9a-f]+$/);
    });

    test('should use default length of 16', () => {
      const result = cryptoFunctions.RANDOM_STRING();
      expect(result.length).toBe(16);
    });
  });

  describe('JWT_DECODE', () => {
    test('should decode valid JWT token', () => {
      // Sample JWT token (header.payload.signature)
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.signature';
      const result = cryptoFunctions.JWT_DECODE(token);
      
      expect(result.header).toBeDefined();
      expect(result.payload).toBeDefined();
      expect(result.payload.name).toBe('John Doe');
      expect(result.payload.sub).toBe('1234567890');
    });

    test('should handle invalid JWT token', () => {
      const result = cryptoFunctions.JWT_DECODE('invalid.token');
      expect(result.error).toBeDefined();
    });

    test('should handle malformed JWT token', () => {
      const result = cryptoFunctions.JWT_DECODE('not-a-jwt');
      expect(result.error).toBeDefined();
    });
  });

  describe('PASSWORD_HASH', () => {
    test('should hash password with SHA256 by default', async () => {
      const result = await cryptoFunctions.PASSWORD_HASH('testpassword');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      
      // Hash should be different each time due to salt
      const result2 = await cryptoFunctions.PASSWORD_HASH('testpassword');
      expect(result).not.toBe(result2);
      expect(result).toContain('sha256$');
    });

    test('should hash password with specified algorithm', async () => {
      const sha256 = await cryptoFunctions.PASSWORD_HASH('test', 'SHA256');
      const sha1 = await cryptoFunctions.PASSWORD_HASH('test', 'SHA1');
      
      expect(sha256).not.toBe(sha1);
      expect(typeof sha256).toBe('string');
      expect(typeof sha1).toBe('string');
    });
  });

  describe('PASSWORD_VERIFY', () => {
    test('should verify correct password', async () => {
      const password = 'testpassword';
      const hash = await cryptoFunctions.PASSWORD_HASH(password);
      const result = await cryptoFunctions.PASSWORD_VERIFY(password, hash);
      
      expect(result).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const hash = await cryptoFunctions.PASSWORD_HASH('correct');
      const result = await cryptoFunctions.PASSWORD_VERIFY('wrong', hash);
      
      expect(result).toBe(false);
    });

    test('should handle empty password', async () => {
      const hash = await cryptoFunctions.PASSWORD_HASH('');
      const result = await cryptoFunctions.PASSWORD_VERIFY('', hash);
      
      expect(result).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    test('password hash and verify workflow', async () => {
      const passwords = ['simple', 'complex!@#$', '12345', 'émojis🔥'];
      
      for (const pwd of passwords) {
        const hash = await cryptoFunctions.PASSWORD_HASH(pwd);
        const valid = await cryptoFunctions.PASSWORD_VERIFY(pwd, hash);
        const invalid = await cryptoFunctions.PASSWORD_VERIFY(pwd + 'x', hash);
        
        expect(valid).toBe(true);
        expect(invalid).toBe(false);
      }
    });

    test('random strings should be unique', () => {
      const strings = new Set();
      for (let i = 0; i < 100; i++) {
        strings.add(cryptoFunctions.RANDOM_STRING(20));
      }
      
      // Should generate unique strings (extremely unlikely to have duplicates)
      expect(strings.size).toBe(100);
    });
  });
});