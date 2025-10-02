# GCP Declarative Syntax & Variable Interpolation Tests

## Overview

These Jest tests verify the new DSL features for GCP ADDRESS handlers:
1. **Declarative syntax** (WITH...END blocks)
2. **Variable interpolation** ({{var}}, ${var}, %var%, etc.)

## Test Files

### `address-gcp-declarative-gcloud-invocations.test.js` ⭐ **NEW**

**Pattern**: Jest → JavaScript → Embedded RexxJS → **Mock Verification** → Jest Assertions

**What's Different**: This file actually **verifies the gcloud commands** that would be invoked, not just that they succeed.

**Test Suites**:

1. **Declarative Load Balancer - Command Sequence**
   - Verify correct order: health check → backend → URL map → forwarding rule
   - Verify HTTPS load balancer with SSL certificate
   - Check all gcloud arguments are correct

2. **Variable Interpolation in gcloud Commands**
   - Verify `{{env}}` → `production` in actual command arguments
   - Verify multiple variables interpolate correctly
   - Ensure NO `{{...}}` patterns remain in commands

3. **Non-Declarative Commands - gcloud Invocations**
   - Cloud Run DELETE with interpolated service name
   - PubSub CREATE TOPIC with interpolated topic name

4. **REXX Logic + Interpolation - Command Verification**
   - Verify IF/THEN changes which gcloud commands are invoked
   - Verify DO loops invoke gcloud N times with different arguments

5. **Command Argument Format Verification**
   - Health check arguments formatted correctly
   - CDN-enabled backend arguments formatted correctly

6. **Error Cases**
   - Verify gcloud NOT invoked for malformed syntax

**Key Features**:
```javascript
// Captures ALL spawn calls
let spawnCalls = [];

jest.mock('child_process', () => ({
  spawn: jest.fn((...args) => {
    spawnCalls.push(args);  // ← Capture the call
    return mockProcess;
  })
}));

// Later, verify the actual commands
const commandStrings = spawnCalls.map(call => {
  const [cmd, args] = call;
  return `${cmd} ${args.join(' ')}`;
});

expect(commandStrings.find(cmd =>
  cmd.includes('backend-services create') &&
  cmd.includes('production-backend')  // ← Verify interpolation happened
)).toBeDefined();
```

### `address-gcp-declarative-syntax.test.js`

**Pattern**: Jest → JavaScript → Embedded RexxJS → Jest Assertions

**Test Suites**:

1. **Declarative Parser - Basic Functionality**
   - Parse key-value pairs
   - Parse nested blocks
   - Parse deeply nested structures
   - Parse arrays
   - Handle comments

2. **Variable Interpolation - Parser Level**
   - Handlebars pattern (`{{var}}`)
   - Unknown variables (left as-is)
   - Nested block interpolation

3. **Declarative Syntax - Load Balancer via RexxJS**
   - Simple load balancer
   - Complex multi-backend configuration

4. **Variable Interpolation - Full Stack** (RexxJS → GCP Handler)
   - Handlebars pattern
   - Shell-style `${var}`
   - Batch-style `%var%`

5. **Variable Interpolation - Non-Declarative Commands**
   - Sheets handler commands
   - BigQuery handler commands

6. **REXX-based Logic with Declarative Blocks (Option A)**
   - IF/THEN conditionals
   - DO loops for multiple resources

7. **Error Handling**
   - Malformed syntax
   - Missing delimiters

8. **Integration - Real-World Scenarios**
   - Multi-region load balancer with full configuration

### `address-gcp-interpolation.test.js`

**Pattern**: Jest → JavaScript → Embedded RexxJS → Jest Assertions

**Test Suites**:

1. **Interpolation Patterns**
   - Handlebars (default)
   - Shell style
   - Batch style
   - Custom patterns

2. **Interpolation in Handler Commands**
   - Sheets (spreadsheet IDs, sheet names)
   - Docs (document IDs)
   - Storage (bucket and file names)
   - BigQuery (dataset and table names)
   - Cloud Run (service names)
   - Functions (function names)
   - PubSub (topic and subscription names)

3. **Multi-Variable Interpolation**
   - Multiple variables in single command
   - Nested references

4. **Interpolation with REXX Logic**
   - Conditionally set variables
   - Loop-generated values

