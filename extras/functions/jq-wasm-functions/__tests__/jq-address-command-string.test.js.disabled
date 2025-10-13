/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

describe('jq ADDRESS Library Command-String Tests', () => {
  let originalGlobal;

  beforeEach(() => {
    // Save original state
    originalGlobal = {};
    ['JQ_ADDRESS_MAIN', 'ADDRESS_JQ_HANDLER', 'ADDRESS_JQ_METHODS', 'jq'].forEach(key => {
      if (global[key]) originalGlobal[key] = global[key];
    });

    // Mock jq-wasm with realistic behavior BEFORE loading source
    global.jq = {
      json: jest.fn(),
      raw: jest.fn(),
      version: jest.fn().mockReturnValue('jq-1.8.1')
    };

    // Mock the require function to simulate jq-wasm not being available
    const originalRequire = global.require;
    global.require = jest.fn().mockImplementation((module) => {
      if (module === 'jq-wasm') {
        throw new Error('Module not found');
      }
      return originalRequire(module);
    });

    // Load the source file
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(path.join(__dirname, '../src/jq-address.js'), 'utf8');
    eval(source);
    
    // Restore require
    global.require = originalRequire;
  });

  afterEach(() => {
    // Restore original state
    ['JQ_ADDRESS_MAIN', 'ADDRESS_JQ_HANDLER', 'ADDRESS_JQ_METHODS', 'jq'].forEach(key => {
      if (originalGlobal[key]) {
        global[key] = originalGlobal[key];
      } else {
        delete global[key];
      }
    });
  });

  test('should support setcontext method for command-string queries', async () => {
    const testData = { users: [{ name: "Alice", age: 30 }, { name: "Bob", age: 25 }] };
    
    // Set context
    const contextResult = await global.ADDRESS_JQ_HANDLER('setcontext', { data: testData });
    
    expect(contextResult.success).toBe(true);
    expect(contextResult.operation).toBe('SET_CONTEXT');
    expect(contextResult.contextSet).toBe(true);
    expect(contextResult.message).toBe('Data context set for command-string queries');
  });

  test('should support getcontext method', async () => {
    const testData = { users: [{ name: "Alice" }] };
    
    // Set context first
    await global.ADDRESS_JQ_HANDLER('setcontext', { data: testData });
    
    // Get context
    const contextResult = await global.ADDRESS_JQ_HANDLER('getcontext', {});
    
    expect(contextResult.success).toBe(true);
    expect(contextResult.operation).toBe('GET_CONTEXT');
    expect(contextResult.hasContext).toBe(true);
    expect(contextResult.context).toEqual(testData);
  });

  test('should support clearcontext method', async () => {
    const testData = { users: [{ name: "Alice" }] };
    
    // Set and clear context
    await global.ADDRESS_JQ_HANDLER('setcontext', { data: testData });
    const clearResult = await global.ADDRESS_JQ_HANDLER('clearcontext', {});
    
    expect(clearResult.success).toBe(true);
    expect(clearResult.operation).toBe('CLEAR_CONTEXT');
    expect(clearResult.message).toBe('Data context cleared');
    
    // Verify context is cleared
    const getResult = await global.ADDRESS_JQ_HANDLER('getcontext', {});
    expect(getResult.hasContext).toBe(false);
    expect(getResult.context).toBe(null);
  });

  test('should execute command-string queries with context', async () => {
    const testData = { users: [{ name: "Alice", age: 30 }, { name: "Bob", age: 25 }] };
    const expectedResult = ["Alice", "Bob"];
    
    // Mock jq.json to return names
    global.jq.json.mockResolvedValue(expectedResult);
    
    // Set context
    await global.ADDRESS_JQ_HANDLER('setcontext', { data: testData });
    
    // Execute command-string query (this should call jq internally)
    const result = await global.ADDRESS_JQ_HANDLER('.users[].name');
    
    // Verify the basic structure and success
    expect(result.success).toBe(true);
    expect(result.operation).toBe('QUERY');
    expect(result.query).toBe('.users[].name');
    expect(result.result).toEqual(expectedResult);
    expect(result.message).toBe('jq query executed successfully');
  });

  test('should reject command-string queries without context', async () => {
    await expect(global.ADDRESS_JQ_HANDLER('.users[].name')).rejects.toThrow('jq command requires data context');
  });

  test('should handle empty command-string queries', async () => {
    const result = await global.ADDRESS_JQ_HANDLER('');
    
    expect(result.success).toBe(true);
    expect(result.operation).toBe('NOOP');
    expect(result.message).toBe('Empty jq command - no operation performed');
    expect(result.result).toBe(null);
  });

  test('should handle complex jq queries via command-string', async () => {
    const testData = { 
      fruit: { color: "red", price: 1.99 },
      vegetables: ["carrot", "potato"]
    };
    const expectedResult = ["red", 1.99];
    
    global.jq.json.mockResolvedValue(expectedResult);
    
    // Set context
    await global.ADDRESS_JQ_HANDLER('setcontext', { data: testData });
    
    // Execute complex query (the example from user's question)
    const result = await global.ADDRESS_JQ_HANDLER('.fruit.color,.fruit.price');
    
    expect(result.success).toBe(true);
    expect(result.query).toBe('.fruit.color,.fruit.price');
    expect(result.result).toEqual(expectedResult);
    expect(result.operation).toBe('QUERY');
  });

  test('should include context methods in ADDRESS_JQ_METHODS metadata', () => {
    const methods = global.ADDRESS_JQ_METHODS;
    
    expect(methods.setcontext).toBeDefined();
    expect(methods.setcontext.description).toBe('Set data context for command-string queries');
    expect(methods.setcontext.params).toEqual(['data']);
    
    expect(methods.getcontext).toBeDefined();
    expect(methods.getcontext.description).toBe('Get current data context');
    expect(methods.getcontext.params).toEqual([]);
    
    expect(methods.clearcontext).toBeDefined();
    expect(methods.clearcontext.description).toBe('Clear data context');
    expect(methods.clearcontext.params).toEqual([]);
  });

  test('should format command-string results for REXX variables', async () => {
    const testData = { count: 42 };
    const expectedResult = 42;
    
    global.jq.json.mockResolvedValue(expectedResult);
    
    await global.ADDRESS_JQ_HANDLER('setcontext', { data: testData });
    const result = await global.ADDRESS_JQ_HANDLER('.count');
    
    // Check REXX variable formatting
    expect(result.output).toBe(expectedResult); // RESULT variable
    expect(result.errorCode).toBe(0); // RC variable
    expect(result.errorMessage).toBeUndefined(); // ERRORTEXT only on errors
    expect(result.success).toBe(true);
  });

  test('should handle jq execution errors in command-string mode', async () => {
    const testData = { users: [] };
    
    global.jq.json.mockRejectedValue(new Error('Invalid jq syntax'));
    
    await global.ADDRESS_JQ_HANDLER('setcontext', { data: testData });
    
    await expect(global.ADDRESS_JQ_HANDLER('..invalid.query')).rejects.toThrow('jq command execution failed');
  });
});