# jq-wasm-functions

JSON query execution functions using jq-wasm (portable, pure-JS).

## Description

Provides jq query functions for RexxJS using jq-wasm for portable, pure-JavaScript implementation. Works in both Node.js and browser environments without requiring system binaries.

## Requirements

- **NPM dependency:** `jq-wasm` (automatically installed)
- No system binaries required

## Installation

Install via REQUIRE in your RexxJS script:

```rexx
REQUIRE "registry:org.rexxjs/jq-wasm-functions"
```

## Usage

```rexx
// Simple query
LET data = '{"name": "RexxJS", "version": "1.0.0", "features": ["REXX", "JavaScript"]}'
LET result = jqQuery(data, '.name')
SAY result  // Outputs: "RexxJS"

// Array access
LET first = jqQuery(data, '.features[0]')
SAY first  // Outputs: "REXX"

// Get array length
LET count = jqLength(data, '.features')
SAY count  // Outputs: 2

// Get keys
LET keys = jqKeys(data)
SAY keys  // Outputs: ["name", "version", "features"]
```

## Available Functions

- **jqQuery(data, query)** - Execute jq query, return parsed JSON result
- **jqRaw(data, query)** - Execute jq query and return as string
- **jqKeys(data)** - Get object keys (equivalent to `jqQuery(data, 'keys')`)
- **jqValues(data)** - Get object values (equivalent to `jqQuery(data, 'values')`)
- **jqLength(data)** - Get array/object length (equivalent to `jqQuery(data, 'length')`)
- **jqType(data)** - Get JSON type (equivalent to `jqQuery(data, 'type')`)

## vs jq-functions

| Feature | jq-wasm-functions | jq-functions (native) |
|---------|------------------|---------------------|
| Performance | Slower (WASM) | ⚡ Fast (native binary) |
| Installation | No system deps | Requires `apt install jq` |
| Portability | Works everywhere | Linux/macOS/Unix only |
| Size | ~3 MB download | ~0 MB (no deps) |
| Use case | Browser/portable | Server/CLI apps |

**Recommendation:** Use `jq-wasm-functions` for browsers or when you can't install system packages, use `jq-functions` for production servers.

## License

MIT License - Copyright (c) 2025 RexxJS Project
