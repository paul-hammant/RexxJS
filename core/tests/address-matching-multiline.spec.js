/**
 * ADDRESS HEREDOC MULTILINE Test
 * Tests the HEREDOC approach that collects multiline content
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { TestRexxInterpreter } = require('../src/test-interpreter');
const { parse } = require('../src/parser');

describe('ADDRESS HEREDOC MULTILINE functionality', () => {
  let interpreter;
  let mockAddressSender;
  let testHandlerCalls;

  beforeEach(() => {
    testHandlerCalls = [];
    
    const testAddressHandler = async (payload, params, context) => {
      testHandlerCalls.push({ payload, params, context });
      return { success: true, operation: 'TEST_OK' };
    };
    
    mockAddressSender = {
      sendToAddress: jest.fn(),
      send: jest.fn().mockResolvedValue({ success: true, result: null })
    };
    
    interpreter = new TestRexxInterpreter(mockAddressSender, {}, {});
    
    // Register test address handler
    interpreter.addressTargets.set('testhandler', {
      handler: testAddressHandler,
      methods: {},
      metadata: { name: 'Test Handler' }
    });
  });

  const executeRexxCode = async (rexxCode) => {
    const commands = parse(rexxCode);
    return await interpreter.run(commands, rexxCode);
  };

  describe('Basic HEREDOC multiline collection', () => {
    test('should collect simple indented lines', async () => {
      const rexxCode = `ADDRESS testhandler
<<CONTENT
First line
Second line
Third line
CONTENT`;
      
      await executeRexxCode(rexxCode);
      
      expect(testHandlerCalls).toHaveLength(1);
      expect(testHandlerCalls[0].payload).toBe('First line\nSecond line\nThird line');
    });

    test('should collect lines with mixed content', async () => {
      const rexxCode = `ADDRESS testhandler
<<SQL
SELECT * FROM table
WHERE condition = 'value'
ORDER BY id
SQL`;
      
      await executeRexxCode(rexxCode);
      
      expect(testHandlerCalls).toHaveLength(1);
      expect(testHandlerCalls[0].payload).toBe('SELECT * FROM table\nWHERE condition = \'value\'\nORDER BY id');
    });

    test('should handle empty HEREDOC sections', async () => {
      const rexxCode = `ADDRESS testhandler
<<EMPTY
EMPTY`;
      
      await executeRexxCode(rexxCode);
      
      expect(testHandlerCalls).toHaveLength(1);
      expect(testHandlerCalls[0].payload).toBe('');
    });

    test('should handle HEREDOC with single line', async () => {
      const rexxCode = `ADDRESS testhandler
<<SINGLE
Only one line
SINGLE`;
      
      await executeRexxCode(rexxCode);
      
      expect(testHandlerCalls).toHaveLength(1);
      expect(testHandlerCalls[0].payload).toBe('Only one line');
    });

    test('should collect complex nested content', async () => {
      const rexxCode = `ADDRESS testhandler
<<COMPLEX
{
  "user": "test",
  "data": {
    "nested": true
  }
}
COMPLEX`;
      
      await executeRexxCode(rexxCode);
      
      expect(testHandlerCalls).toHaveLength(1);
      const expected = '{\n  "user": "test",\n  "data": {\n    "nested": true\n  }\n}';
      expect(testHandlerCalls[0].payload).toBe(expected);
    });
  });

  describe('SQL-specific HEREDOC tests', () => {
    test('should demonstrate that HEREDOC delivers complete multiline SQL', async () => {
      const rexxCode = `ADDRESS testhandler
<<SQL_QUERY
SELECT users.name, 
       users.email,
       COUNT(orders.id) as order_count
FROM users
LEFT JOIN orders ON users.id = orders.user_id
WHERE users.active = 1
GROUP BY users.id
HAVING COUNT(orders.id) > 0
ORDER BY order_count DESC
LIMIT 10;
SQL_QUERY`;
      
      await executeRexxCode(rexxCode);
      
      expect(testHandlerCalls).toHaveLength(1);
      expect(testHandlerCalls[0].payload).toContain('SELECT users.name,');
      expect(testHandlerCalls[0].payload).toContain('FROM users');
      expect(testHandlerCalls[0].payload).toContain('ORDER BY order_count DESC');
      expect(testHandlerCalls[0].payload).toContain('LIMIT 10;');
    });
  });
});