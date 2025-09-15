# DOM Functions

DOM automation capabilities for web testing, UI manipulation, and interactive application development, designed for Autonomous Web Mode execution.

## ⚠️ Autonomous Web Mode Only

**Important**: DOM functions are only available in Autonomous Web Mode (direct browser execution). They will throw an error in Command-line mode since the `document` object is not available, and are not applicable in Controlled Web Mode where the worker iframe may not have DOM access permissions.

```rexx
-- This will work in browser
LET count = QUERY selector="button" operation="count"

-- This will throw "DOM functions only available in browser environment" in Command-line mode
```

## Core DOM Query Functions

### QUERY - Element Inspection and Data Retrieval

The `QUERY` function is the foundation of DOM interaction, providing multiple operations for inspecting elements.

#### Basic Syntax
```rexx
LET result = QUERY selector="CSS_SELECTOR" operation="OPERATION" [additional_params]
```

### Element Counting and Existence
```rexx
-- Count matching elements
LET button_count = QUERY selector="button" operation="count"
LET form_count = QUERY selector="form" operation="count"

-- Check if element exists (returns true/false)
LET modal_exists = QUERY selector="#modal" operation="exists"
LET has_errors = QUERY selector=".error-message" operation="exists"
```

### Visibility and State Checking
```rexx
-- Check if element is visible (considers offsetParent)
LET is_visible = QUERY selector="#popup" operation="visible"
LET menu_open = QUERY selector=".dropdown-menu" operation="visible"

-- Check for CSS classes
LET is_selected = QUERY selector="#item1" operation="has_class" class="selected"
LET is_loading = QUERY selector=".spinner" operation="has_class" class="active"
```

### Content and Value Extraction
```rexx
-- Get text content
LET title_text = QUERY selector="#page-title" operation="text"
LET error_message = QUERY selector=".error" operation="text"

-- Get input/select values
LET user_name = QUERY selector="#username" operation="value"
LET selected_country = QUERY selector="#country-select" operation="value"

-- Get element attributes
LET element_id = QUERY selector=".main-content" operation="id"
LET element_name = QUERY selector="input[type='text']" operation="name"
LET css_classes = QUERY selector="#container" operation="class"

-- Get custom attributes
LET data_id = QUERY selector=".product" operation="attribute" attribute="data-product-id"
LET aria_label = QUERY selector="button" operation="attribute" attribute="aria-label"
```

### Form Serialization
```rexx
-- Serialize form data to JSON string
LET form_data = QUERY selector="#registration-form" operation="serialize"
-- Returns: {"name":"John","email":"john@example.com","country":"US"}
```

## DOM Manipulation Functions

### CLICK - Element Interaction
```rexx
-- Basic clicking
CLICK selector="#submit-button"
CLICK selector=".menu-item:first-child"

-- Click with validation
LET button_exists = QUERY selector="#save-btn" operation="exists"
IF button_exists THEN
    CLICK selector="#save-btn"
ENDIF
```

### TYPE - Text Input
```rexx
-- Basic text input
TYPE selector="#username" text="john_doe"
TYPE selector="#password" text="secret123"

-- Clear and type
TYPE selector="#search-box" text=""  -- Clear field
TYPE selector="#search-box" text="new search term"

-- Dynamic text input
LET user_email = "user@domain.com"
TYPE selector="#email-input" text=user_email
```

### SELECT_OPTION - Dropdown Selection
```rexx
-- Select by value
SELECT_OPTION selector="#country-select" value="US"
SELECT_OPTION selector="#language" value="en"

-- Dynamic selection
LET preferred_country = "CA"
SELECT_OPTION selector="#shipping-country" value=preferred_country
```

### SET - Property Assignment
```rexx
-- Set element properties
SET selector="#progress-bar" property="value" value="75"
SET selector="#status-text" property="textContent" value="Processing..."

-- Set custom properties
SET selector="#player" property="currentTime" value="30"
```

## CSS Manipulation Functions

