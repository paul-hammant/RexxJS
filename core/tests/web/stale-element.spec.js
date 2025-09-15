/**
 * Stale Element Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { test, expect } = require('@playwright/test');

test.describe('Stale Element Reproduction Tests', () => {
  
  test('should demonstrate stale element when form is replaced', async ({ page }) => {
    // Navigate to the FluentSelenium test page
    await page.goto('/tests/stale-element-repro/index.html');
    
    // Get element handle (similar to Selenium WebElement)
    const passwordField = await page.$('#cheddarCheeseLoginPassword');
    expect(passwordField).not.toBeNull();
    
    // Verify we can interact with it
    await passwordField.type('initial text');
    const value = await passwordField.evaluate(el => el.value);
    expect(value).toBe('initial text');
    
    // Replace the form in DOM, making child elements stale
    await page.evaluate(() => {
      const form = document.getElementById('cheddarCheeseLoginForm');
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);
    });
    
    // Now the passwordField handle is stale
    // This should throw an error
    let staleError = null;
    try {
      await passwordField.type('this will fail');
    } catch (error) {
      staleError = error;
    }
    
    expect(staleError).not.toBeNull();
    expect(staleError.message).toContain('Element is not attached to the DOM'); // Playwright's version of StaleElementException
    
    console.log('✅ Successfully detected stale element after form replacement');
  });
  
  test('should demonstrate stale element when innerHTML is rebuilt', async ({ page }) => {
    await page.goto('/tests/stale-element-repro/index.html');
    
    // Get element handle
    const passwordField = await page.$('#cheddarCheeseLoginPassword');
    expect(passwordField).not.toBeNull();
    
    // Store initial value
    await passwordField.type('test123');
    
    // Rebuild form innerHTML (common in SPAs)
    await page.evaluate(() => {
      const form = document.getElementById('cheddarCheeseLoginForm');
      const originalHTML = form.innerHTML;
      form.innerHTML = '';
      setTimeout(() => {
        form.innerHTML = originalHTML + '<button type="submit">Login</button>';
      }, 10);
    });
    
    await page.waitForTimeout(50); // Wait for DOM update
    
    // Element handle should be stale
    let staleError = null;
    try {
      // Try to interact with the stale element
      await passwordField.type('more text');
    } catch (error) {
      staleError = error;
    }
    
    expect(staleError).not.toBeNull();
    expect(staleError.message).toContain('Element is not attached to the DOM');
    console.log('✅ Successfully detected stale element after innerHTML rebuild');
  });
  
  test('should demonstrate FluentSelenium retry pattern', async ({ page }) => {
    await page.goto('/tests/stale-element-repro/index.html');
    
    // Retry pattern similar to FluentSelenium's RetryAfterStaleElement
    const retryOperation = async (operation, selector, maxRetries = 3) => {
      let lastError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // Get fresh element handle each time
          const element = await page.$(selector);
          if (!element) throw new Error('Element not found');
          
          return await operation(element);
        } catch (error) {
          lastError = error;
          console.log(`  Retry ${attempt}/${maxRetries} after error:`, error.message);
          
          if (attempt < maxRetries) {
            await page.waitForTimeout(100);
            continue;
          }
        }
      }
      throw lastError;
    };
    
    // Simulate element going stale during operation
    let operationCount = 0;
    const result = await retryOperation(
      async (element) => {
        operationCount++;
        
        // Make element stale on first attempt
        if (operationCount === 1) {
          await page.evaluate(() => {
            const form = document.getElementById('cheddarCheeseLoginForm');
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
          });
          
          // This will fail due to staleness
          return await element.type('password123');
        }
        
        // Second attempt should succeed with fresh element
        await element.type('password123');
        return await element.evaluate(el => el.value);
      },
      '#cheddarCheeseLoginPassword'
    );
    
    expect(result).toBe('password123');
    expect(operationCount).toBe(2); // Should have retried once
    console.log('✅ Successfully handled stale element with retry pattern');
  });
  
  test('should demonstrate stale element in complex chain operations', async ({ page }) => {
    await page.goto('/tests/stale-element-repro/index.html');
    
    // Add some nested elements for testing
    await page.evaluate(() => {
      const form = document.getElementById('cheddarCheeseLoginForm');
      form.innerHTML += `
        <div id="thirdAddress">
          <div class="fromto-column">
            <span>Flight: AA123</span>
          </div>
        </div>
      `;
    });
    
    // Get element handles in a chain (like FluentSelenium's traversal)
    const container = await page.$('#thirdAddress');
    const column = await container.$('.fromto-column');
    const text = await column.$('span');
    
    // Verify initial state
    const initialText = await text.textContent();
    expect(initialText).toBe('Flight: AA123');
    
    // Make middle element stale (column)
    await page.evaluate(() => {
      const column = document.querySelector('.fromto-column');
      const newColumn = column.cloneNode(true);
      column.parentNode.replaceChild(newColumn, column);
    });
    
    // The 'column' and 'text' handles are now stale, but 'container' is still valid
    let containerValid = true;
    let columnStale = false;
    let textStale = false;
    
    try {
      await container.evaluate(el => el.id);
    } catch (e) {
      containerValid = false;
    }
    
    try {
      // Try to interact with the stale element
      await column.click();
    } catch (e) {
      columnStale = true;
    }
    
    try {
      // Try to interact with the stale element
      await text.click();
    } catch (e) {
      textStale = true;
    }
    
    expect(containerValid).toBe(true);  // Parent still valid
    expect(columnStale).toBe(true);     // Middle element stale
    expect(textStale).toBe(true);       // Child element stale
    
    console.log('✅ Successfully demonstrated chain staleness behavior');
  });
  
  test('should demonstrate AJAX-like dynamic content staleness', async ({ page }) => {
    await page.goto('/tests/stale-element-repro/index.html');
    
    // Add dynamic content
    await page.evaluate(() => {
      const div = document.createElement('div');
      div.id = 'dynamicContent';
      div.innerHTML = '<p id="status">Loading...</p>';
      document.body.appendChild(div);
    });
    
    // Get element handle
    const statusElement = await page.$('#status');
    expect(await statusElement.textContent()).toBe('Loading...');
    
    // Simulate AJAX response updating content
    await page.evaluate(() => {
      setTimeout(() => {
        document.getElementById('dynamicContent').innerHTML = 
          '<p id="status">Loaded!</p><p>Extra content</p>';
      }, 100);
    });
    
    await page.waitForTimeout(150);
    
    // Original element handle is now stale
    let isStale = false;
    try {
      // Try to interact with the stale element
      await statusElement.click();
    } catch (error) {
      isStale = true;
    }
    
    expect(isStale).toBe(true);
    
    // Getting fresh reference works
    const newStatusElement = await page.$('#status');
    expect(await newStatusElement.textContent()).toBe('Loaded!');
    
    console.log('✅ Successfully demonstrated AJAX staleness scenario');
  });
});

test.describe('RexxJS-style Retry Pattern Concepts', () => {
  
  test('should demonstrate RETRY_ON_STALE pattern concept', async ({ page }) => {
    await page.goto('/tests/stale-element-repro/index.html');
    
    // Simulate RexxJS's RETRY_ON_STALE block behavior
    const executeWithRetry = async (operations, timeout = 5000, preserveVars = {}) => {
      const startTime = Date.now();
      let attempts = 0;
      
      while (Date.now() - startTime < timeout) {
        attempts++;
        const vars = { ...preserveVars }; // Restore preserved variables
        
        try {
          console.log(`  Attempt ${attempts}...`);
          
          // Execute all operations in the block
          for (const operation of operations) {
            await operation(vars);
          }
          
          console.log(`  ✓ Completed successfully after ${attempts} attempts`);
          return vars; // Return final variable state
          
        } catch (error) {
          if (error.message.includes('Element is not attached to the DOM') || 
              error.message.includes('Target closed') || 
              error.message.includes('Execution context was destroyed')) {
            console.log(`  ↻ Retrying after stale element...`);
            await page.waitForTimeout(100);
            continue;
          }
          throw error; // Re-throw non-stale errors
        }
      }
      
      throw new Error(`RETRY_ON_STALE timeout after ${timeout}ms`);
    };
    
    // Define operations that would be in RETRY_ON_STALE block
    const operations = [
      async (vars) => {
        vars.form = await page.$('#cheddarCheeseLoginForm');
        if (!vars.form) throw new Error('Form not found');
      },
      async (vars) => {
        vars.passwordField = await vars.form.$('#cheddarCheeseLoginPassword');
        if (!vars.passwordField) throw new Error('Password field not found');
      },
      async (vars) => {
        await vars.passwordField.type('test_password');
        vars.typedValue = await vars.passwordField.evaluate(el => el.value);
      }
    ];
    
    // Track if we've made the form stale yet
    let madeStale = false;
    
    // Modified operations that trigger staleness on first attempt
    const operationsWithStaleTrigger = [
      async (vars) => {
        vars.form = await page.$('#cheddarCheeseLoginForm');
        if (!vars.form) throw new Error('Form not found');
      },
      async (vars) => {
        // Make stale on first attempt only
        if (!madeStale) {
          madeStale = true;
          await page.evaluate(() => {
            const form = document.getElementById('cheddarCheeseLoginForm');
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
          });
        }
        
        vars.passwordField = await vars.form.$('#cheddarCheeseLoginPassword');
        if (!vars.passwordField) throw new Error('Password field not found');
      },
      async (vars) => {
        await vars.passwordField.type('test_password');
        vars.typedValue = await vars.passwordField.evaluate(el => el.value);
      }
    ];
    
    // Execute with retry - should succeed after retry due to staleness
    const result = await executeWithRetry(operationsWithStaleTrigger, 5000, { attemptCount: 0 });
    
    expect(result.typedValue).toBe('test_password');
    console.log('✅ Successfully demonstrated RETRY_ON_STALE pattern concept');
  });
});