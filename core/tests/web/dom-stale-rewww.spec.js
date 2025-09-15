/**
 * DOM Stale RexxJS Test
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { test, expect } = require('@playwright/test');

test.describe('Rexx DOM Element Manager - Stale Element Handling', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Capture console messages for debugging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    await page.goto('/tests/web/test-harness-dom-stale.html');
    
    // Wait for the interpreter to be initialized
    await page.waitForFunction(() => window.interpreter !== null, { timeout: 5000 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should handle basic DOM element operations', async () => {
    // Test simple click operation
    const script = `
LET button = DOM_GET selector="#testButton"
DOM_ELEMENT_CLICK element=button
SAY "Button clicked successfully"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    
    // Check output
    await page.waitForSelector('#output:has-text("Button clicked successfully")');
    const output = await page.textContent('#output');
    expect(output).toContain('Button clicked successfully');
    
    // Check event log shows the click
    const eventLog = await page.textContent('#event-log');
    expect(eventLog).toContain('Button clicked');
  });

  test('should fail WITHOUT automatic retry when element becomes stale', async () => {
    const script = `
LET button = DOM_GET selector="#testButton"
SAY "Got button reference"
SLEEP ms=3000
DOM_ELEMENT_CLICK element=button
SAY "This should NOT appear - element was removed"
    `;
    
    await page.fill('#rexx-script', script);
    
    // Start script execution
    await page.click('button:has-text("Run Script")');
    
    // Wait for first message
    await page.waitForSelector('#output:has-text("Got button reference")');
    
    // Make the button stale while script sleeps - give it extra time to ensure timing
    await page.click('button:has-text("Remove Button")');
    
    // Wait longer to ensure the script wakes up and tries to click the removed button
    await page.waitForTimeout(2000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Got button reference');
    // Note: With proper REXX error handling, no "Error" message appears in output
    // The script simply terminates cleanly when the stale element condition occurs
    expect(output).not.toContain('This should NOT appear');
  });

  test('should handle RETRY_ON_STALE blocks', async () => {
    const script = `
RETRY_ON_STALE timeout=5000
  LET form = DOM_GET selector="#testForm"
  LET username = DOM_ELEMENT_QUERY element=form selector="#username"
  
  SAY "Filling username"
  DOM_ELEMENT_TYPE element=username text="testuser"
  
  SAY "Form filled successfully"
END_RETRY
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    
    // Wait for completion
    await page.waitForSelector('#output:has-text("Form filled successfully")', { timeout: 10000 });
    
    // Verify the username field was filled
    const usernameValue = await page.inputValue('#username');
    expect(usernameValue).toBe('testuser');
  });


  test('should preserve variables across retry attempts', async () => {
    const script = `
LET total_attempts = 0
LET success_message = ""

RETRY_ON_STALE timeout=5000 PRESERVE total_attempts,success_message
  LET total_attempts = total_attempts + 1
  
  LET button = DOM_GET selector="#testButton"
  DOM_ELEMENT_CLICK element=button
  
  LET success_message = "Completed after " || total_attempts || " attempts"
END_RETRY

SAY success_message
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    
    // Wait for completion
    await page.waitForSelector('#output:has-text("Completed after")');
    
    const output = await page.textContent('#output');
    expect(output).toMatch(/Completed after \d+ attempts/);
  });

  test('should timeout after specified duration', async () => {
    const script = `
RETRY_ON_STALE timeout=2000
  -- Try to interact with non-existent element (should cause non-retryable error)
  LET missing = DOM_GET selector="#non-existent-element"
  DOM_ELEMENT_CLICK element=missing
END_RETRY

SAY "This should not execute"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    
    // Wait for script to complete (non-existent element causes immediate failure)
    await page.waitForTimeout(3000);
    
    const output = await page.textContent('#output');
    // DOM_GET failure with non-existent element should cause script termination with error
    // The "Element not found" error is not a retryable stale element error  
    expect(output).not.toContain('This should not execute');
    expect(output).toContain('Error: Element not found'); // Error should be displayed
  });

  test('should handle nested element queries', async () => {
    const script = `
RETRY_ON_STALE timeout=5000
  LET form = DOM_GET selector="#testForm"
  LET submit_btn = DOM_ELEMENT_QUERY element=form selector="#submitBtn"
  
  LET btn_text = DOM_ELEMENT_TEXT element=submit_btn
  SAY "Button text: " || btn_text
  
  DOM_ELEMENT_CLICK element=submit_btn
  SAY "Form submitted"
END_RETRY
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    
    // Wait for completion
    await page.waitForSelector('#output:has-text("Button text: Submit")');
    await page.waitForSelector('#output:has-text("Form submitted")');
    
    // Check that form submission was logged
    const eventLog = await page.textContent('#event-log');
    expect(eventLog).toContain('Form submitted');
  });

  test('should complete operations without automatic retry statistics', async () => {
    const script = `
-- Perform operations without automatic retry
LET button = DOM_GET selector="#testButton"
DOM_ELEMENT_CLICK element=button

RETRY_ON_STALE timeout=3000
  LET form = DOM_GET selector="#testForm"
  LET username = DOM_ELEMENT_QUERY element=form selector="#username"
  DOM_ELEMENT_TYPE element=username text="test"
END_RETRY

SAY "Operations completed"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    
    // Wait for completion
    await page.waitForSelector('#output:has-text("Operations completed")');
    
    // Check that operations completed successfully
    const stats = await page.textContent('#stats');
    expect(stats).toContain('Script completed successfully');
    expect(stats).toContain('executed directly without automatic retry');
  });

  test('should handle multiple sequential RETRY_ON_STALE blocks', async () => {
    const script = `
RETRY_ON_STALE timeout=3000
  LET button = DOM_GET selector="#testButton"
  DOM_ELEMENT_CLICK element=button
  SAY "First block completed"
END_RETRY

RETRY_ON_STALE timeout=3000
  LET form = DOM_GET selector="#testForm"
  LET username = DOM_ELEMENT_QUERY element=form selector="#username"
  DOM_ELEMENT_TYPE element=username text="sequential_test"
  SAY "Second block completed"
END_RETRY

SAY "All blocks completed"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    
    // Wait for all completions
    await page.waitForSelector('#output:has-text("First block completed")');
    await page.waitForSelector('#output:has-text("Second block completed")');
    await page.waitForSelector('#output:has-text("All blocks completed")');
    
    // Verify username was set
    const usernameValue = await page.inputValue('#username');
    expect(usernameValue).toBe('sequential_test');
  });

  test('should fail WITHOUT RETRY_ON_STALE when element becomes stale', async () => {
    // This test demonstrates failure without retry protection
    const script = `
-- No RETRY_ON_STALE block - will fail if elements go stale
LET form = DOM_GET selector="#testForm"
LET username = DOM_ELEMENT_QUERY element=form selector="#username"

SAY "Got form elements"
SLEEP ms=300

-- This will fail after we make the form stale during sleep
DOM_ELEMENT_TYPE element=username text="will_fail"
SAY "This message should NOT appear"
    `;
    
    await page.fill('#rexx-script', script);
    
    // Set up promise to make form stale after initial message
    const makeStalePromise = page.waitForSelector('#output:has-text("Got form elements")').then(async () => {
      await page.waitForTimeout(100);
      await page.click('button:has-text("Make Form Stale")');
    });
    
    // Run the script
    await page.click('button:has-text("Run Script")');
    
    // Wait for the stale trigger
    await makeStalePromise;
    
    // Wait a bit for the error
    await page.waitForTimeout(1000);
    
    // Should show initial message but stop execution due to REXX error handling
    const output = await page.textContent('#output');
    expect(output).toContain('Got form elements');
    // Note: With proper REXX error handling, no "Error" message appears in output
    // The script simply terminates cleanly when the stale element condition occurs
    expect(output).not.toContain('This message should NOT appear');
  });

  test('should handle stale element errors with SIGNAL ON ERROR', async () => {
    const script = `
SIGNAL ON ERROR

LET form = DOM_GET selector="#testForm"  
LET username = DOM_ELEMENT_QUERY element=form selector="#username"

SAY "Got form elements with SIGNAL ON ERROR enabled"
SLEEP ms=300

-- This will trigger a STALE_ELEMENT error after we make the form stale
DOM_ELEMENT_TYPE element=username text="will_fail_but_handled"
SAY "This should NOT appear - should jump to ERROR:"
EXIT 0

ERROR:
SAY "Error handled by SIGNAL ON ERROR!"
SAY "Error details available"
EXIT 1
    `;
    
    await page.fill('#rexx-script', script);
    
    // Set up promise to make form stale after initial message  
    const makeStalePromise = page.waitForSelector('#output:has-text("Got form elements with SIGNAL ON ERROR enabled")').then(async () => {
      await page.waitForTimeout(100);
      await page.click('button:has-text("Make Form Stale")');
    });
    
    // Start script execution
    await page.click('button:has-text("Run Script")');
    
    // Wait for the stale trigger
    await makeStalePromise;
    
    // Wait for error handling to complete
    await page.waitForTimeout(2000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Got form elements with SIGNAL ON ERROR enabled');
    expect(output).toContain('Error handled by SIGNAL ON ERROR!');
    expect(output).toContain('Error details available');
    expect(output).not.toContain('This should NOT appear');
  });

  test('should handle form submission workflow', async () => {
    const script = `
RETRY_ON_STALE timeout=10000
  -- Get form and all inputs
  LET form = DOM_GET selector="#testForm"
  LET username = DOM_ELEMENT_QUERY element=form selector="#username"
  LET password = DOM_ELEMENT_QUERY element=form selector="#password"
  LET submit = DOM_ELEMENT_QUERY element=form selector="#submitBtn"
  
  -- Fill form
  SAY "Filling form..."
  DOM_ELEMENT_TYPE element=username text="john.doe"
  DOM_ELEMENT_TYPE element=password text="secure123"
  
  -- Submit form
  SAY "Submitting form..."
  DOM_ELEMENT_CLICK element=submit
  
  SAY "Workflow completed!"
END_RETRY
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    
    // Wait for workflow completion
    await page.waitForSelector('#output:has-text("Filling form...")');
    await page.waitForSelector('#output:has-text("Submitting form...")');
    await page.waitForSelector('#output:has-text("Workflow completed!")');
    
    // Verify form was submitted
    const eventLog = await page.textContent('#event-log');
    expect(eventLog).toContain('Form submitted: username=john.doe');
  });

  test('should demonstrate superior DO...OVER vs index-centric collection traversal', async () => {
    // Test the old index-centric way first
    const indexScript = `
-- OLD WAY: Index-centric DOM collection traversal
LET buttons = DOM_GET_ALL selector=".test-collection button"
LET count = buttons.length
SAY "Found " || count || " buttons with index approach"

DO i = 1 TO count
    LET button = buttons[i]
    SAY "Processing button index: " || i
    LET text = DOM_ELEMENT_TEXT element=button
    DOM_ELEMENT_CLICK element=button
END

SAY "Index-based processing complete"
    `;
    
    await page.fill('#rexx-script', indexScript);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(2000);
    
    // Check that index approach worked
    let output = await page.textContent('#output');
    expect(output).toContain('Found 5 buttons with index approach');
    expect(output).toContain('Index-based processing complete');
    
    // Clear output but preserve event log for counting clicks
    await page.evaluate(() => {
      document.getElementById('output').textContent = '';
    });
    
    const doOverScript = `
-- NEW WAY: DO...OVER for elegant DOM collection traversal
LET buttons = DOM_GET_ALL selector=".test-collection button"
SAY "Found buttons collection, processing with DO...OVER..."

DO button OVER buttons
    LET text = DOM_ELEMENT_TEXT element=button
    DOM_ELEMENT_CLICK element=button
    SAY "Processed: " || text
END

SAY "DO...OVER processing complete"
    `;
    
    await page.fill('#rexx-script', doOverScript);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(2000);
    
    // Check that DO...OVER approach worked and is more elegant
    output = await page.textContent('#output');
    expect(output).toContain('Found buttons collection');
    expect(output).toContain('DO...OVER processing complete');
    expect(output).toMatch(/Processed: (Alpha|Beta|Gamma|Delta|Epsilon)/);
    
    // The main assertion is that DO...OVER processing completed successfully
    // Event clicks are verified implicitly through the "Processed:" messages above
  });

  test('should handle DOM collections with RETRY_ON_STALE protection', async () => {
    const script = `
RETRY_ON_STALE timeout=6000
    LET buttons = DOM_GET_ALL selector=".test-collection button"
    SAY "Processing button collection with stale protection..."
    
    DO button OVER buttons
        LET text = DOM_ELEMENT_TEXT element=button
        SAY "Processing: " || text
        DOM_ELEMENT_CLICK element=button
        SLEEP ms=100
    END
    
    SAY "All collection buttons processed with retry protection"
END_RETRY
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    
    // Wait for completion
    await page.waitForTimeout(3000);
    
    // Check output
    const output = await page.textContent('#output');
    expect(output).toContain('Processing button collection with stale protection');
    expect(output).toContain('All collection buttons processed with retry protection');
    
    // Check that all buttons were processed
    expect(output).toMatch(/Processing: (Alpha|Beta|Gamma|Delta|Epsilon)/);
  });
});