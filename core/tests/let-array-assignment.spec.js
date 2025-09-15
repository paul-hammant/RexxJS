/**
 * LET Array Assignment Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { parse } = require('../src/parser');
const { Interpreter } = require('../src/interpreter');

describe('LET array assignment', () => {
  let interpreter;
  let output = [];

  beforeEach(() => {
    output = [];
    const mockOutputHandler = (text) => {
      output.push(text);
    };
    
    interpreter = new Interpreter(null, mockOutputHandler);
  });

  test('should handle LET with array literal', async () => {
    const rexxCode = `LET test_numbers = [1, 2, 3, 4, 5, -1, -2, 0]`;
    
    const commands = parse(rexxCode);
    console.log('Parsed commands:', JSON.stringify(commands, null, 2));
    
    await interpreter.run(commands);
    
    // Check if the variable was set correctly
    const result = interpreter.variables.get('test_numbers');
    console.log('Result:', result);
    
    expect(result).toBeDefined();
  });

  test('should handle simple LET assignment first', async () => {
    const rexxCode = `LET x = 5`;
    
    const commands = parse(rexxCode);
    console.log('Simple LET commands:', JSON.stringify(commands, null, 2));
    
    await interpreter.run(commands);
    
    const result = interpreter.variables.get('x');
    console.log('Simple result:', result);
    
    expect(result).toBe(5);
  });
});