/**
 * Test for REXX procedure argument parsing bug
 * 
 * This test isolates the issue where PARSE ARG in procedures
 * doesn't correctly substitute variable names with their values
 * in string concatenation contexts.
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('REXX Procedure Argument Parsing', () => {
  const rexxExecutable = path.join(__dirname, '../rexx');
  
  function runRexxScript(scriptContent) {
    const testPath = path.join(__dirname, 'temp-procedure-test.rexx');
    
    return new Promise((resolve, reject) => {
      // Write test script
      fs.writeFileSync(testPath, scriptContent);
      
      const child = spawn(rexxExecutable, [testPath], {
        cwd: path.join(__dirname, '..'),
        timeout: 5000
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
        // Clean up test file
        try {
          fs.unlinkSync(testPath);
        } catch (e) {
          // Ignore cleanup errors
        }
        resolve({ code, stdout, stderr });
      });
      
      child.on('error', (error) => {
        // Clean up test file
        try {
          fs.unlinkSync(testPath);
        } catch (e) {
          // Ignore cleanup errors
        }
        reject(error);
      });
    });
  }

  test('PARSE ARG should correctly substitute argument values in string concatenation', async () => {
    const script = `
SAY "Testing REXX procedure arguments..."

CALL TestProcedure "Hello World"
CALL TestProcedure "Another Test"

EXIT 0

TestProcedure:
  PARSE ARG message
  SAY "Message: " || message
  SAY "Direct variable: " || message
RETURN
`;

    const result = await runRexxScript(script);
    
    // Debug output
    console.log('Procedure test exit code:', result.code);
    console.log('STDOUT:');
    console.log(result.stdout);
    if (result.stderr) {
      console.log('STDERR:', result.stderr);
    }
    
    // Script should execute successfully
    expect(result.code).toBe(0);
    
    // EXPECTED behavior: variable substitution should work
    expect(result.stdout).toContain('Message: Hello World');
    expect(result.stdout).toContain('Direct variable: Hello World');
    expect(result.stdout).toContain('Message: Another Test');
    expect(result.stdout).toContain('Direct variable: Another Test');
    
    // CURRENT BUGGY behavior: shows literal variable name instead of value
    // These assertions will FAIL, documenting the bug:
    expect(result.stdout).not.toContain('Message: message');
    expect(result.stdout).not.toContain('Direct variable: message');
  }, 10000);

  test('PARSE ARG with LET assignment should work correctly', async () => {
    const script = `
SAY "Testing PARSE ARG with LET assignment..."

CALL AssignmentTest "Test Value"

EXIT 0

AssignmentTest:
  PARSE ARG input_value
  LET stored_value = input_value
  SAY "Stored: " || stored_value
  SAY "Original: " || input_value
RETURN
`;

    const result = await runRexxScript(script);
    
    console.log('Assignment test exit code:', result.code);
    console.log('STDOUT:');
    console.log(result.stdout);
    
    expect(result.code).toBe(0);
    
    // Expected: proper variable substitution
    expect(result.stdout).toContain('Stored: Test Value');
    expect(result.stdout).toContain('Original: Test Value');
    
    // Should NOT show literal variable names
    expect(result.stdout).not.toContain('Stored: stored_value');
    expect(result.stdout).not.toContain('Original: input_value');
  }, 10000);

  test('procedure arguments should work in complex expressions', async () => {
    const script = `
SAY "Testing complex procedure argument expressions..."

CALL MathTest 5, 10

EXIT 0

MathTest:
  PARSE ARG x y
  LET sum = x + y
  LET product = x * y
  SAY "Arguments: " || x || " and " || y
  SAY "Sum: " || sum
  SAY "Product: " || product
RETURN
`;

    const result = await runRexxScript(script);
    
    console.log('Math test exit code:', result.code);
    console.log('STDOUT:');
    console.log(result.stdout);
    
    expect(result.code).toBe(0);
    
    // Expected: proper argument parsing and arithmetic
    expect(result.stdout).toContain('Arguments: 5 and 10');
    expect(result.stdout).toContain('Sum: 15');
    expect(result.stdout).toContain('Product: 50');
    
    // Should NOT show literal variable names
    expect(result.stdout).not.toContain('Arguments: x and y');
    expect(result.stdout).not.toContain('Sum: sum');
    expect(result.stdout).not.toContain('Product: product');
  }, 10000);
});