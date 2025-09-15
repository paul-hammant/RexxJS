/**
 * Tests for REQUIRE system loading ADDRESS target libraries
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('REQUIRE ADDRESS Target Libraries', () => {
  let interpreter;
  
  beforeEach(() => {
    const mockAddressSender = {
      send: async (namespace, method, params) => {
        // Mock fallback address sender that should not be called when ADDRESS targets are registered
        throw new Error(`Fallback AddressSender called for ${namespace}.${method} - ADDRESS target should handle this`);
      }
    };
    
    const outputHandler = {
      writeLine: (text) => console.log(text),
      output: (text) => console.log(text)
    };
    
    interpreter = new Interpreter(mockAddressSender, outputHandler);
  });
  
  test('should load calculator service library and register ADDRESS target', async () => {
    // Load the calculator service library  
    const requireScript = 'REQUIRE "./tests/test-libs/calculator-service.js"';
    const requireCommands = parse(requireScript);
    
    await interpreter.run(requireCommands);
    
    // Verify ADDRESS target was registered
    expect(interpreter.addressTargets.has('calculator')).toBe(true);
    
    const calculatorTarget = interpreter.addressTargets.get('calculator');
    expect(calculatorTarget).toBeDefined();
    expect(typeof calculatorTarget.handler).toBe('function');
    expect(calculatorTarget.methods).toBeDefined();
    expect(calculatorTarget.metadata.libraryName).toBe('./tests/test-libs/calculator-service.js');
  });
  
  test('should use ADDRESS target for method calls after ADDRESS statement', async () => {
    // Load the calculator service library
    await interpreter.run(parse('REQUIRE "./tests/test-libs/calculator-service.js"'));
    
    // Use ADDRESS to switch to calculator namespace and call method
    const script = `
      ADDRESS calculator
      LET result = add a=5 b=3
    `;
    
    const commands = parse(script);
    await interpreter.run(commands);
    
    // Verify the result from the ADDRESS target
    const result = interpreter.getVariable('result');
    expect(result).toBeDefined();
    expect(result.operation).toBe('add');
    expect(result.result).toBe(8);
    expect(result.operands).toEqual([5, 3]);
    expect(result.timestamp).toBeDefined();
  });
  
  test('should handle multiple operations with ADDRESS target', async () => {
    // Load calculator service
    await interpreter.run(parse('REQUIRE "./tests/test-libs/calculator-service.js"'));
    
    // Perform multiple calculator operations
    const script = `
      ADDRESS calculator
      LET sum = add a=10 b=20
      LET diff = subtract a=50 b=30  
      LET product = multiply a=6 b=7
      LET quotient = divide a=100 b=4
      LET power = power base=2 exponent=3
      LET sqrt_val = sqrt value=16
    `;
    
    await interpreter.run(parse(script));
    
    // Verify all operations
    expect(interpreter.getVariable('sum').result).toBe(30);
    expect(interpreter.getVariable('diff').result).toBe(20);
    expect(interpreter.getVariable('product').result).toBe(42);
    expect(interpreter.getVariable('quotient').result).toBe(25);
    expect(interpreter.getVariable('power').result).toBe(8);
    expect(interpreter.getVariable('sqrt_val').result).toBe(4);
  });
  
  test('should handle ADDRESS target errors appropriately', async () => {
    // Load calculator service  
    await interpreter.run(parse('REQUIRE "./tests/test-libs/calculator-service.js"'));
    
    // Test division by zero error
    const script = `
      ADDRESS calculator
      LET result = divide a=10 b=0
    `;
    
    const commands = parse(script);
    
    await expect(interpreter.run(commands)).rejects.toThrow('Division by zero');
  });
  
  test('should handle unknown ADDRESS target methods', async () => {
    // Load calculator service
    await interpreter.run(parse('REQUIRE "./tests/test-libs/calculator-service.js"'));
    
    // Try to call non-existent method
    const script = `
      ADDRESS calculator
      LET result = unknown_method param=123
    `;
    
    const commands = parse(script);
    
    await expect(interpreter.run(commands)).rejects.toThrow('Unknown calculator method: unknown_method');
  });
  
  test('should get service status from ADDRESS target', async () => {
    // Load calculator service
    await interpreter.run(parse('REQUIRE "./tests/test-libs/calculator-service.js"'));
    
    // Get service status
    const script = `
      ADDRESS calculator
      LET status = status()
    `;
    
    await interpreter.run(parse(script));
    
    const status = interpreter.getVariable('status');
    expect(status.service).toBe('calculator');
    expect(status.version).toBe('1.0.0'); 
    expect(status.methods).toContain('add');
    expect(status.methods).toContain('subtract');
    expect(status.timestamp).toBeDefined();
  });
  
  test('should fall back to Address Sender for unregistered ADDRESS targets', async () => {
    // Don't load any ADDRESS target libraries
    
    // Mock Address Sender to verify it gets called
    const mockAddressSender = {
      send: async (namespace, method, params) => {
        return { rpc_called: true, namespace, method, params };
      }
    };
    
    interpreter.addressSender = mockAddressSender;
    
    // Use unregistered ADDRESS target
    const script = `
      ADDRESS unregistered_service
      LET result = some_method param=value
    `;
    
    await interpreter.run(parse(script));
    
    const result = interpreter.getVariable('result');
    expect(result.rpc_called).toBe(true);
    expect(result.namespace).toBe('unregistered_service');
    expect(result.method).toBe('some_method');
  });
  
  test('should switch between ADDRESS targets and fallback RPC', async () => {
    // Load calculator service
    await interpreter.run(parse('REQUIRE "./tests/test-libs/calculator-service.js"'));
    
    // Mock Address Sender for non-registered targets
    const mockAddressSender = {
      send: async (namespace, method, params) => {
        return { rpc_result: `${namespace}.${method}`, params };
      }
    };
    
    interpreter.addressSender = mockAddressSender;
    
    const script = `
      ADDRESS calculator
      LET calc_result = add a=1 b=2
      
      ADDRESS other_service  
      LET rpc_result = other_method value=test
      
      ADDRESS calculator
      LET calc_result2 = multiply a=3 b=4
    `;
    
    await interpreter.run(parse(script));
    
    // Verify calculator ADDRESS target was used
    expect(interpreter.getVariable('calc_result').result).toBe(3);
    expect(interpreter.getVariable('calc_result2').result).toBe(12);
    
    // Verify RPC fallback was used for unregistered service
    expect(interpreter.getVariable('rpc_result').rpc_result).toBe('other_service.other_method');
  });
});