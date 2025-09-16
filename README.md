# RexxJS

A lightweight, embeddable REXX interpreter for JavaScript environments, with comprehensive DOM support for web applications. While it runs excellently in Node.js, RexxJS particularly shines in browser environments where few scripting language options exist.

The aim is to implement as much of 1979's Rexx as possible, with the likely exception of PULL that'd seek user input - ordinarily that'd map to something coming from STDIN, but there's no such thing in the DOM.

A blog entry I did when making this repo public: [Starting RexxJS](https://paulhammant.com/2025/09/15/starting-rexxjs/)
    
Compatibility with other REXX implementations: RexxJS does not claim compatibility

### Retro features are back in 2025

1. global vars and lack of scoping
2. UPPER CASE keywords
3. Weak typing: "2" is string and a number that can have mathematics done on it
5. Case-insensitive variables
6. Line-oriented source
7. No real data structures

### Harms that are back again

1. Labels and SIGNAL are goto-ish: Edsger Dijkstra's famous 1968 letter, [Go To Statement Considered Harmful](https://homepages.cwi.nl/~storm/teaching/reader/Dijkstra68.pdf)
2. INTERPRET is in eval's family tree [Why are eval-like features considered evil?](https://homepages.cwi.nl/~storm/teaching/reader/Dijkstra68.pdf)
3. 1 (one) based indexing
4. Dynamic variable creation

### extra features

1. Understands the web a little (1979 was before Tim Berners-Lee's www moment in 1991)
2. Understands the DOM enough.

## 🎯 Overview

This implementation provides a complete Rexx ecosystem with three execution modes:

1. **Pure Browser Rexx** - Local scripting, including DOM interop
2. **Node.js** - Server-side scripting with full filesystem access
3. **Standalone Binary** - Self-contained executables with embedded Node.js runtime

## 🔧 Implementation Modes

### 1. Pure Browser Rexx Interpreter

**Purpose**: Local automation and scripting within a single JavaScript context.

**Features**:
- Fully inlined parser and interpreter
- No external dependencies
- Direct function call execution
- Ideal for component self-automation

**Example Usage**:
```rexx
-- Local calculator automation
press button=5
press button="*"
press button=6
press button="="
LET result = getDisplay
```

**Architecture**:
```
Rexx Script → Parser → AST → Local Interpreter → Direct Function Calls
```

**Implementation**: See `green-pure-javascript-calculator-app.html` - the calculator has its own embedded Rexx interpreter for self-scripting.

### 2. Application Addressing Rexx

**Purpose**: Scripts addressing other applications for remote control and automation. Cross-iframe implementation uses secure postMessage communication.

**Features**:
- Application addressing via `ADDRESS` command
- Cross-iframe implementation: Sandboxed iframe isolation (`sandbox="allow-scripts"`)
- Cross-iframe implementation: JSON-RPC protocol over postMessage transport
- Cross-iframe implementation: Asynchronous communication with promise-based responses
- Cross-iframe implementation: Cross-origin communication without same-origin access

**Example Usage**:
```rexx
-- Script running in left iframe, controlling right iframe
ADDRESS calculator
clear
press button=2
press button="+"
press button=0
press button="+"
press button=2
press button="+"
press button=2
press button="="
LET final_result = getDisplay
```

**Architecture (Cross-iframe Implementation)**:
```
Rexx Script → Parser → Application Address → postMessage → 
Parent Frame Router → Target Iframe → Application Handler → Execute
```

**Communication Flow (Cross-iframe Implementation)**:
1. Rexx interpreter executes `ADDRESS application_name` 
2. Commands sent via postMessage to parent frame
3. Parent frame routes message to target iframe
4. Target iframe processes command and sends response
5. Response routed back through parent to original iframe
6. Promise resolved with result

**Note**: Other implementation approaches possible (WebSockets, HTTP APIs, native messaging, etc.)

### 3. Nested Rexx-to-Rexx Addressing

**Purpose**: Rexx interpreters that can address and invoke other Rexx interpreters.

**Features**:
- Multi-level automation capabilities
- Rexx scripts that generate and execute other Rexx scripts
- Distributed Rexx execution across multiple contexts
- Cross-iframe implementation available, other approaches possible

**Example Concept**:
```rexx
-- Left iframe Rexx calls right iframe Rexx
ADDRESS automation_service
LET script_to_run = "press button=9; press button=*; press button=7"
execute_rexx script=script_to_run target_iframe="calculator"
```

**Architecture**:
```
Rexx₁ → Application Addressing → Rexx₂ → Local Execution
```

## 🔒 Security Model

### Iframe Sandboxing
```html
<iframe sandbox="allow-scripts" src="...">
```

**Restrictions**:
- ✅ **BLOCKED**: `parent.document` access
- ✅ **BLOCKED**: `top.location` manipulation  
- ✅ **BLOCKED**: Cross-iframe DOM access
- ✅ **BLOCKED**: Same-origin resource access
- ✅ **BLOCKED**: Popup window creation
- ✅ **BLOCKED**: Form submission to other origins
- ✅ **ALLOWED**: Script execution (required for functionality)
- ✅ **ALLOWED**: postMessage communication (controlled channel)

### Communication Security (Cross-iframe Implementation)
- All inter-application communication via controlled postMessage API
- No direct DOM access between iframes
- Parent frame acts as message router and security boundary
- Application addressing includes request IDs to prevent confusion/replay

## 🌐 DOM Interoperability

The Rexx interpreter can be extended with DOM manipulation capabilities for rich browser automation.

### Query Operations

**Concept**: Rexx scripts that can query and inspect the DOM:

```rexx
-- DOM querying from Rexx
ADDRESS dom
LET button_count = query selector="button" operation="count"
LET form_data = query selector="#myForm" operation="serialize"  
LET is_visible = query selector="#modal" operation="visible"

-- Conditional logic based on DOM state
IF is_visible = "true" THEN
  click selector="#modal .close-button"
ENDIF
```

**Implementation Pattern**:
```javascript
const domMethods = {
    query(params) {
        const { selector, operation } = params;
        const elements = document.querySelectorAll(selector);
        
        switch (operation) {
            case 'count':
                return elements.length;
            case 'visible':
                return elements[0]?.offsetParent !== null;
            case 'text':
                return elements[0]?.textContent;
            case 'value':
                return elements[0]?.value;
            case 'serialize':
                // Return form data as object
                const formData = new FormData(elements[0]);
                return Object.fromEntries(formData);
        }
    }
};
```

### Manipulation Operations

**Concept**: Rexx scripts that can modify DOM elements:

```rexx
-- DOM manipulation from Rexx  
ADDRESS dom
click selector="#submit-button"
type selector="#name-input" text="John Doe"
set selector="#email" property="value" value="john@example.com"
add_class selector=".highlight" class="selected"
remove_class selector=".old" class="deprecated"
set_style selector="#modal" property="display" value="block"

-- Complex interactions
LET items = query selector=".todo-item" operation="count"
DO i = 1 TO items
  LET item_selector = ".todo-item:nth-child(" || i || ")"
  LET is_completed = query selector=item_selector operation="has_class" class="completed"
  IF is_completed = "false" THEN
    click selector=item_selector || " .checkbox"
  ENDIF  
END
```

**Implementation Pattern**:
```javascript
const domMethods = {
    click(params) {
        const element = document.querySelector(params.selector);
        element?.click();
        return true;
    },
    
    type(params) {
        const element = document.querySelector(params.selector);
        if (element) {
            element.value = params.text;
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return true;
    },
    
    set(params) {
        const element = document.querySelector(params.selector);
        if (element) {
            element[params.property] = params.value;
        }
        return true;
    },
    
    add_class(params) {
        const element = document.querySelector(params.selector);
        element?.classList.add(params.class);
        return true;
    },
    
    set_style(params) {
        const element = document.querySelector(params.selector);
        if (element) {
            element.style[params.property] = params.value;
        }
        return true;
    }
};
```

### Event Handling

**Concept**: Rexx scripts that can respond to DOM events:

```rexx
-- Event-driven Rexx automation
ADDRESS dom
listen event="click" selector=".dynamic-button" callback="handle_dynamic_click"
listen event="input" selector="#search-box" callback="handle_search"

-- Callback handlers (would be implemented as separate Rexx functions)
handle_dynamic_click:
  LET button_text = query selector="[clicked]" operation="text"
  type selector="#result" text="Clicked: " || button_text
RETURN

handle_search:
  LET search_term = query selector="#search-box" operation="value"
  IF LENGTH(search_term) > 2 THEN
    -- Trigger search
    click selector="#search-submit"
  ENDIF
RETURN
```

### Form Automation

**Concept**: Complete form filling and submission:

```rexx
-- Form automation workflow
ADDRESS dom  
LET form_exists = query selector="#registration-form" operation="exists"

IF form_exists = "true" THEN
  type selector="#firstName" text="John"
  type selector="#lastName" text="Doe" 
  type selector="#email" text="john.doe@example.com"
  click selector="#newsletter" -- checkbox
  select selector="#country" value="US"
  
  -- Validate before submit
  LET email_valid = query selector="#email" operation="valid"
  IF email_valid = "true" THEN
    click selector="#submit"
    wait_for selector=".success-message" timeout=5000
    LET success = query selector=".success-message" operation="visible"
    IF success = "true" THEN
      log "Registration completed successfully"
    ENDIF
  ENDIF
ENDIF
```

### Integration Example

**Complete DOM-aware Rexx automation**:
```javascript
// Enhanced interpreter with DOM capabilities
class DOMInterpreter extends Interpreter {
    constructor(rpcClient) {
        super(rpcClient);
        
        // Add DOM methods to RPC capabilities
        this.localMethods = {
            ...this.localMethods,
            ...domMethods,
            
            // Custom automation helpers
            wait_for(params) {
                return new Promise((resolve) => {
                    const check = () => {
                        const element = document.querySelector(params.selector);
                        if (element && element.offsetParent) {
                            resolve(true);
                        } else {
                            setTimeout(check, 100);
                        }
                    };
                    check();
                    
                    // Timeout after specified time
                    setTimeout(() => resolve(false), params.timeout || 5000);
                });
            }
        };
    }
}
```

This DOM integration enables Rexx to become a powerful browser automation language, capable of testing, form filling, UI manipulation, and complex web application workflows.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific Playwright tests  
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/cross-iframe-scripting.spec.js --project=chromium

# Install Playwright browsers (if needed)
npx playwright install
```

## 📦 Quick Start

```bash
# Start local development server
npx http-server -p 8082 -c-1

# View demos
open http://localhost:8082/tests/test-harness-dom.html
open http://localhost:8082/tests/test-harness-cross-iframe2.html
```

## 🔨 Building & Deployment

### Quick Start Options

**Browser Development:**
```bash
# Serve files locally
npx http-server -p 8082 -c-1
# Open: http://localhost:8082/tests/test-harness-dom.html
```

**Node.js CLI:**
```bash
# Run REXX scripts directly
node src/cli.js myscript.rexx
```

**Standalone Binary:**
```bash
# Create self-contained executable (no Node.js required on target)
node ../create-pkg-binary.js

# Deploy and run
./rexx-linux-x64 myscript.rexx
```

For complete production builds, webpack configuration, deployment options, and optimization guides, see **[BUILDING.md](../BUILDING.md)**.

## 📁 Project Structure

```
├── src/
│   ├── parser.js          # Core Rexx parser (Node.js + Browser)
│   ├── interpreter.js     # Core Rexx interpreter (Node.js + Browser) 
│   └── index.js          # Node.js entry point
├── tests/
│   ├── test-harness-cross-iframe.html      # Original RPC demo
│   ├── test-harness-cross-iframe2.html     # Calculator automation demo
│   ├── rexx-app.html                       # Rexx interpreter iframe
│   ├── pure-javascript-calculator-app.html                 # Original calculator (math functions)
│   ├── green-pure-javascript-calculator-app.html           # Button-based calculator + local Rexx
│   └── *.spec.js                          # Playwright test files
├── playwright.config.js   # Playwright configuration
└── README.md              # This file
```

## 🔧 API Reference

### Core Language Features

```rexx
-- Variable assignment
LET variable_name = value
LET result = function_call param1=value1 param2=value2

-- Function calls  
function_name param1=value1 param2=value2

-- Application Addressing
ADDRESS target_application
function_call param=value

-- Comments
-- This is a comment
```

### Application Methods (Calculator Example)

```rexx
-- Button operations
press button="5"           # Press calculator button
clear                      # Clear calculator display  
getDisplay                 # Get current display value

-- Math operations (original calculator)
add x=10 y=20             # Add two numbers
subtract x=50 y=30        # Subtract numbers  
multiply x=6 y=7          # Multiply numbers
divide x=84 y=2           # Divide numbers
display value=42 message="Result"  # Display with message
```

## 🚀 Advanced Usage

### Custom Application Methods

Extend applications with your own methods:

```javascript
const customMethods = {
    square(params) {
        const { value } = params;
        const result = value * value;
        logMessage(`square(${value}) = ${result}`);
        return result;
    },
    
    factorial(params) {
        const { n } = params;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        logMessage(`factorial(${n}) = ${result}`);
        return result;
    }
};

// Merge with existing application methods
Object.assign(applicationMethods, customMethods);
```

### Error Handling

The interpreter supports Rexx-style SIGNAL error handling:

```rexx
-- Enable error handling with custom label
SIGNAL ON ERROR NAME ErrorHandler
ADDRESS calculator
LET result = SHA256 data="test"  -- Will throw error if no crypto available
EXIT

ErrorHandler:
display value=0 message="Crypto operation failed"
LET errorHandled = "YES"
```

```rexx
-- Use default ERROR label
SIGNAL ON ERROR
LET result = JSON_PARSE text="invalid json"  -- Will throw parsing error
EXIT

ERROR:
display message="JSON parsing failed - using default values"
LET result = "{}"
```

```rexx
-- Disable error handling
SIGNAL ON ERROR NAME ErrorHandler
-- ... some operations ...
SIGNAL OFF ERROR
LET result = divide x=10 y=0  -- Will throw unhandled error
```

**Error Handling Features**:
- `SIGNAL ON ERROR [NAME label]` - Enable error handling, jump to specified label (default: ERROR)
- `SIGNAL OFF ERROR` - Disable error handling, let errors propagate normally  
- Label-based error recovery with full script context
- Works with built-in functions (crypto, JSON, math) and application addressing calls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality  
4. Ensure all tests pass
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details.

---

Built with ❤️ for folks that liked Rexx and in particular ARexx from way back. RexxJS brings modern web automation to the classic Rexx experience.