/**
 * ADDRESS Return Value Bug Reproduction Test
 * 
 * This test reproduces a bug in the RexxJS interpreter where certain ADDRESS call patterns
 * don't properly capture the returned result from the handler.
 * 
 * Bug: `LET result = methodName` returns literal string instead of handler's returned object
 * Works: `LET result = methodName params=""` returns the handler's returned object correctly
 * 
 * Copyright (c) 2025 Paul Hammant  
 * Licensed under the MIT License
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('ADDRESS Return Value Bug Reproduction', () => {
  let interpreter;
  
  beforeEach(() => {
    const mockAddressSender = {
      send: async (namespace, method, params) => {
        throw new Error(`Fallback AddressSender called for ${namespace}.${method} - ADDRESS target should handle this`);
      }
    };
    
    const outputHandler = {
      writeLine: (text) => console.log(text),
      output: (text) => console.log(text)
    };
    
    interpreter = new Interpreter(mockAddressSender, outputHandler);
    
    // Register a mock ADDRESS target that simulates the SQLite behavior
    const mockHandler = (commandOrMethod, params) => {
      console.log('Mock handler called with:', {commandOrMethod, params, type: typeof commandOrMethod});
      
      // Simulate the same logic pattern as SQLite handler
      const knownMethods = ['status', 'execute', 'query'];
      const hasNoRealParams = !params || (Object.keys(params).length === 1 && params.params === '');
      
      if (typeof commandOrMethod === 'string' && hasNoRealParams && 
          !knownMethods.includes(commandOrMethod.toLowerCase())) {
        // Would handle as SQL command - but for this test, just return the command
        return Promise.resolve(commandOrMethod);
      }
      
      // Handle method calls
      switch (commandOrMethod.toLowerCase()) {
        case 'status':
          const statusResult = {
            success: true,
            service: 'mock',
            database: ':memory:',
            methods: ['status', 'execute', 'query']
          };
          console.log('Mock STATUS result:', JSON.stringify(statusResult, null, 2));
          return Promise.resolve(statusResult);
          
        case 'execute':
          return Promise.resolve({
            success: true,
            operation: 'EXECUTE',
            rowsAffected: 1
          });

        case 'query':
          return Promise.resolve({
            success: true,
            operation: 'QUERY',
            rows: []
          });
          
        default:
          return Promise.resolve(commandOrMethod);
      }
    };
    
    // Register the mock ADDRESS target
    interpreter.addressTargets.set('mock', {
      handler: mockHandler,
      methods: ['status', 'execute', 'query'],
      metadata: {
        libraryName: 'mock-address-bug-test',
        type: 'address-target'
      }
    });
  });
  
  test('demonstrates the ADDRESS return value bug', async () => {
    // Test Case 1: Bare method call (SHOULD work but currently fails due to bug)
    const buggyScript = `
      ADDRESS MOCK
      LET result1 = status
    `;
    
    const buggyCommands = parse(buggyScript);
    await interpreter.run(buggyCommands);
    
    const result1 = interpreter.getVariable('result1');
    console.log('Result1 (should be object):', result1);
    console.log('Result1 type:', typeof result1);
    
    // THIS IS HOW IT SHOULD WORK (will fail until bug is fixed):
    expect(typeof result1).toBe('object');  // Should be object, not string
    expect(result1.success).toBe(true);     // Should have handler's properties
    expect(result1.service).toBe('mock');   // Should have handler's properties
    
    // Test Case 2: Method call with empty params (WORKS - returns object)  
    const workingScript = `
      ADDRESS MOCK
      LET result2 = status params=""
    `;
    
    const workingCommands = parse(workingScript);
    await interpreter.run(workingCommands);
    
    const result2 = interpreter.getVariable('result2');
    console.log('Result2 (working pattern):', result2);
    console.log('Result2 type:', typeof result2);
    console.log('Result2.success:', result2.success);
    
    // This works correctly - result2 is the returned object
    expect(typeof result2).toBe('object');
    expect(result2.success).toBe(true);
    expect(result2.service).toBe('mock');
    expect(result2.database).toBe(':memory:');
    
    // Test Case 3: Method call with real params (WORKS - returns object)
    const workingScript2 = `
      ADDRESS MOCK  
      LET result3 = execute sql="CREATE TABLE test (id INTEGER)"
    `;
    
    const workingCommands2 = parse(workingScript2);
    await interpreter.run(workingCommands2);
    
    const result3 = interpreter.getVariable('result3');
    console.log('Result3 (working pattern with params):', result3);
    
    // This also works correctly
    expect(typeof result3).toBe('object');
    expect(result3.success).toBe(true);
    expect(result3.operation).toBe('EXECUTE');
    expect(result3.rowsAffected).toBe(1);
  });
  
  test('documents the specific failing vs working patterns', async () => {
    const testScript = `
      ADDRESS MOCK
      
      // FAILING PATTERNS (return literal strings instead of objects):
      LET fail1 = status
      
      // WORKING PATTERNS (return proper objects):
      LET work1 = status params=""
      LET work2 = execute sql="SELECT 1"
      LET work3 = query sql="SELECT * FROM users"
    `;
    
    const commands = parse(testScript);
    await interpreter.run(commands);
    
    // Verify ALL patterns now return objects (bug fixed)
    const fail1 = interpreter.getVariable('fail1');
    expect(typeof fail1).toBe('object');  // FIXED: now returns handler result
    expect(fail1.success).toBe(true);
    
    // Verify working patterns return objects
    const work1 = interpreter.getVariable('work1');
    expect(typeof work1).toBe('object');
    expect(work1.success).toBe(true);
    
    const work2 = interpreter.getVariable('work2');
    expect(typeof work2).toBe('object');
    expect(work2.success).toBe(true);
    
    const work3 = interpreter.getVariable('work3');
    expect(typeof work3).toBe('object');
    expect(work3.success).toBe(true);
  });
  
  test('shows that ADDRESS handler IS called correctly for both patterns', async () => {
    // This test proves the handler receives correct arguments in both cases
    // The bug is NOT in the handler - it's in how the interpreter captures the result
    
    let handlerCallCount = 0;
    const callDetails = [];
    
    const trackingHandler = (commandOrMethod, params) => {
      handlerCallCount++;
      callDetails.push({
        call: handlerCallCount,
        commandOrMethod,
        params,
        type: typeof commandOrMethod
      });
      
      // Always return the same object regardless of how it's called
      return Promise.resolve({
        success: true,
        callNumber: handlerCallCount,
        receivedCommand: commandOrMethod,
        receivedParams: params
      });
    };
    
    interpreter.addressTargets.set('tracker', {
      handler: trackingHandler,
      methods: ['status'],
      metadata: { libraryName: 'tracker' }
    });
    
    const testScript = `
      ADDRESS TRACKER
      LET result_bare = status
      ADDRESS TRACKER  
      LET result_with_params = status params=""
    `;
    
    const commands = parse(testScript);
    await interpreter.run(commands);
    
    // Verify handler was called twice
    expect(handlerCallCount).toBe(2);
    expect(callDetails).toHaveLength(2);
    
    // Verify both calls received the same commandOrMethod
    expect(callDetails[0].commandOrMethod).toBe('status');
    expect(callDetails[1].commandOrMethod).toBe('status');
    
    // Verify the params difference  
    expect(callDetails[0].params).toEqual({ params: '' });
    expect(callDetails[1].params).toEqual({ params: '' });
    
    // The critical finding: both calls are identical, but results differ
    const resultBare = interpreter.getVariable('result_bare');
    const resultWithParams = interpreter.getVariable('result_with_params');
    
    console.log('Handler call details:', callDetails);
    console.log('Result bare:', resultBare);
    console.log('Result with params:', resultWithParams);
    
    // Bug is now fixed: both handlers work the same
    expect(typeof resultBare).toBe('object'); // FIXED: now returns object
    expect(resultBare.success).toBe(true); // FIXED: now has handler properties
    expect(resultBare.callNumber).toBe(1);
    
    expect(typeof resultWithParams).toBe('object'); // Still works correctly
    expect(resultWithParams.success).toBe(true);
    expect(resultWithParams.callNumber).toBe(2);
  });
});