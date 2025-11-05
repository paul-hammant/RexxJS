# What This Repository Contains

This is a **REXX interpreter and RPC framework** implemented in JavaScript, designed to run both in Node.js and browsers with comprehensive cross-application communication capabilities.

## Core Components

### REXX Language Interpreter (`src/interpreter.js`)
- Complete REXX language implementation with modern extensions
- Supports classic REXX syntax: `SAY`, `LET`, `DO...END`, `IF...THEN...ELSE`, `SELECT...WHEN`
- Advanced control structures: `DO OVER` for iteration, `INTERPRET` for dynamic code execution
- There is `INTERPRET_JS` too dynamic JavaScript code execution - but that's really only for debugging
- Function library system with 200+ built-in functions across multiple domains

### Environment Detection & Awareness

The interpreter automatically detects its execution environment—whether it's running in a standard
Node.js process, as a standalone executable created by `pkg`, or within a web browser. This runtime
context is exposed in two ways: globally to other JavaScript modules via the `REXX_ENVIRONMENT`
object, and directly to REXX scripts through special `RUNTIME.` stem variables (e.g., `RUNTIME.TYPE`,
`RUNTIME.IS_PKG`, `RUNTIME.HAS_DOM`). This powerful feature allows both the core system and user
scripts to implement conditional logic that adapts to the capabilities of the host environment, such
as accessing the file system in Node.js or manipulating the DOM in a browser.

#### Modes of operation

- In the repo - un-built for NodeJs: core/src/interpreter.js with core/src/parser.js. Typical use would be Rexx lines embedded in a jest test with classic expectations
- In the repo - un-built for NodeJs: `core/rexx` executable - does scripting to setup the interpreter given command line invocation. Devs of this repo, might use that.
- Built for NodeJs: bin/rexx executable (after make-binary.sh invocation). This does scripting to setup the interpreter given commandline invocation. Should work on Glibc and Musl x86-64 systems. The result should be identical in operation an capabilities to `core/rexx`, but this time made by 'pkg'
- Built for Web: GitHub-Action makes a bundle of the interpreter. `cd core/src/repl && npm install` to make it, or just use the one online that github-actions made: https://repl.rexxjs.org/repl/dist/rexxjs.bundle.js
- In the repo - un-built for Web: core/src/interpreter.js and core/src/parser.js again but served up via https://localhost:portNum/core/src/interpreter-web-loader.js


## CLI & Distribution

- **./rexx** - Standalone binary (49MB, no Node.js required) created via `create-pkg-binary.js`
- **node core/src/cli.js** - Node.js CLI for development (requires Node.js installation)
- **./rexxt** - Test runner (via src/test-interpreter.js) with modern testing features
  - Test skip capability with `@skip` annotations (inspired by Jest/pytest/RSpec)
  - Tag-based filtering, pattern matching, multiple output modes
  - See `core/REXXT_GUIDE.md` for complete documentation 

### Function Libraries (core `src/` and modular `extras/functions/`)
- **Core functions**: String processing, JSON/Web, security, validation (in `src/`)
- **HTTP functions**: RESTful API integration with `HTTP_GET`, `HTTP_POST`, `HTTP_PUT`, `HTTP_DELETE` returning structured `{status, body, headers, ok}` objects (in `src/`)
- **R-style functions**: Statistical computing (data frames, factors, mathematical operations) - relocated to `extras/functions/r-inspired/`
- **SciPy-style functions**: Scientific computing (interpolation, signal processing) - relocated to `extras/functions/scipy/`
- **Excel functions**: Spreadsheet operations (VLOOKUP, statistical functions) - relocated to `extras/functions/excel/`
- **Modular design**: Function libraries loaded on-demand via REXX `REQUIRE` statements. Libraries can be loaded by their published name (e.g., `REQUIRE "org.rexxjs/excel-functions"`) or by a relative path to the source file (e.g., `REQUIRE "../path/to/excel-functions.js"`)

### Operations vs Functions Architecture
RexxJS distinguishes between two types of callable code:
- **Operations** (imperative commands without parentheses): Side-effect actions like `SERVE_GUEST guest="alice"` or `CLEAN_BATHHOUSE area="lobby"`
  - Receive parameters as named params object directly
  - Used for state-changing commands and imperative workflows
  - Can be called from REQUIRE'd libraries alongside functions
