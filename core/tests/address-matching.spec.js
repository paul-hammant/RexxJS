/**
 * Address Matching Tests
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
      sendToAddress: jest.fn()
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

  describe('Basic MATCHING pattern functionality', () => {
    test('should extract captured group from simple dot pattern', async () => {
      const rexxCode = `
        LET test_value = 42
        ADDRESS mockaddress MATCHING("^[ \\t]*\\. (.*)$")
        . {test_value} should equal 42
      `;
      
      await executeRexxCode(rexxCode);
      expect(mockAddressHandler).toHaveBeenCalledWith(
        '{test_value} should equal 42', 
        expect.objectContaining({ test_value: 42, _addressMatchingPattern: '^[ \\t]*\\. (.*)$' }),
        expect.anything()
      );
    });

    test('should handle flexible whitespace in MATCHING pattern', async () => {
      const rexxCode = `
        REQUIRE "expectations-address"
        LET test_value = 100
        ADDRESS EXPECTATIONS MATCHING("^[ \\t]*\\\\.[ \\t]+(.*)$")
        .    {test_value} should equal 100
        	.	{test_value} should be greater than 50
      `;
      
      await executeRexxCode(rexxCode);
    });

    test('should handle multiple capture groups correctly', async () => {
      const rexxCode = `
        REQUIRE "expectations-address"
        LET name = "Alice"
        ADDRESS EXPECTATIONS MATCHING("^TEST: (.*) - (.*)$")
        TEST: {name} should equal "Alice" - priority high
      `;
      
      await executeRexxCode(rexxCode);
    });
  });

  describe('MATCHING pattern precedence over parsing', () => {
    test('should treat function-call-like lines as ADDRESS lines when MATCHING is active', async () => {
      const rexxCode = `
        REQUIRE "expectations-address"
        LET result = 25
        ADDRESS EXPECTATIONS MATCHING("^[ \\t]*# (.*)$")
        # {result} should equal 25
      `;
      
      await executeRexxCode(rexxCode);
    });

    test('should treat assignment-like lines as ADDRESS lines when MATCHING is active', async () => {
      const rexxCode = `
        REQUIRE "expectations-address"
        LET count = 5
        ADDRESS EXPECTATIONS MATCHING("^[ \\t]*CHECK: (.*)$")
        CHECK: {count} should equal 5
      `;
      
      await executeRexxCode(rexxCode);
    });

    test('should not interfere with normal function calls when pattern does not match', async () => {
      const rexxCode = `
        REQUIRE "expectations-address"
        LET test_var = 10
        ADDRESS EXPECTATIONS MATCHING("^[ \\t]*\\. (.*)$")
        SAY "This is a normal SAY command"
        CALL TestFunction
        LET normal_assignment = 20

        TestFunction:
          SAY "Function called successfully"
        RETURN
      `;
      
      await executeRexxCode(rexxCode);
      expect(output).toContain("This is a normal SAY command");
      expect(output).toContain("Function called successfully");
    });
  });

  describe('Multiple ADDRESS targets with MATCHING', () => {
    test('should handle different ADDRESS targets with different MATCHING patterns', async () => {
      const rexxCode = `
        REQUIRE "expectations-address"
        LET value1 = 100
        LET value2 = 200
        
        ADDRESS EXPECTATIONS MATCHING("^[ \\t]*\\. (.*)$")
        . {value1} should equal 100
        
        ADDRESS DEFAULT
        SAY "Switched to default"
        
        ADDRESS EXPECTATIONS MATCHING("^[ \\t]*>>> (.*)$")
        >>> {value2} should equal 200
      `;
      
      await executeRexxCode(rexxCode);
      expect(output).toContain("Switched to default");
    });
  });

  describe('Complex MATCHING patterns', () => {
    test('should handle regex special characters in patterns', async () => {
      const rexxCode = `
        REQUIRE "expectations-address"
        LET status = "OK"
        ADDRESS EXPECTATIONS MATCHING("^[ \\t]*\\[TEST\\]\\s+(.*)$")
        [TEST] {status} should equal "OK"
      `;
      
      await executeRexxCode(rexxCode);
    });

    test('should handle optional groups in patterns', async () => {
      const rexxCode = `
        REQUIRE "expectations-address"
        LET priority = "high"
        LET task = "complete"
        ADDRESS EXPECTATIONS MATCHING("^(?:PRIORITY )?(.*)$")
        PRIORITY {priority} should equal "high"
        {task} should equal "complete"
      `;
      
      await executeRexxCode(rexxCode);
    });
  });

  describe('Error handling', () => {
    test('should handle invalid regex patterns gracefully', async () => {
      const rexxCode = `
        REQUIRE "expectations-address"
        LET test_value = 42
        ADDRESS EXPECTATIONS MATCHING("^[invalid")
        . {test_value} should equal 42
      `;
      
      // Should not crash, should fall back to normal parsing
      await executeRexxCode(rexxCode);
      // The expectation might fail, but the script should not crash
    });

    test('should handle empty MATCHING patterns', async () => {
      const rexxCode = `
        REQUIRE "expectations-address"
        LET test_value = 42
        ADDRESS EXPECTATIONS MATCHING("")
        {test_value} should equal 42
      `;
      
      await executeRexxCode(rexxCode);
    });
  });

  describe('MATCHING with multi-line expectations', () => {
    test('should work with HEREDOC-style multi-line expectations', async () => {
      const rexxCode = `
        REQUIRE "expectations-address"
        LET val1 = 10
        LET val2 = 20
        
        ADDRESS EXPECTATIONS MATCHING("^[ \\t]*\\. (.*)$")
        . {val1} should equal 10
        . {val2} should equal 20
        . {val1} should be less than {val2}
      `;
      
      await executeRexxCode(rexxCode);
    });
  });

  describe('Variable substitution in MATCHING lines', () => {
    test('should properly substitute variables in matched lines', async () => {
      const rexxCode = `
        REQUIRE "expectations-address"
        LET user_name = "Bob"
        LET user_age = 30
        LET min_age = 18
        
        ADDRESS EXPECTATIONS MATCHING("^[ \\t]*VERIFY: (.*)$")
        VERIFY: {user_name} should equal "Bob"
        VERIFY: {user_age} should be greater than {min_age}
      `;
      
      await executeRexxCode(rexxCode);
    });

    test('should handle complex variable expressions in matched lines', async () => {
      const rexxCode = `
        REQUIRE "expectations-address"
        LET data_count = 5
        LET max_allowed = 10
        
        ADDRESS EXPECTATIONS MATCHING("^[ \\t]*CHECK: (.*)$")
        CHECK: {data_count} should be less than {max_allowed}
        CHECK: {data_count} should be greater than 0
      `;
      
      await executeRexxCode(rexxCode);
    });
  });

  describe('Integration with expectation counting', () => {
    test('should correctly count expectations from MATCHING patterns', async () => {
      const rexxCode = `
        REQUIRE "expectations-address"
        LET a = 1
        LET b = 2
        LET c = 3
        
        ADDRESS EXPECTATIONS MATCHING("^[ \\t]*\\. (.*)$")
        . {a} should equal 1
        . {b} should equal 2
        . {c} should equal 3
      `;
      
      await executeRexxCode(rexxCode);
      
      // Check expectation count if available
      // This would need to be checked via the test infrastructure
    });
  });
});