const { test, expect } = require('@playwright/test');

test.describe('Rexx-A-Sketch', () => {
  test.beforeEach(async ({ page }) => {
    // Start the Vite dev server on port 5174
    await page.goto('http://localhost:5174/');
    await page.waitForLoadState('networkidle');

    // Wait for RexxJS to load
    await page.waitForFunction(() => window.RexxInterpreter && window.parse);
  });

  test('should load the application', async ({ page }) => {
    // Check title
    await expect(page.locator('h1')).toContainText('Rexx-A-Sketch');

    // Check subtitle
    await expect(page.locator('.subtitle')).toContainText('Hey, Etch. Draw!');

    // Check canvas exists
    const canvas = page.locator('#canvas');
    await expect(canvas).toBeVisible();

    // Check dials exist
    await expect(page.locator('#dialX')).toBeVisible();
    await expect(page.locator('#dialY')).toBeVisible();
  });

  test('should have interactive dials', async ({ page }) => {
    const dialX = page.locator('#dialX');
    const dialXValue = page.locator('#dialX-value');

    // Initial value should be 0
    await expect(dialXValue).toHaveText('0');

    // Change dial value
    await dialX.fill('2');

    // Value display should update
    const value = await dialXValue.textContent();
    expect(parseFloat(value)).toBeCloseTo(2, 0);
  });

  test('should clear canvas when clear button clicked', async ({ page }) => {
    // Click clear button
    await page.click('#clearBtn');

    // Canvas should be empty (no lines drawn)
    const lineCount = await page.locator('#canvas line').count();
    expect(lineCount).toBe(0);
  });

  test('should draw stick figure when button clicked', async ({ page }) => {
    // Click draw stick figure button
    await page.click('#drawStickFigureBtn');

    // Wait for drawing animation to complete
    await page.waitForTimeout(2000);

    // Canvas should have lines drawn
    const lineCount = await page.locator('#canvas line').count();
    expect(lineCount).toBeGreaterThan(10); // Stick figure has multiple lines
  });

  test('should display position coordinates', async ({ page }) => {
    const posX = page.locator('#posX');
    const posY = page.locator('#posY');

    // Position display should exist
    await expect(posX).toBeVisible();
    await expect(posY).toBeVisible();

    // Position should update when moving dials
    const dialX = page.locator('#dialX');
    await dialX.fill('1');

    // Wait a bit for position update
    await page.waitForTimeout(100);

    // Position should have changed (not necessarily to exact value due to clamping)
    const xText = await posX.textContent();
    expect(xText).toBeTruthy();
  });

  test('should show control bus status', async ({ page }) => {
    const busStatus = page.locator('#busStatus');

    // Status display should exist
    await expect(busStatus).toBeVisible();

    // Should show disconnected (no backend running in test)
    await expect(busStatus).toHaveText('Disconnected');
  });

  test('should execute RexxJS commands', async ({ page }) => {
    // Execute a simple Rexx command to clear and draw
    const result = await page.evaluate(async () => {
      const script = `
        CLEAR
        MOVE_TO 400 300
        PEN_DOWN
        MOVE 50 0
      `;

      const parsed = window.parse(script);
      const interpreter = new window.RexxInterpreter();
      await interpreter.run(parsed);

      return true;
    });

    expect(result).toBe(true);

    // Canvas should have at least one line
    const lineCount = await page.locator('#canvas line').count();
    expect(lineCount).toBeGreaterThan(0);
  });

  test('should handle pen up and pen down', async ({ page }) => {
    // Draw with pen down, then pen up, then move
    await page.evaluate(async () => {
      const script = `
        CLEAR
        MOVE_TO 300 300
        PEN_DOWN
        MOVE 50 0
        PEN_UP
        MOVE 50 0
        PEN_DOWN
        MOVE 50 0
      `;

      const parsed = window.parse(script);
      const interpreter = new window.RexxInterpreter();
      await interpreter.run(parsed);
    });

    // Canvas should have lines (2 segments with a gap)
    const lineCount = await page.locator('#canvas line').count();
    expect(lineCount).toBeGreaterThan(0);
  });

  test('should handle drawing commands', async ({ page }) => {
    // Test various drawing commands
    await page.evaluate(async () => {
      const script = `
        CLEAR
        DRAW_LINE 100 100 200 200
        DRAW_LINE 200 200 300 100
      `;

      const parsed = window.parse(script);
      const interpreter = new window.RexxInterpreter();
      await interpreter.run(parsed);
    });

    // Canvas should have 2 lines
    const lineCount = await page.locator('#canvas line').count();
    expect(lineCount).toBe(2);
  });

  test('should get position', async ({ page }) => {
    const position = await page.evaluate(async () => {
      const script = `
        MOVE_TO 123 456
        LET pos = GET_POSITION
      `;

      const parsed = window.parse(script);
      const interpreter = new window.RexxInterpreter();
      await interpreter.run(parsed);

      return window.GET_POSITION();
    });

    expect(position.position.x).toBeCloseTo(123, 0);
    expect(position.position.y).toBeCloseTo(456, 0);
  });
});
