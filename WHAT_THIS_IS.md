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
- **Mock testing**: Comprehensive test framework (`core/tests/mock-address.js`)
- Supports both traditional command strings (`"CREATE TABLE users"`) and modern method calls (`execute sql="CREATE TABLE users"`)

### Provisioning & Orchestration (`extras/addresses/provisioning-and-orchestration/`)
Comprehensive infrastructure management with VM, container automation, and **cloud orchestration**:

**Google Cloud Platform (`address-gcp.js`) - The Modern Cloud Orchestration Language:**
- **🚀 Killer Feature: Direct Spreadsheet Access** - `"SHEET 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms SELECT * FROM 'Sales'"`
- **SQL-like operations on Google Sheets** - Treat spreadsheets as databases with SELECT, INSERT, UPDATE
- **Service-specific command languages** - SHEETS, BIGQUERY, FIRESTORE, STORAGE, PUBSUB, FUNCTIONS, RUN
- **HEREDOC orchestration workflows** - Complex multi-service operations as readable documentation
- **Cross-service data flow** - Sheets → BigQuery → Firestore → Pub/Sub in single scripts
- **Replaces Google Apps Script, gcloud scripting, Zapier/IFTTT, ETL tools**

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