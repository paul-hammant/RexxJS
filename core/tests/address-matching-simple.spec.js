/**
 * Address Matching Simple Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { TestRexxInterpreter } = require('../src/test-interpreter');
const { parse } = require('../src/parser');

describe('ADDRESS MATCHING functionality', () => {
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

  describe('MATCHING pattern precedence over parsing', () => {
    test('should treat function-call-like lines as ADDRESS lines when MATCHING is active', async () => {
      const rexxCode = `
        LET result = 25
        ADDRESS mockaddress MATCHING("^[ \\t]*# (.*)$")
        # {result} should equal 25
      `;
      
      await executeRexxCode(rexxCode);
      
      // Should have been called with the captured group content
      expect(mockAddressHandler).toHaveBeenCalledWith(
        '{result} should equal 25', 
        expect.objectContaining({ result: 25, _addressMatchingPattern: '^[ \\t]*# (.*)$' }),
        expect.anything()
      );
    });

    test('should extract captured group from dot pattern', async () => {
      const rexxCode = `
        LET test_value = 42
        ADDRESS mockaddress MATCHING("^[ \\t]*\\. (.*)$")
        . {test_value} should equal 42
      `;
      
      await executeRexxCode(rexxCode);
      
      // Should extract just the part after the dot
      expect(mockAddressHandler).toHaveBeenCalledWith(
        '{test_value} should equal 42', 
        expect.objectContaining({ test_value: 42, _addressMatchingPattern: '^[ \\t]*\\. (.*)$' }),
        expect.anything()
      );
    });

    test('should handle flexible whitespace in MATCHING pattern', async () => {
      const rexxCode = `
        LET test_value = 100  
        ADDRESS mockaddress MATCHING("^[ \\t]*\\.[ \\t]+(.*)$")
        .    {test_value} should equal 100
        	.	{test_value} should be greater than 50
      `;
      
      await executeRexxCode(rexxCode);
      
      // Should have been called twice, once for each matching line
      expect(mockAddressHandler).toHaveBeenCalledTimes(2);
      expect(mockAddressHandler).toHaveBeenNthCalledWith(1,
        '{test_value} should equal 100', 
        expect.objectContaining({ test_value: 100 }),
        expect.anything()
      );
      expect(mockAddressHandler).toHaveBeenNthCalledWith(2,
        '{test_value} should be greater than 50', 
        expect.objectContaining({ test_value: 100 }),
        expect.anything()
      );
    });

    test('should not interfere with normal function calls when pattern does not match', async () => {
      const rexxCode = `
        LET test_var = 10
        ADDRESS mockaddress MATCHING("^[ \\t]*\\. (.*)$")
        SAY "This is a normal SAY command"
        LET normal_assignment = 20
      `;
      
      await executeRexxCode(rexxCode);
      
      // Mock handler should not have been called since no lines match the pattern
      expect(mockAddressHandler).not.toHaveBeenCalled();
      // But SAY should have worked normally
      expect(output).toContain("This is a normal SAY command");
    });

    test('should handle lines that would normally be parsed as assignments', async () => {
      const rexxCode = `
        LET status = "OK"
        ADDRESS mockaddress MATCHING("^[ \\t]*CHECK: (.*)$")
        CHECK: {status} should equal "OK"  
      `;
      
      await executeRexxCode(rexxCode);
      
      expect(mockAddressHandler).toHaveBeenCalledWith(
        '{status} should equal "OK"', 
        expect.objectContaining({ status: "OK" }),
        expect.anything()
      );
    });

    test('should handle complex regex patterns', async () => {
      const rexxCode = `
        LET priority = "high"
        ADDRESS mockaddress MATCHING("^[ \\t]*\\[TEST\\]\\s+(.*)$")
        [TEST] {priority} should equal "high"
      `;
      
      await executeRexxCode(rexxCode);
      
      expect(mockAddressHandler).toHaveBeenCalledWith(
        '{priority} should equal "high"', 
        expect.objectContaining({ priority: "high" }),
        expect.anything()
      );
    });

    test('should handle multiple variables in matched lines', async () => {
      const rexxCode = `
        LET name = "Alice"
        LET age = 30
        ADDRESS mockaddress MATCHING("^[ \\t]*>>> (.*)$")
        >>> {name} is {age} years old
      `;
      
      await executeRexxCode(rexxCode);
      
      expect(mockAddressHandler).toHaveBeenCalledWith(
        '{name} is {age} years old', 
        expect.objectContaining({ name: "Alice", age: 30 }),
        expect.anything()
      );
    });

    test('should NOT interpolate variables by default - handler receives raw {variable} syntax', async () => {
      const rexxCode = `
        LET user_name = "Bob"
        LET user_score = 95
        LET is_admin = true
        
        ADDRESS mockaddress MATCHING("^[ \\t]*CHECK: (.*)$")
        CHECK: {user_name} scored {user_score} and admin status is {is_admin}
      `;
      
      await executeRexxCode(rexxCode);
      
      // Verify the message contains literal {variable} syntax (NOT interpolated)
      expect(mockAddressHandler).toHaveBeenCalledWith(
        '{user_name} scored {user_score} and admin status is {is_admin}',
        expect.objectContaining({ 
          user_name: "Bob", 
          user_score: 95, 
          is_admin: true,
          _addressMatchingPattern: '^[ \\t]*CHECK: (.*)$'
        }),
        expect.anything()
      );
      
      // Verify the handler receives variable VALUES in context, but NOT in message
      const call = mockAddressHandler.mock.calls[mockAddressHandler.mock.calls.length - 1];
      const [message, context] = call;
      
      // Message should contain {braces} - NOT interpolated values
      expect(message).toContain('{user_name}');
      expect(message).toContain('{user_score}');
      expect(message).toContain('{is_admin}');
      expect(message).not.toContain('Bob');
      expect(message).not.toContain('95');
      expect(message).not.toContain('true');
      
      // Context should contain actual values
      expect(context.user_name).toBe('Bob');
      expect(context.user_score).toBe(95);
      expect(context.is_admin).toBe(true);
    });
  });

  describe('Error handling', () => {
    test('should handle invalid regex patterns gracefully', async () => {
      const rexxCode = `
        LET test_value = 42
        ADDRESS mockaddress MATCHING("^[invalid")
        . {test_value} should equal 42
      `;
      
      // Should not crash, should fall back to normal parsing
      const result = await executeRexxCode(rexxCode);
      expect(result).toBeDefined();
      
      // With invalid regex, it should fall back to normal parsing
      // The line ". {test_value} should equal 42" would be parsed as a function call
      // Since we're in an ADDRESS context, it should still be sent to the address handler as a function call
      expect(mockAddressHandler).toHaveBeenCalled();
    });

    test('should handle patterns with no capture groups', async () => {
      const rexxCode = `
        LET test_value = 42
        ADDRESS mockaddress MATCHING("^[ \\t]*\\.")
        . some content here
      `;
      
      await executeRexxCode(rexxCode);
      
      // Should remove the matched portion and send the rest
      expect(mockAddressHandler).toHaveBeenCalledWith(
        'some content here', 
        expect.objectContaining({ test_value: 42 }),
        expect.anything()
      );
    });
  });

  describe('Multiple ADDRESS contexts', () => {
    test('should handle switching between ADDRESS targets with different patterns', async () => {
      // Register another mock address
      const mockAddressHandler2 = jest.fn().mockResolvedValue({ success: true });
      interpreter.addressTargets.set('mockaddress2', {
        handler: mockAddressHandler2,
        methods: {},
        metadata: { name: 'Mock Address 2' }
      });

      const rexxCode = `
        LET value1 = 100
        LET value2 = 200
        
        ADDRESS mockaddress MATCHING("^[ \\t]*\\. (.*)$")
        . value1 is {value1}
        
        ADDRESS DEFAULT
        SAY "Switched to default"
        
        ADDRESS mockaddress2 MATCHING("^[ \\t]*>>> (.*)$")
        >>> value2 is {value2}
      `;
      
      await executeRexxCode(rexxCode);
      
      expect(mockAddressHandler).toHaveBeenCalledWith(
        'value1 is {value1}', 
        expect.objectContaining({ value1: 100, value2: 200 }),
        expect.anything()
      );
      
      expect(mockAddressHandler2).toHaveBeenCalledWith(
        'value2 is {value2}', 
        expect.objectContaining({ value1: 100, value2: 200 }),
        expect.anything()
      );
      
      expect(output).toContain("Switched to default");
    });
  });

  describe('ADDRESS reset functionality', () => {
    test('should reset to default when ADDRESS used without target', async () => {
      const rexxCode = `
        LET test_value = 42
        ADDRESS mockaddress MATCHING("^[ \\t]*\\. (.*)$")
        . {test_value} should equal 42
        
        ADDRESS
        SAY "Back to normal output"
      `;
      
      await executeRexxCode(rexxCode);
      
      // Should have been called once for the matching line
      expect(mockAddressHandler).toHaveBeenCalledTimes(1);
      expect(mockAddressHandler).toHaveBeenCalledWith(
        '{test_value} should equal 42', 
        expect.objectContaining({ test_value: 42 }),
        expect.anything()
      );
      
      // SAY should have worked normally after ADDRESS reset
      expect(output).toContain("Back to normal output");
    });

    test('should reset to default and clear matching pattern', async () => {
      const rexxCode = `
        LET name = "Alice"
        ADDRESS mockaddress MATCHING("^[ \\t]*\\. (.*)$")
        . {name} should equal "Alice"
        
        ADDRESS
        . This should NOT be sent to mockaddress handler
        SAY "Normal processing resumed"
      `;
      
      await executeRexxCode(rexxCode);
      
      // Should only be called once (before ADDRESS reset)
      expect(mockAddressHandler).toHaveBeenCalledTimes(1);
      expect(mockAddressHandler).toHaveBeenCalledWith(
        '{name} should equal "Alice"', 
        expect.objectContaining({ name: "Alice" }),
        expect.anything()
      );
      
      // After ADDRESS reset, the dot line should be processed normally (not sent to handler)
      expect(output).toContain("Normal processing resumed");
    });

    test('should work the same as ADDRESS DEFAULT', async () => {
      const mockAddressHandler2 = jest.fn().mockResolvedValue({ success: true });
      interpreter.addressTargets.set('testaddress', {
        handler: mockAddressHandler2,
        methods: {},
        metadata: { name: 'Test Address' }
      });

      // Test ADDRESS (no target)
      const rexxCode1 = `
        LET value = 100
        ADDRESS testaddress MATCHING("^[ \\\\t]*>>> (.*)$")
        >>> {value} is one hundred
        ADDRESS
        SAY "Reset with ADDRESS alone"
      `;
      
      await executeRexxCode(rexxCode1);
      
      // Reset the mock for second test
      const handler1Calls = mockAddressHandler2.mock.calls.length;
      mockAddressHandler2.mockClear();
      output.length = 0; // Clear output array
      
      // Test ADDRESS DEFAULT
      const rexxCode2 = `
        LET value = 100
        ADDRESS testaddress MATCHING("^[ \\\\t]*>>> (.*)$")
        >>> {value} is one hundred
        ADDRESS DEFAULT
        SAY "Reset with ADDRESS DEFAULT"
      `;
      
      await executeRexxCode(rexxCode2);
      
      // Both should have the same behavior
      expect(handler1Calls).toBe(1);
      expect(mockAddressHandler2).toHaveBeenCalledTimes(1);
      
      // Both should have processed the SAY command normally
      expect(output).toContain("Reset with ADDRESS DEFAULT");
    });

    test('should allow switching between multiple ADDRESS targets', async () => {
      const mockLogHandler = jest.fn().mockResolvedValue({ success: true });
      interpreter.addressTargets.set('logger', {
        handler: mockLogHandler,
        methods: {},
        metadata: { name: 'Logger' }
      });

      const rexxCode = `
        LET user = "Bob"
        LET action = "login"
        
        ADDRESS mockaddress MATCHING("^[ \\\\t]*CHECK: (.*)$")
        CHECK: {user} should be "Bob"
        
        ADDRESS logger MATCHING("^[ \\\\t]*LOG: (.*)$")
        LOG: {user} performed {action}
        
        ADDRESS
        SAY "All done"
      `;
      
      await executeRexxCode(rexxCode);
      
      expect(mockAddressHandler).toHaveBeenCalledWith(
        '{user} should be "Bob"',
        expect.objectContaining({ user: "Bob", action: "login" }),
        expect.anything()
      );
      
      expect(mockLogHandler).toHaveBeenCalledWith(
        '{user} performed {action}',
        expect.objectContaining({ user: "Bob", action: "login" }),
        expect.anything()
      );
      
      expect(output).toContain("All done");
    });
  });

  describe('ADDRESS string quote types', () => {
    test('should support double quotes, single quotes, and backticks identically', async () => {
      const rexxCode = `
        LET test_value = 42
        
        ADDRESS mockaddress "Double quote command: {test_value}"
        ADDRESS mockaddress 'Single quote command: {test_value}'
        ADDRESS mockaddress \`Backtick command: {test_value}\`
      `;
      
      await executeRexxCode(rexxCode);
      
      // Should have been called three times, once for each quote type
      expect(mockAddressHandler).toHaveBeenCalledTimes(3);
      
      // Verify each call received the exact string content
      expect(mockAddressHandler).toHaveBeenNthCalledWith(1,
        'Double quote command: {test_value}', 
        expect.objectContaining({ test_value: 42 }),
        expect.anything()
      );
      
      expect(mockAddressHandler).toHaveBeenNthCalledWith(2,
        'Single quote command: {test_value}', 
        expect.objectContaining({ test_value: 42 }),
        expect.anything()
      );
      
      expect(mockAddressHandler).toHaveBeenNthCalledWith(3,
        'Backtick command: {test_value}', 
        expect.objectContaining({ test_value: 42 }),
        expect.anything()
      );
    });

    test('should support all quote types in multiline ADDRESS strings', async () => {
      const rexxCode = `
        LET api_data = "test"
        
        ADDRESS mockaddress
        "Double quote multiline: {api_data}"
        
        ADDRESS mockaddress
        'Single quote multiline: {api_data}'
        
        ADDRESS mockaddress
        \`Backtick multiline: {api_data}\`
      `;
      
      await executeRexxCode(rexxCode);
      
      // Should have been called three times for multiline strings
      expect(mockAddressHandler).toHaveBeenCalledTimes(3);
      
      expect(mockAddressHandler).toHaveBeenNthCalledWith(1,
        'Double quote multiline: {api_data}', 
        expect.objectContaining({ api_data: "test" }),
        expect.anything()
      );
      
      expect(mockAddressHandler).toHaveBeenNthCalledWith(2,
        'Single quote multiline: {api_data}', 
        expect.objectContaining({ api_data: "test" }),
        expect.anything()
      );
      
      expect(mockAddressHandler).toHaveBeenNthCalledWith(3,
        'Backtick multiline: {api_data}', 
        expect.objectContaining({ api_data: "test" }),
        expect.anything()
      );
    });

    test('should handle quote nesting correctly', async () => {
      const rexxCode = `
        ADDRESS mockaddress "Contains 'single' quotes inside"
        ADDRESS mockaddress 'Contains "double" quotes inside'
        ADDRESS mockaddress \`Contains 'both' "quote" types\`
      `;
      
      await executeRexxCode(rexxCode);
      
      expect(mockAddressHandler).toHaveBeenCalledTimes(3);
      
      expect(mockAddressHandler).toHaveBeenNthCalledWith(1,
        "Contains 'single' quotes inside", 
        expect.anything(),
        expect.anything()
      );
      
      expect(mockAddressHandler).toHaveBeenNthCalledWith(2,
        'Contains "double" quotes inside', 
        expect.anything(),
        expect.anything()
      );
      
      expect(mockAddressHandler).toHaveBeenNthCalledWith(3,
        'Contains \'both\' "quote" types', 
        expect.anything(),
        expect.anything()
      );
    });

    test('should work with MATCHING patterns and all quote types', async () => {
      const rexxCode = `
        LET test_var = "value"
        
        ADDRESS mockaddress MATCHING("^[ \\t]*\\. (.*)$")
        . {test_var} should equal "value"
        
        ADDRESS mockaddress "Inline double quote after MATCHING"
        ADDRESS mockaddress 'Inline single quote after MATCHING'
        ADDRESS mockaddress \`Inline backtick after MATCHING\`
      `;
      
      await executeRexxCode(rexxCode);
      
      // Should have been called 4 times: 1 MATCHING + 3 inline strings
      expect(mockAddressHandler).toHaveBeenCalledTimes(4);
      
      // First call from MATCHING pattern
      expect(mockAddressHandler).toHaveBeenNthCalledWith(1,
        '{test_var} should equal "value"', 
        expect.objectContaining({ test_var: "value" }),
        expect.anything()
      );
      
      // Remaining calls from inline strings (should bypass MATCHING)
      expect(mockAddressHandler).toHaveBeenNthCalledWith(2,
        'Inline double quote after MATCHING', 
        expect.anything(),
        expect.anything()
      );
      
      expect(mockAddressHandler).toHaveBeenNthCalledWith(3,
        'Inline single quote after MATCHING', 
        expect.anything(),
        expect.anything()
      );
      
      expect(mockAddressHandler).toHaveBeenNthCalledWith(4,
        'Inline backtick after MATCHING', 
        expect.anything(),
        expect.anything()
      );
    });
  });
});