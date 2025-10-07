/**
 * Cryptography Functions Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { cryptoFunctions } = require('../src/cryptography-functions');

describe('Cryptography Functions', () => {

  describe('Hash Functions', () => {
    const testString = 'Hello, World!';

    describe('HASH_SHA256', () => {
      test('should produce consistent SHA-256 hash', async () => {
        const hash1 = await cryptoFunctions.HASH_SHA256(testString);
        const hash2 = await cryptoFunctions.HASH_SHA256(testString);
        expect(hash1).toBe(hash2);
        expect(hash1.length).toBe(64); // SHA-256 produces 64 hex characters
      });

      test('should produce different hashes for different inputs', async () => {
        const hash1 = await cryptoFunctions.HASH_SHA256('input1');
        const hash2 = await cryptoFunctions.HASH_SHA256('input2');
        expect(hash1).not.toBe(hash2);
      });
    });

    describe('HASH_SHA1', () => {
      test('should produce consistent SHA-1 hash', async () => {
        const hash1 = await cryptoFunctions.HASH_SHA1(testString);
        const hash2 = await cryptoFunctions.HASH_SHA1(testString);
        expect(hash1).toBe(hash2);
        expect(hash1.length).toBe(40); // SHA-1 produces 40 hex characters
      });
    });

    describe('HASH_SHA384', () => {
      test('should produce consistent SHA-384 hash', async () => {
        const hash1 = await cryptoFunctions.HASH_SHA384(testString);
        const hash2 = await cryptoFunctions.HASH_SHA384(testString);
        expect(hash1).toBe(hash2);
        expect(hash1.length).toBe(96); // SHA-384 produces 96 hex characters
      });

      test('should produce different hashes for different inputs', async () => {
        const hash1 = await cryptoFunctions.HASH_SHA384('input1');
        const hash2 = await cryptoFunctions.HASH_SHA384('input2');
        expect(hash1).not.toBe(hash2);
      });
    });

    describe('HASH_SHA512', () => {
      test('should produce consistent SHA-512 hash', async () => {
        const hash1 = await cryptoFunctions.HASH_SHA512(testString);
        const hash2 = await cryptoFunctions.HASH_SHA512(testString);
        expect(hash1).toBe(hash2);
        expect(hash1.length).toBe(128); // SHA-512 produces 128 hex characters
      });

      test('should produce different hashes for different inputs', async () => {
        const hash1 = await cryptoFunctions.HASH_SHA512('input1');
        const hash2 = await cryptoFunctions.HASH_SHA512('input2');
        expect(hash1).not.toBe(hash2);
      });
    });

    describe('HASH_MD5', () => {
      test('should produce consistent MD5 hash', () => {
        const hash1 = cryptoFunctions.HASH_MD5(testString);
        const hash2 = cryptoFunctions.HASH_MD5(testString);
        expect(hash1).toBe(hash2);
        expect(hash1.length).toBe(32); // MD5 produces 32 hex characters
      });

      test('should produce different hashes for different inputs', () => {
        const hash1 = cryptoFunctions.HASH_MD5('input1');
        const hash2 = cryptoFunctions.HASH_MD5('input2');
        expect(hash1).not.toBe(hash2);
      });
    });
  });

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