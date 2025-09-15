/**
 * Address Lines Simple Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { TestRexxInterpreter } = require('../src/test-interpreter');
const { parse } = require('../src/parser');

describe('ADDRESS LINES simple functionality', () => {
  let interpreter;
  let output;
  let mockAddressSender;
  let mockAddressHandler;
  let capturedCalls;

  beforeEach(() => {
    output = [];
    capturedCalls = [];
    
    // Mock address handler that captures called lines
    mockAddressHandler = async (message, context, sourceContext) => {
      capturedCalls.push({ message, context, sourceContext });
      return { success: true };
    };
    
    mockAddressSender = {
      sendToAddress: jest.fn()
    };
    
    interpreter = new TestRexxInterpreter(mockAddressSender, {}, {
      output: (msg) => output.push(msg)
    });
    
    // Register a mock address target that captures lines
    interpreter.addressTargets.set('test', {
      handler: mockAddressHandler,
      methods: {},
      metadata: { name: 'Test Address' }
    });
  });

  const executeRexxCode = async (rexxCode) => {
    const commands = parse(rexxCode);
    return await interpreter.run(commands, rexxCode);
  };

  test('should parse ADDRESS LINES correctly', () => {
    const rexxCode = 'ADDRESS test LINES(3)';
    const commands = parse(rexxCode);
    
    expect(commands).toHaveLength(1);
    expect(commands[0]).toMatchObject({
      type: 'ADDRESS_WITH_LINES',
      target: 'test',
      lineCount: 3
    });
  });

  test('should capture single line', async () => {
    const rexxCode = `LET name = "Alice"
ADDRESS test LINES(1)
SAY "Hello {name}"
SAY "This should execute normally"`;
    
    await executeRexxCode(rexxCode);
    
    expect(capturedCalls).toHaveLength(1);
    expect(capturedCalls[0].message).toBe('SAY "Hello {name}"');
    expect(capturedCalls[0].context).toMatchObject({ name: 'Alice' });
    expect(output).toContain('This should execute normally');
  });

  test('should capture two lines', async () => {
    const rexxCode = `LET x = 42
ADDRESS test LINES(2)
SAY "Line 1"
SAY "Line 2"
SAY "Normal execution"`;
    
    await executeRexxCode(rexxCode);
    
    expect(capturedCalls).toHaveLength(1);
    expect(capturedCalls[0].message).toBe('SAY "Line 1"\nSAY "Line 2"');
    expect(capturedCalls[0].context).toMatchObject({ x: 42 });
    expect(output).toContain('Normal execution');
  });

  test('should capture LET assignments', async () => {
    const rexxCode = `ADDRESS test LINES(2)
LET first = "hello" 
LET second = "world"
SAY "Should execute normally"`;
    
    await executeRexxCode(rexxCode);
    
    expect(capturedCalls).toHaveLength(1);
    expect(capturedCalls[0].message).toBe('LET first = "hello"\nLET second = "world"');
    expect(output).toContain('Should execute normally');
  });
});