# Advanced Statements

Advanced language constructs for precision control, parsing, debugging, and program structure.

## NUMERIC Statement - Precision Control

Control arithmetic precision and formatting following classic Rexx standards.

### Basic Syntax
```rexx
NUMERIC DIGITS value    -- Set decimal precision (1-999999999)
NUMERIC FUZZ value      -- Set comparison tolerance (0 to digits-1)
NUMERIC FORM format     -- Set format (SCIENTIFIC or ENGINEERING)
```

### Examples
```rexx
-- Set decimal precision
NUMERIC DIGITS 15
SAY "High precision calculation"
LET result = 1.0 / 3.0

-- Set fuzz for comparison tolerance
NUMERIC FUZZ 2
SAY "Tolerant comparisons"

-- Set number format
NUMERIC FORM SCIENTIFIC
SAY "Scientific notation enabled"

-- Using variables
LET precision = "20"
NUMERIC DIGITS precision
SAY "Dynamic precision setting"
```

### Supported Settings
- **DIGITS** - Decimal precision (default: 9)
- **FUZZ** - Comparison tolerance (default: 0)  
- **FORM** - Number format: SCIENTIFIC or ENGINEERING (default: SCIENTIFIC)

## PARSE Statement - Advanced String Parsing

Powerful string parsing with templates, following classic Rexx patterns.

### Basic Syntax
```rexx
PARSE VAR variable WITH template       -- Parse from variable
PARSE VALUE expression WITH template   -- Parse from expression  
PARSE ARG variable WITH template       -- Parse from arguments
```

### Template Features
- **Variables** - Capture parsed segments
- **Quoted delimiters** - Custom separators like `","`, `"-"`, `"@"`
- **Space parsing** - Automatic word separation
- **Remaining text** - Last variable gets all remaining content

### Examples

**Space-delimited parsing:**
```rexx
LET fullName = "John Doe Smith"
PARSE VAR fullName WITH firstName lastName middleName
-- firstName="John", lastName="Doe", middleName="Smith"
```

**Custom delimiter parsing:**
```rexx
LET date = "2024-12-25"
PARSE VAR date WITH year "-" month "-" day
-- year="2024", month="12", day="25"

LET email = "user@example.com"
PARSE VAR email WITH username "@" domain
-- username="user", domain="example.com"
```

**VALUE source (expressions):**
```rexx
LET csvData = "apple,banana,cherry"
PARSE VALUE csvData WITH fruit1 "," fruit2 "," fruit3
-- fruit1="apple", fruit2="banana", fruit3="cherry"
```

**Remaining text handling:**
```rexx
LET sentence = "The quick brown fox jumps over"
PARSE VAR sentence WITH word1 word2 remaining
-- word1="The", word2="quick", remaining="brown fox jumps over"
```

## Stack Operations - PUSH/PULL/QUEUE

Classic Rexx stack operations for managing data structures with LIFO and FIFO patterns.

### Basic Operations

## RETRY_ON_STALE - Handling Stale DOM Elements

The `RETRY_ON_STALE` feature is used in browser automation scripts to handle stale DOM elements. It automatically retries operations on elements that may have become stale due to page updates or dynamic content loading.

### Usage
```rexx
RETRY_ON_STALE
```

This directive can be placed before operations that interact with the DOM to ensure they are retried if the target elements are not immediately available.
```rexx
PUSH value      -- Add to top of stack (LIFO)
PULL variable   -- Remove from top into variable  
QUEUE value     -- Add to bottom of stack (FIFO)
```

### Stack Functions
```rexx
STACK_SIZE          -- Get number of items
STACK_PEEK          -- Look at top item without removing
STACK_PUSH value    -- Add item, return new size
STACK_PULL          -- Remove and return top item
STACK_QUEUE value   -- Add to bottom, return new size
STACK_CLEAR         -- Empty stack, return cleared count
```

### Examples

**LIFO operations (Last In, First Out):**
```rexx
PUSH "first item"
PUSH "second item"
PUSH "third item"

PULL item1  -- Gets "third item"
PULL item2  -- Gets "second item"
PULL item3  -- Gets "first item"
```

**FIFO operations (First In, First Out):**
```rexx
QUEUE "task1"
QUEUE "task2"
QUEUE "task3"

PULL next_task  -- Gets "task1"
```

**Using variables:**
```rexx
LET urgent = "priority task"
PUSH urgent
PULL processing

-- Stack functions for advanced operations
LET stack_size = STACK_SIZE
LET top_item = STACK_PEEK
LET pushed_count = STACK_PUSH value="new item"
LET pulled_item = STACK_PULL
LET cleared_count = STACK_CLEAR
```

