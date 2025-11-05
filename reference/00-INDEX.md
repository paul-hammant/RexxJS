Conflict marker: <<<<<<< claude/review-reference-docs-011CUpb28GvjrALDGUMveRbu
# RexxJS Reference Documentation Index

This directory contains comprehensive reference documentation for RexxJS, organized by topic from basic syntax to advanced features.

## Table of Contents

### Core Language (01-10)

- **[01-language-basics.md](01-language-basics.md)** - Basic REXX syntax, comments, commands
- **[02-variables.md](02-variables.md)** - Variable system, scoping, stem variables, RUNTIME vars
- **[03-control-flow.md](03-control-flow.md)** - DO loops, IF/THEN/ELSE, SELECT/WHEN/OTHERWISE
- **[04-functions-overview.md](04-functions-overview.md)** - Function calls, parameters, return values
- **[05-operations-vs-functions.md](05-operations-vs-functions.md)** - Operations vs Functions architecture
- **[06-error-handling.md](06-error-handling.md)** - SIGNAL ON ERROR, exception handling
- **[07-subroutines.md](07-subroutines.md)** - Labels, CALL, RETURN, SIGNAL
- **[08-heredoc.md](08-heredoc.md)** - HEREDOC syntax with interpolation
- **[09-interpret.md](09-interpret.md)** - Dynamic code execution with INTERPRET
- **[10-environment.md](10-environment.md)** - Runtime environment detection and RUNTIME variables

### Built-in Functions (11-26)

- **[11-string-functions.md](11-string-functions.md)** - String manipulation (SUBSTR, POS, LENGTH, etc.)
- **[12-math-functions.md](12-math-functions.md)** - Mathematical operations
- **[13-array-functions.md](13-array-functions.md)** - Array manipulation (MAP, FILTER, REDUCE, etc.)
- **[14-json-functions.md](14-json-functions.md)** - JSON parsing and manipulation
- **[15-http-functions.md](15-http-functions.md)** - HTTP_GET, HTTP_POST, HTTP_PUT, HTTP_DELETE
- **[16-file-functions.md](16-file-functions.md)** - File system operations (Node.js only)
- **[17-date-time-functions.md](17-date-time-functions.md)** - Date and time handling
- **[18-cryptography-functions.md](18-cryptography-functions.md)** - Hashing, encryption, signatures
- **[19-statistics-functions.md](19-statistics-functions.md)** - Statistical calculations
- **[20-probability-functions.md](20-probability-functions.md)** - Probability distributions
- **[21-random-functions.md](21-random-functions.md)** - Random number generation
- **[22-validation-functions.md](22-validation-functions.md)** - Data validation and type checking
- **[23-regex-functions.md](23-regex-functions.md)** - Regular expression operations
- **[24-url-functions.md](24-url-functions.md)** - URL parsing and manipulation
- **[25-logic-functions.md](25-logic-functions.md)** - Logical operations
- **[26-dom-functions.md](26-dom-functions.md)** - DOM manipulation (browser only)

### ADDRESS Facility (27-50)

#### Core Concepts
- **[27-address-facility.md](27-address-facility.md)** - ADDRESS mechanism overview and architecture

#### Core ADDRESS Handlers (28-32)
- **[28-address-system.md](28-address-system.md)** - Shell command execution
- **[29-address-sql.md](29-address-sql.md)** - SQLite database operations
- **[30-address-expectations.md](30-address-expectations.md)** - Test assertions (EXPECT framework)
- **[31-address-test-framework.md](31-address-test-framework.md)** - Test framework operations
- **[32-address-echo.md](32-address-echo.md)** - Echo ADDRESS handler (example/testing)

#### Container Management (33-36)
- **[33-address-docker.md](33-address-docker.md)** - Docker container lifecycle and management
- **[34-address-podman.md](34-address-podman.md)** - Podman rootless containers
- **[35-address-nspawn.md](35-address-nspawn.md)** - systemd-nspawn lightweight containers
- **[36-address-firecracker.md](36-address-firecracker.md)** - Firecracker microVMs

