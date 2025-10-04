# jq-address (Native)

JSON query execution via ADDRESS interface using system `jq` binary.

## Description

Provides a jq ADDRESS target for RexxJS that shells out to the system-installed `jq` binary for maximum performance. This is the recommended version for server-side use.

## Requirements

- **System Binary:** `jq` must be installed on your system
  - Ubuntu/Debian: `sudo apt install jq`
  - macOS: `brew install jq`
  - Fedora/RHEL: `sudo dnf install jq`

## Installation

Install via REQUIRE in your RexxJS script:

```rexx
REQUIRE "registry:org.rexxjs/jq-address"
```

## Usage

```rexx
// Set data and query variables
LET data = '{"name": "RexxJS", "version": "1.0.0"}'
LET query = ".name"

// Execute query
ADDRESS JQ "query"
SAY RESULT  // Outputs: RexxJS
```

## vs jq-wasm-address

| Feature | jq-address (native) | jq-wasm-address |
|---------|-------------------|------------------|
| Performance | ⚡ Fast (native binary) | Slower (WASM) |
| Installation | Requires `apt install jq` | No system deps |
| Portability | Linux/macOS/Unix only | Works everywhere |
| Size | ~0 MB (no deps) | ~3 MB download |
| Use case | Server/CLI apps | Browser/portable |

**Recommendation:** Use `jq-address` for production servers, use `jq-wasm-address` for browsers or when you can't install system packages.

## License

MIT License - Copyright (c) 2025 RexxJS Project
