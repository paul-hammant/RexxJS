# Rexx Examples

Practical examples demonstrating the interpreter's capabilities - from self-contained automation to cross-application addressing communication.

**Quick Start:**
```bash
npx http-server -p 8082 -c-1
# Open: http://localhost:8082/tests/test-harness-dom.html
```

## Built-in Function Examples

The interpreter includes 259+ built-in functions for self-contained operation:

### Data Processing Pipeline
```rexx
-- Process JSON data with validation and transformation
LET users = '[{"name":"john doe","email":"JOHN@INVALID"},{"name":"jane smith","email":"jane@example.com"}]'
LET parsed = JSON_PARSE text=users
LET count = ARRAY_LENGTH array=parsed

DO i = 1 TO count
    LET user = ARRAY_GET array=parsed index=i
    LET name = PROPER string=ARRAY_GET(array=user key="name")
    LET email = LOWER string=ARRAY_GET(array=user key="email")
    LET valid = REGEX_TEST string=email pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
    
    IF valid THEN
        SAY name || " <" || email || "> ✓"
    ELSE
        SAY name || " <" || email || "> ✗ Invalid email"
    ENDIF
END
```

### Cryptographic Operations
```rexx
-- Hash generation and verification (browser crypto API)
LET data = "sensitive information"
LET hash = SHA256 data=data
LET encoded = BASE64_ENCODE text=hash

SAY "SHA256: " || hash
SAY "Base64: " || encoded

-- Password hashing with salt
LET password = "MySecurePassword123"
LET salt = RANDOM_STRING length=32
LET hashed = PASSWORD_HASH password=password salt=salt
SAY "Hashed password: " || hashed
```

### Statistical Analysis
```rexx
-- Calculate statistics from numeric data
LET dataset = '[12, 15, 18, 22, 25, 28, 31, 35, 38, 42]'
LET numbers = JSON_PARSE text=dataset
LET count = ARRAY_LENGTH array=numbers

LET sum = 0
LET max_val = ARRAY_GET array=numbers index=1
LET min_val = max_val

DO i = 1 TO count
    LET num = ARRAY_GET array=numbers index=i
    LET sum = sum + num
    IF num > max_val THEN LET max_val = num
    IF num < min_val THEN LET min_val = num
END

LET mean = sum / count
LET range = max_val - min_val

SAY "Dataset: " || dataset
SAY "Count: " || count || ", Sum: " || sum
SAY "Mean: " || ROUND(value=mean decimals=2)
SAY "Range: " || min_val || "-" || max_val || " (" || range || ")"
```

## DOM Automation Examples

### Form Automation & Validation
```rexx
-- Comprehensive form testing
SIGNAL ON ERROR NAME FormError

-- Test form validation
CLICK selector="#submit-form"
LET errors = QUERY selector=".error-message" operation="count"
SAY "Empty form validation: " || errors || " errors shown"

-- Fill and submit form
TYPE selector="#name-input" text="John Smith"  
TYPE selector="#email-input" text="john@example.com"
SELECT_OPTION selector="#country-select" value="US"
CLICK selector="#newsletter"

-- Verify data entry
LET name = QUERY selector="#name-input" operation="value"
LET email = QUERY selector="#email-input" operation="value"
SAY "Entered: " || name || " <" || email || ">"

CLICK selector="#submit-form"
LET success = WAIT_FOR selector=".success-message" timeout=3000
SAY "Form submission: " || (success ? "SUCCESS" : "FAILED")
EXIT

FormError:
SAY "DOM Error: " || ERROR_MESSAGE || " (line " || ERROR_LINE || ")"
```

### Dynamic Content Processing
```rexx
-- Process variable number of list items
LET item_count = QUERY selector=".todo-item" operation="count"
SAY "Processing " || item_count || " todo items..."

DO i = 1 TO item_count
    LET selector = ".todo-item:nth-child(" || i || ")"
    LET text = QUERY selector=selector || " .todo-text" operation="text"
    LET completed = QUERY selector=selector operation="has_class" class="completed"
    
    IF completed = false THEN
        CLICK selector=selector || " .todo-checkbox"
        ADD_CLASS selector=selector class="completed"
        SAY "Completed: " || text
    ELSE
        SAY "Already done: " || text  
    ENDIF
END
```

### Page Analysis & Scraping  
```rexx
-- Analyze page structure and extract data
LET buttons = QUERY selector="button" operation="count"
LET inputs = QUERY selector="input" operation="count"
LET forms = QUERY selector="form" operation="count"

SAY "Page Analysis:"
SAY "  Buttons: " || buttons
SAY "  Inputs: " || inputs  
SAY "  Forms: " || forms

-- Extract all form field data
IF forms > 0 THEN
    LET form_data = QUERY selector="form" operation="serialize"
    LET data = JSON_PARSE text=form_data
    
    SAY "Form data extracted:"
    -- Iterate through form fields (simplified)
    SAY form_data
ENDIF
```

