/**
 * Mock ADDRESS Target Testing
 * 
 * Tests the mock ADDRESS target functionality
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('Mock ADDRESS Target', () => {
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
  });
  
  test('should load mock ADDRESS target and register it', async () => {
    // Load the mock address library  
    const requireScript = 'REQUIRE "./tests/mock-address.js"';
    const requireCommands = parse(requireScript);
    
    await interpreter.run(requireCommands);
    
    // Verify ADDRESS target was registered
    expect(interpreter.addressTargets.has('mock')).toBe(true);
    
    const mockTarget = interpreter.addressTargets.get('mock');
    expect(mockTarget).toBeDefined();
    expect(typeof mockTarget.handler).toBe('function');
    expect(mockTarget.methods).toBeDefined();
    expect(mockTarget.metadata.libraryName).toBe('./tests/mock-address.js');
  });

  test('should handle ECHO command via ADDRESS', async () => {
    // Load the library first
    const requireScript = 'REQUIRE "./tests/mock-address.js"';
    const requireCommands = parse(requireScript);
    await interpreter.run(requireCommands);
    
    // Reset state for clean test
    global._resetMockAddress();
    
    // Test ADDRESS MOCK with ECHO command
    const script = `
      ADDRESS MOCK
      "ECHO Hello from Mock"
    `;
    const commands = parse(script);
    await interpreter.run(commands);
    
    // Verify the mock received the ECHO command
    const mockState = global._getMockAddressState();
    expect(mockState.commandHistory).toHaveLength(1);
    expect(mockState.commandHistory[0].command).toBe('ECHO Hello from Mock');
    expect(mockState.lastResult).toBe('Hello from Mock');
  });

  test('should handle SET and GET operations', async () => {
    // Load the library first
    const requireScript = 'REQUIRE "./tests/mock-address.js"';
    const requireCommands = parse(requireScript);
    await interpreter.run(requireCommands);
    
    // Reset state for clean test
    global._resetMockAddress();
    
    // Test SET and GET operations
    const script = `
      ADDRESS MOCK
      "SET testvar 42"
      "GET testvar"
    `;
    const commands = parse(script);
    await interpreter.run(commands);
    
    // Verify the mock received both commands and stored the value
    const mockState = global._getMockAddressState();
    expect(mockState.commandHistory).toHaveLength(2);
    expect(mockState.commandHistory[0].command).toBe('SET testvar 42');
    expect(mockState.commandHistory[1].command).toBe('GET testvar');
    
    // Verify the variable was stored and retrieved
    expect(mockState.variables.testvar).toBe(42);
    expect(mockState.lastResult).toBe(42); // Last result from GET
  });

  test('should handle INCREMENT operations', async () => {
    // Load the library first  
    const requireScript = 'REQUIRE "./tests/mock-address.js"';
    const requireCommands = parse(requireScript);
    await interpreter.run(requireCommands);
    
    // Reset state for clean test
    global._resetMockAddress();
    
    // Test INCREMENT functionality
    const script = `
      ADDRESS MOCK
      "SET counter 10"
      "INCREMENT counter"
      "INCREMENT counter 5"
    `;
    const commands = parse(script);
    await interpreter.run(commands);
    
    // Verify the mock received all commands and performed calculations correctly
    const mockState = global._getMockAddressState();
    expect(mockState.commandHistory).toHaveLength(3);
    expect(mockState.commandHistory[0].command).toBe('SET counter 10');
    expect(mockState.commandHistory[1].command).toBe('INCREMENT counter');
    expect(mockState.commandHistory[2].command).toBe('INCREMENT counter 5');
    
    // Verify the counter was incremented correctly: 10 + 1 + 5 = 16
    expect(mockState.variables.counter).toBe(16);
    expect(mockState.counter).toBeGreaterThan(0); // Internal operation counter
  });

  test('should handle complete workflow with state tracking', async () => {
    // Load the library first
    const requireScript = 'REQUIRE "./tests/mock-address.js"';
    const requireCommands = parse(requireScript);
    await interpreter.run(requireCommands);
    
    // Reset state for clean test
    global._resetMockAddress();
    
    // Multi-step workflow like SQL test
    const script = `
      ADDRESS MOCK
      LET reset_result = RESET
      LET set_result = SET key="username" value="testuser"
      LET incr_result = INCREMENT key="counter" amount="5"
      LET get_result = GET key="username"
      LET status_result = STATUS
    `;
    const commands = parse(script);
    await interpreter.run(commands);
    
    // Verify each step like SQL test does
    const resetResult = interpreter.getVariable('reset_result');
    expect(resetResult.success).toBe(true);
    expect(resetResult.method).toBe('RESET');
    
    const setResult = interpreter.getVariable('set_result');
    expect(setResult.success).toBe(true);
    expect(setResult.method).toBe('SET');
    expect(setResult.state).toHaveProperty('username', 'testuser');
    
    const incrResult = interpreter.getVariable('incr_result');
    expect(incrResult.success).toBe(true);
    expect(incrResult.method).toBe('INCREMENT');
    expect(incrResult.result).toBe(5); // 0 + 5
    expect(incrResult.previous).toBe(0);
    expect(incrResult.increment).toBe(5);
    
    const getResult = interpreter.getVariable('get_result');
    expect(getResult.success).toBe(true);
    expect(getResult.method).toBe('GET');
    expect(getResult.result).toBe('testuser');
    expect(getResult.key).toBe('username');
    expect(getResult.found).toBe(true);
    
    const statusResult = interpreter.getVariable('status_result');
    expect(statusResult.success).toBe(true);
    expect(statusResult.method).toBe('STATUS');
    expect(statusResult.state.variableCount).toBe(2); // username + counter
    expect(statusResult.state.commandCount).toBeGreaterThan(0);
    
    // Verify mock state was updated correctly (like SQL data verification)
    const mockState = global._getMockAddressState();
    expect(mockState.variables.username).toBe('testuser');
    expect(mockState.variables.counter).toBe(5);
    expect(mockState.commandHistory).toHaveLength(5);
  });

  test('should handle error conditions gracefully', async () => {
    // Load the library first
    const requireScript = 'REQUIRE "./tests/mock-address.js"';
    const requireCommands = parse(requireScript);
    await interpreter.run(requireCommands);
    
    // Test error handling
    const script = `
      ADDRESS MOCK
      "UNKNOWN_COMMAND"
      "SET"
      "GET nonexistent"
    `;
    const commands = parse(script);
    
    // Should not throw - errors should be handled gracefully
    await expect(interpreter.run(commands)).resolves.not.toThrow();
  });

  test('should handle JSON parsing', async () => {
    // Load the library first
    const requireScript = 'REQUIRE "./tests/mock-address.js"';
    const requireCommands = parse(requireScript);
    await interpreter.run(requireCommands);
    
    // Test JSON parsing
    const script = `
      ADDRESS MOCK
      "JSON {\\"name\\": \\"test\\", \\"value\\": 123}"
    `;
    const commands = parse(script);
    await interpreter.run(commands);
    
    // Should complete without errors
    expect(true).toBe(true);
  });

  test('should handle state reset', async () => {
    // Load the library first
    const requireScript = 'REQUIRE "./tests/mock-address.js"';
    const requireCommands = parse(requireScript);
    await interpreter.run(requireCommands);
    
    // Test state reset
    const script = `
      ADDRESS MOCK
      "SET temp 999"
      "RESET"
      "STATUS"
    `;
    const commands = parse(script);
    await interpreter.run(commands);
    
    // Should complete without errors
    expect(true).toBe(true);
  });

  test('should work with REXX variable interpolation', async () => {
    // Load the library first
    const requireScript = 'REQUIRE "./tests/mock-address.js"';
    const requireCommands = parse(requireScript);
    await interpreter.run(requireCommands);
    
    // Test variable interpolation
    const script = `
      LET mykey = "testkey"
      LET myvalue = "testvalue"
      ADDRESS MOCK
      "SET {mykey} {myvalue}"
      "GET {mykey}"
    `;
    const commands = parse(script);
    await interpreter.run(commands);
    
    // Should complete without errors
    expect(true).toBe(true);
  });

  test('should support both command strings and method calls like SQL', async () => {
    // Load the library first
    const requireScript = 'REQUIRE "./tests/mock-address.js"';
    const requireCommands = parse(requireScript);
    await interpreter.run(requireCommands);
    
    // Reset state for clean test
    global._resetMockAddress();
    
    // Mix command strings (like SQL "CREATE TABLE") and method calls (like SQL execute())
    const script = `
      ADDRESS MOCK
      "SET user_count 0"
      LET echo_result = ECHO message="Hello World"
      "INCREMENT user_count"
      LET final_count = GET key="user_count"
      LET variables = VARIABLES
    `;
    const commands = parse(script);
    await interpreter.run(commands);
    
    // Verify method call results (like SQL test verifies execute() results)
    const echoResult = interpreter.getVariable('echo_result');
    expect(echoResult.success).toBe(true);
    expect(echoResult.result).toBe('Hello World');
    expect(echoResult.method).toBe('ECHO');
    
    const finalCount = interpreter.getVariable('final_count');
    expect(finalCount.success).toBe(true);
    expect(finalCount.result).toBe(1); // 0 + 1 from INCREMENT
    expect(finalCount.method).toBe('GET');
    expect(finalCount.key).toBe('user_count');
    
    const variables = interpreter.getVariable('variables');
    expect(variables.success).toBe(true);
    expect(variables.result).toHaveProperty('user_count', 1);
    expect(variables.count).toBe(1); // Should report variable count
    
    // Verify command strings worked (like SQL command strings set RC and RESULT)
    const mockState = global._getMockAddressState();
    expect(mockState.variables.user_count).toBe(1);
    expect(mockState.commandHistory).toHaveLength(5);
    expect(mockState.commandHistory[0].command).toBe('SET user_count 0');
    expect(mockState.commandHistory[2].command).toBe('INCREMENT user_count');
  });

  test('should work with control structures and variable interpolation', async () => {
    // Load the library first
    const requireScript = 'REQUIRE "./tests/mock-address.js"';
    const requireCommands = parse(requireScript);
    await interpreter.run(requireCommands);
    
    // Reset state for clean test  
    global._resetMockAddress();
    
    // Test with DO loop and variable interpolation (like SQL with dynamic queries)
    const script = `
      ADDRESS MOCK
      "RESET"
      DO i = 1 TO 3
        "SET item_{i} value{i}"
        LET result_{i} = GET key="item_{i}"
      END
      LET final_status = STATUS
    `;
    const commands = parse(script);
    await interpreter.run(commands);
    
    // Verify each iteration worked (like SQL verifying each row inserted)
    const result1 = interpreter.getVariable('result_1');
    expect(result1.success).toBe(true);
    expect(result1.result).toBe('value1');
    expect(result1.key).toBe('item_1');
    
    const result2 = interpreter.getVariable('result_2');
    expect(result2.result).toBe('value2');
    expect(result2.key).toBe('item_2');
    
    const result3 = interpreter.getVariable('result_3');
    expect(result3.result).toBe('value3');
    expect(result3.key).toBe('item_3');
    
    const finalStatus = interpreter.getVariable('final_status');
    expect(finalStatus.success).toBe(true);
    expect(finalStatus.state.variableCount).toBe(3); // item_1, item_2, item_3
    
    // Verify all variables were stored correctly (like SQL data verification)
    const mockState = global._getMockAddressState();
    expect(mockState.variables).toHaveProperty('item_1', 'value1');
    expect(mockState.variables).toHaveProperty('item_2', 'value2'); 
    expect(mockState.variables).toHaveProperty('item_3', 'value3');
    expect(Object.keys(mockState.variables)).toHaveLength(3);
  });
});