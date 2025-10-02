# Variable Interpolation Integration TODO

**Goal**: Integrate RexxJS global interpolation (`core/src/interpolation-config.js`) across all ADDRESS handlers for consistent variable interpolation support.

**Status**: ✅ GCP handlers complete (30/30) | 🔲 Other handlers pending

---

## Completed ✅

### Provisioning & Orchestration - GCP (30 handlers)
- ✅ **address-gcp.js** - Main handler passes variablePool from interpreter
- ✅ All 30 sub-handlers:
  - apps-script, artifact-registry, bigquery, bigtable, billing
  - cloud-armor, cloud-cdn, cloud-kms, cloud-run, cloud-scheduler
  - cloud-sql, cloud-tasks, compute-engine, dns, docs
  - firestore, functions, gke, iam, load-balancing (with declarative syntax)
  - logging, memorystore, monitoring, pubsub, secret-manager
  - sheets, slides, spanner, storage, vpc

**Implementation**: Each handler has:
1. Import of `interpolation-config.js`
2. `interpolateVariables(str)` method accessing `this.parent.variablePool`
3. Interpolation applied in `handle()` or `execute()` methods
4. Support for all patterns: `{{var}}`, `${var}`, `%var%`, custom

---

## Pending 🔲

### 1. Provisioning & Orchestration - Container/VM Handlers

#### **address-docker.js** ✅ HIGH PRIORITY - COMPLETED
- **Type**: Class-based handler (`AddressDockerHandler`)
- **Entry point**: `ADDRESS_DOCKER_HANDLER(commandOrMethod, params, sourceContext)`
- **Current state**: No interpolation support
- **Pattern**:
  ```javascript
  "create image=debian:stable name={{container_name}}"
  "exec {{container_id}} command='echo {{message}}'"
  ```
- **Changes needed**:
  1. Add interpolation-config.js import
  2. Add `interpolateVariables(str)` method to class
  3. Apply in command parsing (before key-value extraction)
  4. Access variablePool from `params` (2nd parameter from interpreter)

#### **address-podman.js** ✅ HIGH PRIORITY - COMPLETED
- **Type**: Class-based handler (`AddressPodmanHandler`)
- **Entry point**: `ADDRESS_PODMAN_HANDLER(commandOrMethod, params, sourceContext)`
- **Current state**: No interpolation support
- **Similar to**: address-docker.js (same architecture)
- **Changes needed**: Same as address-docker.js

#### **address-lambda.js** 🔲 MEDIUM PRIORITY
- **Type**: Class-based handler (`AddressLambdaHandler`)
- **Entry point**: `ADDRESS_LAMBDA_HANDLER(commandOrMethod, params, sourceContext)`
- **Current state**: No interpolation support
- **Pattern**:
  ```javascript
  "create function={{function_name}} runtime=nodejs20.x handler=index.handler"
  "invoke {{function_name}} payload='{{json_payload}}'"
  ```
- **Changes needed**: Same pattern as Docker/Podman

#### **address-nspawn.js** 🔲 MEDIUM PRIORITY
- **Type**: Class-based handler (`AddressNspawnHandler`)
- **Entry point**: `ADDRESS_NSPAWN_HANDLER(commandOrMethod, params, sourceContext)`
- **Current state**: No interpolation support
- **Changes needed**: Same pattern as Docker/Podman

#### **address-openfaas.js** 🔲 MEDIUM PRIORITY
- **Type**: Class-based handler (`AddressOpenFaaSHandler`)
- **Entry point**: `ADDRESS_OPENFAAS_HANDLER(commandOrMethod, params, sourceContext)`
- **Current state**: No interpolation support
- **Pattern**:
  ```javascript
  "deploy function={{func_name}} image={{image_name}}"
  ```
- **Changes needed**: Same pattern

#### **address-proxmox.js** 🔲 MEDIUM PRIORITY
- **Type**: Class-based handler (`AddressProxmoxHandler`)
- **Entry point**: `ADDRESS_PROXMOX_HANDLER(commandOrMethod, params, sourceContext)`
- **Current state**: No interpolation support
- **Changes needed**: Same pattern