## Error Handling with Context

### Robust DOM Operations
```rexx
-- Advanced error handling with recovery
SIGNAL ON ERROR NAME SmartRecovery
LET retry_count = 0

AttemptOperation:
CLICK selector="#dynamic-button"
WAIT_FOR selector=".result" timeout=2000
SAY "Operation successful"
EXIT

SmartRecovery:
LET func = ERROR_FUNCTION
LET vars = JSON_PARSE text=ERROR_VARIABLES
LET retries = ARRAY_GET array=vars key="retry_count"

SELECT
    WHEN func = "CLICK" THEN
        SAY "Click failed - trying alternative selector"
        LET alt_buttons = QUERY selector="button" operation="count"
        IF alt_buttons > 0 THEN
            CLICK selector="button:first-child"
        ENDIF
    WHEN func = "WAIT_FOR" AND retries < 3 THEN  
        LET retry_count = retries + 1
        SAY "Timeout - retry " || retry_count
        WAIT milliseconds=1000
        SIGNAL AttemptOperation
    OTHERWISE
        SAY "Unrecoverable error: " || ERROR_MESSAGE
        SAY "Stack trace:"
        SAY ERROR_STACK
END
```

## Cross-Application Communication

### Calculator Automation
```rexx
-- Control calculator in separate iframe
ADDRESS calculator

clear
press button=5
press button="*"  
press button=6
press button="="

LET result = getDisplay
SAY "5 × 6 = " || result

-- Chain calculations
LET sum = add x=result y=10
display message="Result + 10 = " || sum
```

### Kitchen Service Integration
```rexx
-- Multi-service application addressing workflow
ADDRESS kitchen

-- Check inventory and plan meal
LET stock = checkStock item="chicken"
LET available = ARRAY_GET array=stock key="quantity"

IF available >= 6 THEN
    createMeal chicken=6 potatoes=4 rice=2
    prepareDish name="Deluxe Dinner" servings=6
    
    LET remaining = checkStock item="chicken"
    SAY "Used 6 chicken, " || ARRAY_GET(array=remaining key="quantity") || " remaining"
ELSE
    prepareDish name="Vegetarian Special" servings=4
    SAY "Insufficient chicken (" || available || "), prepared vegetarian meal"
ENDIF
```

### Cross-Application DOM + Addressing
```rexx
-- Combine local DOM with remote application addressing
LET user_name = QUERY selector="#name-input" operation="value"
IF user_name = "" THEN
    TYPE selector="#name-input" text="Demo User"  
    LET user_name = "Demo User"
ENDIF

-- Send to calculator iframe
ADDRESS calculator
display message="Hello, " || user_name

-- Perform calculation
LET lucky_number = add x=LENGTH(string=user_name) y=42
display message="Your lucky number: " || lucky_number

-- Update local page
ADD_CLASS selector="#name-input" class="processed"
SAY "Sent greeting and lucky number to calculator"
```

## Complex Automation Patterns

### Web Testing Suite
```rexx
-- Production-quality testing framework
SIGNAL ON ERROR NAME TestError
LET passed = 0
LET failed = 0
LET tests = '[
    {"name":"Form Elements","selector":"#submit-form","operation":"exists"},
    {"name":"Email Validation","selector":"#email-input","operation":"exists"},
    {"name":"Submit Button","selector":"#submit-form","operation":"exists"}
]'

LET test_list = JSON_PARSE text=tests
LET test_count = ARRAY_LENGTH array=test_list

DO i = 1 TO test_count
    LET test = ARRAY_GET array=test_list index=i
    LET name = ARRAY_GET array=test key="name"
    LET selector = ARRAY_GET array=test key="selector"
    LET operation = ARRAY_GET array=test key="operation"
    
    LET result = QUERY selector=selector operation=operation
    IF result THEN
        SAY "✓ " || name
        LET passed = passed + 1
    ELSE
        SAY "✗ " || name  
        LET failed = failed + 1
    ENDIF
END

LET total = passed + failed
LET rate = ROUND value=(passed * 100 / total) decimals=1
SAY ""
SAY "Test Results: " || passed || "/" || total || " passed (" || rate || "%)"
EXIT

TestError:
SAY "Test framework error: " || ERROR_MESSAGE
LET failed = failed + 1
```

