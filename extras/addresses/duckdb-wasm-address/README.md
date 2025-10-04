# DuckDB-WASM ADDRESS Library for RexxJS

An ADDRESS library that integrates DuckDB-WASM, providing a powerful, in-process analytical database for RexxJS.

## Usage

### REXX Code

```rexx
-- Load the DuckDB-WASM ADDRESS library
REQUIRE "duckdb-wasm-address"
ADDRESS DUCKDB

-- Simple query using method-call style
LET result = query sql="SELECT 42 AS the_answer;"
SAY "Result: " result.result[0].the_answer -- "Result: 42"

-- Simple query using command-string style
"SELECT 'Hello, DuckDB!' AS message;"
SAY "Command string result: " RESULT[0].message

-- Register a remote Parquet file and query it
ADDRESS DUCKDB
register_file_url name="weather.parquet" url="https://github.com/duckdb/duckdb-wasm/raw/main/data/weather.parquet"
"SELECT * FROM 'weather.parquet' LIMIT 5;"
DO i = 0 TO RESULT.length - 1
    SAY "Temp: " RESULT[i].temp_2m
END

-- Get the status of the DuckDB service
LET status = status()
SAY "DuckDB Version: " status.result.version
```

### Available Methods

- `query(sql)` - Executes a SQL query. Returns the result as an array of objects.
- `register_file_url(name, url, protocol)` - Registers a remote file (e.g., CSV, Parquet, JSON) from a URL for querying. `protocol` is optional.
- `status()` - Gets the status of the DuckDB service, including version and feature flags.

## Dependencies

- `@duckdb/duckdb-wasm` - The DuckDB-WASM library.

## Build & Test

```bash
# From within this directory (extras/addresses/duckdb-wasm)
npm install
npm test
```
