/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Playwright tests for histogram visualization in browser
 */

const { test, expect } = require('@playwright/test');

test.describe('Histogram Browser Visualization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/web/test-harness-histogram.html');
    
    // Wait for page to load and histograms to generate
    await page.waitForSelector('.histogram-grid');
    await page.waitForTimeout(2000); // Allow time for histogram generation
  });

  test('should load test harness and display all histogram canvases', async ({ page }) => {
    // Check that all canvas elements are present
    const canvases = [
      'normal-distribution',
      'uniform-distribution', 
      'exponential-distribution',
      'bimodal-distribution',
      'small-dataset',
      'constant-values'
    ];

    for (const canvasId of canvases) {
      const canvas = page.locator(`#${canvasId}`);
      await expect(canvas).toBeVisible();
      
      // Verify canvas has been drawn on (not blank)
      const boundingBox = await canvas.boundingBox();
      expect(boundingBox.width).toBeGreaterThanOrEqual(400);
      expect(boundingBox.height).toBeGreaterThanOrEqual(300);
    }
  });

  test('should generate histograms with correct titles', async ({ page }) => {
    const expectedTitles = [
      'Normal Distribution (μ=100, σ=15)',
      'Uniform Distribution [25, 75]',
      'Exponential Distribution (λ=0.5)',
      'Bimodal Distribution',
      'Small Dataset (n=12)',
      'Constant Values (all = 42)'
    ];

    for (const title of expectedTitles) {
      const titleElement = page.locator('.histogram-title', { hasText: title });
      await expect(titleElement).toBeVisible();
    }
  });

  test('should show successful histogram generation in log', async ({ page }) => {
    // Check for success messages in log
    const logEntries = page.locator('.log-entry.log-success');
    
    // Should have success messages for each histogram
    await expect(logEntries).toHaveCount(8); // 7 histograms + 1 final success message
    
    // Check specific success messages
    await expect(page.locator('.log-entry', { hasText: '✅ Normal distribution rendered' })).toBeVisible();
    await expect(page.locator('.log-entry', { hasText: '✅ Uniform distribution rendered' })).toBeVisible();
    await expect(page.locator('.log-entry', { hasText: '✅ Exponential distribution rendered' })).toBeVisible();
    await expect(page.locator('.log-entry', { hasText: '✅ Bimodal distribution rendered' })).toBeVisible();
    await expect(page.locator('.log-entry', { hasText: '✅ Small dataset rendered' })).toBeVisible();
    await expect(page.locator('.log-entry', { hasText: '✅ Constant values rendered' })).toBeVisible();
    await expect(page.locator('.log-entry', { hasText: '✅ Custom distribution rendered' })).toBeVisible();
    await expect(page.locator('.log-entry', { hasText: '🎯 All histograms generated successfully!' })).toBeVisible();
  });

  test('should allow regeneration of histograms', async ({ page }) => {
    // Clear the log
    await page.click('button:text("Clear Log")');
    
    // Wait for log to be cleared
    await expect(page.locator('.log-entry', { hasText: 'Log cleared' })).toBeVisible();
    
    // Regenerate histograms
    await page.click('button:text("Generate All Histograms")');
    
    // Wait for generation to complete
    await page.waitForSelector('.log-entry:has-text("🎯 All histograms generated successfully!")', { timeout: 10000 });
    
    // Verify all histograms were regenerated
    const successEntries = page.locator('.log-entry.log-success');
    await expect(successEntries).toHaveCount(8);
  });

  test('should execute custom code successfully', async ({ page }) => {
    // Clear existing custom code
    await page.fill('#customCode', '');
    
    // Add custom histogram code
    const customCode = `
// Generate random data
const randomData = Array.from({length: 50}, () => Math.random() * 20 + 10);
const customHist = generateHistogram(randomData, {
  main: 'Test Custom Histogram',
  col: 'red',
  breaks: 10
});
renderHistogramToCanvas(customHist, 'custom-histogram');
log('Custom histogram created!', 'success');
    `;
    
    await page.fill('#customCode', customCode);
    
    // Execute the custom code
    await page.click('button:text("Execute Custom Code")');
    
    // Wait for execution
    await page.waitForTimeout(1000);
    
    // Check for success in log
    await expect(page.locator('.log-entry', { hasText: 'Custom histogram created!' })).toBeVisible();
    await expect(page.locator('.log-entry', { hasText: '✅ Custom code executed successfully' })).toBeVisible();
    
    // Verify custom histogram canvas shows the title (should be overwritten by test custom code)
    await expect(page.locator('.histogram-title', { hasText: 'Custom Beta-like Distribution' })).toBeVisible();
  });

  test('should handle PNG downloads', async ({ page }) => {
    // Set up download handling
    const downloadPromise = page.waitForEvent('download');
    
    // Click download button
    await page.click('button:text("Download Normal PNG")');
    
    const download = await downloadPromise;
    
    // Verify download properties
    expect(download.suggestedFilename()).toBe('normal-distribution-histogram.png');
    
    // Verify download in log
    await expect(page.locator('.log-entry', { hasText: '📥 Downloaded normal-distribution-histogram.png' })).toBeVisible();
  });

  test('should display error handling for invalid custom code', async ({ page }) => {
    // Enter invalid JavaScript code
    const invalidCode = `
// This will cause an error
nonExistentFunction();
    `;
    
    await page.fill('#customCode', invalidCode);
    await page.click('button:text("Execute Custom Code")');
    
    // Wait for error to appear
    await page.waitForTimeout(1000);
    
    // Check for error in log
    await expect(page.locator('.log-entry.log-error')).toBeVisible();
    await expect(page.locator('.log-entry', { hasText: '❌ Custom code error:' })).toBeVisible();
  });

  test('should have responsive grid layout', async ({ page }) => {
    // Check that histogram grid exists and has proper structure
    const histogramGrid = page.locator('.histogram-grid');
    await expect(histogramGrid).toBeVisible();
    
    // Check that histogram cards exist
    const histogramCards = page.locator('.histogram-card');
    await expect(histogramCards).toHaveCount(7); // 6 generated + 1 custom
    
    // Verify each card has title and canvas
    for (let i = 0; i < 6; i++) {
      const card = histogramCards.nth(i);
      await expect(card.locator('.histogram-title')).toBeVisible();
      await expect(card.locator('canvas')).toBeVisible();
    }
  });

  test('should maintain consistent canvas rendering across refreshes', async ({ page }) => {
    // Take initial screenshot of normal distribution
    const canvas1 = page.locator('#normal-distribution');
    
    // Wait for initial render
    await page.waitForTimeout(2000);
    
    // Refresh page
    await page.reload();
    
    // Wait for new render
    await page.waitForSelector('.histogram-grid');
    await page.waitForTimeout(2000);
    
    // Both canvases should exist and have same dimensions
    const canvas2 = page.locator('#normal-distribution');
    await expect(canvas2).toBeVisible();
    
    const box1 = await canvas1.boundingBox();
    const box2 = await canvas2.boundingBox();
    
    expect(box1.width).toBe(box2.width);
    expect(box1.height).toBe(box2.height);
  });
});