# Variable Interpolation Integration - All GCP Handlers

## Summary

All 30 GCP ADDRESS handlers now support RexxJS global variable interpolation using the `interpolation-config.js` system.

## What Changed

### 1. Variable Pool Flow (Complete Chain)

```
REXX Script (variables: env, port, domain, etc.)
    ↓
RexxJS Interpreter (core/src/interpreter.js)
    • Collects: const context = Object.fromEntries(this.variables)
    • Calls: addressTarget.handler(commandString, context, sourceContext)
    ↓
ADDRESS_GCP_HANDLER (address-gcp.js:304)
    • Receives: (commandString, context, sourceContext)
    • Passes: handler.execute(commandString, context)
    ↓
UnifiedGcpHandler.execute() (address-gcp.js:565)
    • Receives: (command, variablePool)
    • Freezes: this.variablePool = Object.freeze({ ...variablePool })
    ↓
Service Handlers (sheets, docs, bigquery, load-balancing, etc.)
    • Access: this.parent.variablePool
    • Interpolate: this.interpolateVariables(command)
    ↓
DeclarativeParser (for declarative syntax only)
    • Receives: new DeclarativeParser(variablePool)
    • Interpolates: {{var}} patterns in block content
```

### 2. All 30 Handlers Updated

Each handler now has:

**A. Import statement:**
```javascript
// Try to import interpolation config from RexxJS core
let interpolationConfig = null;
try {
  interpolationConfig = require('../../../../core/src/interpolation-config.js');
} catch (e) {
  // Not available - will use simpler variable resolution
}
```

**B. Interpolation method:**
```javascript
/**
 * Interpolate variables using RexxJS global interpolation pattern
 */
interpolateVariables(str) {
  if (!interpolationConfig) {
    return str;
  }

  const variablePool = this.parent.variablePool || {};
  const pattern = interpolationConfig.getCurrentPattern();

  if (!pattern.hasDelims(str)) {
    return str;
  }

  return str.replace(pattern.regex, (match) => {
    const varName = pattern.extractVar(match);

    if (varName in variablePool) {
      return variablePool[varName];
    }

    return match; // Variable not found - leave as-is
  });
}
```

**C. Usage in handle() or execute():**
```javascript
async handle(command) {
  const trimmed = command.trim();

  // Apply RexxJS variable interpolation ({{var}} pattern)
  const interpolated = this.interpolateVariables(trimmed);
  const upperCommand = interpolated.toUpperCase();

  // ... rest of handler logic uses interpolated
}
```

### 3. Handlers List (All 30)

1. ✅ apps-script-handler.js
2. ✅ artifact-registry-handler.js
3. ✅ bigquery-handler.js
4. ✅ bigtable-handler.js
5. ✅ billing-handler.js
6. ✅ cloud-armor-handler.js
7. ✅ cloud-cdn-handler.js
8. ✅ cloud-kms-handler.js
9. ✅ cloud-run-handler.js
10. ✅ cloud-scheduler-handler.js
11. ✅ cloud-sql-handler.js
12. ✅ cloud-tasks-handler.js
13. ✅ compute-engine-handler.js
14. ✅ dns-handler.js
15. ✅ docs-handler.js
16. ✅ firestore-handler.js
17. ✅ functions-handler.js
18. ✅ gke-handler.js
19. ✅ iam-handler.js
20. ✅ load-balancing-handler.js (also supports declarative syntax)
21. ✅ logging-handler.js
22. ✅ memorystore-handler.js
23. ✅ monitoring-handler.js
24. ✅ pubsub-handler.js
25. ✅ secret-manager-handler.js
26. ✅ sheets-handler.js
27. ✅ slides-handler.js
28. ✅ spanner-handler.js
29. ✅ storage-handler.js
30. ✅ vpc-handler.js

## Usage Examples

### Simple Interpolation

```rexx
#!/usr/bin/env rexx

CALL setInterpolationPattern 'handlebars'  /* {{var}} - default */

/* Define variables */
spreadsheet_id = "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
sheet_name = "Students"

/* Use in Sheets command */
ADDRESS GCP 'SHEETS {{spreadsheet_id}} SELECT * FROM {{sheet_name}}'
```

Result: `SHEETS 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms SELECT * FROM Students`

### Multi-Variable Interpolation

```rexx
#!/usr/bin/env rexx

env = "production"
region = "us-central1"
instance_type = "n1-standard-2"
project = "my-project"

ADDRESS GCP 'COMPUTE CREATE {{env}}-server MACHINE {{instance_type}} REGION {{region}} PROJECT {{project}}'
```

Result: `COMPUTE CREATE production-server MACHINE n1-standard-2 REGION us-central1 PROJECT my-project`

### Declarative Syntax with Interpolation

