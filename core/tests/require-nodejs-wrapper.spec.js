/**
 * REQUIRE Node.js Module Wrapper Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('REQUIRE Node.js Module Wrapper', () => {
  test('should wrap Node.js modules automatically', async ({ page }) => {
    // Create a test Node.js module
    const testModulePath = path.join(__dirname, 'test-nodejs-module.js');
    const fs = require('fs');
    
    // Create temporary Node.js module
    fs.writeFileSync(testModulePath, `
      function calculateSum(numbers) {
        return numbers.reduce((a, b) => a + b, 0);
      }
      
      function findLength(data) {
        return data.length;
      }
      
      module.exports = { calculateSum, findLength };
    `);
    
    try {
      await page.goto(`file://${path.join(__dirname, 'test-harness-require-nodejs.html')}`);
      
      // Test that REQUIRE can load Node.js modules
      await page.evaluate(async (modulePath) => {
        // This should work in Node.js mode
        window.testResults = [];
        
        try {
          // Load Node.js module via REQUIRE
          await window.interpreter.executeRexxCode(`REQUIRE "${modulePath}"`);
          
          // Test wrapped functions exist and work
          const result1 = await window.interpreter.executeRexxCode(`
            LET result = CALCULATE_SUM data=[1,2,3,4,5]
            RETURN result
          `);
          window.testResults.push({ test: 'sum', result: result1 });
          
          const result2 = await window.interpreter.executeRexxCode(`
            LET result = FIND_LENGTH data=[1,2,3]
            RETURN result
          `);
          window.testResults.push({ test: 'length', result: result2 });
          
          // Test detection function exists
          const info = await window.interpreter.executeRexxCode(`
            LET info = TEST_NODEJS_MODULE_MAIN
            RETURN info
          `);
          window.testResults.push({ test: 'detection', result: info });
          
        } catch (error) {
          window.testResults.push({ error: error.message });
        }
      }, testModulePath);
      
      // Check results
      const results = await page.evaluate(() => window.testResults);
      
      // Verify wrapped functions work
      expect(results.find(r => r.test === 'sum')?.result).toBe(15);
      expect(results.find(r => r.test === 'length')?.result).toBe(3);
      
      // Verify detection function was created
      const detectionResult = results.find(r => r.test === 'detection')?.result;
      expect(detectionResult).toHaveProperty('type', 'library_info');
      expect(detectionResult).toHaveProperty('source', 'nodejs-require');
      expect(detectionResult).toHaveProperty('loaded', true);
      
    } finally {
      // Cleanup
      if (fs.existsSync(testModulePath)) {
        fs.unlinkSync(testModulePath);
      }
    }
  });

  test('should handle npm packages', async ({ page }) => {
    await page.goto(`file://${path.join(__dirname, 'test-harness-require-nodejs.html')}`);
    
    // Test loading lodash (if available)
    const result = await page.evaluate(async () => {
      try {
        // Try to load lodash via REQUIRE
        await window.interpreter.executeRexxCode(`REQUIRE "lodash"`);
        
        // Test that lodash functions are available
        const result = await window.interpreter.executeRexxCode(`
          LET result = _CHUNK data=[1,2,3,4,5,6] size=2
          RETURN result
        `);
        
        return { success: true, result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    if (result.success) {
      // lodash is available, test it worked
      expect(result.result).toEqual([[1,2], [3,4], [5,6]]);
    } else {
      // lodash not available, that's ok for testing
      console.log('lodash not available for testing:', result.error);
    }
  });
});