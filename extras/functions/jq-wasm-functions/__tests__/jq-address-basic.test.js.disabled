/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

describe('jq ADDRESS Library Basic Tests', () => {
  test('should load without errors', () => {
    // Mock jq-wasm 
    global.jq = {
      raw: jest.fn(),
      json: jest.fn(),
      version: jest.fn().mockReturnValue('jq-1.6')
    };

    // Load the source file
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(path.join(__dirname, '../src/jq-address.js'), 'utf8');
    
    // Execute it in Node.js environment
    expect(() => {
      eval(source);
    }).not.toThrow();
    
    // Check that globals are set
    expect(global.JQ_ADDRESS_MAIN).toBeDefined();
    expect(global.ADDRESS_JQ_HANDLER).toBeDefined();
    expect(global.ADDRESS_JQ_METHODS).toBeDefined();
    
    // Test metadata function
    const metadata = global.JQ_ADDRESS_MAIN();
    expect(metadata.type).toBe('address-target');
    expect(metadata.provides.addressTarget).toBe('jq');
    
    delete global.jq;
    delete global.JQ_ADDRESS_MAIN;
    delete global.ADDRESS_JQ_HANDLER; 
    delete global.ADDRESS_JQ_METHODS;
  });

  test('should have proper rexxjs-meta comment', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(path.join(__dirname, '../src/jq-address.js'), 'utf8');
    
    expect(source).toContain('@rexxjs-meta');
    expect(source).toContain('"dependencies":{"jq-wasm":"1.1.0-jq-1.8.1"}');
    expect(source).toContain('jq-address v1.0.0');
  });

  test('should export functions for both Node.js and browser', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(path.join(__dirname, '../src/jq-address.js'), 'utf8');
    
    // Should have exports for both environments
    expect(source).toContain('typeof window !== \'undefined\'');
    expect(source).toContain('typeof global !== \'undefined\'');
    expect(source).toContain('JQ_ADDRESS_MAIN');
    expect(source).toContain('ADDRESS_JQ_HANDLER');
    expect(source).toContain('ADDRESS_JQ_METHODS');
  });
});