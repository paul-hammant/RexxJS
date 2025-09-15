/**
 * Expectations REXX Demo Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { spawn } = require('child_process');
const path = require('path');

describe('RexxJS Expectations Demo Script', () => {
  
  test('should run expectations demo script successfully', async () => {
    const scriptPath = path.join(__dirname, 'scripts/simple-expectations-demo.js');
    const nodeCmd = 'node';
    
    const result = await new Promise((resolve, reject) => {
      const child = spawn(nodeCmd, [scriptPath], {
        cwd: path.join(__dirname, '..'),
        timeout: 10000
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        resolve({ code, stdout, stderr });
      });
      
      child.on('error', (error) => {
        reject(error);
      });
    });
    
    // Debug output
    console.log('Exit code:', result.code);
    console.log('STDOUT:');
    console.log(result.stdout);
    if (result.stderr) {
      console.log('STDERR:');
      console.log(result.stderr);
    }
    
    // Verify the script ran successfully
    expect(result.code).toBe(0);
    
    // Verify key expectation messages appear in output
    expect(result.stdout).toContain('RexxJS Expectations Demo');
    expect(result.stdout).toContain('✓ Literal number equality passed');
    expect(result.stdout).toContain('✓ Age validation passed');
    expect(result.stdout).toContain('✓ Name contains check passed');
    expect(result.stdout).toContain('✓ Array type check passed');
    expect(result.stdout).toContain('✓ Nested property equality passed');
    expect(result.stdout).toContain('✓ Deep nested property check passed');
    expect(result.stdout).toContain('✓ Negated equality check passed');
    expect(result.stdout).toContain('All Expectations Passed!');
    
    // Verify no expectation failures occurred
    expect(result.stdout).not.toContain('AssertionError');
    expect(result.stdout).not.toContain('Expected');
    expect(result.stdout).not.toContain('but was');
  }, 15000);
  
  test('should handle expectation failures gracefully', () => {
    // Use JavaScript approach since REXX REQUIRE has path issues
    const { ADDRESS_EXPECTATIONS_HANDLER, ExpectationError } = require('../src/expectations-address');
    
    // The handler now throws a synchronous error
    expect(() => ADDRESS_EXPECTATIONS_HANDLER('{5} should be 10')).toThrow(ExpectationError);
    expect(() => ADDRESS_EXPECTATIONS_HANDLER('{5} should be 10')).toThrow('EXPECTATIONS.execute: 10 (number) expected, but 5 (number) encountered');
  });

  test('should demonstrate context variable usage', async () => {
    // Use JavaScript approach since REXX REQUIRE has path issues  
    const { ADDRESS_EXPECTATIONS_HANDLER } = require('../src/expectations-address');
    
    // Define test data similar to what would be in REXX context
    const testContext = {
      user: { name: "Bob", age: 42, scores: [100, 95, 88] }
    };
    
    // Test context-based expectations
    let result1 = await ADDRESS_EXPECTATIONS_HANDLER('expect', { expression: '{user.name} should be "Bob"', context: testContext });
    expect(result1.success).toBe(true);
    
    let result2 = await ADDRESS_EXPECTATIONS_HANDLER('expect', { expression: '{user.age} should be greater than 40', context: testContext });
    expect(result2.success).toBe(true);
    
    let result3 = await ADDRESS_EXPECTATIONS_HANDLER('expect', { expression: '{user.scores} should contain 100', context: testContext });
    expect(result3.success).toBe(true);
    
    // Verify all expectations passed
    expect(result1.operation).toBe('EXPECTATION');
    expect(result2.operation).toBe('EXPECTATION');
    expect(result3.operation).toBe('EXPECTATION');
  }, 15000);
});