# duckdb-address (Native)

In-process analytical database via ADDRESS interface using system `duckdb` binary.

## Description

Provides a DuckDB ADDRESS target for RexxJS that shells out to the system-installed `duckdb` binary for maximum performance. This is the recommended version for server-side analytics.

## Requirements

- **System Binary:** `duckdb` must be installed on your system
  - See: https://duckdb.org/docs/installation/

## Installation

Install via REQUIRE in your RexxJS script:

```rexx
REQUIRE "registry:org.rexxjs/duckdb-address"
```

## Usage

```rexx
// Execute SQL query
LET sql = "SELECT 42 AS answer;"
ADDRESS DUCKDB "query"
SAY RESULT  // Outputs: [{"answer": 42}]

// Multiple rows
LET sql = "SELECT * FROM (VALUES (1, 'Alice'), (2, 'Bob')) AS t(id, name);"
ADDRESS DUCKDB "query"
SAY RESULT
```

## vs duckdb-wasm-address

| Feature | duckdb-address (native) | duckdb-wasm-address |
|---------|------------------------|---------------------|
| Performance | ⚡ Very Fast (native) | Fast (WASM) |
| Installation | Requires duckdb binary | No system deps |
| Portability | Linux/macOS/Unix only | Works everywhere |
| Size | ~0 MB (no deps) | ~50 MB download |
| Use case | Server analytics | Browser/portable |

**Recommendation:** Use `duckdb-address` for production servers, use `duckdb-wasm-address` for browsers or when you can't install system packages.

## License

MIT License - Copyright (c) 2025 RexxJS Project
