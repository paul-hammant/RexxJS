# jq-functions (Native)

JSON query execution functions using system `jq` binary.

## Description

Provides jq query functions for RexxJS that shell out to the system-installed `jq` binary for maximum performance. This is the recommended version for server-side use.

## Requirements

- **System Binary:** `jq` must be installed on your system
  - Ubuntu/Debian: `sudo apt install jq`
  - macOS: `brew install jq`
  - Fedora/RHEL: `sudo dnf install jq`

## Installation

Install via REQUIRE in your RexxJS script:

```rexx
REQUIRE "registry:org.rexxjs/jq-functions"
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
- **jqRaw(data, query)** - Execute jq query with `-r` flag, return raw string
- **jqKeys(data)** - Get object keys (equivalent to `jqQuery(data, 'keys')`)
- **jqValues(data)** - Get object values (equivalent to `jqQuery(data, 'values')`)
- **jqLength(data)** - Get array/object length (equivalent to `jqQuery(data, 'length')`)
- **jqType(data)** - Get JSON type (equivalent to `jqQuery(data, 'type')`)

## vs jq-wasm-functions

| Feature | jq-functions (native) | jq-wasm-functions |
|---------|---------------------|-------------------|
| Performance | ⚡ Fast (native binary) | Slower (WASM) |
| Installation | Requires `apt install jq` | No system deps |
| Portability | Linux/macOS/Unix only | Works everywhere |
| Size | ~0 MB (no deps) | ~3 MB download |
| Use case | Server/CLI apps | Browser/portable |

**Recommendation:** Use `jq-functions` for production servers, use `jq-wasm-functions` for browsers or when you can't install system packages.

## License

MIT License - Copyright (c) 2025 RexxJS Project
