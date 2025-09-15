/**
 * Debug Introspection Test
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { test, expect } = require('@playwright/test');

test.describe('Debug SAY Output Issue', () => {
    test('should capture SAY output from introspection script', async ({ page }) => {
        // Navigate to test harness
        await page.goto('/tests/web/test-harness-streaming-control.html');
        
        // Wait for calculator to load in worker
        await page.waitForTimeout(2000);
        
        // Click introspect button
        await page.click('button:has-text("🔍 Introspect Calculator")');
        
        // Wait for execution
        await page.waitForTimeout(5000);
        
        // Check worker log for SAY output
        const workerLog = await page.frameLocator('iframe[src*="streaming-worker"]').locator('#worker-log').textContent();
        console.log('Worker Log:', workerLog);
        
        // Check controller log for SAY output  
        const controllerLog = await page.frameLocator('iframe[src*="streaming-controller"]').locator('#controller-log').textContent();
        console.log('Controller Log:', controllerLog);
        
        // Check main log
        const mainLog = await page.locator('#main-log').textContent();
        console.log('Main Log:', mainLog);
        
        // Verify that we see button discovery details somewhere
        const hasButtonDetails = workerLog.includes('Button') || controllerLog.includes('Button') || mainLog.includes('Button');
        console.log('Has button details:', hasButtonDetails);
        
        expect(hasButtonDetails).toBeTruthy();
    });
});