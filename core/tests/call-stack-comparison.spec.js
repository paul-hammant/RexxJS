/**
 * Call Stack Comparison Test
 * Compares call stacks between ADDRESS MATCHING and direct ADDRESS calls
 */

const { TestRexxInterpreter } = require('../src/test-interpreter');
const { parse } = require('../src/parser');

describe('Call Stack Comparison', () => {
  let interpreter;
  let mockHandler;
  let callStacks = [];

  beforeEach(() => {
    callStacks = [];
    
    mockHandler = jest.fn().mockImplementation((content, context, rexxInterpreter) => {
      const stack = new Error().stack;
      callStacks.push({
        content,
        context: context || {},
        stack
      });
      
      return {
        success: true,
        operation: 'SELECT',
        sql: content,
        rows: [{ id: 1, name: 'test' }],
        count: 1
      };
    });
    
    interpreter = new TestRexxInterpreter({}, {}, {});
    interpreter.addressTargets.set('testdb', {
      handler: mockHandler,
      methods: ['query'],
      metadata: { name: 'Test Database' }
    });
  });

  const executeRexxCode = async (rexxCode) => {
    const commands = parse(rexxCode);
    return await interpreter.run(commands, rexxCode);
  };

  test('should capture call stack for ADDRESS MATCHING', async () => {
    await executeRexxCode(`
      ADDRESS testdb MATCHING("  (.*)")
      
        SELECT * FROM test
    `);
    
    console.log('=== ADDRESS MATCHING CALL STACK ===');
    console.log(callStacks[0].stack);
  });

  test('should capture call stack for direct ADDRESS', async () => {
    await executeRexxCode(`
      ADDRESS testdb
      "SELECT * FROM test"
    `);
    
    console.log('=== DIRECT ADDRESS CALL STACK ===');
    console.log(callStacks[0].stack);
  });
});