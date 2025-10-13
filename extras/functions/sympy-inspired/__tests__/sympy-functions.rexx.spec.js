const path = require('path');

// Import the Rexx interpreter from core
const { RexxInterpreter } = require('../../../../core/src/interpreter');
const { parse } = require('../../../../core/src/parser');

// Import the function module for direct registration  
const sympyFunctions = require('../src/sympy-functions');

describe('SymPy Functions - Rexx Integration Tests', () => {
  let interpreter;
  
  beforeEach(() => {
    interpreter = new RexxInterpreter(null, {
      output: (text) => {}, // Silent for tests
      loadPaths: [path.join(__dirname, '../../../core/src')]
    });
    
    // Register SymPy functions directly with the interpreter
    // This verifies that functions are properly "hooked up" for REXX use
    Object.keys(sympyFunctions).forEach(funcName => {
      interpreter.builtInFunctions[funcName] = sympyFunctions[funcName];
    });
  });

  test('should handle SYMPY_FUNCTIONS_MAIN detection function', async () => {
    const rexxCode = `
      LET result = SYMPY_FUNCTIONS_MAIN
      SAY "Detection function result: " || result.loaded
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const result = interpreter.variables.get('result');
    expect(result).toBeDefined();
    expect(result.type).toBe('library_info');
    expect(result.name).toBe('SymPy Functions');
    expect(result.loaded).toBe(true);
  });

  test('should handle SY_SYMBOL function through Rexx interpreter', async () => {
    const rexxCode = `
      LET name = "x"
      LET result = SY_SYMBOL name=name
      SAY "Symbol created: " || result.name
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const result = interpreter.variables.get('result');
    expect(result).toBeDefined();
    expect(result.name).toBe('x');
    expect(typeof result.toString).toBe('function');
  });

  test('should handle SY_NUM function through Rexx interpreter', async () => {
    const rexxCode = `
      LET value = "42"
      LET result = SY_NUM value=value
      SAY "Number created: " || result.value
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const result = interpreter.variables.get('result');
    expect(result).toBeDefined();
    expect(result.value).toBe(42);
    expect(typeof result.toString).toBe('function');
  });

  test('should handle SY_DIFF differentiation function', () => {
    // Test SY_DIFF function directly with proper Symbol objects
    const x = interpreter.builtInFunctions.SY_SYMBOL('x');
    const result = interpreter.builtInFunctions.SY_DIFF(x, x);
    expect(result).toBeDefined();
    expect(typeof result.toString).toBe('function');
    expect(result.value).toBe(1); // derivative of x with respect to x is 1
  });
});