### ADD_CLASS / REMOVE_CLASS - Class Management
```rexx
-- Add classes
ADD_CLASS selector=".menu-item" class="active"
ADD_CLASS selector="#notification" class="visible"

-- Remove classes  
REMOVE_CLASS selector=".old-item" class="highlighted"
REMOVE_CLASS selector="#modal" class="hidden"

-- Conditional class management
LET is_valid = QUERY selector="#form" operation="attribute" attribute="data-valid"
IF is_valid = "true" THEN
    ADD_CLASS selector="#form" class="success"
    REMOVE_CLASS selector="#form" class="error"
ELSE
    ADD_CLASS selector="#form" class="error"
    REMOVE_CLASS selector="#form" class="success"
ENDIF
```

### SET_STYLE - Direct Style Manipulation
```rexx
-- Basic styling
SET_STYLE selector="#popup" property="display" value="block"
SET_STYLE selector=".highlight" property="backgroundColor" value="yellow"

-- Dynamic styling
LET progress_width = "75%"
SET_STYLE selector="#progress-fill" property="width" value=progress_width

-- Hide/show elements
SET_STYLE selector="#loading-spinner" property="display" value="none"
SET_STYLE selector="#content" property="opacity" value="1"
```

## Timing and Waiting Functions

### WAIT_FOR - Element Waiting
```rexx
-- Wait for element with default 5-second timeout
LET success = WAIT_FOR selector=".success-message"
IF success THEN
    SAY "Success message appeared"
ELSE
    SAY "Timeout - success message never appeared"
ENDIF

-- Wait with custom timeout (10 seconds)
LET modal_appeared = WAIT_FOR selector="#confirmation-modal" timeout=10000
```

### WAIT - Simple Delays
```rexx
-- Wait 1 second (default)
WAIT

-- Wait specific duration
WAIT milliseconds=2000  -- 2 seconds
WAIT milliseconds=500   -- 0.5 seconds

-- Use in automation sequences
CLICK selector="#load-data-btn"
WAIT milliseconds=1000
LET data_loaded = QUERY selector=".data-table" operation="visible"
```

## Advanced Automation Patterns

### Form Automation Workflow
```rexx
-- Complete form filling and submission
SAY "Starting registration form automation..."

-- Fill form fields
TYPE selector="#firstName" text="John"
TYPE selector="#lastName" text="Doe"
TYPE selector="#email" text="john.doe@example.com"
SELECT_OPTION selector="#country" value="US"

-- Handle checkboxes
CLICK selector="#terms-checkbox"
CLICK selector="#newsletter-checkbox"

-- Validate before submit
LET email_valid = QUERY selector="#email" operation="attribute" attribute="data-valid"
LET terms_checked = QUERY selector="#terms-checkbox" operation="attribute" attribute="checked"

IF email_valid = "true" AND terms_checked THEN
    CLICK selector="#submit-button"
    
    -- Wait for success or error
    LET success_shown = WAIT_FOR selector=".success-message" timeout=5000
    IF success_shown THEN
        LET success_text = QUERY selector=".success-message" operation="text"
        SAY "Registration successful: " || success_text
    ELSE
        LET error_shown = QUERY selector=".error-message" operation="exists"
        IF error_shown THEN
            LET error_text = QUERY selector=".error-message" operation="text"
            SAY "Registration failed: " || error_text
        ELSE
            SAY "Registration status unknown - timeout"
        ENDIF
    ENDIF
ELSE
    SAY "Form validation failed - cannot submit"
ENDIF
```

### Bulk Element Processing
```rexx
-- Process multiple similar elements
LET todo_count = QUERY selector=".todo-item" operation="count"
SAY "Found " || todo_count || " todo items to process"

DO i = 1 TO todo_count
    LET item_selector = ".todo-item:nth-child(" || i || ")"
    
    -- Check if item is already completed
    LET is_completed = QUERY selector=item_selector operation="has_class" class="completed"
    
    IF is_completed = false THEN
        -- Get the todo text
        LET todo_text = QUERY selector=item_selector || " .todo-text" operation="text"
        SAY "Completing todo: " || todo_text
        
        -- Mark as complete
        CLICK selector=item_selector || " .todo-checkbox"
        ADD_CLASS selector=item_selector class="completed"
        
        -- Add visual feedback
        SET_STYLE selector=item_selector property="opacity" value="0.7"
        
        -- Brief pause between items
        WAIT milliseconds=200
    ENDIF
END

SAY "Todo list processing complete"
```