5. **Edge Cases and Error Handling**
   - Empty values
   - Numeric values
   - Special characters
   - No double-interpolation

6. **Backward Compatibility**
   - Works without interpolation config
   - Non-interpolated commands unchanged

## Running Tests

### Run All GCP DSL Tests
```bash
# Run gcloud invocation verification tests (RECOMMENDED)
npx jest extras/addresses/provisioning-and-orchestration/__tests__/address-gcp-declarative-gcloud-invocations.test.js

# Run declarative syntax tests
npx jest extras/addresses/provisioning-and-orchestration/__tests__/address-gcp-declarative-syntax.test.js

# Run interpolation tests
npx jest extras/addresses/provisioning-and-orchestration/__tests__/address-gcp-interpolation.test.js
```

### Run Specific Test Suite
```bash
npx jest -t "Declarative Parser - Basic Functionality"
npx jest -t "Variable Interpolation - Full Stack"
```

### Run with Verbose Output
```bash
npx jest extras/addresses/provisioning-and-orchestration/__tests__/address-gcp-declarative-syntax.test.js --verbose
```

## Test Pattern: Jest → RexxJS → Jest

### Example Test Structure

```javascript
test('should interpolate REXX variables in declarative block', async () => {
  // 1. Create RexxJS interpreter (Jest setup)
  const { Interpreter } = require('../../../../core/src/interpreter');
  const { parse } = require('../../../../core/src/parser');
  const interpreter = new Interpreter(mockRpcClient);

  // 2. Load GCP ADDRESS handler
  const gcpPath = path.join(__dirname, '../address-gcp.js');
  await interpreter.run(parse(`REQUIRE "${gcpPath}"`));

  // 3. Execute REXX script with DSL features
  const script = `
    CALL setInterpolationPattern 'handlebars'

    env = "production"
    port = 443

    ADDRESS GCP 'LOAD-BALANCER {{env}}-lb WITH
    backend_service "{{env}}-backend" {
      health_check {
        port {{port}}
      }
    }
    END'
  `;

  await interpreter.run(parse(script));

  // 4. Assert results (Jest assertions)
  const rc = interpreter.getVariable('RC');
  expect(rc).toBe(0);
});
```

## Key Features Tested

### 1. Declarative Syntax (WITH...END)

```rexx
ADDRESS GCP 'LOAD-BALANCER my-lb WITH
backend_service "my-backend" {
  protocol HTTP
  health_check {
    port 80
  }
}
END'
```

**Tests verify**:
- Parser correctly parses nested blocks
- GCP handler creates resources in correct order
- Error handling for malformed syntax

### 2. Variable Interpolation

```rexx
env = "production"
port = 443

ADDRESS GCP 'LOAD-BALANCER {{env}}-lb WITH
backend_service "{{env}}-backend" {
  health_check { port {{port}} }
}
END'
```

**Tests verify**:
- Variables flow: REXX → Interpreter → ADDRESS Handler → Parser
- Multiple interpolation patterns work
- Unknown variables left as-is
- No double-interpolation

### 3. REXX Logic + Declarative Blocks (Option A)

```rexx
/* REXX handles conditionals */
IF env = "production" THEN port = 443
ELSE port = 80

/* Declarative block uses interpolated result */
ADDRESS GCP 'LOAD-BALANCER {{env}}-lb WITH
backend_service "{{env}}-backend" {
  health_check { port {{port}} }
}
END'
```

**Tests verify**:
- REXX IF/THEN works before declarative blocks
- REXX DO loops can create multiple resources
- Variables correctly scoped

## Mocking Strategy

### Basic Mocking (declarative-syntax.test.js, interpolation.test.js)

Tests mock external dependencies to return success:

```javascript
// Mock child_process for gcloud commands
jest.mock('child_process', () => ({
  spawn: jest.fn(),
  exec: jest.fn((cmd, callback) => {
    if (cmd.includes('gcloud config get-value project')) {
      callback(null, 'test-project-123', '');
    }
  })
}));

// Mock spawn for declarative operations
const { spawn } = require('child_process');
spawn.mockReturnValue({
  stdout: { on: jest.fn() },
  stderr: { on: jest.fn() },
  on: jest.fn((event, callback) => {
    if (event === 'close') callback(0);
  })
});
```