```rexx
#!/usr/bin/env rexx

env = "staging"
port = 8080
domain = "staging.example.com"

ADDRESS GCP 'LOAD-BALANCER {{env}}-lb WITH
backend_service "{{env}}-backend" {
  protocol HTTP
  timeout 30s

  health_check {
    port {{port}}
    request_path "/health"
  }
}

frontend {
  port 443
  ssl_certificate {
    domains ["{{domain}}"]
  }
}
END'
```

### Loop with Interpolation (Option A)

```rexx
#!/usr/bin/env rexx

CALL setInterpolationPattern 'handlebars'

regions = "us-central1 us-east1 us-west1"

DO i = 1 TO WORDS(regions)
  region = WORD(regions, i)

  /* Variable interpolation happens per loop iteration */
  ADDRESS GCP 'VPC CREATE SUBNET subnet-{{region}} REGION {{region}} RANGE 10.0.{{i}}.0/24'
END
```

### Different Interpolation Patterns

```rexx
#!/usr/bin/env rexx

/* Handlebars (default) */
CALL setInterpolationPattern 'handlebars'
ADDRESS GCP 'STORAGE LIST BUCKET={{bucket_name}}'  /* {{bucket_name}} */

/* Shell style */
CALL setInterpolationPattern 'shell'
ADDRESS GCP 'STORAGE LIST BUCKET=${bucket_name}'   /* ${bucket_name} */

/* Batch style */
CALL setInterpolationPattern 'batch'
ADDRESS GCP 'STORAGE LIST BUCKET=%bucket_name%'    /* %bucket_name% */

/* Custom pattern */
CALL setInterpolationPattern '[[v]]'
ADDRESS GCP 'STORAGE LIST BUCKET=[[bucket_name]]'  /* [[bucket_name]] */
```

## Key Design Decisions

### Option A: REXX Handles Logic, Blocks Handle Structure

**Decision:** Keep conditionals and loops in REXX, not in declarative blocks.

**Rationale:**
- REXX is already a full scripting language with IF/THEN, DO loops, etc.
- Declarative blocks are data/configuration structures
- Simpler parser - no need to implement expression evaluation
- Better debugging - REXX trace works for logic
- Avoid "two places for logic" confusion

**Implementation:**
- ✅ Variable interpolation in blocks ({{var}})
- ✅ REXX does loops/conditionals
- ✅ REXX can build complex blocks via string composition
- ❌ No @if/@foreach inside blocks (use REXX instead)

### Read-Only Variable Pool

**Decision:** Handlers receive frozen/immutable variable pool.

**Implementation:**
```javascript
this.variablePool = Object.freeze({ ...variablePool });
```

**Rationale:**
- ADDRESS handlers cannot corrupt REXX variable state
- Ensures referential transparency
- Variables flow one-way: REXX → handlers
- Handlers can read but not mutate

### Backward Compatibility

**Preserved:**
- Legacy `@variable` syntax in some handlers (Sheets, BigQuery)
- Both `@var` and `{{var}}` work (interpolation applied sequentially)
- Existing imperative commands unchanged
- Declarative syntax is opt-in (only for LOAD-BALANCER currently)

## Testing

See `test-interpolation.rexx` for comprehensive interpolation tests across all handlers.

Run existing examples:
```bash
./test-lb-with-variables.rexx      # Load balancer with interpolation
./test-lb-simple-declarative.rexx  # Declarative syntax
./test-interpolation.rexx          # Cross-handler interpolation
```

## Benefits

1. **DRY Principle** - Define values once, reuse everywhere
2. **Environment Parity** - Same templates, different variable values
3. **Type Safety** - Variables validated at REXX level before interpolation
4. **Consistency** - All handlers use same interpolation system
5. **Flexibility** - Switch interpolation pattern globally
6. **Readable** - `{{var}}` syntax is clear and standard

## Future Enhancements

### Potential (Not Implemented)

1. **More declarative handlers** - Apply WITH...END syntax to VPC, GKE, CloudArmor
2. **Nested interpolation** - Support `{{outer_{{inner}}}}`
3. **Expression evaluation** - `{{port + 1}}` (currently only simple lookup)
4. **Conditional blocks** - `@if {{env}} == "prod"` (currently use REXX IF)
5. **Loop blocks** - `@foreach region in {{regions}}` (currently use REXX DO)

### Not Planned

- Logic inside declarative blocks (use REXX for this)
- Handler mutation of variable pool (read-only by design)
- Automatic type conversion (REXX handles this)

## References

- **Core interpolation**: `/core/src/interpolation-config.js`
- **Declarative parser**: `/extras/addresses/shared-utils/declarative-parser.js`
- **Main handler**: `/extras/addresses/provisioning-and-orchestration/address-gcp.js`
- **Example handler**: `/extras/addresses/provisioning-and-orchestration/gcp-handlers/load-balancing-handler.js`
- **Documentation**: `VARIABLE-INTERPOLATION.md`, `DECLARATIVE-SYNTAX.md`

---

**Status**: ✅ Complete - All 30 GCP handlers support interpolation
**Date**: 2025-10-02
**Architecture**: Option A (REXX handles logic, blocks handle structure)
