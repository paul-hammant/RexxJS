const { test, expect } = require('@playwright/test');

test.describe('DOM Element Functions - Phase 2: Navigation & Properties', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the DOM stale test harness which has our DOM functions
    await page.goto('/tests/web/test-harness-dom-stale.html');
    
    // Wait for the page to load
    await page.waitForSelector('#output');
    await page.waitForSelector('#rexx-script');
  });

  test('DOM_ELEMENT_PARENT should get parent element', async ({ page }) => {
    const script = `
-- Test DOM_ELEMENT_PARENT function
LET button = DOM_GET selector=".test-collection button:first-child"
LET parent = DOM_ELEMENT_PARENT element=button
SAY "Got parent reference: " || parent

-- Get parent properties
LET parentTag = DOM_ELEMENT_TAG element=parent
LET parentClass = DOM_ELEMENT_CLASS element=parent
SAY "Parent tag: " || parentTag
SAY "Parent class: " || parentClass
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Got parent reference: dom_element_');
    expect(output).toContain('Parent tag: DIV');
    expect(output).toContain('Parent class: test-collection');
  });

  test('DOM_ELEMENT_CHILDREN should get child elements', async ({ page }) => {
    const script = `
-- Test DOM_ELEMENT_CHILDREN function
LET container = DOM_GET selector=".test-collection"
LET children = DOM_ELEMENT_CHILDREN element=container
SAY "Found " || children.length || " children"

-- Test with selector filter
LET buttonChildren = DOM_ELEMENT_CHILDREN element=container selector="button"
SAY "Found " || buttonChildren.length || " button children"

-- Check first child
LET firstChild = ARRAY_GET(children, 1)
LET childTag = DOM_ELEMENT_TAG element=firstChild
SAY "First child tag: " || childTag
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Found 6 children'); // h4 + 5 buttons
    expect(output).toContain('Found 5 button children');
    expect(output).toContain('First child tag: H4');
  });

  test('DOM_ELEMENT_SIBLINGS should get sibling elements', async ({ page }) => {
    const script = `
-- Test DOM_ELEMENT_SIBLINGS function
LET secondButton = DOM_GET selector=".test-collection button:nth-child(3)"
LET siblings = DOM_ELEMENT_SIBLINGS element=secondButton
SAY "Found " || siblings.length || " siblings"

-- Check sibling properties
DO i = 1 TO siblings.length
    LET sibling = ARRAY_GET(siblings, i)
    LET tag = DOM_ELEMENT_TAG element=sibling
    IF tag = "BUTTON" THEN
        LET text = DOM_ELEMENT_TEXT element=sibling
        SAY "Sibling button: " || text
    ELSE
        SAY "Sibling: " || tag
    ENDIF
END
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Found 5 siblings'); // h4 + 4 other buttons
    expect(output).toContain('Sibling button: Alpha');
    expect(output).toContain('Sibling button: Gamma');
    expect(output).toContain('Sibling: H4');
  });

  test('DOM_ELEMENT_NEXT_SIBLING and DOM_ELEMENT_PREV_SIBLING should work', async ({ page }) => {
    const script = `
-- Test sibling navigation
LET secondButton = DOM_GET selector=".test-collection button:nth-child(3)"
LET buttonText = DOM_ELEMENT_TEXT element=secondButton
SAY "Current button: " || buttonText

-- Get next sibling
LET nextSibling = DOM_ELEMENT_NEXT_SIBLING element=secondButton
LET nextText = DOM_ELEMENT_TEXT element=nextSibling
SAY "Next sibling: " || nextText

-- Get previous sibling
LET prevSibling = DOM_ELEMENT_PREV_SIBLING element=secondButton
LET prevTag = DOM_ELEMENT_TAG element=prevSibling
IF prevTag = "BUTTON" THEN
    LET prevText = DOM_ELEMENT_TEXT element=prevSibling
    SAY "Previous sibling: " || prevText
ELSE
    SAY "Previous sibling tag: " || prevTag
ENDIF
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Current button: Beta');
    expect(output).toContain('Next sibling: Gamma');
    expect(output).toContain('Previous sibling: Alpha');
  });

  test('DOM_ELEMENT_TAG should get element tag names', async ({ page }) => {
    const script = `
-- Test DOM_ELEMENT_TAG function
LET buttons = DOM_GET_ALL selector=".test-collection button"
LET container = DOM_GET selector=".test-collection"
LET heading = DOM_GET selector=".test-collection h4"

LET buttonTag = DOM_ELEMENT_TAG element=ARRAY_GET(buttons, 1)
LET containerTag = DOM_ELEMENT_TAG element=container
LET headingTag = DOM_ELEMENT_TAG element=heading

SAY "Button tag: " || buttonTag
SAY "Container tag: " || containerTag
SAY "Heading tag: " || headingTag
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Button tag: BUTTON');
    expect(output).toContain('Container tag: DIV');
    expect(output).toContain('Heading tag: H4');
  });

  test('DOM_ELEMENT_ID should get element IDs', async ({ page }) => {
    const script = `
-- Test DOM_ELEMENT_ID function
LET form = DOM_GET selector="form"
LET formId = DOM_ELEMENT_ID element=form
SAY "Form ID: " || formId

LET username = DOM_GET selector="#username"
LET usernameId = DOM_ELEMENT_ID element=username
SAY "Username ID: " || usernameId

-- Test element without ID
LET button = DOM_GET selector=".test-collection button:first-child"
LET buttonId = DOM_ELEMENT_ID element=button
SAY "Button ID: '" || buttonId || "'"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Form ID: testForm');
    expect(output).toContain('Username ID: username');
    expect(output).toContain("Button ID: ''");
  });

  test('DOM_ELEMENT_CLASS and DOM_ELEMENT_CLASSES should work', async ({ page }) => {
    const script = `
-- Test class functions
LET container = DOM_GET selector=".test-collection"
LET className = DOM_ELEMENT_CLASS element=container
LET classes = DOM_ELEMENT_CLASSES element=container

SAY "Class string: " || className
SAY "Number of classes: " || classes.length

DO i = 1 TO classes.length
    LET cls = ARRAY_GET(classes, i)
    SAY "Class " || i || ": " || cls
END
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Class string: test-collection');
    expect(output).toContain('Number of classes: 1');
    expect(output).toContain('Class 1: test-collection');
  });

  test('DOM_ELEMENT_VISIBLE should detect element visibility', async ({ page }) => {
    const script = `
-- Test DOM_ELEMENT_VISIBLE function
LET button = DOM_GET selector=".test-collection button:first-child"
LET visible = DOM_ELEMENT_VISIBLE element=button
SAY "Button visible: " || visible

LET container = DOM_GET selector=".test-collection"
LET containerVisible = DOM_ELEMENT_VISIBLE element=container
SAY "Container visible: " || containerVisible
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Button visible: true');
    expect(output).toContain('Container visible: true');
  });

  test('DOM_ELEMENT_BOUNDS should get element dimensions', async ({ page }) => {
    const script = `
-- Test DOM_ELEMENT_BOUNDS function
LET button = DOM_GET selector=".test-collection button:first-child"
LET bounds = DOM_ELEMENT_BOUNDS element=button

SAY "Button bounds:"
SAY "  Width: " || bounds.width
SAY "  Height: " || bounds.height
SAY "  X: " || bounds.x
SAY "  Y: " || bounds.y
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Button bounds:');
    expect(output).toMatch(/Width: \d+/);
    expect(output).toMatch(/Height: \d+/);
    expect(output).toMatch(/X: \d+/);
    expect(output).toMatch(/Y: \d+/);
  });

  test('Complex navigation workflow', async ({ page }) => {
    const script = `
-- Complex navigation test
SAY "=== Complex Navigation Test ==="

-- Start with a button
LET thirdButton = DOM_GET selector=".test-collection button:nth-child(4)"
LET text = DOM_ELEMENT_TEXT element=thirdButton
SAY "Starting with: " || text

-- Navigate to parent
LET parent = DOM_ELEMENT_PARENT element=thirdButton
LET parentTag = DOM_ELEMENT_TAG element=parent
SAY "Parent is: " || parentTag

-- Get all children of parent
LET children = DOM_ELEMENT_CHILDREN element=parent selector="button"
SAY "Parent has " || children.length || " button children"

-- Get siblings
LET siblings = DOM_ELEMENT_SIBLINGS element=thirdButton
SAY "Element has " || siblings.length || " siblings"

-- Navigate through siblings
LET prevSibling = DOM_ELEMENT_PREV_SIBLING element=thirdButton
LET prevText = DOM_ELEMENT_TEXT element=prevSibling
SAY "Previous sibling: " || prevText

LET nextSibling = DOM_ELEMENT_NEXT_SIBLING element=thirdButton
LET nextText = DOM_ELEMENT_TEXT element=nextSibling
SAY "Next sibling: " || nextText

SAY "=== Navigation complete ==="
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(2000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Starting with: Gamma');
    expect(output).toContain('Parent is: DIV');
    expect(output).toContain('Parent has 5 button children');
    expect(output).toContain('Previous sibling: Beta');
    expect(output).toContain('Next sibling: Delta');
    expect(output).toContain('Navigation complete');
  });

  test('Form navigation and property inspection', async ({ page }) => {
    const script = `
-- Form navigation test
SAY "=== Form Navigation Test ==="

LET form = DOM_GET selector="#testForm"
LET formTag = DOM_ELEMENT_TAG element=form
LET formId = DOM_ELEMENT_ID element=form
SAY "Form: " || formTag || " (ID: " || formId || ")"

-- Get form children
LET inputs = DOM_ELEMENT_CHILDREN element=form selector="input"
SAY "Form has " || inputs.length || " input children"

-- Inspect each input
DO i = 1 TO inputs.length
    LET input = ARRAY_GET(inputs, i)
    LET inputId = DOM_ELEMENT_ID element=input
    LET inputTag = DOM_ELEMENT_TAG element=input
    SAY "Input " || i || ": " || inputTag || " (ID: " || inputId || ")"
END

-- Get submit button
LET submitBtn = DOM_ELEMENT_CHILDREN element=form selector="button"
LET submitElement = ARRAY_GET(submitBtn, 1)
LET submitId = DOM_ELEMENT_ID element=submitElement
LET submitText = DOM_ELEMENT_TEXT element=submitElement
SAY "Submit button: " || submitText || " (ID: " || submitId || ")"

SAY "=== Form inspection complete ==="
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(2000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Form: FORM (ID: testForm)');
    expect(output).toContain('Form has 2 input children');
    expect(output).toContain('Input 1: INPUT (ID: username)');
    expect(output).toContain('Input 2: INPUT (ID: password)');
    expect(output).toContain('Submit button: Submit (ID: submitBtn)');
    expect(output).toContain('Form inspection complete');
  });

  test('Error handling for navigation functions', async ({ page }) => {
    const script = `
-- Test error handling for navigation
SAY "Testing navigation error handling..."

-- Try to get parent of body (should fail)
LET body = DOM_GET selector="body"
LET bodyParent = DOM_ELEMENT_PARENT element=body
SAY "This should not appear"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Testing navigation error handling');
    expect(output).toContain('Error');
    expect(output).not.toContain('This should not appear');
  });
});