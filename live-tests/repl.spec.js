const { test, expect } = require('playwright/test');

test('basic navigation test', async ({ page }) => {
  await page.goto('https://repl.rexxjs.org/repl/');
  await expect(page).toHaveTitle('REXX Web REPL');
});

test('loads the REXX interpreter', async ({ page }) => {
  await page.goto('https://repl.rexxjs.org/repl/');
  await page.getByRole('button', { name: 'Load REXX Interpreter' }).click();
  await expect(page.locator('#repl-input')).toBeVisible();
});

test('executes a simple REXX command', async ({ page }) => {
  await page.goto('https://repl.rexxjs.org/repl/');
  await page.getByRole('button', { name: 'Load REXX Interpreter' }).click();
  await expect(page.locator('#repl-input')).toBeVisible();

  await page.locator('#repl-input').fill('SAY "Hello, World!"');
  await page.locator('#repl-input').press('Enter');

  const outputLocator = page.locator('#repl-history .repl-output').last();
  await expect(outputLocator).toHaveText('Hello, World!');
});

test('runs a demo script', async ({ page }) => {
  await page.goto('https://repl.rexxjs.org/repl/');
  await page.getByRole('button', { name: 'Load REXX Interpreter' }).click();
  await expect(page.locator('#repl-input')).toBeVisible();

  await page.locator('#demo-select').selectOption('basic');
  await page.locator('#run-demo-btn').click();

  const successMessage = page.locator('#repl-history').getByText(/✅ Demo completed!/);
  await expect(successMessage).toBeVisible({ timeout: 20000 });
});
