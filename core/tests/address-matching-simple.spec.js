/**
 * Address Simple Tests - Converted to HEREDOC
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { TestRexxInterpreter } = require('../src/test-interpreter');
const { parse } = require('../src/parser');

describe('ADDRESS HEREDOC functionality', () => {
  let interpreter;
  let output;
  let mockAddressSender;
  let mockAddressHandler;

  beforeEach(() => {
    output = [];
    
    // Mock address handler that captures called lines
    mockAddressHandler = jest.fn().mockResolvedValue({ success: true });
    
    mockAddressSender = {
      sendToAddress: jest.fn(),
      send: jest.fn().mockResolvedValue({ success: true, result: null })
    };
    
    interpreter = new TestRexxInterpreter(mockAddressSender, {}, {
      output: (msg) => output.push(msg)
    });
    
    // Register a mock address target that captures matching lines
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

  describe('Basic HEREDOC functionality', () => {
    test('should handle simple HEREDOC', async () => {
      const rexxCode = `
        LET result = 25
        ADDRESS mockaddress
        <<EXPECTATION
        {{result}} should equal 25
        EXPECTATION
      `;
      
      await executeRexxCode(rexxCode);
      
      expect(mockAddressHandler).toHaveBeenCalledWith(
        '        {{result}} should equal 25', 
        expect.objectContaining({ result: 25 }),
        expect.anything()
      );
    });

    test('should handle multiline HEREDOC', async () => {
      const rexxCode = `
        LET test_value = 100  
        ADDRESS mockaddress
        <<EXPECTATIONS
        {{test_value}} should equal 100
        {{test_value}} should be greater than 50
        EXPECTATIONS
      `;
      
      await executeRexxCode(rexxCode);
      
      expect(mockAddressHandler).toHaveBeenCalledTimes(1);
      expect(mockAddressHandler).toHaveBeenCalledWith(
        '        {{test_value}} should equal 100\n        {{test_value}} should be greater than 50', 
        expect.objectContaining({ test_value: 100 }),
        expect.anything()
      );
    });

    test('should not interfere with normal function calls when no HEREDOC provided', async () => {
      const rexxCode = `
        LET test_var = 10
        ADDRESS mockaddress
        SAY "This is a normal SAY command"
        LET normal_assignment = 20
      `;
      
      await executeRexxCode(rexxCode);
      
      expect(mockAddressHandler).not.toHaveBeenCalled();
      expect(output).toContain("This is a normal SAY command");
    });

    test('should handle complex HEREDOC content', async () => {
      const rexxCode = `
        LET userId = 42
        LET status = "active"
        ADDRESS mockaddress
        <<SQL
        SELECT * FROM users 
        WHERE id = {{userId}} 
          AND status = '{{status}}'
        ORDER BY created_at DESC
        SQL
      `;
      
      await executeRexxCode(rexxCode);
      
      const expectedSQL = "        SELECT * FROM users \n        WHERE id = {{userId}} \n          AND status = '{{status}}'\n        ORDER BY created_at DESC";
      expect(mockAddressHandler).toHaveBeenCalledWith(
        expectedSQL,
        expect.objectContaining({ userId: 42, status: "active" }),
        expect.anything()
      );
    });

    test('should handle empty HEREDOC', async () => {
      const rexxCode = `
        ADDRESS mockaddress
        <<EMPTY
        EMPTY
      `;
      
      await executeRexxCode(rexxCode);
      
      expect(mockAddressHandler).toHaveBeenCalledWith(
        '',
        expect.any(Object),
        expect.anything()
      );
    });
  });

  describe('Multiple ADDRESS targets with HEREDOC', () => {
    beforeEach(() => {
      interpreter.addressTargets.set('mockaddress2', {
        handler: jest.fn().mockResolvedValue({ success: true }),
        methods: {},
        metadata: { name: 'Mock Address 2' }
      });
    });

    test('should handle different ADDRESS targets with different HEREDOC content', async () => {
      const rexxCode = `
        LET value = 123
        ADDRESS mockaddress
        <<TEST1
        First test with {{value}}
        TEST1
        
        ADDRESS mockaddress2
        <<TEST2
        Second test with {{value}}
        TEST2
      `;
      
      await executeRexxCode(rexxCode);
      
      expect(mockAddressHandler).toHaveBeenCalledWith(
        '        First test with {{value}}',
        expect.objectContaining({ value: 123 }),
        expect.anything()
      );
      
      const mockHandler2 = interpreter.addressTargets.get('mockaddress2').handler;
      expect(mockHandler2).toHaveBeenCalledWith(
        '        Second test with {{value}}',
        expect.objectContaining({ value: 123 }),
        expect.anything()
      );
    });
  });
});