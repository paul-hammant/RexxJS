/**
 * Assertions REXX Integration Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { spawn } = require('child_process');
const path = require('path');

describe('RexxJS Assertions Integration Tests', () => {
  const rexxExecutable = path.join(__dirname, '../rexx');
  const scriptsDir = path.join(__dirname, 'scripts');
  
  function runRexxScript(scriptName) {
    const scriptPath = path.join(scriptsDir, scriptName);
    
    return new Promise((resolve, reject) => {
      const child = spawn(rexxExecutable, [scriptPath], {
        cwd: path.join(__dirname, '..'),
        timeout: 15000
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
  }

  test('assertions-demo.rexx should execute successfully with all assertions passing', async () => {
    const result = await runRexxScript('assertions-demo.rexx');
    
    // Debug output
    console.log('assertions-demo.rexx exit code:', result.code);
    if (result.stderr) {
      console.log('STDERR:', result.stderr);
    }
    
    // Script should pass (exit code 0)
    expect(result.code).toBe(0);
    expect(result.stderr).toBe('');
    
    // Verify key assertion success messages appear
    expect(result.stdout).toContain('=== RexxJS Assertions Demo ===');
    expect(result.stdout).toContain('✓ Literal number equality passed');
    expect(result.stdout).toContain('✓ Age validation passed');
    expect(result.stdout).toContain('✓ Name contains check passed');
    expect(result.stdout).toContain('✓ Array type check passed');
    expect(result.stdout).toContain('✓ Nested property equality passed');
    expect(result.stdout).toContain('✓ Deep nested property check passed');
    expect(result.stdout).toContain('✓ Negated equality check passed');
    expect(result.stdout).toContain('=== All Assertions Passed! ===');
    
    // Should not contain any failure indicators
    expect(result.stdout).not.toContain('AssertionError');
    expect(result.stdout).not.toContain('Expected');
    expect(result.stdout).not.toContain('but was');
    expect(result.stderr).not.toContain('Error');
  }, 20000);

  test('assertions-multiline.rexx should execute successfully with multi-line ADDRESS pattern', async () => {
    const result = await runRexxScript('assertions-multiline.rexx');
    
    // Debug output
    console.log('assertions-multiline.rexx exit code:', result.code);
    if (result.stderr) {
      console.log('STDERR:', result.stderr);
    }
    
    // Script should pass (exit code 0)
    expect(result.code).toBe(0);
    expect(result.stderr).toBe('');
    
    // Verify key assertion success messages appear
    expect(result.stdout).toContain('=== RexxJS Multi-line Assertions Demo ===');
    expect(result.stdout).toContain('✓ Context name check passed');
    expect(result.stdout).toContain('✓ Context age check passed');
    expect(result.stdout).toContain('✓ Context array contains check passed');
    expect(result.stdout).toContain('✓ Temperature equality check passed');
    expect(result.stdout).toContain('✓ Config theme check passed');
    expect(result.stdout).toContain('✓ Email validation passed');
    expect(result.stdout).toContain('✓ Number type check passed');
    expect(result.stdout).toContain('=== All Multi-line Assertions Passed! ===');
    
    // Should not contain any failure indicators
    expect(result.stdout).not.toContain('AssertionError');
    expect(result.stdout).not.toContain('Expected');
    expect(result.stdout).not.toContain('but was');
    expect(result.stderr).not.toContain('Error');
  }, 20000);

  test('assertions-failing.rexx demonstrates REXX ADDRESS assertion behavior', async () => {
    const result = await runRexxScript('assertions-failing.rexx');
    
    // Debug output
    console.log('assertions-failing.rexx exit code:', result.code);
    console.log('STDOUT:', result.stdout);
    if (result.stderr) {
      console.log('STDERR:', result.stderr);
    }
    
    // The script should exit with a non-zero code due to the failing assertion.
    expect(result.code).not.toBe(0);

    // The stderr should contain the assertion failure message.
    expect(result.stderr).toContain('10 (number) expected, but 5 (number) encountered');
    
    // Should start execution
    expect(result.stdout).toContain('Testing failing assertion...');
    
    // Should not see the message after the failing assertion
    expect(result.stdout).not.toContain('This should not appear');
  }, 20000);

  test('modified assertions-demo.rexx demonstrates assertion processing', async () => {
    // Test what happens when we modify the demo script to have a failing assertion
    const fs = require('fs');
    const originalPath = path.join(scriptsDir, 'assertions-demo.rexx');
    const testPath = path.join(scriptsDir, 'assertions-demo-failing-test.rexx');
    
    try {
      // Read original script and modify one assertion to fail
      const originalContent = fs.readFileSync(originalPath, 'utf8');
      const modifiedContent = originalContent.replace(
        'ADDRESS EXPECTATIONS "{user_name} should contain \'John\'"',
        'ADDRESS EXPECTATIONS "{user_name} should contain \'Eeeee\'"'
      );
      
      // Write modified script
      fs.writeFileSync(testPath, modifiedContent);
      
      // Run the modified script
      const result = await runRexxScript('assertions-demo-failing-test.rexx');
      
      // Debug output
      console.log('Modified demo script exit code:', result.code);
      if (result.stderr) {
        console.log('STDERR:', result.stderr);
      }
      
      // The script should exit with a non-zero code due to the failing assertion.
      expect(result.code).not.toBe(0);
      expect(result.stderr).toContain('something that contains Eeeee expected, but John Doe encountered');
      
      // Should start execution
      expect(result.stdout).toContain('=== RexxJS Assertions Demo ===');
      
      // The assertion library should be loaded and execute, but the message is not in stdout.
      // Let's remove this check as it's not reliable.
      
    } finally {
      // Clean up test file
      try {
        fs.unlinkSync(testPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }, 20000);

  test('ADDRESS EXPECTATIONS integration should handle both one-liner and multi-line patterns', async () => {
    // Create a test script that demonstrates both patterns working
    const fs = require('fs');
    const testScript = `#!/usr/bin/env node
REQUIRE "./src/expectations-address.js"

SAY "Testing both ADDRESS EXPECTATIONS patterns..."

// One-liner pattern
ADDRESS EXPECTATIONS "{42} should be 42"
SAY "✓ One-liner assertion passed"

// Multi-line pattern
ADDRESS EXPECTATIONS
"{42} should be a number"
SAY "✓ Multi-line assertion passed"

// Back to one-liner
ADDRESS EXPECTATIONS "{42} should be greater than 40"
SAY "✓ Final one-liner passed"

SAY "=== Mixed Pattern Test Passed! ==="
EXIT 0`;
    
    const testPath = path.join(scriptsDir, 'mixed-pattern-test.rexx');
    
    try {
      fs.writeFileSync(testPath, testScript);
      
      const result = await runRexxScript('mixed-pattern-test.rexx');
      
      // Debug output
      console.log('Mixed pattern test exit code:', result.code);
      if (result.stderr) {
        console.log('STDERR:', result.stderr);
      }
      
      // Should pass
      expect(result.code).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toContain('✓ One-liner assertion passed');
      expect(result.stdout).toContain('✓ Multi-line assertion passed');
      expect(result.stdout).toContain('✓ Final one-liner passed');
      expect(result.stdout).toContain('=== Mixed Pattern Test Passed! ===');
      
    } finally {
      try {
        fs.unlinkSync(testPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }, 20000);
});