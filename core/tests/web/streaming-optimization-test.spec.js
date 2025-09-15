/**
 * Streaming Optimization Test
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { test, expect } = require('@playwright/test');

test.describe('Streaming Controller Performance', () => {
  test('should have optimized logging with reduced output volume', async ({ page }) => {
    // Navigate to streaming controller test harness
    await page.goto('/tests/web/streaming-controller.html');
    
    // Wait for initialization
    await page.waitForSelector('#controller-log', { timeout: 5000 });
    
    // Click DOM Introspection button
    await page.click('button:has-text("DOM Introspection")');
    
    // Wait for execution to complete (look for final discovery message)
    await page.waitForFunction(() => {
      const log = document.getElementById('controller-log');
      return log && log.textContent.includes('Introspection complete');
    }, { timeout: 15000 });
    
    // Check that log output is optimized (should be much less than 1900+ lines)
    const logContent = await page.textContent('#controller-log');
    const logLines = logContent.split('\n').filter(line => line.trim().length > 0);
    
    console.log(`Log lines: ${logLines.length}`);
    
    // Should have significantly fewer log lines than before (< 50 instead of 1900+)
    expect(logLines.length).toBeLessThan(100);
    
    // Should still show progress updates
    expect(logContent).toMatch(/Progress: \d+ buttons discovered/);
    
    // Should show completion message
    expect(logContent).toMatch(/Introspection complete: \d+ buttons discovered with optimized logging/);
    
    // Should show final API advice
    expect(logContent).toMatch(/Generated API Advice/);
  });
});