- **Functions** (expressions with parentheses): Pure/query operations like `COUNT_TOKENS()` or `IDENTIFY_SPIRIT(description="muddy")`
  - Support both positional (`SUBSTR("hello", 2, 3)`) and named parameters (`SUBSTR(start=2, length=3)`)
  - Parameters converted via parameter-converter for flexibility
  - Work in all contexts: assignments, expressions, pipe operators
- **REQUIRE system**: Libraries export both functions and operations, automatically loaded and prefixed via `REQUIRE "lib" AS prefix_(.*)`

### Function Execution Priority
When a function is called, the interpreter resolves it in this order:
1. **Built-in REXX functions** (LENGTH, SUBSTR, POS, etc.) - Always available regardless of ADDRESS context
2. **External functions** from REQUIRE'd libraries
3. **ADDRESS handler custom methods** - Only checked if not a built-in function
4. **Browser functions** (executeBrowserStringFunction)
5. **RPC/fallback** handler

This ensures standard REXX functions always work, while allowing ADDRESS handlers to define custom methods that don't conflict with built-ins. DOM functions use `DOM_` prefix (`DOM_QUERY`, `DOM_CLICK`, etc.) to avoid naming conflicts.

### ADDRESS mechanism
- **Cross-Application Communication** is one way of looking at it
- **Alien parsable/interpretable language** (Sql, bash, english assertion grammar, others)
- **implementations** can modify RC and RESULT vars (the latter a dict if needed)
- **SQL**: SQLite database operations
- **SYSTEM**: OS-level shell command execution (`ADDRESS SYSTEM "ls -la"`, `ADDRESS SYSTEM "cat > file.txt <<'EOF' ... EOF"`)
- **Assertions**: not just for the build in test framework
- **Mock testing**: Comprehensive test framework (`core/tests/mock-address.js`)
- **HEREDOC with interpolation**: `<<SQL` supports variable interpolation with configurable patterns (`{{var}}`, `${var}`, custom)
- **HEREDOC JSON auto-parsing**: `LET config = <<JSON` automatically parses to JavaScript objects
- Supports both traditional command strings (`"CREATE TABLE users"`) and modern method calls (`execute sql="CREATE TABLE users"`)

### Provisioning & Orchestration (`extras/addresses/provisioning-and-orchestration/`)
Comprehensive infrastructure management with VM, container automation, and **cloud orchestration**:

**Google Cloud Platform (`address-gcp.js`) - The Modern Cloud Orchestration Language:**
- **🚀 Killer Feature: Direct Spreadsheet Access** - `"SHEET 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms SELECT * FROM 'Sales'"`
- **SQL-like operations on Google Sheets** - Treat spreadsheets as databases with SELECT, INSERT, UPDATE
- **Service-specific command languages** - SHEETS, BIGQUERY, FIRESTORE, STORAGE, PUBSUB, FUNCTIONS, RUN
- **Production-ready Cloud Functions & Cloud Run** - 2nd gen functions with JSON-based URL extraction, intelligent error detection
- **HEREDOC orchestration workflows** - Complex multi-service operations as readable documentation
- **Cross-service data flow** - Sheets → BigQuery → Firestore → Pub/Sub → Functions → Cloud Run in single scripts
- **Replaces Google Apps Script, gcloud scripting, Zapier/IFTTT, ETL tools**
- **Built-in test examples** - Working end-to-end tests with automatic cleanup (all within free tier)

**Container Management:**
- **Docker** (`address-docker.js`) - Full Docker container lifecycle
- **Podman** (`address-podman.js`) - Rootless container operations
- **systemd-nspawn** (`address-nspawn.js`) - Lightweight OS containers

**Virtual Machine Management:**
- **QEMU/KVM** (`address-qemu.js`) - Production virtualization with Guest Agent
  - Command execution via qemu-guest-agent (no SSH needed)
  - Three execution methods: Guest Agent → SSH fallback → Serial console
  - Full lifecycle with pause/resume, save/restore state (via virsh)
- **VirtualBox** (`address-virtualbox.js`) - Desktop/development VMs with Guest Additions
  - Command execution via Guest Additions (no SSH needed)
  - ISO management, network configuration, snapshot support
  - Full lifecycle with pause/resume, save/restore state