#### **address-qemu.js** 🔲 MEDIUM PRIORITY
- **Type**: Class-based handler (`AddressQemuHandler`)
- **Entry point**: `ADDRESS_QEMU_HANDLER(commandOrMethod, params, sourceContext)`
- **Current state**: No interpolation support
- **Changes needed**: Same pattern

#### **address-virtualbox.js** 🔲 MEDIUM PRIORITY
- **Type**: Class-based handler (`AddressVirtualBoxHandler`)
- **Entry point**: `ADDRESS_VIRTUALBOX_HANDLER(commandOrMethod, params, sourceContext)`
- **Current state**: No interpolation support
- **Changes needed**: Same pattern

#### **address-ssh.js** 🔲 MEDIUM PRIORITY
- **Type**: Class-based handler (`AddressSshHandler`)
- **Entry point**: `ADDRESS_SSH_HANDLER(commandOrMethod, params, sourceContext)`
- **Current state**: No interpolation support
- **Pattern**:
  ```javascript
  "connect host={{server}} user={{username}} key={{ssh_key_path}}"
  "run {{command_to_execute}}"
  ```
- **Changes needed**: Same pattern

#### **address-remote-docker.js** 🔲 LOW PRIORITY
- **Type**: Class-based handler (`AddressRemoteDockerHandler`)
- **Entry point**: `ADDRESS_REMOTE_DOCKER_HANDLER(commandOrMethod, params, sourceContext)`
- **Current state**: No interpolation support
- **Changes needed**: Same pattern

---

### 2. AI/LLM Handlers

#### **anthropic-ai/claude/claude-address.js** ✅ HIGH PRIORITY - COMPLETED
- **Type**: Function-based handler
- **Entry point**: `ADDRESS_CLAUDE_HANDLER(commandOrMethod, params)`
- **Current state**: No interpolation support
- **Pattern**:
  ```javascript
  "SYSTEM ROLE {{system_prompt}}"
  "CHAT {{chat_id}} TEXT '{{user_message}}'"
  ```
- **Changes needed**:
  1. Import interpolation-config.js
  2. Create standalone `interpolateVariables(str, variablePool)` function
  3. Apply in `handleClaudeCommand()` before parsing
  4. Extract variablePool from `params` parameter

#### **gemini-ai/src/gemini-pro.js** ✅ HIGH PRIORITY - COMPLETED
- **Type**: Function-based handler
- **Entry point**: Needs investigation (appears to be Gemini Pro handler)
- **Current state**: No interpolation support
- **Pattern**: TBD (needs analysis)
- **Changes needed**: Similar to Claude

#### **gemini-ai/src/gemini-pro-vision.js** 🔲 MEDIUM PRIORITY
- **Type**: Function-based handler (vision-specific)
- **Current state**: No interpolation support
- **Changes needed**: Similar to Claude

#### **open-ai/chat-completions/src/chat-completions.js** ✅ HIGH PRIORITY - COMPLETED
- **Type**: Function-based handler
- **Entry point**: Needs investigation
- **Current state**: No interpolation support
- **Pattern**:
  ```javascript
  "CHAT model={{model_name}} prompt='{{user_prompt}}'"
  ```
- **Changes needed**: Similar to Claude

---

### 3. Data/Query Handlers

#### **jq/src/jq-address.js** 🔲 MEDIUM PRIORITY
- **Type**: Function-based handler
- **Entry point**: `ADDRESS_JQ_HANDLER(commandOrMethod, params)`
- **Current state**: No interpolation support
- **Pattern**:
  ```javascript
  "query data={{json_var}} query='{{jq_filter}}'"
  ".items[] | select(.name == \"{{item_name}}\")"
  ```
- **Changes needed**:
  1. Import interpolation-config.js
  2. Create `interpolateVariables(str, variablePool)` function
  3. Apply before jq query execution
  4. Extract variablePool from `params`

