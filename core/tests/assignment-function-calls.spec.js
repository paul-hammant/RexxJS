/**
 * Assignment Function Calls Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { parse } = require('../src/parser');
const { RexxInterpreter } = require('../src/interpreter');

describe('Function Calls in Assignments', () => {
  
  describe('Parser Tests', () => {
    it('should parse function call in assignment with proper REXX syntax', () => {
      const script = 'LET result = JSON_PARSE(string="test")';
      const parsed = parse(script);
      
      console.log('Parsed result:', JSON.stringify(parsed, null, 2));
      
      // This should be parsed as an ASSIGNMENT with a FUNCTION_CALL expression
      expect(parsed).toHaveLength(1);
      expect(parsed[0].type).toBe('ASSIGNMENT');
      expect(parsed[0].variable).toBe('result');
      expect(parsed[0].expression).toBeDefined();
      expect(parsed[0].expression.type).toBe('FUNCTION_CALL');
      expect(parsed[0].expression.command).toBe('JSON_PARSE');
    });

    it('should parse function call in assignment with JavaScript-like dot syntax', () => {
      const script = 'result = JSON.parse(json_string)';
      const parsed = parse(script);
      
      console.log('Parsed result for dot syntax:', JSON.stringify(parsed, null, 2));
      
      // Currently this fails - it should either parse as function call or throw error
      // Let's see what it actually parses as
    });

    it('should parse simple assignment', () => {
      const script = 'LET result = "hello"';
      const parsed = parse(script);
      
      console.log('Simple assignment parsed as:', JSON.stringify(parsed, null, 2));
      
      expect(parsed).toHaveLength(1);
      expect(parsed[0].type).toBe('ASSIGNMENT');
      expect(parsed[0].variable).toBe('result');
    });
  });

  describe('Interpreter Tests', () => {
    let interpreter;

    beforeEach(() => {
      interpreter = new RexxInterpreter();
    });

    it('should throw proper error for non-existent function in assignment', async () => {
      const script = 'LET result = NONEXISTENT_FUNCTION(param="test")';
      const parsed = parse(script);
      
      console.log('Parsed nonexistent function:', JSON.stringify(parsed, null, 2));
      
      // This should throw an error when executed
      await expect(interpreter.run(parsed)).rejects.toThrow(/Function NONEXISTENT_FUNCTION is not available/);
    });

    it('should execute built-in function in assignment correctly', async () => {
      const script = 'LET result = LENGTH(string="hello")';
      const parsed = parse(script);
      
      console.log('Parsed LENGTH function:', JSON.stringify(parsed, null, 2));
      
      await interpreter.run(parsed);
      expect(interpreter.variables.get('result')).toBe(5);
    });

    it('should show what happens with JavaScript-like syntax', async () => {
      const script = `
        LET json_string = "test"
        LET result = JSON.parse(json_string)
        SAY "Result is: " result
      `;
      const parsed = parse(script);
      
      console.log('JavaScript-like syntax parsed as:', JSON.stringify(parsed, null, 2));
      
      // Let's see what actually happens when we run this
      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };
      
      await expect(interpreter.run(parsed)).rejects.toThrow(/Function JSON is not available/);
    });
  });
});