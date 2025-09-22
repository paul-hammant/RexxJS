/**
 * Address Lines Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { TestRexxInterpreter } = require('../src/test-interpreter');
const { parse } = require('../src/parser');

describe('ADDRESS LINES functionality', () => {
  let interpreter;
  let output;
  let mockAddressSender;
  let mockAddressHandler;

  beforeEach(() => {
    output = [];
    
    // Mock address handler that captures called lines
    mockAddressHandler = jest.fn().mockResolvedValue({ success: true });
    
    mockAddressSender = {
      sendToAddress: jest.fn()
    };
    
    interpreter = new TestRexxInterpreter(mockAddressSender, {}, {
      output: (msg) => output.push(msg)
    });
    
    // Register a mock address target that captures lines
    interpreter.addressTargets.set('mockaddress', {
      handler: mockAddressHandler,
      methods: {},
      metadata: { name: 'Mock Address' }
    });
  });

  const executeRexxCode = async (rexxCode) => {
    const commands = parse(rexxCode);
    return await interpreter.run(commands, rexxCode);
  };

  describe('Basic LINES functionality', () => {
    test('should capture single line with LINES(1)', async () => {
      const rexxCode = `LET test_value = 42
ADDRESS mockaddress LINES(1)
SAY "Captured line with value {test_value}"`;
      
      await executeRexxCode(rexxCode);
      expect(mockAddressHandler).toHaveBeenCalledWith(
        'SAY "Captured line with value {test_value}"', 
        expect.objectContaining({ test_value: 42 }),
        expect.anything()
      );
    });

    test('should capture multiple lines with LINES(3)', async () => {
      const rexxCode = `LET name = "Alice"
LET age = 30
ADDRESS mockaddress LINES(3)
SAY "User: {name}"
SAY "Age: {age}"
LET status = "active"`;
      
      await executeRexxCode(rexxCode);
      expect(mockAddressHandler).toHaveBeenCalledWith(
        'SAY "User: {name}"\nSAY "Age: {age}"\nLET status = "active"', 
        expect.objectContaining({ name: 'Alice', age: 30 }),
        expect.anything()
      );
    });

    test('should capture exact number of lines specified', async () => {
      const rexxCode = `ADDRESS mockaddress LINES(2)
LET first = 1
LET second = 2
LET third = 3
SAY "This should execute normally"`;
      
      await executeRexxCode(rexxCode);
      expect(mockAddressHandler).toHaveBeenCalledWith(
        'LET first = 1\nLET second = 2', 
        expect.any(Object),
        expect.anything()
      );
      expect(output).toContain('This should execute normally');
    });

    test('should handle LINES(0) as no-op', async () => {
      const rexxCode = `ADDRESS mockaddress LINES(0)
SAY "This should execute normally"`;
      
      await executeRexxCode(rexxCode);
      expect(mockAddressHandler).not.toHaveBeenCalled();
      expect(output).toContain('This should execute normally');
    });
  });

  describe('LINES with different command types', () => {
    test('should capture function calls', async () => {
      const rexxCode = `ADDRESS mockaddress LINES(2)
LET result = UPPER string="hello"
LET length = LENGTH string=result`;
      
      await executeRexxCode(rexxCode);
      expect(mockAddressHandler).toHaveBeenCalledWith(
        'LET result = UPPER string="hello"\nLET length = LENGTH string=result',
        expect.any(Object),
        expect.anything()
      );
    });

    test('should capture control flow statements', async () => {
      const rexxCode = `LET x = 5
ADDRESS mockaddress LINES(3)
IF x > 0 THEN DO
SAY "Positive"
END`;
      
      await executeRexxCode(rexxCode);
      expect(mockAddressHandler).toHaveBeenCalledWith(
        'IF x > 0 THEN DO\nSAY "Positive"\nEND',
        expect.objectContaining({ x: 5 }),
        expect.anything()
      );
    });

    test('should capture mixed statement types', async () => {
      const rexxCode = `ADDRESS mockaddress LINES(4)
LET name = "Bob"
SAY "Hello {name}"
LET count = LENGTH string=name
IF count > 2 THEN SAY "Long name"
      `;
      
      await executeRexxCode(rexxCode);
      expect(mockAddressHandler).toHaveBeenCalledWith(
        'LET name = "Bob"\nSAY "Hello {name}"\nLET count = LENGTH string=name\nIF count > 2 THEN SAY "Long name"',
        expect.any(Object),
        expect.anything()
      );
    });
  });

  describe('LINES interaction with ADDRESS switching', () => {
    test('should reset LINES state when switching ADDRESS targets', async () => {
      const rexxCode = `ADDRESS mockaddress LINES(2)
SAY "First line"
ADDRESS default
SAY "This should execute normally"`;
      
      await executeRexxCode(rexxCode);
      expect(mockAddressHandler).toHaveBeenCalledWith(
        'SAY "First line"',
        expect.any(Object),
        expect.anything()
      );
      expect(output).toContain('This should execute normally');
    });

    test('should handle switching between LINES and HEREDOC', async () => {
      const rexxCode = `ADDRESS mockaddress LINES(1)
SAY "Captured by LINES"
ADDRESS mockaddress
<<HEREDOC
Captured by HEREDOC
HEREDOC
ADDRESS default
SAY "Normal execution"`;
      
      await executeRexxCode(rexxCode);
      expect(mockAddressHandler).toHaveBeenNthCalledWith(1,
        'SAY "Captured by LINES"',
        expect.any(Object),
        expect.anything()
      );
      expect(mockAddressHandler).toHaveBeenNthCalledWith(2,
        'Captured by HEREDOC',
        expect.any(Object),
        expect.anything()
      );
      expect(output).toContain('Normal execution');
    });

    test('should handle consecutive LINES commands', async () => {
      const rexxCode = `ADDRESS mockaddress LINES(1)
SAY "First capture"
ADDRESS mockaddress LINES(2)
SAY "Second capture line 1"
SAY "Second capture line 2"
SAY "Normal execution"`;
      
      await executeRexxCode(rexxCode);
      expect(mockAddressHandler).toHaveBeenNthCalledWith(1,
        'SAY "First capture"',
        expect.any(Object),
        expect.anything()
      );
      expect(mockAddressHandler).toHaveBeenNthCalledWith(2,
        'SAY "Second capture line 1"\nSAY "Second capture line 2"',
        expect.any(Object),
        expect.anything()
      );
      expect(output).toContain('Normal execution');
    });
  });

  describe('LINES with variable interpolation', () => {
    test('should pass variables to address handler', async () => {
      const rexxCode = `LET user = "Alice"
LET score = 95
ADDRESS mockaddress LINES(2)
SAY "User {user} scored {score}"
LET grade = IF score > 90 THEN "A" ELSE "B"`;
      
      await executeRexxCode(rexxCode);
      expect(mockAddressHandler).toHaveBeenCalledWith(
        'SAY "User {user} scored {score}"\nLET grade = IF score > 90 THEN "A" ELSE "B"',
        expect.objectContaining({ user: 'Alice', score: 95 }),
        expect.anything()
      );
    });

    test('should include variables defined before LINES', async () => {
      const rexxCode = `LET prefix = "LOG:"
LET level = "INFO"
ADDRESS mockaddress LINES(1)
SAY "{prefix} [{level}] System ready"`;
      
      await executeRexxCode(rexxCode);
      expect(mockAddressHandler).toHaveBeenCalledWith(
        'SAY "{prefix} [{level}] System ready"',
        expect.objectContaining({ prefix: 'LOG:', level: 'INFO' }),
        expect.anything()
      );
    });
  });

  describe('Edge cases and error handling', () => {
    test('should handle empty lines gracefully', async () => {
      const rexxCode = `ADDRESS mockaddress LINES(2)

SAY "Non-empty line"`;
      
      await executeRexxCode(rexxCode);
      expect(mockAddressHandler).toHaveBeenCalledWith(
        'SAY "Non-empty line"',
        expect.any(Object),
        expect.anything()
      );
    });

    test('should handle LINES with no following commands', async () => {
      const rexxCode = `ADDRESS mockaddress LINES(5)
SAY "Only one line"`;
      
      await executeRexxCode(rexxCode);
      expect(mockAddressHandler).toHaveBeenCalledWith(
        'SAY "Only one line"',
        expect.any(Object),
        expect.anything()
      );
    });

    test('should handle large LINES count', async () => {
      const rexxCode = `ADDRESS mockaddress LINES(10)
SAY "Line 1"
SAY "Line 2"
SAY "Line 3"`;
      
      await executeRexxCode(rexxCode);
      expect(mockAddressHandler).toHaveBeenCalledWith(
        'SAY "Line 1"\nSAY "Line 2"\nSAY "Line 3"',
        expect.any(Object),
        expect.anything()
      );
    });

    test('should handle LINES with complex expressions', async () => {
      const rexxCode = `LET data = "test,data,here"
ADDRESS mockaddress LINES(3)
LET items = SPLIT string=data delimiter=","
LET count = ARRAY_SIZE array=items
LET result = JOIN array=items separator=" | "`;
      
      await executeRexxCode(rexxCode);
      expect(mockAddressHandler).toHaveBeenCalledWith(
        'LET items = SPLIT string=data delimiter=","\nLET count = ARRAY_SIZE array=items\nLET result = JOIN array=items separator=" | "',
        expect.objectContaining({ data: 'test,data,here' }),
        expect.anything()
      );
    });
  });

  describe('LINES parsing validation', () => {
    test('should parse LINES with integer parameter', () => {
      const rexxCode = 'ADDRESS test LINES(5)';
      const commands = parse(rexxCode);
      
      expect(commands).toHaveLength(1);
      expect(commands[0]).toMatchObject({
        type: 'ADDRESS_WITH_LINES',
        target: 'test',
        lineCount: 5
      });
    });

    test('should parse LINES with zero parameter', () => {
      const rexxCode = 'ADDRESS test LINES(0)';
      const commands = parse(rexxCode);
      
      expect(commands).toHaveLength(1);
      expect(commands[0]).toMatchObject({
        type: 'ADDRESS_WITH_LINES',
        target: 'test',
        lineCount: 0
      });
    });

    test('should not parse LINES with non-integer parameter', () => {
      const rexxCode = 'ADDRESS test LINES(abc)';
      const commands = parse(rexxCode);
      
      // Should not match LINES pattern, should be parsed as regular command
      expect(commands[0].type).not.toBe('ADDRESS_WITH_LINES');
    });
  });
});