#### **sqlite3/sqlite-address.js** ✅ HIGH PRIORITY - COMPLETED
- **Type**: Function-based handler
- **Entry point**: `ADDRESS_SQLITE3_HANDLER(commandOrMethod, params)`
- **Current state**: No interpolation support
- **Pattern**:
  ```javascript
  "SELECT * FROM {{table_name}} WHERE id = {{user_id}}"
  "INSERT INTO users (name, email) VALUES ('{{name}}', '{{email}}')"
  ```
- **Changes needed**:
  1. Import interpolation-config.js
  2. Create `interpolateVariables(str, variablePool)` function
  3. Apply before SQL execution
  4. Extract variablePool from `params`
  5. **IMPORTANT**: Ensure interpolation happens BEFORE parameterized queries (for table/column names)
  6. **SECURITY**: Values should still use parameterized queries, not direct interpolation

#### **duckdb-wasm/src/duckdb-wasm-address.js** 🔲 MEDIUM PRIORITY
- **Type**: Function-based handler
- **Entry point**: Needs investigation
- **Current state**: No interpolation support
- **Pattern**: Similar to sqlite3
- **Changes needed**: Similar to sqlite3

---

### 4. Scripting Handlers

#### **pyodide/src/pyodide-address.js** 🔲 MEDIUM PRIORITY
- **Type**: Function-based handler
- **Entry point**: Needs investigation
- **Current state**: No interpolation support
- **Pattern**:
  ```javascript
  "import {{module_name}}"
  "{{python_code}}"
  ```
- **Changes needed**:
  1. Import interpolation-config.js
  2. Create `interpolateVariables(str, variablePool)` function
  3. Apply before Python code execution
  4. Extract variablePool from params

---

## Implementation Pattern Summary

### For Class-Based Handlers (Docker, Podman, Lambda, etc.)

```javascript
// 1. At top of file
let interpolationConfig = null;
try {
  interpolationConfig = require('../../core/src/interpolation-config.js');
} catch (e) {
  // Not available
}

// 2. In class
class AddressDockerHandler {
  /**
   * Interpolate variables using RexxJS global interpolation pattern
   */
  interpolateVariables(str, variablePool) {
    if (!interpolationConfig || !variablePool) {
      return str;
    }

    const pattern = interpolationConfig.getCurrentPattern();
    if (!pattern.hasDelims(str)) {
      return str;
    }

    return str.replace(pattern.regex, (match) => {
      const varName = pattern.extractVar(match);
      if (varName in variablePool) {
        return variablePool[varName];
      }
      return match;
    });
  }

  // 3. In handler method
  async execute(command, variablePool = {}) {
    // Apply interpolation
    const interpolated = this.interpolateVariables(command, variablePool);

    // Continue with normal parsing
    // ...
  }
}

// 4. In ADDRESS_*_HANDLER function
async function ADDRESS_DOCKER_HANDLER(commandOrMethod, params, sourceContext) {
  const handler = await getOrCreateDockerHandler();

  // Extract variablePool from params (passed by interpreter)
  const variablePool = params || {};

  if (typeof commandOrMethod === 'string') {
    return await handler.execute(commandOrMethod, variablePool);
  }
  // ...
}
```

### For Function-Based Handlers (JQ, SQLite, Claude, etc.)

```javascript
// 1. At top of file
let interpolationConfig = null;
try {
  interpolationConfig = require('../../../core/src/interpolation-config.js');
} catch (e) {
  // Not available
}

// 2. Standalone interpolation function
function interpolateVariables(str, variablePool) {
  if (!interpolationConfig || !variablePool) {
    return str;
  }

  const pattern = interpolationConfig.getCurrentPattern();
  if (!pattern.hasDelims(str)) {
    return str;
  }

  return str.replace(pattern.regex, (match) => {
    const varName = pattern.extractVar(match);
    if (varName in variablePool) {
      return variablePool[varName];
    }
    return match;
  });
}

// 3. In ADDRESS_*_HANDLER function
async function ADDRESS_JQ_HANDLER(commandOrMethod, params) {
  // Extract variablePool from params
  const variablePool = params || {};

  if (typeof commandOrMethod === 'string') {
    // Apply interpolation
    const interpolated = interpolateVariables(commandOrMethod, variablePool);

    // Execute query with interpolated command
    // ...
  }
}
```

---

## Priority Breakdown