#### Virtual Machine Management (37-39)
- **[37-address-qemu.md](37-address-qemu.md)** - QEMU/KVM virtualization with Guest Agent
- **[38-address-virtualbox.md](38-address-virtualbox.md)** - VirtualBox VM management
- **[39-address-lxd.md](39-address-lxd.md)** - LXD container and VM management

#### Cloud & Serverless (40-44)
- **[40-address-gcp.md](40-address-gcp.md)** - Google Cloud Platform services orchestration
- **[41-address-lambda.md](41-address-lambda.md)** - AWS Lambda function management
- **[42-address-openfaas.md](42-address-openfaas.md)** - OpenFaaS serverless functions
- **[43-address-proxmox.md](43-address-proxmox.md)** - Proxmox VE management
- **[44-address-ssh.md](44-address-ssh.md)** - Remote SSH command execution

#### Data & AI (45-48)
- **[45-address-duckdb.md](45-address-duckdb.md)** - DuckDB analytical database
- **[46-address-duckdb-wasm.md](46-address-duckdb-wasm.md)** - DuckDB WebAssembly (browser)
- **[47-address-claude.md](47-address-claude.md)** - Claude AI integration
- **[48-address-gemini.md](48-address-gemini.md)** - Google Gemini AI integration

### Module System & Libraries (51-60)

- **[51-require-system.md](51-require-system.md)** - REQUIRE statement, module loading
- **[52-module-resolution.md](52-module-resolution.md)** - Path resolution, registries, prefixes
- **[53-bundling.md](53-bundling.md)** - Module bundling for web distribution
- **[54-library-r-functions.md](54-library-r-functions.md)** - R-inspired statistical functions
- **[55-library-scipy-functions.md](55-library-scipy-functions.md)** - SciPy-inspired scientific functions
- **[56-library-excel-functions.md](56-library-excel-functions.md)** - Excel-like spreadsheet functions
- **[57-library-numpy-functions.md](57-library-numpy-functions.md)** - NumPy-inspired array operations
- **[58-library-jq-functions.md](58-library-jq-functions.md)** - jq-style JSON querying
- **[59-library-graphviz-functions.md](59-library-graphviz-functions.md)** - Graphviz visualization
- **[60-library-diff-functions.md](60-library-diff-functions.md)** - Diff and patch operations

### Web & Browser Features (61-65)

- **[61-web-overview.md](61-web-overview.md)** - RexxJS in browser environments
- **[62-web-controlbus.md](62-web-controlbus.md)** - Cross-iframe RPC with control bus
- **[63-web-checkpoint.md](63-web-checkpoint.md)** - CHECKPOINT streaming protocol
- **[64-web-standalone.md](64-web-standalone.md)** - Standalone browser interpreter
- **[65-web-security.md](65-web-security.md)** - Browser security model

### Testing & Development (66-70)

- **[66-test-framework.md](66-test-framework.md)** - Built-in test framework
- **[67-test-dogfood.md](67-test-dogfood.md)** - Dogfood tests (RexxJS testing RexxJS)
- **[68-tracing.md](68-tracing.md)** - TRACE statement for debugging
- **[69-security.md](69-security.md)** - Security model and permissions
- **[70-rexxt-test-runner.md](70-rexxt-test-runner.md)** - rexxt test runner with TUI navigation

### Advanced Topics (71-75)

- **[71-interpolation.md](71-interpolation.md)** - String interpolation patterns
- **[72-parameter-conversion.md](72-parameter-conversion.md)** - Parameter type conversion
- **[73-function-execution-priority.md](73-function-execution-priority.md)** - Function resolution order
- **[74-operations-architecture.md](74-operations-architecture.md)** - Operations implementation details
- **[75-performance.md](75-performance.md)** - Performance optimization tips

## Documentation Conventions

### Code Examples

All examples use the following format:

