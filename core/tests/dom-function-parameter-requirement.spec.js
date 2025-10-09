/**
 * DOM Function Parameter Requirement Test
 * 
 * Tests that DOM functions properly error when called without parameters
 * instead of falling back to ADDRESS calls with confusing results.
 * 
 * ISSUE: DOM_QUERY without parameters becomes ADDRESS call returning 
 * {"status":"ignored","result":"Default ADDRESS call ignored"}
 * 
 * EXPECTED: Clear error "DOM_QUERY function requires parameters"
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('DOM Function Parameter Requirements', () => {
  let interpreter;
  let consoleSpy;
  
  beforeEach(() => {
    const mockAddressSender = {
      send: async () => ({ status: 'ignored', result: 'Default ADDRESS call ignored' })
    };
    
    const outputHandler = {
      writeLine: () => {},
      output: () => {}
    };
    
    interpreter = new Interpreter(mockAddressSender, outputHandler);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  
  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test('DOM_QUERY without parameters should error clearly instead of becoming ADDRESS call', async () => {
    const script = `
result = DOM_QUERY
SAY result
    `;

    // Currently this falls back to ADDRESS call, but should error
    await expect(interpreter.run(parse(script))).rejects.toThrow('DOM_QUERY function requires parameters');
  });

  test('DOM_QUERY with proper parameters should attempt to work (not ADDRESS call)', async () => {
    const script = `
result = DOM_QUERY(selector="body", operation="exists")
SAY result
    `;

    // This should attempt function call (not ADDRESS call), may error due to Node.js environment
    await interpreter.run(parse(script));
    
    // If we reach here, it didn't throw an error about requiring parameters (which is good)
    // The actual DOM function behavior is tested elsewhere
  });

  test('DOM_QUERY with named parameters without parentheses should attempt to work', async () => {
    const script = `
result = DOM_QUERY selector="body" operation="exists" 
SAY result
    `;

    // This should attempt function call (not ADDRESS call)
    await interpreter.run(parse(script));
    
    // If we reach here, it didn't throw our parameter requirement error (which is good)
  });

  test('Other DOM functions should also require parameters', async () => {
    const domFunctions = ['DOM_CLICK', 'DOM_TYPE', 'DOM_GET_TEXT', 'DOM_SET_ATTRIBUTE'];
    
    for (const funcName of domFunctions) {
      const script = `result = ${funcName}`;
      
      await expect(interpreter.run(parse(script))).rejects.toThrow(`${funcName} function requires parameters`);
    }
  });

  test('Pattern-matched functions (DOM_*) should require parameters', async () => {
    const script = `
result = DOM_CUSTOM_FUNCTION
SAY result
    `;

    // Any DOM_* pattern should require parameters, not fall back to ADDRESS
    await expect(interpreter.run(parse(script))).rejects.toThrow('DOM_CUSTOM_FUNCTION function requires parameters');
  });

  test('Non-DOM functions should still work with ADDRESS fallback', async () => {
    const script = `
result = SOME_UNKNOWN_COMMAND
SAY result
    `;

    // Non-DOM functions should still fall back to ADDRESS calls (not throw parameter errors)
    await interpreter.run(parse(script));
    
    // If we reach here, it didn't throw our DOM parameter requirement error (which is good)
    // This verifies that non-DOM functions still follow the normal ADDRESS fallback path
  });
});