### **HIGH PRIORITY** (User-facing, command-heavy)
1. ✅ GCP handlers (DONE)
2. ✅ address-docker.js (DONE)
3. ✅ address-podman.js (DONE)
4. ✅ sqlite3/sqlite-address.js (DONE)
5. ✅ anthropic-ai/claude/claude-address.js (DONE)
6. ✅ gemini-ai/src/gemini-pro.js (DONE)
7. ✅ open-ai/chat-completions/src/chat-completions.js (DONE)

### **MEDIUM PRIORITY** (Less command-heavy, but still beneficial)
8. 🔲 address-lambda.js
9. 🔲 address-nspawn.js
10. 🔲 address-openfaas.js
11. 🔲 address-proxmox.js
12. 🔲 address-qemu.js
13. 🔲 address-virtualbox.js
14. 🔲 address-ssh.js
15. 🔲 jq/src/jq-address.js
16. 🔲 duckdb-wasm/src/duckdb-wasm-address.js
17. 🔲 pyodide/src/pyodide-address.js
18. 🔲 gemini-ai/src/gemini-pro-vision.js

### **LOW PRIORITY** (Edge cases)
19. 🔲 address-remote-docker.js

---

## Testing Strategy

For each handler, create test file: `test-{handler}-interpolation.rexx`

**Example** (`test-docker-interpolation.rexx`):
```rexx
#!/usr/bin/env rexx

CALL setInterpolationPattern 'handlebars'

/* Test variables */
container_name = "test-container"
image_name = "debian:stable"
message = "Hello from interpolation"

/* Test interpolation */
ADDRESS DOCKER 'create image={{image_name}} name={{container_name}}'
ADDRESS DOCKER 'exec {{container_name}} command="echo {{message}}"'
ADDRESS DOCKER 'stop {{container_name}}'
```

---

## Notes

### Variable Pool Flow (Already Implemented in Core)

```
REXX Script
  ↓
RexxJS Interpreter (core/src/interpreter.js:2303-2312)
  • const context = Object.fromEntries(this.variables)
  • await addressTarget.handler(finalCommandString, context, sourceContext)
  ↓
ADDRESS_*_HANDLER(commandString, params, sourceContext)
  • params = variablePool from interpreter
  ↓
Handler interpolation
  • interpolateVariables(commandString, params)
```

### Security Considerations

1. **SQL Handlers** (SQLite, DuckDB):
   - Interpolation for table/column names (structural)
   - **Still use parameterized queries for values** (prevent SQL injection)

2. **Shell/Command Handlers** (Docker, SSH, etc.):
   - Be aware of command injection risks
   - Consider validation after interpolation

3. **AI Handlers** (Claude, Gemini, OpenAI):
   - Interpolation is safe for prompts
   - Consider token limits with large interpolated values

### Backward Compatibility

- All handlers should work WITHOUT interpolation if:
  - `interpolation-config.js` not available
  - `variablePool` is empty/null
  - No interpolation delimiters in command string

- Legacy variable syntax (like `@var` in some handlers) should continue to work

---

## Completion Checklist

- [x] Docker handler interpolation
- [x] Podman handler interpolation
- [ ] Lambda handler interpolation
- [ ] Other container handlers (nspawn, qemu, virtualbox, proxmox, openfaas)
- [ ] SSH handler interpolation
- [ ] Remote Docker handler interpolation
- [x] Claude AI handler interpolation
- [x] Gemini AI handlers interpolation
- [x] OpenAI handler interpolation
- [ ] JQ handler interpolation
- [x] SQLite handler interpolation
- [ ] DuckDB handler interpolation
- [ ] Pyodide handler interpolation
- [ ] Test suite for each handler
- [ ] Documentation updates
- [ ] Example scripts for each handler

---

**Last Updated**: 2025-10-02
**Author**: Claude Code
**Status**:
- ✅ GCP Complete (30/30 handlers)
- ✅ HIGH PRIORITY Complete (6/6 handlers: Docker, Podman, SQLite, Claude, Gemini, OpenAI)
- 🔲 MEDIUM/LOW PRIORITY Pending (~13 handlers remaining)
