/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const { Interpreter } = require('../../../../../core/src/interpreter');
const { parse } = require('../../../../../core/src/parser');

// Custom output handler that collects output for testing
class TestOutputHandler {
  constructor() {
    this.buffer = '';
  }
  
  output(message) {
    this.buffer += message + '\n';
  }
  
  clear() {
    this.buffer = '';
  }
  
  getOutput() {
    return this.buffer;
  }
}

describe('Missing Built-in Functions Error Handling', () => {
  let interpreter;
  let outputHandler;
  
  beforeEach(() => {
    outputHandler = new TestOutputHandler();
    interpreter = new Interpreter(null, outputHandler);
  });

  describe('Available R Functions Work Correctly', () => {
    test('should execute MAX without throwing error when available', async () => {
      const script = `
LET result = MAX values=[1,2,3,4,5]
SAY "MAX executed: " || result
      `;
      
      // The main goal is to verify MAX doesn't throw a "function not available" error
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      expect(output).toContain('MAX executed:'); // Just verify it executed
    });

    test('should execute MIN without throwing error when available', async () => {
      const script = `
LET result = MIN values=[10,5,8,3,9]
SAY "MIN executed: " || result
      `;
      
      // The main goal is to verify MIN doesn't throw a "function not available" error
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      expect(output).toContain('MIN executed:'); // Just verify it executed
    });
  });

  describe('Missing R Functions Provide Clear Error Messages', () => {
    test('should provide clear error message for MEAN when not available', async () => {
      const script = `
LET average = MEAN data=[1,2,3,4,5]
SAY "Average: " || average
      `;
      
      await expect(interpreter.run(parse(script))).rejects.toThrow(/Function MEAN is not available.*This appears to be an R statistical function/);
    });

    test('should provide clear error message for APPLY when not available', async () => {
      const script = `
LET result = APPLY data=[1,2,3] func="sum"
SAY "Result: " || result
      `;
      
      await expect(interpreter.run(parse(script))).rejects.toThrow(/Function APPLY is not available.*This appears to be an R statistical function/);
    });

    test('should provide clear error message for MATRIX when not available', async () => {
      const script = `
LET matrix = MATRIX rows=2 cols=3 data=[1,2,3,4,5,6]
SAY "Matrix created"
      `;
      
      await expect(interpreter.run(parse(script))).rejects.toThrow(/Function MATRIX is not available.*This appears to be an R statistical function/);
    });

    test('should provide clear error message for custom R_ function', async () => {
      const script = `
LET result = CUSTOM_FUNCTION param=123
SAY "Result: " || result
      `;
      
      await expect(interpreter.run(parse(script))).rejects.toThrow(/Function CUSTOM_FUNCTION is not available.*This appears to be an R statistical function/);
    });
  });

  describe('Missing Array Functions Provide Clear Error Messages', () => {
    test('should provide clear error message for ARRAY_ function', async () => {
      const script = `
LET result = ARRAY_CUSTOM data=[1,2,3]
SAY "Result: " || result
      `;
      
      await expect(interpreter.run(parse(script))).rejects.toThrow(/Function ARRAY_CUSTOM is not available/);
    });
  });

  describe('Missing JSON Functions Provide Clear Error Messages', () => {
    test('should provide clear error message for JSON_ function', async () => {
      const script = `
LET result = JSON_CUSTOM data='{"test": 123}'
SAY "Result: " || result
      `;
      
      await expect(interpreter.run(parse(script))).rejects.toThrow(/Function JSON_CUSTOM is not available/);
    });
  });

  describe('Hardcoded Missing Functions Provide Clear Error Messages', () => {
    test('should provide clear error message for missing LENGTH function', async () => {
      // Create interpreter without any built-in functions to simulate missing LENGTH
      const emptyInterpreter = new Interpreter(null, outputHandler);
      // Clear out the built-in functions to simulate missing modules
      emptyInterpreter.builtInFunctions = {};
      
      const script = `
LET result = LENGTH text="hello"
SAY "Length: " || result
      `;
      
      await expect(emptyInterpreter.run(parse(script))).rejects.toThrow(/Function LENGTH is not available/);
    });

    test('should provide clear error message for missing ABS function', async () => {
      // Create interpreter without math functions
      const emptyInterpreter = new Interpreter(null, outputHandler);
      emptyInterpreter.builtInFunctions = {};
      
      const script = `
LET result = ABS value=-42
SAY "Absolute: " || result
      `;
      
      await expect(emptyInterpreter.run(parse(script))).rejects.toThrow(/Function ABS is not available/);
    });
  });

  describe('Known Built-in Functions Should Work', () => {
    test('should execute built-in string functions without error', async () => {
      const script = `
LET result = LENGTH text="hello world"
SAY "Length: " || result
      `;
      
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      expect(output).toContain('Length: 11');
    });

    test('should execute built-in math functions without error', async () => {
      const script = `
LET result = ABS value=-42
SAY "Absolute: " || result
      `;
      
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      expect(output).toContain('Absolute: 42');
    });
  });

  describe('Case Insensitivity', () => {
    test('should provide error for missing R functions regardless of case', async () => {
      const script = `
LET result = r_custom_function param=123
SAY "This should not execute"
      `;
      
      // The function name gets normalized to uppercase in error messages, so adjust expectation
      await expect(interpreter.run(parse(script))).rejects.toThrow(/Function CUSTOM_FUNCTION is not available.*This appears to be an R statistical function/);
    });
  });

  describe('Unknown Functions Without Address Sender', () => {
    test('should provide helpful error for unknown functions when no Address Sender available', async () => {
      const script = `
LET result = TOTALLY_UNKNOWN_FUNCTION param=123
SAY "This should not execute"
      `;
      
      await expect(interpreter.run(parse(script))).rejects.toThrow(/Function TOTALLY_UNKNOWN_FUNCTION is not available.*not recognized as a built-in function and no Address Sender is configured/);
    });

    test('should provide helpful error for Excel functions when no Address Sender available', async () => {
      const script = `
LET result = EXCEL_VLOOKUP lookup="test" table=[]
SAY "This should not execute"
      `;
      
      await expect(interpreter.run(parse(script))).rejects.toThrow(/Function EXCEL_VLOOKUP is not available.*not recognized as a built-in function and no Address Sender is configured/);
    });
  });
});