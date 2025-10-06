const { test, expect } = require('@playwright/test');

test.describe('DOM Element Functions - Phase 1 Implementation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the DOM stale test harness which has our DOM functions
    await page.goto('/tests/web/test-harness-dom-stale.html');
    
    // Wait for the page to load
    await page.waitForSelector('#output');
    await page.waitForSelector('#rexx-script');
  });

  test('DOM_GET should get single element reference', async ({ page }) => {
    const script = `
-- Test DOM_GET function
LET button = DOM_GET selector="button:first-child"
SAY "Got button reference: " || button
SAY "Reference type: " || TYPEOF(button)
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Got button reference: dom_element_');
    expect(output).toContain('Reference type: string');
  });

  test('DOM_GET_ALL should get array of element references', async ({ page }) => {
    const script = `
-- Test DOM_GET_ALL function
LET buttons = DOM_GET_ALL selector=".test-collection button"
SAY "Found " || buttons.length || " button references"
SAY "First button: " || ARRAY_GET(buttons, 1)
SAY "Second button: " || ARRAY_GET(buttons, 2)
SAY "Array type: " || TYPEOF(buttons)
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Found 5 button references');
    expect(output).toContain('First button: dom_element_');
    expect(output).toContain('Second button: dom_element_');
    expect(output).toContain('Array type: object');
  });

  test('DOM_ELEMENT_TEXT should get element text content', async ({ page }) => {
    const script = `
-- Test DOM_ELEMENT_TEXT function
LET buttons = DOM_GET_ALL selector=".test-collection button"
LET firstButton = ARRAY_GET(buttons, 1)
LET text = DOM_ELEMENT_TEXT element=firstButton
SAY "First button text: " || text

LET secondButton = ARRAY_GET(buttons, 2)
LET text2 = DOM_ELEMENT_TEXT element=secondButton
SAY "Second button text: " || text2
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('First button text: Alpha');
    expect(output).toContain('Second button text: Beta');
  });

  test('DOM_ELEMENT_CLICK should click elements', async ({ page }) => {
    const script = `
-- Test DOM_ELEMENT_CLICK function
LET buttons = DOM_GET_ALL selector=".test-collection button"
LET firstButton = ARRAY_GET(buttons, 1)
LET text = DOM_ELEMENT_TEXT element=firstButton
SAY "Clicking button: " || text
LET result = DOM_ELEMENT_CLICK element=firstButton
SAY "Click result: " || result
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Clicking button: Alpha');
    expect(output).toContain('Click result: true');
    
    // Check that the click was registered in the event log
    const eventLog = await page.textContent('#event-log');
    expect(eventLog).toContain('Alpha clicked');
  });

  test('DOM_ELEMENT_SET_ATTR and DOM_ELEMENT_GET_ATTR should work', async ({ page }) => {
    const script = `
-- Test DOM_ELEMENT attribute functions
LET button = DOM_GET selector=".test-collection button:first-child"
LET originalTitle = DOM_ELEMENT_GET_ATTR element=button name="title"
SAY "Original title: " || originalTitle

-- Set a new title
DOM_ELEMENT_SET_ATTR element=button name="title" value="Custom Title"
LET newTitle = DOM_ELEMENT_GET_ATTR element=button name="title"
SAY "New title: " || newTitle

-- Set a data attribute
DOM_ELEMENT_SET_ATTR element=button name="data-test" value="phase1-test"
LET dataAttr = DOM_ELEMENT_GET_ATTR element=button name="data-test"
SAY "Data attribute: " || dataAttr
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('New title: Custom Title');
    expect(output).toContain('Data attribute: phase1-test');
  });

  test('DOM_ELEMENT_SET_STYLE should modify element styles', async ({ page }) => {
    const script = `
-- Test DOM_ELEMENT_SET_STYLE function
LET button = DOM_GET selector=".test-collection button:first-child"
SAY "Setting button style..."

-- Set background color
DOM_ELEMENT_SET_STYLE element=button property="backgroundColor" value="red"
SAY "Background color set to red"

-- Set border
DOM_ELEMENT_SET_STYLE element=button property="border" value="3px solid blue"
SAY "Border set to blue"

-- Set font weight
DOM_ELEMENT_SET_STYLE element=button property="fontWeight" value="bold"
SAY "Font weight set to bold"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Background color set to red');
    expect(output).toContain('Border set to blue');
    expect(output).toContain('Font weight set to bold');
    
    // Verify the styles were actually applied
    const buttonStyle = await page.evaluate(() => {
      const button = document.querySelector('.test-collection button:first-child');
      return {
        backgroundColor: button.style.backgroundColor,
        border: button.style.border,
        fontWeight: button.style.fontWeight
      };
    });
    
    expect(buttonStyle.backgroundColor).toBe('red');
    expect(buttonStyle.border).toBe('3px solid blue');
    expect(buttonStyle.fontWeight).toBe('bold');
  });

  test('DOM_ELEMENT_QUERY should find child elements', async ({ page }) => {
    const script = `
-- Test DOM_ELEMENT_QUERY function
LET container = DOM_GET selector=".test-collection"
LET firstButton = DOM_ELEMENT_QUERY element=container selector="button:first-child"
LET buttonText = DOM_ELEMENT_TEXT element=firstButton
SAY "Found first button in container: " || buttonText

-- Query for a specific button
LET betaButton = DOM_ELEMENT_QUERY element=container selector="button:nth-child(2)"
LET betaText = DOM_ELEMENT_TEXT element=betaButton
SAY "Found second button: " || betaText
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Found first button in container: Alpha');
    expect(output).toContain('Found second button: Beta');
  });

  test('DOM_ELEMENT_QUERY_ALL should find all child elements', async ({ page }) => {
    const script = `
-- Test DOM_ELEMENT_QUERY_ALL function
LET container = DOM_GET selector=".test-collection"
LET buttons = DOM_ELEMENT_QUERY_ALL element=container selector="button"
SAY "Found " || buttons.length || " buttons in container"

-- Process all buttons found
DO i = 1 TO buttons.length
    LET button = ARRAY_GET(buttons, i)
    LET text = DOM_ELEMENT_TEXT element=button
    SAY "Button " || i || ": " || text
END
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Found 5 buttons in container');
    expect(output).toContain('Button 1: Alpha');
    expect(output).toContain('Button 2: Beta');
    expect(output).toContain('Button 3: Gamma');
    expect(output).toContain('Button 4: Delta');
    expect(output).toContain('Button 5: Epsilon');
  });

  test('DO...OVER should work with DOM_GET_ALL results', async ({ page }) => {
    const script = `
-- Test DO...OVER with DOM element references
LET buttons = DOM_GET_ALL selector=".test-collection button"
SAY "Processing " || buttons.length || " buttons with DO...OVER"

DO button OVER buttons
    LET text = DOM_ELEMENT_TEXT element=button
    SAY "Processing: " || text
    -- Click each button
    DOM_ELEMENT_CLICK element=button
END

SAY "DO...OVER processing complete"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(2000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Processing 5 buttons with DO...OVER');
    expect(output).toContain('Processing: Alpha');
    expect(output).toContain('Processing: Beta');
    expect(output).toContain('Processing: Gamma');
    expect(output).toContain('Processing: Delta');
    expect(output).toContain('Processing: Epsilon');
    expect(output).toContain('DO...OVER processing complete');
    
    // Verify all buttons were clicked
    const eventLog = await page.textContent('#event-log');
    expect(eventLog).toContain('Alpha clicked');
    expect(eventLog).toContain('Beta clicked');
    expect(eventLog).toContain('Gamma clicked');
    expect(eventLog).toContain('Delta clicked');
    expect(eventLog).toContain('Epsilon clicked');
  });

  test('Error handling for invalid selectors', async ({ page }) => {
    const script = `
-- Test error handling
SAY "Testing error handling..."

-- Try to get non-existent element
LET missing = DOM_GET selector=".non-existent-element"
SAY "This should not appear"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Testing error handling');
    expect(output).toContain('Error');
    expect(output).not.toContain('This should not appear');
  });

  test('Error handling for invalid element references', async ({ page }) => {
    const script = `
-- Test error handling for invalid references
SAY "Testing invalid element reference..."

-- Try to use invalid element reference
LET text = DOM_ELEMENT_TEXT element="invalid_reference"
SAY "This should not appear"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Testing invalid element reference');
    expect(output).toContain('Error');
    expect(output).not.toContain('This should not appear');
  });

  test('Complex workflow with multiple DOM operations', async ({ page }) => {
    const script = `
-- Complex workflow test
SAY "Starting complex DOM workflow..."

-- Get all buttons and style them
LET buttons = DOM_GET_ALL selector=".test-collection button"
SAY "Found " || buttons.length || " buttons to process"

-- Style each button differently
DO i = 1 TO buttons.length
    LET button = ARRAY_GET(buttons, i)
    LET text = DOM_ELEMENT_TEXT element=button
    
    -- Set different colors based on position
    IF i = 1 THEN
        DOM_ELEMENT_SET_STYLE element=button property="color" value="red"
    ELSEIF i = 2 THEN
        DOM_ELEMENT_SET_STYLE element=button property="color" value="green"
    ELSEIF i = 3 THEN
        DOM_ELEMENT_SET_STYLE element=button property="color" value="blue"
    ELSE
        DOM_ELEMENT_SET_STYLE element=button property="color" value="purple"
    ENDIF
    
    -- Set a data attribute
    DOM_ELEMENT_SET_ATTR element=button name="data-index" value=i
    
    SAY "Styled button " || i || " (" || text || ")"
END

-- Get container and query it
LET container = DOM_GET selector=".test-collection"
LET queriedButtons = DOM_ELEMENT_QUERY_ALL element=container selector="button[data-index]"
SAY "Found " || queriedButtons.length || " buttons with data-index attribute"

SAY "Complex workflow complete!"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(2000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Starting complex DOM workflow');
    expect(output).toContain('Found 5 buttons to process');
    expect(output).toContain('Styled button 1 (Alpha)');
    expect(output).toContain('Styled button 2 (Beta)');
    expect(output).toContain('Found 5 buttons with data-index attribute');
    expect(output).toContain('Complex workflow complete!');
    
    // Verify the styles and attributes were applied
    const verification = await page.evaluate(() => {
      const buttons = document.querySelectorAll('.test-collection button');
      return Array.from(buttons).map((btn, i) => ({
        color: btn.style.color,
        dataIndex: btn.getAttribute('data-index')
      }));
    });
    
    expect(verification[0].color).toBe('red');
    expect(verification[0].dataIndex).toBe('1');
    expect(verification[1].color).toBe('green');
    expect(verification[1].dataIndex).toBe('2');
    expect(verification[2].color).toBe('blue');
    expect(verification[2].dataIndex).toBe('3');
  });
});