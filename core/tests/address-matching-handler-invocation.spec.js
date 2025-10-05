/**
 * ADDRESS MATCHING Handler Invocation Test
 * Tests that ADDRESS MATCHING actually calls the registered address handler
 * and verifies what data is passed vs what RESULT contains
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { TestRexxInterpreter } = require('../src/test-interpreter');
const { parse } = require('../src/parser');

describe('ADDRESS MATCHING handler invocation verification', () => {
  let interpreter;
  let mockHandler;
  let handlerCalls;

  beforeEach(() => {
    handlerCalls = [];
    
    // Mock handler that records all calls and what it receives
    mockHandler = jest.fn().mockImplementation((content, context, rexxInterpreter) => {
      const callRecord = {
        callNumber: handlerCalls.length + 1,
        content: content,
        contentType: typeof content,
        context: context,
        contextKeys: Object.keys(context || {}),
        timestamp: new Date().toISOString(),
        stackTrace: new Error().stack
      };
      handlerCalls.push(callRecord);
      
      console.log(`=== MOCK HANDLER CALL ${callRecord.callNumber} ===`);
      console.log('Content received:', JSON.stringify(content));
      console.log('Content type:', typeof content);
      console.log('Context received:', JSON.stringify(context, null, 2));
      console.log('=== CALL STACK ===');
      console.log(new Error().stack);
      
      // Return a result with rows to simulate SELECT behavior
      return {
        success: true,
        operation: 'SELECT',
        sql: content,
        rows: [
          { id: 1, name: 'alice' },
          { id: 2, name: 'bob' }
        ],
        count: 2,
        handlerCallNumber: callRecord.callNumber
      };
    });
    
    interpreter = new TestRexxInterpreter({}, {}, {});
    
    // Register mock address target
    interpreter.addressTargets.set('testdb', {
      handler: mockHandler,
      methods: ['query', 'select', 'status'],
      metadata: { name: 'Test Database' }
    });
  });

  const executeRexxCode = async (rexxCode) => {
    const commands = parse(rexxCode);
    return await interpreter.run(commands, rexxCode);
  };

  describe('Handler invocation with ADDRESS heredoc', () => {
    test('should verify handler is called with ADDRESS heredoc pattern', async () => {
      const rexxCode = `
        ADDRESS testdb
        <<SQL
SELECT * FROM users
SQL

        ADDRESS testdb
        <<SQL
SELECT * FROM products
SQL
      `;

      await executeRexxCode(rexxCode);
      
      console.log('=== POST-EXECUTION ANALYSIS ===');
      console.log('Mock handler call count:', mockHandler.mock.calls.length);
      console.log('Handler calls recorded:', handlerCalls.length);
      
      // CRITICAL TEST: Was the handler actually called?
      expect(mockHandler).toHaveBeenCalled();
      expect(mockHandler).toHaveBeenCalledTimes(2); // Two heredoc calls

      if (handlerCalls.length > 0) {
        console.log('Handler calls details:');
        handlerCalls.forEach((call, index) => {
          console.log(`  Call ${index + 1}:`, call);
        });
      } else {
        console.log('❌ NO HANDLER CALLS RECORDED');
      }

      // Check what RESULT contains after the last ADDRESS call
      const variables = interpreter.variables;
      const result = variables.get('RESULT');
      console.log('RESULT variable type:', typeof result);
      console.log('RESULT variable content:', JSON.stringify(result, null, 2));

      if (result) {
        console.log('RESULT.rows type:', typeof result.rows);
        console.log('RESULT.rows content:', JSON.stringify(result.rows, null, 2));
      }
    });

    test('should compare with direct ADDRESS call (control test)', async () => {
      const rexxCode = `
        ADDRESS testdb
        "SELECT * FROM users"
      `;
      
      await executeRexxCode(rexxCode);
      
      console.log('=== CONTROL TEST (Direct ADDRESS) ===');
      console.log('Mock handler call count:', mockHandler.mock.calls.length);
      console.log('Handler calls recorded:', handlerCalls.length);
      
      // This should definitely call the handler
      expect(mockHandler).toHaveBeenCalled();
      expect(handlerCalls.length).toBe(1);
      
      // Check RESULT
      const variables = interpreter.variables;
      const result = variables.get('RESULT');
      console.log('RESULT (direct):', JSON.stringify(result, null, 2));
      
      // This should have rows
      expect(result).toBeDefined();
      expect(result.rows).toBeDefined();
      expect(Array.isArray(result.rows)).toBe(true);
    });
  });

  describe('RESULT data flow verification', () => {
    test('should trace what handler returns vs what RESULT contains', async () => {
      const rexxCode = `
        ADDRESS testdb MATCHING("  (.*)")
        
          SELECT * FROM test_table
      `;
      
      await executeRexxCode(rexxCode);
      
      console.log('=== DATA FLOW ANALYSIS ===');
      
      if (handlerCalls.length > 0) {
        console.log('Handler returned:', JSON.stringify(mockHandler.mock.results[0].value, null, 2));
      }
      
      const variables = interpreter.variables;
      const result = variables.get('RESULT');
      console.log('RESULT variable contains:', JSON.stringify(result, null, 2));
      
      // Compare what handler returned vs what RESULT contains
      if (handlerCalls.length > 0 && result) {
        const handlerResult = mockHandler.mock.results[0].value;
        const rexxResult = result;
        
        console.log('=== COMPARISON ===');
        console.log('Handler.rows:', JSON.stringify(handlerResult.rows));
        console.log('RESULT.rows:', JSON.stringify(rexxResult.rows));
        console.log('Rows match:', JSON.stringify(handlerResult.rows) === JSON.stringify(rexxResult.rows));
      }
    });
  });
});