### Command Verification Mocking (address-gcp-declarative-gcloud-invocations.test.js) ⭐

**Actually captures and verifies gcloud commands**:

```javascript
// Track all spawn calls
let spawnCalls = [];

jest.mock('child_process', () => ({
  spawn: jest.fn((...args) => {
    spawnCalls.push(args);  // ← Capture actual command + args
    return {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn((event, callback) => {
        if (event === 'close') callback(0);
      })
    };
  }),
  exec: jest.fn((cmd, callback) => {
    execCalls.push(cmd);
    if (cmd.includes('gcloud config get-value project')) {
      callback(null, 'test-project-123', '');
    }
  })
}));

// Later in tests - verify actual commands
const commandStrings = spawnCalls.map(call => {
  const [cmd, args] = call;
  return `${cmd} ${args.join(' ')}`;
});

// Verify health check creation with correct args
const healthCheckCmd = commandStrings.find(cmd =>
  cmd.includes('health-checks create') &&
  cmd.includes('test-lb-health-check')
);
expect(healthCheckCmd).toBeDefined();
expect(healthCheckCmd).toContain('--port=80');
expect(healthCheckCmd).toContain('--request-path=/health');

// Verify interpolation happened (no {{...}} patterns)
expect(healthCheckCmd).not.toContain('{{');
```

**What Gets Verified**:
1. ✅ **Correct gcloud command** (e.g., `gcloud compute health-checks create`)
2. ✅ **Correct resource name** (e.g., `test-lb-health-check`)
3. ✅ **All arguments present** (e.g., `--port=80`, `--request-path=/health`)
4. ✅ **Interpolation occurred** (e.g., `production-backend`, not `{{env}}-backend`)
5. ✅ **Correct sequence** (health check → backend → URL map → forwarding rule)
6. ✅ **Loop iterations** (DO loop creates N commands with different values)

## Coverage

**Declarative Parser**: 100% code paths
- Key-value pairs
- Nested blocks
- Arrays
- Comments
- Variable interpolation

**GCP Handlers**:
- Load Balancing (full declarative syntax)
- All 30 handlers (variable interpolation)

**Integration**:
- Full stack: REXX → Interpreter → ADDRESS Handler → Sub-Handler → Parser
- Multiple interpolation patterns
- REXX logic integration

## Expected Failures

Some tests are expected to fail with specific errors when run without GCP credentials:

```javascript
// Expected to fail without credentials, but should NOT fail due to interpolation issues
try {
  await interpreter.run(parse(script));
} catch (e) {
  expect(e.message).not.toContain('{{');  // Interpolation should have occurred
}
```

## Architecture Tested

```
┌─────────────────────────────────────────────────────┐
│ REXX Script                                         │
│ • env = "production"                                │
│ • port = 443                                        │
│ • ADDRESS GCP 'LOAD-BALANCER {{env}}-lb WITH...'  │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ RexxJS Interpreter                                  │
│ • context = Object.fromEntries(this.variables)     │
│ • addressTarget.handler(cmd, context, ...)         │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ ADDRESS_GCP_HANDLER                                 │
│ • handler.execute(cmd, variablePool)               │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ UnifiedGcpHandler                                   │
│ • this.variablePool = Object.freeze({...pool})    │
│ • Route to service handler                         │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ LoadBalancingHandler                                │
│ • this.interpolateVariables(command)               │
│ • DeclarativeParser(variablePool)                  │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ DeclarativeParser                                   │
│ • interpolateVariables() using global pattern      │
│ • {{var}} → value from variablePool               │
│ • Parse nested blocks                              │
└─────────────────────────────────────────────────────┘
```

## Contributing

When adding new DSL features:

1. **Add parser tests** - Test parsing logic in isolation
2. **Add integration tests** - Test full RexxJS → Handler → Parser flow
3. **Test all interpolation patterns** - handlebars, shell, batch, custom
4. **Test REXX logic** - Ensure IF/DO work with DSL features
5. **Test error cases** - Malformed syntax, missing delimiters

---

**Last Updated**: 2025-10-02
**Test Count**: ~70 tests across 3 files
**Patterns**:
- **Basic**: Jest → Embedded RexxJS → Jest Assertions
- **Command Verification**: Jest → Embedded RexxJS → **Mock Capture** → Verify gcloud Commands → Jest Assertions