### Data Extraction and Analysis
```rexx
-- Extract information from web pages
LET product_count = QUERY selector=".product-card" operation="count"
SAY "Analyzing " || product_count || " products..."

LET total_price = 0
LET sale_count = 0

DO i = 1 TO product_count
    LET product_selector = ".product-card:nth-child(" || i || ")"
    
    -- Extract product details
    LET name = QUERY selector=product_selector || " .product-name" operation="text"
    LET price_text = QUERY selector=product_selector || " .product-price" operation="text"
    LET is_on_sale = QUERY selector=product_selector operation="has_class" class="on-sale"
    
    -- Parse price (assuming format like "$29.99")
    LET price = SUBSTRING string=price_text start=2  -- Remove $ sign
    LET total_price = total_price + price
    
    IF is_on_sale THEN
        LET sale_count = sale_count + 1
        SAY "SALE: " || name || " - " || price_text
    ENDIF
END

LET average_price = total_price / product_count
SAY "Analysis complete:"
SAY "Total products: " || product_count
SAY "Products on sale: " || sale_count
SAY "Average price: $" || average_price
```

### Conditional UI Navigation
```rexx
-- Make decisions based on current page state
LET menu_visible = QUERY selector="#mobile-menu" operation="visible"
LET is_mobile = QUERY selector="body" operation="has_class" class="mobile-view"

IF is_mobile AND menu_visible = false THEN
    -- Open mobile menu
    CLICK selector="#menu-toggle"
    WAIT_FOR selector="#mobile-menu"
    SAY "Mobile menu opened"
ENDIF

-- Navigate based on current page
LET current_page = QUERY selector="body" operation="attribute" attribute="data-page"

SELECT
    WHEN current_page = "home" THEN
        CLICK selector="#about-link"
        SAY "Navigating to about page"
    WHEN current_page = "about" THEN  
        CLICK selector="#contact-link"
        SAY "Navigating to contact page"
    OTHERWISE
        CLICK selector="#home-link"
        SAY "Returning to home page"
END
```

## Enhanced Error Handling

DOM functions integrate with Rexx error handling and provide enhanced error context including full JavaScript stack traces.

### Enhanced Error Context Functions

When `SIGNAL ON ERROR` is active, these functions provide detailed error information:

- **`ERROR_LINE`** - Line number where the error occurred
- **`ERROR_MESSAGE`** - Full error message
- **`ERROR_STACK`** - Complete JavaScript stack trace
- **`ERROR_FUNCTION`** - Name of the function that failed
- **`ERROR_COMMAND`** - Full Rexx command that caused the error
- **`ERROR_VARIABLES`** - JSON snapshot of all variables at error time
- **`ERROR_TIMESTAMP`** - ISO timestamp when error occurred
- **`ERROR_DETAILS`** - Summary object with key error information

### Comprehensive Error Handling Example
```rexx
-- Enhanced error handling with full context
SIGNAL ON ERROR NAME DetailedErrorHandler
LET username = "testuser"
LET attempt = 1

-- This will fail if element doesn't exist
CLICK selector="#nonexistent-button"

EXIT

DetailedErrorHandler:
-- Capture all available error information
LET error_line = ERROR_LINE
LET error_message = ERROR_MESSAGE
LET error_function = ERROR_FUNCTION
LET error_command = ERROR_COMMAND
LET error_variables = ERROR_VARIABLES
LET js_stack_trace = ERROR_STACK
LET error_time = ERROR_TIMESTAMP

-- Parse the captured variables to access them
LET vars_obj = JSON_PARSE text=error_variables
LET failed_username = ARRAY_GET array=vars_obj key="username"
LET failed_attempt = ARRAY_GET array=vars_obj key="attempt"

-- Log comprehensive error information
SAY "=== ERROR DETAILS ==="
SAY "Line: " || error_line
SAY "Function: " || error_function
SAY "Message: " || error_message
SAY "Command: " || error_command
SAY "Time: " || error_time
SAY "Variables at error:"
SAY "  username: " || failed_username
SAY "  attempt: " || failed_attempt
SAY ""
SAY "JavaScript Stack Trace:"
SAY error_stack

-- Implement recovery logic based on error details
IF error_function = "CLICK" THEN
    SAY "Click failed - trying alternative approach"
    -- Look for similar elements
    LET alt_buttons = QUERY selector="button" operation="count"
    IF alt_buttons > 0 THEN
        CLICK selector="button:first-child"
        SAY "Clicked first available button instead"
    ENDIF
ENDIF
```

