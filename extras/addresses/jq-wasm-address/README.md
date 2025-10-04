# jq ADDRESS Library for RexxJS

A jq JSON query ADDRESS library for RexxJS using jq-wasm WebAssembly.

## Usage

### REXX Code

```rexx
-- Load the jq ADDRESS library
REQUIRE "jq-address"
ADDRESS JQ

-- Method-call style (recommended)
LET data = JSON_PARSE text='{"users":[{"name":"Alice","age":30},{"name":"Bob","age":25}]}'
LET names = query data=data query=".users[].name"
SAY "Names: " names

LET adults = filter data=data.users condition=".age >= 18"
SAY "Adults: " adults

-- Get keys and values
LET keys_result = keys data=data
LET type_result = type data=data

-- Aggregation functions
LET ages = query data=data query=".users[].age"
LET min_age = min data=ages
LET max_age = max data=ages
LET total_age = sum data=ages

-- Command-string style (traditional REXX ADDRESS)
LET fruit_data = JSON_PARSE text='{"fruit":{"color":"red","price":1.99}}'
LET result = setcontext data=fruit_data
".fruit.color,.fruit.price"  -- Returns ["red", 1.99]
SAY "Fruit info: " RESULT

-- Clear context when done
LET clear_result = clearcontext
```

### Available Methods

- `query(data, query, flags)` - Execute jq query and return parsed result
- `raw(data, query, flags)` - Execute jq query and return raw output with stdout/stderr
- `keys(data)` - Get object keys
- `values(data)` - Get object values  
- `length(data)` - Get array/object length
- `type(data)` - Get value type
- `select(data, condition)` - Select matching objects
- `map(data, expression)` - Map over array/object
- `filter(data, condition)` - Filter array by condition
- `sort(data, by)` - Sort array (optionally by key)
- `unique(data)` - Get unique values
- `reverse(data)` - Reverse array
- `min(data)` - Get minimum value
- `max(data)` - Get maximum value
- `sum(data)` - Sum array values
- `flatten(data, depth)` - Flatten array
- `status()` - Get service status
- `setcontext(data)` - Set data context for command-string queries
- `getcontext()` - Get current data context
- `clearcontext()` - Clear data context

## Dependencies

- `jq-wasm` - WebAssembly build of jq for JavaScript environments

## TODO

- **Review more idiomatic solutions than setcontext for JSON to be used as input**: The current setcontext approach for command-string queries differs from other ADDRESS libraries (system-address.js, sqlite-address.js) which handle command-string directly without explicit context setup. Consider alternatives like WITH clause, piping, or other REXX-idiomatic patterns for passing JSON data to jq queries.

## Build

```bash
npm install
npm test
npm run build:all  # Builds both versions
```

## Generated Files

**Two bundle versions are provided:**

### 1. External Dependency Version (Smaller)
- `dist/jq-address.js` - **68KB** production bundle with `@rexxjs-meta` tags
- Compatible with both Node.js and browser environments  
- **External dependency**: requires jq-wasm to be loaded separately
- Best for environments where jq-wasm is shared across multiple libraries

### 2. Self-Contained Version (Larger, Web-Safe)  
- `dist/jq-nodeps-address.js` - **1.3MB** production bundle with jq-wasm included
- **No external dependencies** - everything bundled together
- **Web-safe**: works in any browser environment without additional setup
- Best for standalone usage or when you want a single file deployment

### Usage Comparison

```rexx
-- Both versions work identically:
REQUIRE "jq-address"        -- 68KB, needs jq-wasm loaded separately  
-- OR
REQUIRE "jq-nodeps-address" -- 1.3MB, completely self-contained

ADDRESS JQ
LET result = query data=json_data query=".users[].name"
```