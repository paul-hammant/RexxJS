/**
 * ADDRESS Return Value Bug Fix Verification
 * 
 * CORE BUG FIXED: `LET result = methodName` now correctly returns handler's returned object
 * WORKAROUND NO LONGER NEEDED: `LET result = methodName params=""` still works correctly
 * 
 * This test verifies that the RexxJS interpreter has been fixed to properly
 * capture the returned result from the handler for all ADDRESS call patterns.
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('ADDRESS Return Value Bug Fix Verification', () => {
  let interpreter;
  
  beforeEach(() => {
    const mockAddressSender = {
      send: async () => { throw new Error('Should not reach fallback'); }
    };
    
    const outputHandler = {
      writeLine: () => {},
      output: () => {}
    };
    
    interpreter = new Interpreter(mockAddressSender, outputHandler);
    
    // Register mock ADDRESS target with multiple methods
    const mockHandler = (commandOrMethod, params) => {
      switch (commandOrMethod.toLowerCase()) {
        case 'status':
          return Promise.resolve({
            success: true,
            service: 'mock',
            database: ':memory:',
            methods: ['status', 'banana', 'execute']
          });
        case 'banana':
          return Promise.resolve({
            success: true,
            fruit: 'yellow',
            calories: 105,
            potassium: '358mg'
          });
        default:
          return Promise.resolve({
            success: true,
            method: commandOrMethod,
            receivedParams: params
          });
      }
    };
    
    interpreter.addressTargets.set('mock', {
      handler: mockHandler,
      methods: ['status', 'banana'],
      metadata: { libraryName: 'mock-bug-test' }
    });
  });
  
  test('FIXED: bare method call now returns handler result', async () => {
    const script = `
      ADDRESS MOCK
      LET result = status
    `;
    
    const commands = parse(script);
    await interpreter.run(commands);
    
    const result = interpreter.getVariable('result');
    
    // THIS NOW WORKS (bug has been fixed):
    expect(typeof result).toBe('object');     // Should be object from handler
    expect(result.success).toBe(true);        // Should have handler's properties
    expect(result.service).toBe('mock');      // Should have handler's properties
    expect(result.database).toBe(':memory:'); // Should have handler's properties
  });
  
  test('WORKAROUND: method call with params works correctly', async () => {
    const script = `
      ADDRESS MOCK
      LET result = status params=""
    `;
    
    const commands = parse(script);
    await interpreter.run(commands);
    
    const result = interpreter.getVariable('result');
    
    // CORRECT: This properly returns the handler's object
    expect(typeof result).toBe('object');
    expect(result.success).toBe(true);
    expect(result.service).toBe('mock');      // status case returns service, not method
    expect(result.database).toBe(':memory:'); // status case returns database
  });
  
  test('PROOF: both patterns call the same handler with same arguments', async () => {
    let callCount = 0;
    const calls = [];
    
    const trackingHandler = (commandOrMethod, params) => {
      callCount++;
      calls.push({ commandOrMethod, params });
      return Promise.resolve({ 
        callNumber: callCount,
        success: true 
      });
    };
    
    interpreter.addressTargets.set('tracker', {
      handler: trackingHandler,
      methods: ['test'],
      metadata: { libraryName: 'tracker' }
    });
    
    // Test both patterns
    const script = `
      ADDRESS TRACKER
      LET result1 = test
      ADDRESS TRACKER
      LET result2 = test params=""
    `;
    
    const commands = parse(script);
    await interpreter.run(commands);
    
    // Verify both calls happened with similar arguments
    expect(callCount).toBe(2);
    expect(calls[0].commandOrMethod).toBe('test');
    expect(calls[1].commandOrMethod).toBe('test');
    expect(calls[0].params).toEqual({ params: '' });
    expect(calls[1].params).toEqual({ params: '' });
    
    // Both results should now be objects (bug fixed)
    const result1 = interpreter.getVariable('result1');
    const result2 = interpreter.getVariable('result2');
    
    expect(typeof result1).toBe('object');  // FIXED: now returns handler result
    expect(result1.callNumber).toBe(1);
    expect(typeof result2).toBe('object');  // Still works correctly  
    expect(result2.callNumber).toBe(2);
  });
  
  test('FIXED: any parameterless method now works correctly', async () => {
    const script = `
      ADDRESS MOCK
      LET bananaResult = banana
      LET bananaWorking = banana params=""
    `;
    
    const commands = parse(script);
    await interpreter.run(commands);
    
    const bananaResult = interpreter.getVariable('bananaResult');
    const bananaWorking = interpreter.getVariable('bananaWorking');
    
    // THIS NOW WORKS (bug has been fixed):
    expect(typeof bananaResult).toBe('object');    // Should be object from handler
    expect(bananaResult.success).toBe(true);       // Should have handler's properties
    expect(bananaResult.fruit).toBe('yellow');     // Should have handler's properties
    expect(bananaResult.calories).toBe(105);       // Should have handler's properties
    
    // Both patterns now work correctly
    expect(typeof bananaWorking).toBe('object');
    expect(bananaWorking.success).toBe(true);
    expect(bananaWorking.fruit).toBe('yellow');
    expect(bananaWorking.calories).toBe(105);
  });
});