### Robust DOM Automation with Fallbacks
```rexx
SIGNAL ON ERROR NAME DOMErrorHandler

-- Attempt DOM operations
LET element_exists = QUERY selector="#target-element" operation="exists"
IF element_exists THEN
    CLICK selector="#target-element"
    TYPE selector="#input-field" text="test data"
    
    -- Wait for result
    LET success = WAIT_FOR selector=".result" timeout=3000
    IF success THEN
        SAY "Operation completed successfully"
    ELSE
        -- This might throw an error if element doesn't exist
        LET result_text = QUERY selector=".result" operation="text"
    ENDIF
ENDIF

EXIT

DOMErrorHandler:
SAY "DOM operation failed - continuing with fallback approach"
-- Implement fallback logic here
LET fallback_element = QUERY selector=".alternative-element" operation="exists"
IF fallback_element THEN
    CLICK selector=".alternative-element"
ENDIF
```

## Automated Testing with DOM Functions

### Web Application Test Automation
```rexx
-- Comprehensive test automation
SAY "Starting automated tests..."

-- Test 1: Login functionality
SAY "Test 1: User login"
TYPE selector="#username" text="testuser"
TYPE selector="#password" text="testpass"
CLICK selector="#login-button"

LET login_success = WAIT_FOR selector=".dashboard" timeout=5000
IF login_success THEN
    SAY "✅ Login test PASSED"
ELSE
    LET error_shown = QUERY selector=".login-error" operation="visible"
    IF error_shown THEN
        LET error_msg = QUERY selector=".login-error" operation="text"
        SAY "❌ Login test FAILED: " || error_msg
    ELSE
        SAY "❌ Login test FAILED: Timeout"
    ENDIF
ENDIF

-- Test 2: Navigation
SAY "Test 2: Navigation menu"
CLICK selector="#products-menu"
LET products_page = WAIT_FOR selector=".products-grid" timeout=3000
IF products_page THEN
    LET product_count = QUERY selector=".product-item" operation="count"
    IF product_count > 0 THEN
        SAY "✅ Navigation test PASSED - Found " || product_count || " products"
    ELSE
        SAY "❌ Navigation test FAILED - No products found"
    ENDIF
ELSE
    SAY "❌ Navigation test FAILED - Products page did not load"
ENDIF

-- Test 3: Search functionality
SAY "Test 3: Search feature"
TYPE selector="#search-input" text="laptop"
CLICK selector="#search-button"
WAIT milliseconds=1000

LET search_results = QUERY selector=".search-results .result-item" operation="count"
IF search_results > 0 THEN
    SAY "✅ Search test PASSED - Found " || search_results || " results"
ELSE
    SAY "❌ Search test FAILED - No search results"
ENDIF

SAY "Test automation completed"
```

## Best Practices

### 1. Always Check Element Existence
```rexx
-- Good: Check before interacting
LET button_exists = QUERY selector="#submit-btn" operation="exists"
IF button_exists THEN
    CLICK selector="#submit-btn"
ENDIF

-- Avoid: Direct interaction without checking
-- CLICK selector="#submit-btn"  -- May fail if element doesn't exist
```

### 2. Use Appropriate Waiting Strategies
```rexx
-- Good: Wait for dynamic content
CLICK selector="#load-data"
LET data_loaded = WAIT_FOR selector=".data-table" timeout=10000
IF data_loaded THEN
    -- Process data
ENDIF

-- Good: Simple delays for animations
CLICK selector="#menu-toggle"
WAIT milliseconds=300  -- Allow animation to complete
```

### 3. Handle Different Screen Sizes and States
```rexx
-- Responsive design handling
LET is_mobile = QUERY selector="body" operation="has_class" class="mobile"
IF is_mobile THEN
    CLICK selector="#mobile-menu-toggle"
    WAIT_FOR selector="#mobile-nav"
    CLICK selector="#mobile-nav .about-link"
ELSE
    CLICK selector="#desktop-nav .about-link"
ENDIF
```

