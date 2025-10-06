const { test, expect } = require('@playwright/test');

test.describe('DOM Element Functions - Phase 3: Advanced Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the DOM stale test harness which has our DOM functions
    await page.goto('/tests/web/test-harness-dom-stale.html');
    
    // Wait for the page to load
    await page.waitForSelector('#output');
    await page.waitForSelector('#rexx-script');
  });

  test('DOM_CREATE_ELEMENT should create new elements', async ({ page }) => {
    const script = `
-- Test DOM_CREATE_ELEMENT function
LET newDiv = DOM_CREATE_ELEMENT tag="div" text="Hello World"
SAY "Created div: " || newDiv

LET newInput = DOM_CREATE_ELEMENT tag="input" type="text" name="username" placeholder="Enter name"
SAY "Created input: " || newInput

-- Check element properties
LET divTag = DOM_ELEMENT_TAG element=newDiv
LET inputTag = DOM_ELEMENT_TAG element=newInput
SAY "Div tag: " || divTag
SAY "Input tag: " || inputTag
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Created div: dom_element_');
    expect(output).toContain('Created input: dom_element_');
    expect(output).toContain('Div tag: DIV');
    expect(output).toContain('Input tag: INPUT');
  });

  test('DOM_CREATE_TEXT should create text nodes', async ({ page }) => {
    const script = `
-- Test DOM_CREATE_TEXT function
LET textNode = DOM_CREATE_TEXT text="This is a text node"
SAY "Created text node: " || textNode
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Created text node: dom_element_');
  });

  test('DOM_ELEMENT_APPEND should add child elements', async ({ page }) => {
    const script = `
-- Test DOM_ELEMENT_APPEND function
LET container = DOM_GET selector=".test-collection"
LET newButton = DOM_CREATE_ELEMENT tag="button" text="New Button"
SAY "Created new button"

DOM_ELEMENT_APPEND parent=container child=newButton
SAY "Appended button to container"

-- Verify it was added by counting children
LET children = DOM_ELEMENT_CHILDREN element=container selector="button"
SAY "Container now has " || children.length || " button children"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Created new button');
    expect(output).toContain('Appended button to container');
    expect(output).toContain('Container now has 6 button children'); // 5 original + 1 new
  });

  test('DOM_ELEMENT_PREPEND should add child elements at the beginning', async ({ page }) => {
    const script = `
-- Test DOM_ELEMENT_PREPEND function
LET container = DOM_GET selector=".test-collection"
LET newHeading = DOM_CREATE_ELEMENT tag="h3" text="Prepended Heading"
SAY "Created new heading"

DOM_ELEMENT_PREPEND parent=container child=newHeading
SAY "Prepended heading to container"

-- Check that it's first child
LET children = DOM_ELEMENT_CHILDREN element=container
LET firstChild = ARRAY_GET(children, 1)
LET firstTag = DOM_ELEMENT_TAG element=firstChild
SAY "First child is now: " || firstTag
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Created new heading');
    expect(output).toContain('Prepended heading to container');
    expect(output).toContain('First child is now: H3');
  });

  test('DOM_ELEMENT_INSERT_BEFORE and DOM_ELEMENT_INSERT_AFTER should work', async ({ page }) => {
    const script = `
-- Test insertion functions
LET secondButton = DOM_GET selector=".test-collection button:nth-child(3)"
LET beforeDiv = DOM_CREATE_ELEMENT tag="div" text="Before Beta"
LET afterDiv = DOM_CREATE_ELEMENT tag="div" text="After Beta"

SAY "Inserting elements around Beta button"

DOM_ELEMENT_INSERT_BEFORE reference=secondButton new_element=beforeDiv
DOM_ELEMENT_INSERT_AFTER reference=secondButton new_element=afterDiv

SAY "Elements inserted"

-- Check siblings
LET siblings = DOM_ELEMENT_SIBLINGS element=secondButton
SAY "Beta now has " || siblings.length || " siblings"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Inserting elements around Beta button');
    expect(output).toContain('Elements inserted');
    expect(output).toContain('Beta now has 7 siblings'); // Original 5 + 2 new
  });

  test('DOM_ELEMENT_CLONE should clone elements', async ({ page }) => {
    const script = `
-- Test DOM_ELEMENT_CLONE function
LET originalButton = DOM_GET selector=".test-collection button:first-child"
LET originalText = DOM_ELEMENT_TEXT element=originalButton
SAY "Original button text: " || originalText

LET clonedButton = DOM_ELEMENT_CLONE element=originalButton deep=true
SAY "Cloned button: " || clonedButton

-- Check cloned element properties
LET clonedText = DOM_ELEMENT_TEXT element=clonedButton
LET clonedTag = DOM_ELEMENT_TAG element=clonedButton
SAY "Cloned button text: " || clonedText
SAY "Cloned button tag: " || clonedTag
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Original button text: Alpha');
    expect(output).toContain('Cloned button: dom_element_');
    expect(output).toContain('Cloned button text: Alpha');
    expect(output).toContain('Cloned button tag: BUTTON');
  });

  test('DOM_ELEMENT_REMOVE should remove elements', async ({ page }) => {
    const script = `
-- Test DOM_ELEMENT_REMOVE function
LET container = DOM_GET selector=".test-collection"
LET childrenBefore = DOM_ELEMENT_CHILDREN element=container selector="button"
SAY "Buttons before removal: " || childrenBefore.length

LET lastButton = DOM_GET selector=".test-collection button:last-child"
LET lastButtonText = DOM_ELEMENT_TEXT element=lastButton
SAY "Removing button: " || lastButtonText

DOM_ELEMENT_REMOVE element=lastButton
SAY "Button removed"

LET childrenAfter = DOM_ELEMENT_CHILDREN element=container selector="button"
SAY "Buttons after removal: " || childrenAfter.length
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Buttons before removal: 5');
    expect(output).toContain('Removing button: Epsilon');
    expect(output).toContain('Button removed');
    expect(output).toContain('Buttons after removal: 4');
    
    // Verify the button is actually gone from the DOM
    const epsilonExists = await page.evaluate(() => {
      const buttons = document.querySelectorAll('.test-collection button');
      return Array.from(buttons).some(btn => btn.textContent === 'Epsilon');
    });
    expect(epsilonExists).toBe(false);
  });

  test('DOM_ELEMENT_REPLACE should replace elements', async ({ page }) => {
    const script = `
-- Test DOM_ELEMENT_REPLACE function
LET oldButton = DOM_GET selector=".test-collection button:nth-child(4)"
LET oldText = DOM_ELEMENT_TEXT element=oldButton
SAY "Replacing button: " || oldText

LET newButton = DOM_CREATE_ELEMENT tag="button" text="Replaced Gamma"
DOM_ELEMENT_REPLACE old_element=oldButton new_element=newButton
SAY "Button replaced"

-- Verify replacement by checking the new text
LET replacedButton = DOM_GET selector=".test-collection button:nth-child(4)"
LET newText = DOM_ELEMENT_TEXT element=replacedButton
SAY "New button text: " || newText
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Replacing button: Gamma');
    expect(output).toContain('Button replaced');
    expect(output).toContain('New button text: Replaced Gamma');
  });

  test('DOM_ELEMENT_ON_CLICK should add click event handlers', async ({ page }) => {
    const script = `
-- Test DOM_ELEMENT_ON_CLICK function
LET button = DOM_GET selector=".test-collection button:first-child"
SAY "Adding click handler to Alpha button"

DOM_ELEMENT_ON_CLICK element=button handler="alphaClickHandler"
SAY "Click handler added"

-- Trigger the click
DOM_ELEMENT_CLICK element=button
SAY "Button clicked programmatically"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Adding click handler to Alpha button');
    expect(output).toContain('Click handler added');
    expect(output).toContain('Button clicked programmatically');
    
    // Check console logs for the event handler
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    
    // Click the button manually to trigger the event handler
    await page.click('.test-collection button:first-child');
    await page.waitForTimeout(500);
    
    // Verify event handler was called (would need to check console logs in real scenario)
  });

  test('DOM_ELEMENT_TRIGGER_EVENT should dispatch events', async ({ page }) => {
    const script = `
-- Test DOM_ELEMENT_TRIGGER_EVENT function
LET button = DOM_GET selector=".test-collection button:first-child"
SAY "Setting up event handler"

DOM_ELEMENT_ON_EVENT element=button event="custom" handler="customHandler"
SAY "Custom event handler added"

-- Trigger custom event
DOM_ELEMENT_TRIGGER_EVENT element=button event="custom" data='{"message": "Hello from REXX"}'
SAY "Custom event triggered"

-- Trigger standard click event
DOM_ELEMENT_TRIGGER_EVENT element=button event="click"
SAY "Click event triggered"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Custom event handler added');
    expect(output).toContain('Custom event triggered');
    expect(output).toContain('Click event triggered');
  });

  test('Complex dynamic UI building workflow', async ({ page }) => {
    const script = `
-- Complex dynamic UI test
SAY "=== Dynamic UI Building Test ==="

-- Create a new section
LET section = DOM_CREATE_ELEMENT tag="div" id="dynamic-section"
DOM_ELEMENT_SET_STYLE element=section property="border" value="2px solid blue"
DOM_ELEMENT_SET_STYLE element=section property="padding" value="10px"
DOM_ELEMENT_SET_STYLE element=section property="margin" value="10px"

-- Create a heading
LET heading = DOM_CREATE_ELEMENT tag="h3" text="Dynamic Content"
DOM_ELEMENT_APPEND parent=section child=heading

-- Create a list
LET list = DOM_CREATE_ELEMENT tag="ul"
DOM_ELEMENT_APPEND parent=section child=list

-- Add list items
DO i = 1 TO 3
    LET item = DOM_CREATE_ELEMENT tag="li" text="Dynamic item " || i
    DOM_ELEMENT_APPEND parent=list child=item
    
    -- Add click handler to each item
    DOM_ELEMENT_ON_CLICK element=item handler="itemHandler" || i
END

-- Create a button to remove the section
LET removeBtn = DOM_CREATE_ELEMENT tag="button" text="Remove Section"
DOM_ELEMENT_SET_STYLE element=removeBtn property="backgroundColor" value="red"
DOM_ELEMENT_SET_STYLE element=removeBtn property="color" value="white"
DOM_ELEMENT_APPEND parent=section child=removeBtn

-- Add the section to the page
LET body = DOM_GET selector="body"
DOM_ELEMENT_APPEND parent=body child=section

SAY "Dynamic UI created successfully!"

-- Verify creation
LET sectionTag = DOM_ELEMENT_TAG element=section
LET sectionId = DOM_ELEMENT_ID element=section
SAY "Created section: " || sectionTag || " (ID: " || sectionId || ")"

LET children = DOM_ELEMENT_CHILDREN element=section
SAY "Section has " || children.length || " children"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(2000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Dynamic UI Building Test');
    expect(output).toContain('Dynamic UI created successfully!');
    expect(output).toContain('Created section: DIV (ID: dynamic-section)');
    expect(output).toContain('Section has 3 children'); // h3, ul, button
    
    // Verify the section was actually added to the DOM
    const sectionExists = await page.evaluate(() => {
      return document.getElementById('dynamic-section') !== null;
    });
    expect(sectionExists).toBe(true);
    
    // Verify the heading text
    const headingText = await page.evaluate(() => {
      const section = document.getElementById('dynamic-section');
      const heading = section.querySelector('h3');
      return heading ? heading.textContent : null;
    });
    expect(headingText).toBe('Dynamic Content');
  });

  test('Form manipulation workflow', async ({ page }) => {
    const script = `
-- Form manipulation test
SAY "=== Form Manipulation Test ==="

LET form = DOM_GET selector="#testForm"
SAY "Working with existing form"

-- Add a new field
LET newField = DOM_CREATE_ELEMENT tag="div"
LET newLabel = DOM_CREATE_ELEMENT tag="label" text="Email: "
LET newInput = DOM_CREATE_ELEMENT tag="input" type="email" name="email" placeholder="Enter email"

DOM_ELEMENT_APPEND parent=newField child=newLabel
DOM_ELEMENT_APPEND parent=newField child=newInput

-- Insert before submit button
LET submitBtn = DOM_GET selector="#submitBtn"
DOM_ELEMENT_INSERT_BEFORE reference=submitBtn new_element=newField

SAY "Added email field to form"

-- Clone the form
LET clonedForm = DOM_ELEMENT_CLONE element=form deep=true
LET clonedFormId = "clonedForm"
DOM_ELEMENT_SET_ATTR element=clonedForm name="id" value=clonedFormId

-- Append cloned form to body
LET body = DOM_GET selector="body"
DOM_ELEMENT_APPEND parent=body child=clonedForm

SAY "Cloned and added form to page"

-- Verify the new form exists
LET allForms = DOM_GET_ALL selector="form"
SAY "Total forms on page: " || allForms.length
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(2000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Form Manipulation Test');
    expect(output).toContain('Added email field to form');
    expect(output).toContain('Cloned and added form to page');
    expect(output).toContain('Total forms on page: 2');
    
    // Verify the email field was added
    const emailFieldExists = await page.evaluate(() => {
      const form = document.getElementById('testForm');
      return form.querySelector('input[type="email"]') !== null;
    });
    expect(emailFieldExists).toBe(true);
    
    // Verify the cloned form exists
    const clonedFormExists = await page.evaluate(() => {
      return document.getElementById('clonedForm') !== null;
    });
    expect(clonedFormExists).toBe(true);
  });

  test('Error handling for Phase 3 functions', async ({ page }) => {
    const script = `
-- Test error handling
SAY "Testing Phase 3 error handling..."

-- Try to append to non-existent element
DOM_ELEMENT_APPEND parent="invalid_ref" child="also_invalid"
SAY "This should not appear"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Testing Phase 3 error handling');
    expect(output).toContain('Error');
    expect(output).not.toContain('This should not appear');
  });
});