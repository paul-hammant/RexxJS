/**
 * DOM Basic Test
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { test, expect } = require('@playwright/test');

test('basic page load test', async ({ page }) => {
  // Try to load the page
  console.log('Navigating to test page...');
  await page.goto('/tests/web/test-harness-dom-stale.html');
  
  console.log('Waiting for title...');
  await expect(page).toHaveTitle('Rexx DOM Element Manager Test Harness');
  
  console.log('Checking for textarea...');
  const textarea = await page.locator('#rexx-script');
  await expect(textarea).toBeVisible();
  
  console.log('Test passed!');
});