### 4. Provide Clear Logging and Feedback
```rexx
-- Good: Descriptive logging
SAY "Starting form submission process..."
TYPE selector="#email" text="user@example.com"
SAY "Email entered successfully"

CLICK selector="#submit"
SAY "Submit button clicked, waiting for response..."

LET success = WAIT_FOR selector=".success-message" timeout=5000
IF success THEN
    SAY "Form submitted successfully"
ELSE
    SAY "Form submission failed or timed out"
ENDIF
```

### 5. Use Error Handling for Robust Automation
```rexx
SIGNAL ON ERROR NAME HandleDOMError

-- Your DOM automation code here
LET count = QUERY selector=".items" operation="count"
DO i = 1 TO count
    CLICK selector=".item:nth-child(" || i || ")"
    WAIT milliseconds=100
END

EXIT

HandleDOMError:
SAY "DOM operation failed, attempting recovery..."
-- Implement recovery logic
SIGNAL OFF ERROR  -- Continue without error handling if needed
```

## Integration with Other Rexx Features

DOM functions work seamlessly with all other Rexx language features:

### With Variables and Expressions
```rexx
LET base_selector = "#form"
LET field_number = 3
LET dynamic_selector = base_selector || " input:nth-child(" || field_number || ")"
TYPE selector=dynamic_selector text="Dynamic input"
```

### With Control Flow
```rexx
LET error_count = QUERY selector=".error" operation="count"
IF error_count > 0 THEN
    SAY "Found " || error_count || " errors to fix"
    DO i = 1 TO error_count
        LET error_selector = ".error:nth-child(" || i || ")"
        LET error_text = QUERY selector=error_selector operation="text"
        SAY "Error " || i || ": " || error_text
    END
ENDIF
```

### With Built-in Functions
```rexx
LET timestamp = NOW
LET log_entry = "Page loaded at: " || timestamp
TYPE selector="#log-input" text=log_entry

LET form_data = QUERY selector="#form" operation="serialize"
LET data_obj = JSON_PARSE text=form_data
-- Process parsed form data
```

## Function Reference

### Query Operations
- `QUERY selector="..." operation="count"` - Count matching elements
- `QUERY selector="..." operation="exists"` - Check if element exists
- `QUERY selector="..." operation="visible"` - Check if element is visible
- `QUERY selector="..." operation="text"` - Get text content
- `QUERY selector="..." operation="value"` - Get input/select value
- `QUERY selector="..." operation="attribute" attribute="..."` - Get attribute value
- `QUERY selector="..." operation="has_class" class="..."` - Check for CSS class
- `QUERY selector="..." operation="serialize"` - Serialize form to JSON

### Interaction Functions
- `CLICK selector="..."` - Click element
- `TYPE selector="..." text="..."` - Type text into input
- `SELECT_OPTION selector="..." value="..."` - Select dropdown option
- `SET selector="..." property="..." value="..."` - Set element property

### Style Functions
- `ADD_CLASS selector="..." class="..."` - Add CSS class
- `REMOVE_CLASS selector="..." class="..."` - Remove CSS class
- `SET_STYLE selector="..." property="..." value="..."` - Set CSS style

### Timing Functions
- `WAIT_FOR selector="..." timeout=...` - Wait for element to appear
- `WAIT milliseconds=...` - Simple delay

### Error Context Functions (when SIGNAL ON ERROR is active)
- `ERROR_LINE` - Line number of error
- `ERROR_MESSAGE` - Error message
- `ERROR_STACK` - JavaScript stack trace
- `ERROR_FUNCTION` - Function that failed
- `ERROR_COMMAND` - Rexx command that caused error
- `ERROR_VARIABLES` - JSON snapshot of variables
- `ERROR_TIMESTAMP` - When error occurred

**See also:**
- [Control Flow](02-control-flow.md) for loops and conditionals in automation
- [String Functions](04-string-functions.md) for processing extracted text
- [JSON Functions](08-json-functions.md) for handling form serialization
- [Array Functions](06-array-functions.md) for processing multiple elements