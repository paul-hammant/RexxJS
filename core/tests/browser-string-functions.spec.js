/**
 * Browser String Functions Tests
 * Tests for browser-compatible string functions that replace RPC mocks
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { Interpreter } = require('../src/interpreter');
const { MockKitchenService } = require('./mocks/kitchen-service');

describe('Browser String Functions', () => {
  let interpreter;
  let addressSender;
  let kitchenService;
  
  beforeEach(() => {
    kitchenService = new MockKitchenService();
    addressSender = kitchenService.createRpcClient();
    interpreter = new Interpreter(addressSender);
  });

  describe('WORD function', () => {
    test('should extract first word', async () => {
      const result = interpreter.executeBrowserStringFunction('WORD', ['hello world test', '1']);
      expect(result).toBe('hello');
    });

    test('should extract middle word', async () => {
      const result = interpreter.executeBrowserStringFunction('WORD', ['hello world test', '2']);
      expect(result).toBe('world');
    });

    test('should extract last word', async () => {
      const result = interpreter.executeBrowserStringFunction('WORD', ['hello world test', '3']);
      expect(result).toBe('test');
    });

    test('should return empty string for out of range index', async () => {
      const result = interpreter.executeBrowserStringFunction('WORD', ['hello world', '5']);
      expect(result).toBe('');
    });

    test('should handle empty string input', async () => {
      const result = interpreter.executeBrowserStringFunction('WORD', ['', '1']);
      expect(result).toBe('');
    });

    test('should handle extra whitespace', async () => {
      const result = interpreter.executeBrowserStringFunction('WORD', ['  hello   world  ', '2']);
      expect(result).toBe('world');
    });
  });

  describe('WORDS function', () => {
    test('should count words in string', async () => {
      const result = interpreter.executeBrowserStringFunction('WORDS', ['hello world test']);
      expect(result).toBe(3);
    });

    test('should handle empty string', async () => {
      const result = interpreter.executeBrowserStringFunction('WORDS', ['']);
      expect(result).toBe(0);
    });

    test('should handle extra whitespace', async () => {
      const result = interpreter.executeBrowserStringFunction('WORDS', ['  hello   world  ']);
      expect(result).toBe(2);
    });
  });

  describe('SUBWORD function', () => {
    test('should extract subword from position', async () => {
      const result = interpreter.executeBrowserStringFunction('SUBWORD', ['one two three four', '2', '2']);
      expect(result).toBe('two three');
    });

    test('should extract to end when no length specified', async () => {
      const result = interpreter.executeBrowserStringFunction('SUBWORD', ['one two three four', '3']);
      expect(result).toBe('three four');
    });

    test('should handle out of range start', async () => {
      const result = interpreter.executeBrowserStringFunction('SUBWORD', ['one two', '5', '1']);
      expect(result).toBe('');
    });
  });

  describe('WORDPOS function', () => {
    test('should find phrase position', async () => {
      const result = interpreter.executeBrowserStringFunction('WORDPOS', ['two three', 'one two three four']);
      expect(result).toBe(2);
    });

    test('should return 0 when phrase not found', async () => {
      const result = interpreter.executeBrowserStringFunction('WORDPOS', ['five six', 'one two three four']);
      expect(result).toBe(0);
    });

    test('should handle start position parameter', async () => {
      const result = interpreter.executeBrowserStringFunction('WORDPOS', ['two', 'one two three two', '3']);
      expect(result).toBe(4);
    });
  });

  describe('DELWORD function', () => {
    test('should delete single word', async () => {
      const result = interpreter.executeBrowserStringFunction('DELWORD', ['one two three', '2', '1']);
      expect(result).toBe('one three');
    });

    test('should delete multiple words', async () => {
      const result = interpreter.executeBrowserStringFunction('DELWORD', ['one two three four', '2', '2']);
      expect(result).toBe('one four');
    });

    test('should delete from position to end when no length', async () => {
      const result = interpreter.executeBrowserStringFunction('DELWORD', ['one two three four', '3']);
      expect(result).toBe('one two');
    });
  });

  describe('Integration with Rexx interpreter', () => {
    test('should work via direct function calls', async () => {
      // Set up a test variable
      interpreter.variables.set('text', 'hello world test');
      
      // Call functions directly to test integration
      const firstWord = await interpreter.executeFunctionCall({
        command: 'WORD', 
        params: { '1': 'hello world test', '2': '1' }
      });
      
      const wordCount = await interpreter.executeFunctionCall({
        command: 'WORDS', 
        params: { '1': 'hello world test' }
      });
      
      expect(firstWord).toBe('hello');
      expect(wordCount).toBe(3);
    });
  });
});