```rexx
-- Comment explaining the example
LET variable = VALUE(expression)
SAY "Output: " || variable
```

### Function Signatures

Functions are documented with their parameters:

```
FUNCTION_NAME(param1, param2, ...) → return_type
FUNCTION_NAME(name=value, ...) → return_type  -- Named parameters
```

### Operations Signatures

Operations (imperative commands) are documented without parentheses:

```
OPERATION_NAME param1=value param2=value
```

### ADDRESS Command Format

ADDRESS commands are shown in their typical usage:

```rexx
ADDRESS target_name
"command string"
operation param1=value param2=value
LET result = method_call param=value
```

## Getting Help

- **Quick Reference**: See individual function category docs (11-26)
- **ADDRESS Handlers**: See specific ADDRESS docs (27-48)
- **Examples**: Most docs include practical examples
- **Source Code**: All features documented here are implemented in `/core/src/` or `/extras/`

## Contributing to Documentation

When adding new features to RexxJS:

1. Document in the appropriate reference file
2. Update this index if adding new files
3. Include examples and edge cases
4. Cross-reference related features
5. Test all code examples

## Version Information

This documentation is for RexxJS as of November 2025. Features may have been added or changed since your version. Check the repository for updates.
Conflict marker:  =======
---
layout: default
title: Reference
---

# RexxJS Reference Documentation

A comprehensive reference guide to all RexxJS features, organized by category.

## Execution Mode Overview

RexxJS supports three distinct execution modes, each designed for different use cases and control architectures:

### 1. **Autonomous Web Mode**
Direct browser execution where the RexxJS interpreter runs independently within a single web context. The script controls its own execution flow with no external orchestration. Ideal for interaction with standalone web applications, white-box browser automation, and client-side scripting.

### 2. **Controlled Web Mode** 
Browser execution using a Director/Worker architecture with two iframes communicating via postMessage. An external director orchestrates execution, providing real-time control (pause/resume/abort), progress monitoring, and distributed workflow coordination. Designed for complex multi-step processes requiring external supervision.

### 3. **Command-line Mode**
Execution in Node.js environments (desktop, server, docker-style container or VM) with full file system access but no web/DOM capability. While a programming language attempting to use instead of bash will lead to longer scripts.

*Detailed documentation for each mode is provided in the sections below and in dedicated function references.*

## Core Language Features

### 📝 [Basic Syntax](01-basic-syntax.md)
- Variable assignment and management
- Function calls and parameters
- Comments and code structure
- String interpolation

### 🎯 [Control Flow](02-control-flow.md)
- IF/ELSE/ENDIF statements  
- Complete comparison operators: `=`, `==`, `\=`, `!=`, `<>`, `¬=`, `><`, `>`, `<`, `>=`, `<=`
- DO/END loops (range, step, while, repeat)
- SELECT/WHEN/OTHERWISE branching
- SIGNAL statement for jumps

### 🔧 [Advanced Statements](03-advanced-statements.md)
- NUMERIC statement - precision control
- PARSE statement - string parsing
- Stack operations (PUSH/PULL/QUEUE)
- Subroutines (CALL/RETURN)
- TRACE statement - debugging
- Program structure and flow

## Built-in Functions

### 📊 [String Functions](04-string-functions.md)
- Basic string operations (UPPER, LOWER, LENGTH, etc.)
- Advanced string processing with regex
- String validation and testing
- Text manipulation and formatting

### 🧮 [Math Functions](05-math-functions.md)
- Basic arithmetic (ABS, MAX, MIN)
- Advanced mathematical functions
- Statistical operations
- Geometry and trigonometry

### 📋 [Array Functions](06-array-functions.md)
- Array creation and manipulation
- Array searching and sorting
- Mathematical operations on arrays
- Data processing and analysis

### 🗓️ [Date/Time Functions](07-datetime-functions.md)
- Current date and time retrieval
- Date component extraction and parsing
- Date format conversion and validation
- Time-based calculations and workflows

