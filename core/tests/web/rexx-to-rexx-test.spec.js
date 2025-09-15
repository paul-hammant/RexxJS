/**
 * Rexx-to-Rexx Test
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { test, expect } = require('@playwright/test');

test.describe('Rexx-to-Rexx Raw Code Transmission', () => {
  
  test('should load all 6 iframes including Rexx-to-Rexx pair', async ({ page }) => {
    // Navigate to the multi-instance test harness
    await page.goto('/tests/web/test-harness-multi-instance.html');
    
    // Wait for all 6 iframes to be present
    await expect(page.locator('#rexx-alpha')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#calculator-1')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#rexx-gamma')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#calculator-c')).toBeVisible({ timeout: 10000 });
    
    // Rexx-to-Rexx pair
    await expect(page.locator('#rexx-epsilon')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#rexx-service')).toBeVisible({ timeout: 10000 });
    
    // Wait for all services to be ready
    await expect(page.locator('#communication-log')).toContainText('All frames loaded - Multi-instance service mesh ready!', { timeout: 15000 });
    
    // Verify new topology is displayed
    await expect(page.locator('#communication-log')).toContainText('rexx-epsilon (client) → rexx-interpreter-service (Raw Rexx)');
  });

  test('should demonstrate raw Rexx code transmission and execution', async ({ page }) => {
    // Navigate to the multi-instance test harness
    await page.goto('/tests/web/test-harness-multi-instance.html');
    
    // Wait for all frames to load
    await expect(page.locator('#communication-log')).toContainText('All frames loaded', { timeout: 15000 });
    
    // Get frame locators for the Rexx-to-Rexx pair
    const clientFrame = page.frameLocator('#rexx-epsilon');
    const serviceFrame = page.frameLocator('#rexx-service');
    
    // Wait for both apps to be ready
    await expect(clientFrame.locator('text=Rexx-to-Rexx client ready!')).toBeVisible({ timeout: 10000 });
    await expect(serviceFrame.locator('text=Rexx Interpreter Service ready!')).toBeVisible({ timeout: 10000 });
    
    // Load the simple test script in the client
    await clientFrame.locator('#test-simple').click();
    await expect(clientFrame.locator('#rexx-script')).toContainValue('LET x = 7');
    
    // Send the Rexx code for remote execution
    await clientFrame.locator('#send-rexx').click();
    
    // Wait for execution to complete
    await expect(clientFrame.locator('text=Remote execution completed!')).toBeVisible({ timeout: 15000 });
    
    // Verify the client shows successful execution
    await expect(clientFrame.locator('#output')).toContainText('✅ Syntax valid');
    await expect(clientFrame.locator('#output')).toContainText('📡 Sending raw Rexx code');
    await expect(clientFrame.locator('#output')).toContainText('✅ Remote execution completed!');
    
    // Verify the service shows the execution
    await expect(serviceFrame.locator('#execution-log')).toContainText('📥 Received raw Rexx code');
    await expect(serviceFrame.locator('#execution-log')).toContainText('✅ Execution completed successfully!');
    await expect(serviceFrame.locator('#execution-log')).toContainText('SAY: The answer to everything: 42');
    
    // Check that the main communication log shows the routing
    const mainLog = page.locator('#communication-log');
    await expect(mainLog).toContainText('🔴 RAW REXX REQUEST');
    await expect(mainLog).toContainText('✅ ROUTED RAW REXX TO: rexx-interpreter-service');
    await expect(mainLog).toContainText('🔴 RAW REXX RESPONSE');
    await expect(mainLog).toContainText('✅ Remote Rexx execution completed');
  });

  test('should handle error cases in raw Rexx transmission', async ({ page }) => {
    // Navigate to the multi-instance test harness
    await page.goto('/tests/web/test-harness-multi-instance.html');
    
    // Wait for all frames to load
    await expect(page.locator('#communication-log')).toContainText('All frames loaded', { timeout: 15000 });
    
    // Get frame locators for the Rexx-to-Rexx pair
    const clientFrame = page.frameLocator('#rexx-epsilon');
    const serviceFrame = page.frameLocator('#rexx-service');
    
    // Wait for both apps to be ready
    await expect(clientFrame.locator('text=Rexx-to-Rexx client ready!')).toBeVisible({ timeout: 10000 });
    
    // Put invalid Rexx code in the textarea
    await clientFrame.locator('#rexx-script').fill('INVALID REXX CODE WITH SYNTAX ERROR');
    
    // Try to send the invalid code
    await clientFrame.locator('#send-rexx').click();
    
    // Should get a local syntax validation error
    await expect(clientFrame.locator('#output')).toContainText('❌ Remote execution failed', { timeout: 10000 });
  });

  test('should show service capabilities', async ({ page }) => {
    // Navigate to the multi-instance test harness
    await page.goto('/tests/web/test-harness-multi-instance.html');
    
    // Wait for all frames to load
    await expect(page.locator('#communication-log')).toContainText('All frames loaded', { timeout: 15000 });
    
    // Get frame locator for the service
    const serviceFrame = page.frameLocator('#rexx-service');
    
    // Wait for service to be ready
    await expect(serviceFrame.locator('text=Rexx Interpreter Service ready!')).toBeVisible({ timeout: 10000 });
    
    // Click show capabilities button
    await serviceFrame.locator('#show-capabilities').click();
    
    // Verify capabilities are displayed
    await expect(serviceFrame.locator('#execution-log')).toContainText('=== REXX INTERPRETER SERVICE CAPABILITIES ===');
    await expect(serviceFrame.locator('#execution-log')).toContainText('📡 Protocol: Raw Rexx code transmission via postMessage');
    await expect(serviceFrame.locator('#execution-log')).toContainText('⚡ Execution: Full Rexx language support with DOM interop');
    await expect(serviceFrame.locator('#execution-log')).toContainText('🔒 Security: Sandboxed iframe execution environment');
  });
});