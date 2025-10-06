/**
 * Comprehensive PARSE ARG Tests
 * 
 * Tests all variations and permutations of PARSE ARG functionality
 * to ensure robust command line argument parsing in RexxJS
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { RexxInterpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('PARSE ARG Comprehensive Tests', () => {
  let interpreter;
  let mockAddressSender;

  beforeEach(() => {
    mockAddressSender = {
      send: jest.fn().mockResolvedValue({}),
      outputs: []
    };
    interpreter = new RexxInterpreter(mockAddressSender);
  });

  describe('Basic PARSE ARG functionality', () => {
    it('should parse single argument', async () => {
      // Set up command line arguments
      interpreter.argv = ['hello'];

      const script = `
        PARSE ARG first_arg
        SAY "First argument: " || first_arg
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('first_arg')).toBe('hello');
    });

    it('should parse multiple arguments', async () => {
      interpreter.argv = ['arg1', 'arg2', 'arg3'];

      const script = `
        PARSE ARG first second third
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('first')).toBe('arg1');
      expect(interpreter.getVariable('second')).toBe('arg2');
      expect(interpreter.getVariable('third')).toBe('arg3');
    });

    it('should handle empty arguments', async () => {
      interpreter.argv = [];

      const script = `
        PARSE ARG arg1 arg2 arg3
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('arg1')).toBe('');
      expect(interpreter.getVariable('arg2')).toBe('');
      expect(interpreter.getVariable('arg3')).toBe('');
    });

    it('should handle more variables than arguments', async () => {
      interpreter.argv = ['first', 'second'];

      const script = `
        PARSE ARG a b c d e
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('a')).toBe('first');
      expect(interpreter.getVariable('b')).toBe('second');
      expect(interpreter.getVariable('c')).toBe('');
      expect(interpreter.getVariable('d')).toBe('');
      expect(interpreter.getVariable('e')).toBe('');
    });

    it('should handle fewer variables than arguments', async () => {
      interpreter.argv = ['arg1', 'arg2', 'arg3', 'arg4', 'arg5'];

      const script = `
        PARSE ARG first second
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('first')).toBe('arg1');
      expect(interpreter.getVariable('second')).toBe('arg2');
    });
  });

  describe('PARSE ARG with rest variable (dot notation)', () => {
    it('should capture remaining arguments with dot', async () => {
      interpreter.argv = ['first', 'second', 'third', 'fourth'];

      const script = `
        PARSE ARG first_arg rest_args .
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('first_arg')).toBe('first');
      expect(interpreter.getVariable('rest_args')).toBe('second');
    });
  });

  describe('PARSE ARG in subroutines', () => {
    it('should work correctly in CALL subroutines', async () => {
      interpreter.argv = ['main_arg1', 'main_arg2'];

      const script = `
        PARSE ARG main_first main_second
        CALL TestSub "sub_arg1" "sub_arg2"

        TestSub:
          PARSE ARG sub_first sub_second
          SAY "Sub args: " || sub_first || " " || sub_second
        RETURN
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      // Main args should be preserved
      expect(interpreter.getVariable('main_first')).toBe('main_arg1');
      expect(interpreter.getVariable('main_second')).toBe('main_arg2');

      // Sub args should be set from CALL parameters
      expect(interpreter.getVariable('sub_first')).toBe('sub_arg1');
      expect(interpreter.getVariable('sub_second')).toBe('sub_arg2');
    });
  });

  describe('PARSE ARG with special characters and spaces', () => {
    it('should handle arguments with spaces', async () => {
      interpreter.argv = ['hello world', 'test phrase'];

      const script = `
        PARSE ARG phrase1 phrase2
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('phrase1')).toBe('hello world');
      expect(interpreter.getVariable('phrase2')).toBe('test phrase');
    });

    it('should handle arguments with special characters', async () => {
      interpreter.argv = ['test@example.com', '$100.50', 'path/to/file'];

      const script = `
        PARSE ARG email amount path
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('email')).toBe('test@example.com');
      expect(interpreter.getVariable('amount')).toBe('$100.50');
      expect(interpreter.getVariable('path')).toBe('path/to/file');
    });

    it('should handle empty string arguments', async () => {
      interpreter.argv = ['', 'middle', ''];

      const script = `
        PARSE ARG empty1 middle empty2
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('empty1')).toBe('');
      expect(interpreter.getVariable('middle')).toBe('middle');
      expect(interpreter.getVariable('empty2')).toBe('');
    });
  });

  describe('PARSE ARG with numeric arguments', () => {
    it('should handle numeric arguments as strings', async () => {
      interpreter.argv = ['42', '3.14159', '-10', '0'];

      const script = `
        PARSE ARG int_arg float_arg neg_arg zero_arg
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('int_arg')).toBe('42');
      expect(interpreter.getVariable('float_arg')).toBe('3.14159');
      expect(interpreter.getVariable('neg_arg')).toBe('-10');
      expect(interpreter.getVariable('zero_arg')).toBe('0');
    });

    it('should allow numeric arguments to be used in arithmetic', async () => {
      interpreter.argv = ['10', '5'];

      const script = `
        PARSE ARG num1 num2
        LET sum = num1 + num2
        LET product = num1 * num2
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('sum')).toBe(15);
      expect(interpreter.getVariable('product')).toBe(50);
    });
  });

  describe('PARSE ARG edge cases', () => {
    it('should handle single character arguments', async () => {
      interpreter.argv = ['a', 'b', 'c', 'd', 'e'];

      const script = `
        PARSE ARG a b c d e
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('a')).toBe('a');
      expect(interpreter.getVariable('b')).toBe('b');
      expect(interpreter.getVariable('c')).toBe('c');
      expect(interpreter.getVariable('d')).toBe('d');
      expect(interpreter.getVariable('e')).toBe('e');
    });

    it('should handle very long arguments', async () => {
      const longArg = 'a'.repeat(1000);
      interpreter.argv = [longArg];

      const script = `
        PARSE ARG long_argument
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('long_argument')).toBe(longArg);
      expect(interpreter.getVariable('long_argument').length).toBe(1000);
    });

    it('should handle arguments with quotes', async () => {
      interpreter.argv = ['"quoted"', "'single'", 'mixed"quote\'test'];

      const script = `
        PARSE ARG double_quoted single_quoted mixed_quotes
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('double_quoted')).toBe('"quoted"');
      expect(interpreter.getVariable('single_quoted')).toBe("'single'");
      expect(interpreter.getVariable('mixed_quotes')).toBe('mixed"quote\'test');
    });
  });

  describe('PARSE ARG with conditional logic', () => {
    it('should work in IF statements', async () => {
      interpreter.argv = ['test'];

      const script = `
        PARSE ARG mode
        IF mode = "test" THEN
          LET result = "test_mode"
        ELSE
          LET result = "other_mode"
        ENDIF
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('result')).toBe('test_mode');
    });

    it('should work with LENGTH function', async () => {
      interpreter.argv = ['hello'];

      const script = `
        PARSE ARG input
        IF LENGTH(input) > 0 THEN
          LET has_input = "yes"
        ELSE
          LET has_input = "no"
        ENDIF
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('has_input')).toBe('yes');
    });
  });

  describe('PARSE ARG integration with string operations', () => {
    it('should work with string concatenation', async () => {
      interpreter.argv = ['Hello', 'World'];

      const script = `
        PARSE ARG greeting target
        LET message = greeting || " " || target || "!"
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('message')).toBe('Hello World!');
    });

    it('should work with string functions', async () => {
      interpreter.argv = ['hello world'];

      const script = `
        PARSE ARG input
        LET upper_input = UPPER(input)
        LET input_length = LENGTH(input)
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('upper_input')).toBe('HELLO WORLD');
      expect(interpreter.getVariable('input_length')).toBe(11);
    });
  });
});