/**
 * ARRAY_FILTER Pure-REXX Callback Tests
 * Tests for the new pure-REXX callback functionality alongside existing JS callbacks
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { Interpreter } = require('../src/interpreter');
const { MockKitchenService } = require('./mocks/kitchen-service');

describe('ARRAY_FILTER Pure-REXX Callbacks', () => {
  let interpreter;
  let addressSender;
  let kitchenService;
  
  beforeEach(() => {
    kitchenService = new MockKitchenService();
    addressSender = kitchenService.createRpcClient();
    interpreter = new Interpreter(addressSender);
  });

  describe('Pure-REXX Callback Syntax', () => {
    test('should handle REXX pos() function callbacks', async () => {
      const script = `
        LET words = ["test", "hello", "world", "javascript"]
        checkString = 'pos(item, "a") > 0'
        LET result = ARRAY_FILTER array=words filterExpression=checkString
      `;
      
      const commands = require('../src/parser').parse(script);
      await interpreter.run(commands);
      
      const result = interpreter.getVariable('result');
      expect(result).toEqual(['javascript']); // Only "javascript" contains "a"
    });

    test('should handle REXX length() function callbacks', async () => {
      const script = `
        LET words = ["hi", "hello", "world", "javascript"]
        predicate = 'length(item) > 5'
        LET result = ARRAY_FILTER array=words filterExpression=predicate
      `;
      
      const commands = require('../src/parser').parse(script);
      await interpreter.run(commands);
      
      const result = interpreter.getVariable('result');
      expect(result).toEqual(['javascript']); // Only "javascript" has length > 5
    });

    test('should handle complex REXX expressions with logical operators', async () => {
      const script = `
        LET words = ["test", "hello", "world", "javascript"]
        complexCheck = 'pos(item, "a") > 0 & length(item) > 4'
        LET result = ARRAY_FILTER array=words filterExpression=complexCheck
      `;
      
      const commands = require('../src/parser').parse(script);
      await interpreter.run(commands);
      
      const result = interpreter.getVariable('result');
      expect(result).toEqual(['javascript']); // Has "a" AND length > 4
    });

    test('should handle REXX upper/lower function callbacks', async () => {
      const script = `
        LET words = ["Test", "HELLO", "world", "JavaScript"]
        upperCheck = 'upper(item) = item'
        LET result = ARRAY_FILTER array=words filterExpression=upperCheck
      `;
      
      const commands = require('../src/parser').parse(script);
      await interpreter.run(commands);
      
      const result = interpreter.getVariable('result');
      expect(result).toEqual(['HELLO']); // Only "HELLO" is already uppercase
    });

    test('should handle numeric comparisons with REXX functions', async () => {
      const script = `
        LET numbers = [1, 12, 23, 4, 56]
        numCheck = 'length(item) > 1'
        LET result = ARRAY_FILTER array=numbers filterExpression=numCheck
      `;
      
      const commands = require('../src/parser').parse(script);
      await interpreter.run(commands);
      
      const result = interpreter.getVariable('result');
      expect(result).toEqual([12, 23, 56]); // Numbers with more than 1 digit
    });
  });

  describe('Coexistence with JavaScript Callbacks', () => {
    test('should distinguish between REXX and JS callback syntax', async () => {
      const script = `
        LET words = ["test", "hello", "world", "javascript"]
        
        -- Pure REXX callback
        rexxCheck = 'pos(item, "a") > 0'
        LET rexxResult = ARRAY_FILTER array=words filterExpression=rexxCheck
        
        -- JavaScript callback  
        jsCheck = 'str => str.includes("a")'
        LET jsResult = ARRAY_FILTER array=words filterExpression=jsCheck
      `;
      
      const commands = require('../src/parser').parse(script);
      await interpreter.run(commands);
      
      const rexxResult = interpreter.getVariable('rexxResult');
      const jsResult = interpreter.getVariable('jsResult');
      
      // Both should find "javascript"
      expect(rexxResult).toEqual(['javascript']);
      expect(jsResult).toEqual(['javascript']);
    });

    test('should handle both types in same script correctly', async () => {
      const script = `
        LET numbers = [1, 2, 3, 4, 5, 6]
        
        -- REXX style: length-based filtering
        rexxFilter = 'length(item) = 1'
        LET singleDigits = ARRAY_FILTER array=numbers filterExpression=rexxFilter
        
        -- JS style: value-based filtering  
        jsFilter = 'x => x > 3'
        LET bigNumbers = ARRAY_FILTER array=numbers filterExpression=jsFilter
      `;
      
      const commands = require('../src/parser').parse(script);
      await interpreter.run(commands);
      
      const singleDigits = interpreter.getVariable('singleDigits');
      const bigNumbers = interpreter.getVariable('bigNumbers');
      
      expect(singleDigits).toEqual([1, 2, 3, 4, 5, 6]); // All single digit
      expect(bigNumbers).toEqual([4, 5, 6]); // Greater than 3
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid REXX expressions gracefully', async () => {
      const script = `
        LET words = ["test", "hello"]
        badFilter = 'invalid_function(item) > 0'
        LET result = ARRAY_FILTER array=words filterExpression=badFilter
      `;
      
      const commands = require('../src/parser').parse(script);
      await interpreter.run(commands);
      
      const result = interpreter.getVariable('result');
      expect(result).toEqual([]); // Should return empty array on errors
    });

    test('should preserve item variable scope', async () => {
      const script = `
        LET item = "original"
        LET words = ["test", "hello"]
        filter = 'pos(item, "e") > 0'
        LET result = ARRAY_FILTER array=words filterExpression=filter
        LET afterItem = item
      `;
      
      const commands = require('../src/parser').parse(script);
      await interpreter.run(commands);
      
      const result = interpreter.getVariable('result');
      const afterItem = interpreter.getVariable('afterItem');
      
      expect(result).toEqual(['test', 'hello']); // Both contain "e"
      expect(afterItem).toBe('original'); // Original item value preserved
    });
  });
});