### 🔗 [JSON Functions](08-json-functions.md)
- JSON parsing and stringification
- Data interchange with APIs
- Object manipulation
- Error handling

### 🌐 [Web Functions](09-web-functions.md)  
- URL parsing and encoding/decoding
- Base64 operations and URL-safe encoding
- HTTP resource access and API integration
- Cross-origin communication support

### 🎯 [ID Generation Functions](10-id-functions.md)
- UUID generation (RFC4122)
- Short IDs (NANOID)
- Random data generation
- Cryptographic security

### ✅ [Validation Functions](11-validation-functions.md)
- Email, URL, and phone number validation
- Network address validation (IP, MAC)
- Data type and format verification
- Financial and geographic validation

### 🔒 [Security Functions](12-security-functions.md)
- Hashing (SHA256, SHA1, MD5)
- HMAC generation
- Password hashing and verification
- JWT token handling
- Cryptographic operations

### 💾 [File System Functions](13-filesystem-functions.md)
- Unified localStorage and HTTP resource access
- File operations (read, write, copy, move, delete)
- File discovery and listing with patterns
- Backup management and data persistence

### 📈 [Excel Functions](14-excel-functions.md)
- Logical functions (IF, AND, OR, NOT)
- Statistical calculations (AVERAGE, MEDIAN, STDEV)
- Lookup functions (VLOOKUP, HLOOKUP, INDEX, MATCH)
- Text manipulation (CONCATENATE, LEFT, RIGHT, MID)
- Date operations (TODAY, YEAR, MONTH, DAY)
- Financial calculations (PMT, FV, PV, NPV, IRR)

## Advanced Functions

### 📊 [R-Language Functions](15-r-functions.md)
- Statistical computing and data analysis (150+ functions)
- Matrix operations and linear algebra
- Data manipulation and transformation
- Graphics and visualization
- Machine learning and time series analysis
- Complete R-language compatibility layer

### 🔬 [SciPy Interpolation Functions](16-scipy-functions.md) 
- Advanced interpolation methods (16+ functions)
- 1D/2D interpolation with multiple algorithms
- Spline functions and scattered data interpolation
- Radial basis functions and shape-preserving methods
- Scientific computing and numerical analysis

### 🔍 [Regular Expression Functions](17-regex-functions.md)
- Pattern matching and text processing
- Full JavaScript regex engine support
- Capture groups and advanced matching
- Text extraction and transformation

## Advanced Features

### 🏃 [Dynamic Execution](18-interpret.md)
- INTERPRET statement modes
- Variable scoping and isolation
- Security controls (NO-INTERPRET)
- Meta-programming patterns
- Code generation techniques

### 📡 [Application Addressing](19-application-addressing.md)
- ADDRESS statement for cross-application communication
- **ADDRESS HEREDOC patterns** for domain-specific languages
- Secure iframe integration and postMessage protocols
- API integration and authentication workflows
- Multi-application automation patterns

### 💬 [Output and Debugging](20-output-debug.md)
- SAY statement with variable interpolation
- Structured logging and audit trails
- Debug workflows and progress tracking
- Error reporting and diagnostics

### 🎮 [DOM Functions](21-dom-functions.md)
- Browser DOM query and manipulation (Autonomous Web Mode)
- Element interaction (click, type, select)
- CSS style and class management
- Web automation and testing capabilities

### 🚌 [Control Bus](22-control-bus.md)
- General-purpose distributed application coordination
- CHECKPOINT function for progress monitoring and flow control
- Director/Worker patterns and event loops
- Multi-application workflow orchestration
- Fault tolerance and error recovery

### 📦 [REQUIRE System](23-require-system.md)
- Dynamic library loading including from GitHub releases
- Zero-overhead detection and caching
- Transitive dependency resolution with circular detection
- Minification-safe dependency metadata
- Multi-mode compatibility (Autonomous Web, Controlled Web, Command-line)
- Library publishing conventions and best practices

