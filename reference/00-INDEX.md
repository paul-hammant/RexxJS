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
- **[70-cli-tools.md](70-cli-tools.md)** - Command-line tools (rexx, rexxt)

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