**Key Capabilities:**
- **Cloud-native orchestration**: Single unified interface for all Google Cloud services
- **Exec without SSH**: Run commands directly in VMs/containers like `docker exec`
- **RexxJS deployment**: Automatically deploy and execute RexxJS scripts in VMs/cloud
- **Idempotent operations**: `start_if_stopped`, `stop_if_running` for automation
- **Lifecycle management**: Create, start, stop, pause, resume, restart, snapshot, restore
- **Production features**: Host verification, permissions setup, ISO downloads, guest agent installation
- **Security policies**: Memory/CPU limits, command filtering, audit logging

### Browser Integration (`src/web/`)
- PostMessage-based RPC between iframes
- Secure cross-origin communication
- Real-time streaming with CHECKPOINT functionality (back communication from worker to director)
- Director/worker patterns for distributed processing

### Test Infrastructure (`tests/`)
- **rexxt test runner** - Native RexxJS test runner with modern features (see `core/REXXT_GUIDE.md`)
  - Test skipping with `@skip` annotations
  - Tag-based test filtering (`--tags`)
  - Multiple output modes (live, verbose, minimal)
  - JSON results for CI/CD integration
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

-- Operations (imperative, no parentheses) and Functions (expressions, with parentheses)
REQUIRE "cwd:libs/bathhouse.js"
SERVE_GUEST guest="river_spirit" bath="herbal"     -- Operation: side-effect action
LET count = COUNT_TOKENS()                          -- Function: returns value
LET spirit = IDENTIFY_SPIRIT(description="muddy")   -- Function with named params

-- Named parameters work everywhere (functions only)
LET substr1 = SUBSTR("hello world", 7, 5)           -- Positional: "world"
LET substr2 = SUBSTR(start=7, length=5)             -- Named, data-first via pipe
LET result = "hello world" |> SUBSTR(start=7, length=5)  -- Named params in pipe: "world"

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

-- HTTP API integration
LET response = HTTP_GET("https://api.example.com/users")
LET user_data = HTTP_POST("https://api.example.com/users", '{"name": "Alice", "email": "alice@example.com"}')
LET updated = HTTP_PUT("https://api.example.com/users/123", '{"name": "Alice Smith"}')
LET deleted = HTTP_DELETE("https://api.example.com/users/123")
```

### Infrastructure Automation
```rexx
-- QEMU/KVM virtualization with Guest Agent
ADDRESS QEMU
"create image=debian.qcow2 name=ci-vm memory=4G cpus=4"
"configure_ssh name=ci-vm host=192.168.122.50 user=root"
"install_guest_agent name=ci-vm"
-- Now execute without SSH via qemu-guest-agent
"execute vm=ci-vm command=\"apt update && apt install -y build-essential\""
"deploy_rexx vm=ci-vm rexx_binary=/usr/local/bin/rexx"
"execute_rexx vm=ci-vm script=\"SAY 'Running in VM!'\""

-- VirtualBox with Guest Additions
ADDRESS VIRTUALBOX
"create template=Ubuntu name=test-vm memory=2048"
"start_if_stopped name=test-vm"  -- Idempotent
"install_guest_additions name=test-vm"
"execute vm=test-vm command=\"./run-tests.sh\""
"stop_if_running name=test-vm"  -- Idempotent

-- Docker container management
ADDRESS DOCKER
"create image=node:18 name=app-container"
"exec container=app-container command=\"npm install\""
"exec container=app-container command=\"npm test\""

