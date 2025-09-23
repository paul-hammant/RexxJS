/**
 * Pyodide ADDRESS Handler Test
 * 
 * Tests the RexxJS REQUIRE mechanism resolution chain:
 * 1. Publisher registry (https://rexxjs.org/.list-of-public-lib-publishers.txt)
 * 2. Module registry (https://raw.githubusercontent.com/RexxJS/dist/refs/heads/latest/registry.txt)
 * 3. Bundle (https://raw.githubusercontent.com/RexxJS/dist/refs/heads/latest/addresses/pyodide-address.bundle.js)
 * 
 * Copyright (c) 2025 RexxJS Project
 * Licensed under the MIT License
 */

const { test, expect } = require('@playwright/test');

test('Pyodide ADDRESS handler via REQUIRE mechanism', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  console.log('Navigating to Pyodide test harness...');
  await page.goto('/tests/web/test-harness-pyodide.html');
  
  console.log('Waiting for page title...');
  await expect(page).toHaveTitle('Pyodide ADDRESS Test Harness');
  
  console.log('Checking for test elements...');
  const runButton = await page.locator('#runBtn');
  const logOutput = await page.locator('#log');
  const statusElement = await page.locator('#status');
  
  await expect(runButton).toBeVisible();
  await expect(logOutput).toBeVisible();
  await expect(statusElement).toBeVisible();
  
  console.log('Waiting for initial status...');
  await expect(statusElement).toContainText('Ready to run test');
  
  console.log('Clicking run button to execute Pyodide test...');
  await runButton.click();
  
  // Wait for the test to start
  console.log('Waiting for test execution to begin...');
  await expect(statusElement).toContainText('Executing', { timeout: 10000 });
  
  // Wait for completion (this may take a while due to Pyodide download)
  console.log('Waiting for test completion...');
  await expect(statusElement).toContainText('successfully', { timeout: 60000 });
  
  // Check that the log contains expected output
  console.log('Verifying log output...');
  const logContent = await logOutput.textContent();
  
  // Verify the REQUIRE resolution chain worked
  expect(logContent).toContain('Pyodide address handler loaded');
  expect(logContent).toContain('Switched to Pyodide address');
  expect(logContent).toContain('Hello from Python!');
  expect(logContent).toContain('The answer is 42');
  expect(logContent).toContain('Test completed successfully!');
  expect(logContent).toContain('✓ Pyodide ADDRESS handler test PASSED');
  
  console.log('All assertions passed!');
});

test('REQUIRE mechanism resolution chain verification', async ({ page }) => {
  // Enable console logging  
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  console.log('Testing REQUIRE resolution chain...');
  await page.goto('/tests/web/test-harness-pyodide.html');
  
  // Inject test script to verify resolution chain
  await page.evaluate(() => {
    window.testResolutionChain = async () => {
      try {
        // Test 1: Check publisher registry is accessible
        const publisherResponse = await fetch('https://rexxjs.org/.list-of-public-lib-publishers.txt');
        if (!publisherResponse.ok) {
          throw new Error('Publisher registry not accessible');
        }
        console.log('✓ Publisher registry accessible');
        
        // Test 2: Check module registry is accessible  
        const moduleResponse = await fetch('https://raw.githubusercontent.com/RexxJS/dist/refs/heads/latest/registry.txt');
        if (!moduleResponse.ok) {
          throw new Error('Module registry not accessible');
        }
        console.log('✓ Module registry accessible');
        
        // Test 3: Check Pyodide bundle is accessible
        const bundleResponse = await fetch('https://raw.githubusercontent.com/RexxJS/dist/refs/heads/latest/addresses/pyodide-address.bundle.js');
        if (!bundleResponse.ok) {
          throw new Error('Pyodide bundle not accessible');
        }
        
        // Test 4: Verify @rexxjs-meta is in bundle
        const bundleContent = await bundleResponse.text();
        if (!bundleContent.includes('@rexxjs-meta')) {
          throw new Error('@rexxjs-meta not found in bundle');
        }
        
        // Test 5: Verify canonical namespace is correct
        if (!bundleContent.includes('org.rexxjs/pyodide-address')) {
          throw new Error('Canonical namespace not found in bundle');
        }
        
        console.log('✓ Pyodide bundle accessible and contains metadata');
        console.log('✓ All resolution chain components verified');
        
        return true;
      } catch (error) {
        console.error('Resolution chain verification failed:', error.message);
        return false;
      }
    };
  });
  
  // Run the resolution chain test
  console.log('Running resolution chain verification...');
  const chainVerified = await page.evaluate(() => window.testResolutionChain());
  
  expect(chainVerified).toBe(true);
  console.log('Resolution chain verification completed successfully!');
});