### ⚠️ [Error Handling](24-error-handling.md)
- Enhanced error context functions (ERROR_LINE, ERROR_FUNCTION, etc.)
- SIGNAL statement usage (SIGNAL ON ERROR, SIGNAL OFF ERROR)
- Error recovery patterns and smart retry logic
- Integration with built-in functions and DOM operations
- JavaScript stack trace integration for debugging
- Best practices for robust error handling

## Specialized ADDRESS Handlers

### 🔧 [ADDRESS System](25-system-address.md)
- System command execution and process management
- Environment variable access and configuration
- Cross-platform file system operations
- Process coordination and automation

### 🗄️ [ADDRESS SQLite](26-sqlite-address.md)
- Database operations and query execution
- Transaction management and data persistence
- Schema creation and migration patterns
- Data analysis and reporting workflows

### 🎯 [ADDRESS HEREDOC Patterns](27-address-heredoc-patterns.md)
- Multiline content handling with HEREDOC syntax
- Domain-specific language integration
- Clean syntax for SQL, JSON, XML, and templates
- Migration from legacy MATCHING patterns

### 🔗 [ADDRESS Variable Patterns](28-address-variable-patterns.md)
- Dynamic ADDRESS target resolution
- Variable-based routing and dispatch
- Runtime configuration and target selection
- Flexible automation architectures

### 🛠️ [ADDRESS Handler Utilities](29-address-handler-utilities.md)
- Common utility functions for ADDRESS handlers
- Handler development patterns and best practices
- Error handling and validation utilities
- Testing and debugging support for custom handlers

## Language Extensions

### ✨ [AS Clause Reference](30-as-clause-reference.md)
- Variable aliasing and transformation patterns
- Data type conversion and formatting
- Output redirection and capture
- Advanced parameter passing techniques

### 📝 [Assertions and Expectations](31-assertions-expect-documentation.md)
- Built-in assertion functions for testing and validation
- EXPECT statement for behavior verification
- Test-driven development patterns
- Quality assurance and debugging support

### 🔄 [REQUIRE Statement](33-require-statement.md)
- Detailed REQUIRE statement syntax and semantics
- Registry-based library loading with namespace verification
- Dynamic loading patterns and best practices
- Dependency management and version control
- Library development and publishing guidelines

### 💻 [REPL Guide](34-repl-guide.md)
- Interactive RexxJS development environment
- REPL-specific features and commands
- Debugging and exploration techniques
- Development workflow integration

### 🔤 [Interpolation Patterns](36-interpolation-patterns.md)
- Complete INTERPOLATION PATTERN statement reference
- Predefined and custom interpolation patterns
- Pattern lifecycle management and validation
- Integration with ADDRESS HEREDOC blocks

## Reference Materials

### 📚 [Function Reference](35-function-reference.md)
- Comprehensive cross-reference catalog (400+ functions)
- Implementation status and environment compatibility
- Function availability by category and use case
- Cross-reference index for all built-in functions

### 🧪 [Testing with rexxt](32-testing-rexxt.md)
- Native test runner for RexxJS code
- Execution-based testing without formal suites
- ADDRESS EXPECTATIONS integration patterns
- Test discovery, filtering, and reporting
- Dogfooding and comprehensive testing strategies

---

## Navigation Tips

- **Quick Reference**: Each function includes practical examples and usage patterns
- **Cross-References**: Related functions are linked at the bottom of each section
- **Integration Examples**: Most sections show how features work together
- **Error Handling**: Security and error handling patterns included throughout

---

**Total Functions:** 400+ built-in functions across all categories
**Language Features:** Complete Rexx implementation with modern enhancements
**Security:** Sandboxing, isolation, and cryptographic functions built-in
### 📚 [Function Libraries](12-function-libraries.md)
- Built‑ins vs third‑party
- Positional vs named arguments
- External script CALL semantics
- COPY() and pass‑by semantics
Conflict marker:  >>>>>>> main