-- Google Cloud Platform orchestration
ADDRESS GCP
"SHEET 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms SELECT * FROM 'Orders' WHERE date = TODAY()"
"BIGQUERY INSERT INTO analytics.daily_orders SELECT * FROM SHEETS_RESULT"
"FIRESTORE SET /metrics/today {\"orders\": 342, \"revenue\": 125000}"
"PUBSUB PUBLISH daily-metrics MESSAGE 'Dashboard updated'"
"FUNCTIONS DEPLOY process-orders SOURCE './functions' TRIGGER 'pubsub:orders' RUNTIME 'python311'"
```

### Modern Extensions
- Array/object manipulation with JSON integration
- Functional programming constructs (`MAP`, `FILTER`, `REDUCE`)
- Async/await patterns for browser operations
- Real-time progress monitoring with `CHECKPOINT()`
- Configurable string interpolation patterns - switch between `{{var}}`, `${var}`, `%var%`, or custom delimiters with `SET_INTERPOLATION('pattern')`

## Architecture

The codebase follows a modular design:
- **Parser** (`src/parser.js`): Converts REXX source to executable commands
- **Interpreter** (`src/interpreter.js`): Executes parsed commands with full language support
- **Function Libraries**: Domain-specific functionality in separate modules
- **ADDRESS Targets**: Plugin architecture for external system integration
- **Web Framework**: Browser-specific enhancements and RPC capabilities

### Module Loading Support Matrix

RexxJS's `REQUIRE` system adapts dynamically to the execution environment, providing consistent module loading across Node.js, web bundles, and browser contexts. The system automatically detects the runtime environment and chooses the appropriate loading strategy.

#### Environment Detection & Loading Strategies

**Node.js Environment (`nodejs`)**

- **Local files**: `REQUIRE "./extras/addresses/sqlite3/sqlite-address.js"` 
- **Node modules**: `REQUIRE "lodash"` (npm packages from node_modules)
- **Remote registries**: `REQUIRE "registry:org.rexxjs/excel-functions"`
- **Dependency resolution**: Full npm-style dependency graph with circular dependency detection
- **Security**: Permission-based loading with configurable restrictions

NodeJS modes are via `bin/rexx`, `core/rexx`, direct to `core/src/cli.js`, and via Jest tests in `core/*` under npm-test execution. Web-specific aspects will have to be mocked for tests to pass, and are unavailable to genuine users on the command line. 

TODO: transitive dep handling.

**Web Standalone (`web-standalone`)**

- **Bundled modules**: `REQUIRE "registry:org.rexxjs/jq-address.bundle"` (webpack-compiled, self-contained)
- **Remote loading**: Fetches unbundled modules from unpkg.com or custom registries
- **Browser-optimized**: Modules adapted for browser environment (no Node.js APIs)
- **Dynamic imports**: Uses browser's native import() for ES modules

Web modes are via the `rexxjs.bundle.js` (main live usage), via http://localhost:port/core/src/interpreter-web-loader.js, and in a more limited way file://path/to/core/src/interpreter-web-loader.js.  Note same-origin policy for those last two.

**Web Control Bus (`web-controlbus`)**
- 
- **Cross-iframe communication**: Modules loaded in parent frame, functions available via postMessage RPC
- **Distributed execution**: Functions execute in director frame, results passed back to worker
- **Security isolation**: Each iframe has separate module scope and permissions
- **Streaming support**: Real-time progress updates via `CHECKPOINT()` mechanism

Web control-bus modes are via the `rexxjs.bundle.js` (main live usage), via http://localhost:port/core/src/interpreter-web-loader.js.

#### Module Resolution Patterns

**Preference Lists** - Automatic fallback through multiple sources:

```rexx
REQUIRE "registry:org.rexxjs/excel-functions.bundle, registry:org.rexxjs/excel-functions, ./local/excel.js"
```
- 
- Tries bundled version first (fastest)
- Falls back to unbundled registry version  
- Finally attempts local file

**Registry Prefixes** - Explicit source specification:

```rexx
REQUIRE "registry:org.rexxjs/sqlite-address"     // GitHub Pages registry
REQUIRE "cwd:local/custom-functions.js"         // Current working directory
REQUIRE "npm:lodash"                             // Node.js modules (Node.js only)
REQUIRE "root:extras/addresses/docker.js"       // Project root directory
```

**Path Resolution Strategies** (Environment-Dependent):

**Node.js Environments** (`nodejs`):
- **`cwd:`** - Resolves relative to current working directory (where command was executed)
  ```rexx
  // If executed from /home/user/project/scripts/
  REQUIRE "cwd:../lib/utils.js"    // → /home/user/project/lib/utils.js
  REQUIRE "cwd:helpers.js"         // → /home/user/project/scripts/helpers.js
  ```
- **`root:`** - Resolves relative to project root (where package.json or .git exists)
  ```rexx
  REQUIRE "root:extras/addresses/sqlite.js"    // Always from project root
  ```
- **`./` or `../`** - Resolves relative to current script file location
  ```rexx
  REQUIRE "./local-helper.js"      // Same directory as current script
  ```
- **`/` or `C:\`** - Absolute filesystem paths
  ```rexx
  REQUIRE "/usr/local/lib/custom.js"           // Unix absolute
  REQUIRE "C:\\Program Files\\MyLib\\lib.js"   // Windows absolute
  ```

**Web Environments** (`web-standalone`, `web-controlbus`):
- **`cwd:` and `root:` are NOT supported** - These require Node.js filesystem access
- **Registry and bundled modules only**:
  ```rexx
  REQUIRE "registry:org.rexxjs/excel-functions.bundle"    // Pre-bundled for web
  REQUIRE "registry:org.rexxjs/lodash-adapter"           // RexxJS wrapper for lodash
  REQUIRE "https://raw.githubusercontent.com/RexxJS/dist/latest/addresses/echo-address.bundle.js"  // Direct bundle URLs
  ```
- **JavaScript libraries need adapters** - Raw JS libraries like lodash require RexxJS wrapper modules that export functions with RexxJS calling conventions

**Cross-Environment Adapter Example** (hypothetical `lodash-adapter`):
```rexx
// Same REQUIRE works in both environments
REQUIRE "registry:org.rexxjs/lodash-adapter" AS _(.*)
LET doubled = _MAP([1,2,3], "x * 2")        // → [2,4,6]
LET filtered = _FILTER(users, "age > 18")   // → adult users only
```

**Behind the scenes**:
- **Node.js**: Adapter uses `require('lodash')` from node_modules and wraps functions
- **Web**: Adapter includes bundled lodash code or loads from unpkg.com, same RexxJS interface
- **Function translation**: Converts RexxJS expression strings (`"x * 2"`) to JavaScript functions (`x => x * 2`)
- **Parameter adaptation**: Handles RexxJS named parameters and type conversion

**GitHub Module Example** (real):
```rexx
// Load echo ADDRESS handler from GitHub repository
REQUIRE "github.com/RexxJS/dist@latest"

// Now use the echo ADDRESS target
ADDRESS echo
"Testing echo functionality"
LET result = getLastEcho()
SAY "Echo result: " || result
```

**GitHub Module with AS Clause** (ADDRESS renaming):
```rexx
// Load same echo handler but rename the ADDRESS target
REQUIRE "github.com/RexxJS/dist@latest" AS REPEAT_BACK_TO_ME

// Now use the renamed ADDRESS target
ADDRESS REPEAT_BACK_TO_ME
"Hello from my custom ADDRESS name"
LET response = getLastEcho()
SAY "Custom ADDRESS response: " || response
```

**Note**: Direct HTTPS URLs (like `https://raw.githubusercontent.com/...`) are currently blocked by RexxJS security validation. Use the GitHub module format (`github.com/username/repo@version`) instead.

- **Relative paths limited** - Only work in specific web loader contexts

**Ambiguous Path Prevention**: RexxJS rejects ambiguous paths and suggests explicit prefixes to prevent confusion about resolution context. Web environments enforce stricter limitations due to browser security restrictions.

**AS Clause** - Namespace management and prefix transformation:

```rexx
REQUIRE "./extras/addresses/docker-address.js" AS docker_(.*)
REQUIRE "registry:org.rexxjs/r-stats" AS stats_(.*)
REQUIRE "cwd:bathhouse-library.js" AS bath_(.*)
```

The AS clause transforms function and operation names from loaded modules by applying prefixes to prevent naming conflicts and provide logical namespacing:

**Regex Pattern Transformation** (`prefix_(.*)`)
- **Pattern**: `bath_(.*)` captures the original function name and prefixes it
- **Example**: `SERVE_GUEST` becomes `bath_SERVE_GUEST`, `GET_LOG` becomes `bath_GET_LOG`
- **Usage**: Both operations and functions get the prefix
  ```rexx
  bath_CLEAN_BATHHOUSE area="lobby" intensity="deep"     // Operation
  LET capacity = bath_BATHHOUSE_CAPACITY()               // Function
  ```

**Simple Prefix** (no regex)
- **Pattern**: `docker` (automatically adds underscore → `docker_`)
- **Example**: `CREATE_CONTAINER` becomes `docker_CREATE_CONTAINER`
- **ADDRESS Targets**: Use exact name replacement (no regex patterns allowed)
  ```rexx
  REQUIRE "cwd:qemu-address.js" AS QEMU                  // ADDRESS QEMU
  ```

**Multiple Namespaces** - Same library with different prefixes:
```rexx
REQUIRE "cwd:bathhouse-library.js" AS yubabaHouse_(.*)
REQUIRE "cwd:bathhouse-library.js" AS zenibaHouse_(.*)

yubabaHouse_SERVE_GUEST guest="chihiro"
zenibaHouse_SERVE_GUEST guest="haku"
LET log1 = yubabaHouse_GET_LOG()      // Independent state
LET log2 = zenibaHouse_GET_LOG()      // Independent state
```

**Namespace Isolation Benefits**:
- **Conflict prevention**: Multiple libraries can have same function names
- **Version management**: Load different versions with different prefixes  
- **Logical grouping**: Group related functionality under meaningful prefixes
- **Independent state**: Each prefixed instance maintains separate internal state

#### Bundling & Distribution Architecture

**Bundled Modules** (`.bundle` suffix)
- **Webpack-compiled**: All dependencies included, no runtime resolution needed
- **Browser-ready**: Compatible with web-standalone and web-controlbus
- **Size optimized**: Tree-shaken and minified for production use
- **GitHub Pages registry**: Published as static files for CDN-like performance

**Unbundled Modules** (standard name)
- **Source distribution**: Raw JavaScript with runtime dependency loading
- **Development-friendly**: Easier debugging and modification
- **Dynamic dependencies**: npm packages fetched from unpkg.com as needed
- **Local development**: Available from `extras/` directory structure

#### Advanced Features

**Dependency Management**
- **Circular detection**: Prevents infinite loading loops
- **Version resolution**: Handles multiple versions of same library
- **Load-time permissions**: Security policies applied during module loading
- **Dependency graphs**: Tracks relationships for debugging and optimization

**Remote Orchestration** (SCRO - Streaming CheckpOint Remote Orchestration)
- **CHECKPOINT-based loading**: Modules requested from director via streaming protocol
- **Distributed libraries**: Functions execute remotely, results streamed back
- **Security boundaries**: Director controls what modules workers can access
- **Real-time updates**: Progress and intermediate results via `CHECKPOINT()`

**Environmental Adaptation**
```rexx
// Same REQUIRE statement works across all environments
REQUIRE "registry:org.rexxjs/excel-functions"

// Node.js: Downloads and caches from registry
// Web bundle: Uses pre-bundled version from dist/
// Web control bus: Requests from director frame
// All provide identical VLOOKUP(), SUMIF(), etc. functions
```

**Key Design Principles:**
- **No fallbacks**: Users explicitly choose bundled vs unbundled via REQUIRE statement
- **Environment-agnostic**: Same module code works in Node.js and browsers
- **Universal dependency source**: npm dependencies always fetched from unpkg.com for consistency
- **Explicit control**: Registry prefixes and preference lists give users full control over loading strategy
- **Security-first**: Permission system prevents unauthorized module access
- **Performance-optimized**: Bundled versions for production, unbundled for development

## Use Cases

1. **Scientific Computing**: R/SciPy-compatible functions for data analysis
2. **Web Automation**: Cross-iframe scripting and browser control
3. **Database Operations**: SQL integration with full CRUD capabilities (SQLite3)
4. **HTTP API Integration**: RESTful service communication with `HTTP_GET`, `HTTP_POST`, `HTTP_PUT`, `HTTP_DELETE` functions
5. **System Administration**: OS command execution and file operations
6. **Testing**: Comprehensive mock frameworks for ADDRESS-based applications
7. **Infrastructure Automation**: VM/container provisioning with QEMU, VirtualBox, Docker, Podman
   - CI/CD test environments with automatic VM creation and teardown
   - Multi-platform testing across different OS versions
   - Development environment provisioning and configuration
   - Container-based microservice orchestration
8. **Cloud Orchestration**: Google Cloud Platform service automation and data workflows
   - Google Sheets as database with SQL-like operations
   - Cross-service data pipelines (Sheets → BigQuery → Firestore → Pub/Sub)
   - Serverless function deployment and management
   - Real-time analytics and machine learning pipelines
   - Business intelligence dashboard automation

## Development Guidelines

### For LLM Assistants (`CLAUDE.md`)
- **Testing Requirements**: All work must have `npm test` passing at 100% before completion
- **Web/DOM Work**: Must also have `npm run test:web` passing for browser-related features  
- **Test Execution**: Use `@scratch_test.sh` instructions for all test invocations
- **Playwright Tests**: Prefix with `PLAYWRIGHT_HTML_OPEN=never` to prevent browser windows
- **No Fallback Logic**: Avoid implementing "fallback" patterns - ask for explicit guidance instead

This repository provides a complete REXX environment with modern extensions, making it suitable for everything from simple scripting to complex distributed applications running in browsers or Node.js.