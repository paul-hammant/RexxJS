# What This Repository Contains

This is a **REXX interpreter and RPC framework** implemented in JavaScript, designed to run both in Node.js and browsers with comprehensive cross-application communication capabilities.

## Core Components

### REXX Language Interpreter (`src/interpreter.js`)
- Complete REXX language implementation with modern extensions
- Supports classic REXX syntax: `SAY`, `LET`, `DO...END`, `IF...THEN...ELSE`, `SELECT...WHEN`
- Advanced control structures: `DO OVER` for iteration, `INTERPRET` for dynamic code execution
- Function library system with 200+ built-in functions across multiple domains

## CLI & Distribution

- **./rexx** - Standalone binary (49MB, no Node.js required) created via `create-pkg-binary.js`
- **node core/src/cli.js** - Node.js CLI for development (requires Node.js installation)  
- **./rexxt** - Test runner (via src/test-interpreter.js) with TUI experience 

### Function Libraries (core `src/` and modular `extras/functions/`)
- **Core functions**: String processing, JSON/Web, security, validation (in `src/`)
- **R-style functions**: Statistical computing (data frames, factors, mathematical operations) - relocated to `extras/functions/r-inspired/`
- **SciPy-style functions**: Scientific computing (interpolation, signal processing) - relocated to `extras/functions/scipy/`  
- **Excel functions**: Spreadsheet operations (VLOOKUP, statistical functions) - relocated to `extras/functions/excel/`
- **Modular design**: Function libraries loaded on-demand via REXX `REQUIRE` statements

### ADDRESS mechanism 
- **Cross-Application Communication** is one way of looking at it
- **Alien parsable/interpretable language** (Sql, bash, english assertion grammar, others)
- **implementations** can modify RC and RESULT vars (the latter a dict if needed)
- **SQL**: SQLite database operations
- **Assertions**: not just for the build in test framework
- **System commands**: OS-level operations  
- **Mock testing**: Comprehensive test framework (`tests/mock-address.js`)
- Supports both traditional command strings (`"CREATE TABLE users"`) and modern method calls (`execute sql="CREATE TABLE users"`)

### Browser Integration (`src/web/`)
- PostMessage-based RPC between iframes
- Secure cross-origin communication
- Real-time streaming with CHECKPOINT functionality (back communication from worker to director)
- Director/worker patterns for distributed processing

### Test Infrastructure (`tests/`)
- 50+ comprehensive test suites
- Playwright browser automation tests
- Jest unit tests for all function libraries
- Mock ADDRESS targets for testing cross-application scenarios

### Documentation (`reference/`)
- **35 comprehensive reference documents** covering all RexxJS features
- Organized by category: basic syntax → built-in functions → advanced features → ADDRESS handlers
- Complete function reference with 400+ built-in functions across all domains
- Integration examples and cross-references between related features
- See `reference/00-INDEX.md` for the complete documentation structure

## Key Features for LLMs

### Language Capabilities
```rexx
-- Modern variable assignment
LET data = [1, 2, 3, 4, 5]
LET processed = MAP(data, "x * 2")

-- Database operations
ADDRESS sql
"CREATE TABLE users (id INTEGER, name TEXT)"
LET result = execute sql="INSERT INTO users VALUES (1, 'Alice')"

-- Statistical functions
LET summary = SUMMARY(data)
LET correlation = COR(x_values, y_values)
```

### Cross-Application Automation
```rexx
-- Control calculator application
ADDRESS calculator
clear
press button="2"
press button="+"
press button="3" 
LET result = getDisplay

-- API integration
ADDRESS api
LET response = GET endpoint="/users" params='{"limit": 10}'
```

### Modern Extensions
- Array/object manipulation with JSON integration
- Functional programming constructs (`MAP`, `FILTER`, `REDUCE`)
- Async/await patterns for browser operations
- Real-time progress monitoring with `CHECKPOINT()`

## Architecture

The codebase follows a modular design:
- **Parser** (`src/parser.js`): Converts REXX source to executable commands
- **Interpreter** (`src/interpreter.js`): Executes parsed commands with full language support
- **Function Libraries**: Domain-specific functionality in separate modules
- **ADDRESS Targets**: Plugin architecture for external system integration
- **Web Framework**: Browser-specific enhancements and RPC capabilities

## Use Cases

1. **Scientific Computing**: R/SciPy-compatible functions for data analysis
2. **Web Automation**: Cross-iframe scripting and browser control
3. **Database Operations**: SQL integration with full CRUD capabilities (SQLite3)  
4. **API Integration**: RESTful service communication and data processing
5. **System Administration**: OS command execution and file operations
6. **Testing**: Comprehensive mock frameworks for ADDRESS-based applications

## Development Guidelines

### For LLM Assistants (`CLAUDE.md`)
- **Testing Requirements**: All work must have `npm test` passing at 100% before completion
- **Web/DOM Work**: Must also have `npm run test:web` passing for browser-related features  
- **Test Execution**: Use `@scratch_test.sh` instructions for all test invocations
- **Playwright Tests**: Prefix with `PLAYWRIGHT_HTML_OPEN=never` to prevent browser windows
- **No Fallback Logic**: Avoid implementing "fallback" patterns - ask for explicit guidance instead

This repository provides a complete REXX environment with modern extensions, making it suitable for everything from simple scripting to complex distributed applications running in browsers or Node.js.