## Subroutines - CALL/RETURN

Classic Rexx subroutine support for modular programming with parameter passing and return values.

### Basic Syntax
```rexx
CALL subroutine_name             -- Call with no arguments
CALL subroutine_name arg1        -- Call with one argument  
CALL subroutine_name arg1, arg2  -- Call with multiple arguments
RETURN                           -- Return to caller
RETURN value                     -- Return with value
```

### Subroutine Structure
```rexx
-- Main program
CALL my_subroutine "param1", "param2"
LET result = result  -- Access return value
EXIT

-- Subroutine definition
my_subroutine:
  LET param1 = ARG.1    -- First argument (1-based)
  LET param2 = ARG.2    -- Second argument
  LET count = ARG.0     -- Argument count
  -- subroutine code here
  RETURN result_value
```

### Argument Access
- **ARG.0** - Number of arguments passed
- **ARG.1** - First argument (1-based indexing)
- **ARG.2** - Second argument
- **ARG.n** - nth argument

### Examples

**Simple subroutine call:**
```rexx
CALL calculate_tax 100, 0.08
LET tax_amount = result

EXIT

calculate_tax:
  LET amount = ARG.1      -- First argument
  LET rate = ARG.2        -- Second argument  
  LET arg_count = ARG.0   -- Number of arguments
  LET result = amount * rate
  RETURN result           -- Return value
```

**Nested subroutine calls:**
```rexx
CALL process_order "12345"
EXIT

process_order:
  LET order_id = ARG.1
  CALL validate_order order_id
  CALL calculate_shipping order_id
  LET status = "processed"
  RETURN status

validate_order:
  LET id = ARG.1
  LET valid = "yes"
  RETURN

calculate_shipping:
  LET id = ARG.1
  LET shipping = "standard"
  RETURN
```

## TRACE Statement - Execution Debugging

Enable execution tracing and debugging with multiple modes for different levels of detail.

### Basic Syntax
```rexx
TRACE A        -- All instructions (most verbose)
TRACE R        -- Results of assignments and functions  
TRACE I        -- Intermediate (assignments, functions, calls)
TRACE O        -- Output operations only (SAY statements)
TRACE NORMAL   -- Basic execution tracing
TRACE OFF      -- Disable tracing (default)
```

### TRACE Mode Details
- **A (All)** - Traces every instruction with full details and results
- **R (Results)** - Traces instructions that produce results (assignments, functions)
- **I (Intermediate)** - Traces assignments, function calls, and subroutine calls
- **O (Output)** - Traces only output operations like SAY statements
- **NORMAL** - Basic instruction flow and subroutine call tracing
- **OFF** - Disables all tracing (default state)

### Examples

**Debug a calculation:**
```rexx
TRACE A
LET value = 100
LET tax_rate = 0.08
LET total = value * tax_rate
TRACE OFF
```

**Monitor subroutine calls:**
```rexx
TRACE I
CALL calculate_shipping "priority"
CALL format_results 
TRACE NORMAL
```

**Track only assignments:**
```rexx
TRACE R
LET processed_data = TRANSFORM input="raw data"
LET final_result = VALIDATE data=processed_data
```

### Trace Output Format
```
[HH:MM:SS.sss] MODE:TYPE message => result
[14:32:15.123] A:I ASSIGNMENT 
[14:32:15.124] A:A LET value = "100" => 100
[14:32:15.125] I:C CALL calculate_shipping (1 args)
```

### Accessing Trace Output
```rexx
-- Trace output is captured and can be accessed via interpreter
-- getTraceOutput() returns formatted trace lines
-- clearTraceOutput() clears the trace buffer
```

## Best Practices

### NUMERIC Usage
- Set appropriate precision for your calculations
- Use FUZZ for floating-point comparisons
- Reset to defaults when precision is no longer needed

### PARSE Usage
- Use descriptive variable names for parsed components
- Handle cases where input might not match expected format
- Consider using WORDS/WORD functions for simple word extraction

### Stack Usage
- Use PUSH/PULL for LIFO operations (undo stacks, recursive data)
- Use QUEUE/PULL for FIFO operations (task queues, processing pipelines)
- Check STACK_SIZE before PULL operations to avoid errors

### Subroutine Design
- Use descriptive subroutine names
- Document expected parameters with comments
- Always use EXIT before subroutine definitions in main program
- Handle variable argument counts with ARG.0

### TRACE Usage
- Use TRACE sparingly in production code
- Start with TRACE I for general debugging
- Use TRACE A for detailed step-by-step analysis
- Always turn off tracing when debugging is complete