### Data Validation Pipeline
```rexx
-- Enterprise data processing
LET raw_data = '[
    {"email":"user@example.com","age":"25","score":"85.5"},
    {"email":"invalid-email","age":"abc","score":"92"},
    {"email":"test@domain.org","age":"30","score":"78.2"}
]'

LET records = JSON_PARSE text=raw_data
LET count = ARRAY_LENGTH array=records
LET valid_records = '[]'
LET validation_errors = '[]'

DO i = 1 TO count
    LET record = ARRAY_GET array=records index=i
    LET email = ARRAY_GET array=record key="email"
    LET age = ARRAY_GET array=record key="age"
    LET score = ARRAY_GET array=record key="score"
    
    -- Validation logic
    LET email_valid = REGEX_TEST string=email pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
    LET age_num = age + 0  -- Convert to number, NaN if invalid
    LET score_num = score + 0
    
    IF email_valid AND age_num > 0 AND age_num < 120 AND score_num >= 0 AND score_num <= 100 THEN
        -- Clean and add to valid records
        LET clean_record = '{"email":"' || LOWER(string=email) || '","age":' || age_num || ',"score":' || score_num || '}'
        LET valid_records = ARRAY_PUSH array=valid_records item=JSON_PARSE(text=clean_record)
    ELSE
        -- Add to error list
        LET error = '{"record":' || i || ',"email_valid":' || email_valid || ',"age_valid":' || (age_num > 0 AND age_num < 120) || ',"score_valid":' || (score_num >= 0 AND score_num <= 100) || '}'
        LET validation_errors = ARRAY_PUSH array=validation_errors item=JSON_PARSE(text=error)
    ENDIF
END

LET valid_count = ARRAY_LENGTH array=valid_records
LET error_count = ARRAY_LENGTH array=validation_errors

SAY "Data Validation Results:"
SAY "  Total records: " || count
SAY "  Valid records: " || valid_count  
SAY "  Invalid records: " || error_count
SAY "  Validation rate: " || ROUND(value=(valid_count * 100 / count) decimals=1) || "%"

IF error_count > 0 THEN
    SAY ""
    SAY "Validation Errors:"
    SAY JSON_STRINGIFY data=validation_errors pretty=true
ENDIF
```

## Performance Testing

### Load Testing Simulation
```rexx
-- Simulate user interactions for performance testing
SIGNAL ON ERROR NAME LoadTestError
LET iterations = 50
LET successful_operations = 0
LET failed_operations = 0
LET start_time = NOW

SAY "Starting load test: " || iterations || " iterations"

DO i = 1 TO iterations
    -- Simulate user workflow
    TYPE selector="#search-input" text="test query " || i
    CLICK selector="#search-button"
    
    LET results_loaded = WAIT_FOR selector=".search-results" timeout=5000
    IF results_loaded THEN
        LET result_count = QUERY selector=".result-item" operation="count"
        IF result_count > 0 THEN
            LET successful_operations = successful_operations + 1
            SAY "Iteration " || i || ": " || result_count || " results"
        ELSE
            LET failed_operations = failed_operations + 1
        ENDIF
    ELSE
        LET failed_operations = failed_operations + 1
        SAY "Iteration " || i || ": TIMEOUT"
    ENDIF
    
    -- Clear for next iteration
    CLICK selector="#clear-search"
    WAIT milliseconds=100
END

LET end_time = NOW
LET success_rate = ROUND value=(successful_operations * 100 / iterations) decimals=1

SAY ""
SAY "Load Test Results:"
SAY "  Total operations: " || iterations
SAY "  Successful: " || successful_operations
SAY "  Failed: " || failed_operations  
SAY "  Success rate: " || success_rate || "%"
SAY "  Start: " || start_time
SAY "  End: " || end_time
EXIT

LoadTestError:
LET failed_operations = failed_operations + 1
SAY "Load test error at iteration " || i || ": " || ERROR_MESSAGE
```

## Demo URLs

**Interactive Environments:**
- **DOM Test Harness**: `http://localhost:8082/tests/test-harness-dom.html` - Complete DOM automation environment
- **Cross-Application Addressing**: `http://localhost:8082/tests/test-harness-cross-iframe2.html` - Calculator automation demo
- **Basic Application Addressing**: `http://localhost:8082/tests/test-harness-cross-iframe.html` - Simple application addressing demonstration

**Key Files:**
- `src/interpreter.js` - Core interpreter with 259+ built-in functions
- `src/parser.js` - Rexx language parser
- `tests/` - Complete test suite and examples

**Architecture Highlights:**
- Self-contained built-in functions (259+)
- Browser DOM automation capabilities
- Cross-application addressing communication
- Enhanced error handling with JavaScript stack traces
- Production-ready automation patterns
