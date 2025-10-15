# ADDRESS Handler Cleanup Documentation

## Issues Found

After examining the ADDRESS handlers in the RexxJS system, several inconsistencies were discovered that need remediation:

### 1. Missing canonical field
Docker handler uses `namespace: "rexxjs"` instead of `canonical: "org.rexxjs/docker-address"`

### 2. Inconsistent type field values
- Docker: `type: 'address-target'`
- DuckDB: `type: 'address-handler'`
- NSpawn: `type: 'address'`
- SQLite/System/Echo: `type: 'address-handler'`

### 3. Inconsistent structure for handler info
- Docker: `detectionFunction: 'DOCKER_ADDRESS_META'` (old pattern)
- DuckDB/SQLite/System: `provides: { handlerFunction: 'ADDRESS_X_HANDLER' }` (new pattern)
- NSpawn: `methods: { handlerFunction: 'ADDRESS_NSPAWN_HANDLER' }` (different pattern)

### 4. Duplicate META functions
Pyodide has both `PYODIDE_ADDRESS_META()` and `ORG_REXXJS_PYODIDE_ADDRESS_META()`

### 5. Missing required fields
Some handlers lack `provides.addressTarget` or `canonical` fields

## Standardization Required

The handlers need standardization to follow the pattern established by echo, sqlite3, and system handlers with:
- `canonical: "org.rexxjs/handler-name"`
- `type: "address-handler"`
- `provides: { addressTarget: 'targetname', handlerFunction: 'HANDLER_NAME' }`

## Standard META Function Template

```javascript
function HANDLER_ADDRESS_META() {
  return {
    canonical: "org.rexxjs/handler-address",
    type: "address-handler",
    name: "Handler Service Name",
    version: "1.0.0",
    description: "Handler description",
    provides: {
      addressTarget: "handler",
      handlerFunction: "ADDRESS_HANDLER_HANDLER",
      commandSupport: true,
      methodSupport: true
    },
    dependencies: {
      // module dependencies
    },
    requirements: {
      environment: "nodejs" // or "browser" or "both"
    }
  };
}
```

## Cleanup Actions Needed

1. Standardize all META function return objects to use consistent structure
2. Remove duplicate META functions (keep only the primary one)
3. Remove all _MAIN functions from handlers that still have them
4. Ensure all handlers follow the @rexxjs-meta comment pattern
5. Update require-system.js to not generate hardcoded detection function names