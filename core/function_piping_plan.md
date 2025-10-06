# Function Piping - Future Enhancements

## Current Status

Function piping with the `|>` operator is **fully implemented** in the REXX interpreter:
- ✅ Basic pipe operator with proper precedence
- ✅ Multi-line piping with `|>` continuation
- ✅ Pipe placeholders with `_`
- ✅ Lambda/arrow functions (`n => n * 2`)
- ✅ Data-first function alignment (POS, WORDPOS, LASTPOS, etc.)

**Test Results:** 98/98 test suites passing, 1854/1859 tests passing (99.7%)

---

## Possible Future Enhancements

### 1. Multi-Parameter Lambda Functions

**Current Limitation:** Only single-parameter lambdas are supported (`n => n * 2`)

**Proposed Enhancement:**
```rexx
-- Multi-parameter lambdas for REDUCE/FOLD operations
LET sum = [1, 2, 3, 4] |> REDUCE((acc, n) => acc + n, 0)  -- 10
LET product = [2, 3, 4] |> REDUCE((acc, n) => acc * n, 1)  -- 24

-- For zipping arrays
LET pairs = ZIP([1,2,3], ["a","b","c"], (x, y) => x || y)  -- ["1a", "2b", "3c"]
```

**Implementation Considerations:**
- Parser needs to handle `(param1, param2) => expr` syntax
- Lambda evaluation needs to bind multiple parameters
- Requires REDUCE/FOLD function implementation first

---

### 2. REDUCE/FOLD Function

**Current Limitation:** No accumulator/fold operation available

**Proposed Enhancement:**
```rexx
-- Basic REDUCE with initial value
LET sum = [1, 2, 3, 4] |> REDUCE((acc, n) => acc + n, 0)

-- REDUCE without initial value (uses first element)
LET sum = [1, 2, 3, 4] |> REDUCE((acc, n) => acc + n)

-- Complex reductions
LET result = data
  |> FILTER(n => n > 0)
  |> REDUCE((acc, n) => acc + (n * n), 0)
```

**Implementation Considerations:**
- Add `ARRAY_REDUCE` and `REDUCE` to array-functions.js
- Handle both forms (with and without initial value)
- Requires multi-parameter lambda support
- Parameter order: `REDUCE(array, reducer, initialValue?)`

---

### 3. Additional Functional Programming Patterns

**Current Limitation:** Limited set of array transformation functions

**Proposed Enhancements:**

#### Array Slicing and Chunking
```rexx
LET first5 = data |> TAKE(5)
LET skipFirst = data |> DROP(3)
LET middle = data |> SKIP(2) |> TAKE(5)
LET chunks = data |> CHUNK(3)  -- [[1,2,3], [4,5,6], ...]
```

#### Partitioning and Grouping
```rexx
LET [evens, odds] = [1,2,3,4,5] |> PARTITION(n => n % 2 = 0)
LET groups = data |> GROUP_BY(item => item.category)
```

#### Zipping and Combining
```rexx
LET pairs = ZIP([1,2,3], ["a","b","c"])  -- [[1,"a"], [2,"b"], [3,"c"]]
LET combined = FLATTEN([[1,2], [3,4], [5,6]])  -- [1,2,3,4,5,6]
```

#### Searching and Finding
```rexx
LET found = data |> FIND(n => n > 10)  -- First matching element
LET index = data |> FIND_INDEX(n => n > 10)  -- Index of first match
LET all = data |> FILTER(n => n > 10)  -- All matching elements
```

#### Statistical Operations
```rexx
LET total = data |> SUM
LET average = data |> AVERAGE
LET minimum = data |> MIN
LET maximum = data |> MAX
LET sorted = data |> SORT
LET reversed = data |> REVERSE
```

**Implementation Considerations:**
- Add to `src/array-functions.js`
- Ensure data-first parameter order
- Provide both ARRAY_* and short aliases (TAKE, DROP, etc.)
- Comprehensive test coverage

---

### 4. Improve String Expression Support in ARRAY_MAP

**Current Limitation:** String expressions like `"n * 2"` don't work well with simple arrays (use lambdas instead)

**Current Behavior:**
```rexx
LET x = [1, 2, 3] |> MAP(n => n * 2)  -- ✅ Works: [2, 4, 6]
LET x = [1, 2, 3] |> MAP("n * 2")     -- ❌ Doesn't work: [1, 2, 3]
```

**Proposed Enhancement:**
- Improve ARRAY_MAP to parse and evaluate simple string expressions for primitive arrays
- Use the existing `evaluateRexxCallbackExpression` infrastructure
- Maintain backward compatibility with object array mappings

**Implementation Considerations:**
- Detect whether array is primitive (numbers/strings) vs objects
- For primitive arrays, treat string as expression to evaluate
- For object arrays, maintain current behavior
- Edge cases: distinguish between property access and expressions

---

### 5. Partial Application / Currying Helpers

**Current Limitation:** Complex multi-parameter functions require placeholders

**Current Workaround:**
```rexx
LET result = data |> SUBSTR(_, 1, 5)  -- Works but verbose for repeated use
```

**Proposed Enhancement:**
```rexx
-- Create partially applied function
LET first5 = PARTIAL(SUBSTR, _, 1, 5)
LET result = data |> first5

-- Or with curry helper
LET trim_and_substr = COMPOSE(TRIM, PARTIAL(SUBSTR, _, 1, 10))
LET result = data |> trim_and_substr
```

**Implementation Considerations:**
- Add PARTIAL function that returns a closure
- Add COMPOSE for function composition
- Careful scoping and closure management
- May conflict with REXX's traditional execution model

---

### 6. Stream Processing Optimization

**Current Limitation:** All operations are eager (process entire arrays immediately)

**Proposed Enhancement:**
```rexx
-- Lazy evaluation for large datasets
LET result = LARGE_DATASET
  |> STREAM()          -- Convert to lazy stream
  |> FILTER(n => n > 0)
  |> MAP(n => n * n)
  |> TAKE(10)          -- Only process first 10 matches
  |> COLLECT()         -- Materialize results
```

**Implementation Considerations:**
- Major architectural change
- Would need generator/iterator pattern
- Benefits: performance on large datasets, infinite sequences
- Complexity: debugging, error handling, stack traces
- May be overkill for typical REXX use cases

---

### 7. Async/Promise Support in Pipes

**Current Limitation:** All pipe operations are synchronous (though they can be async internally)

**Proposed Enhancement:**
```rexx
-- Async operations in pipes
LET results = urls
  |> MAP(url => FETCH(url))      -- Returns promises
  |> AWAIT_ALL                    -- Wait for all promises
  |> MAP(response => PARSE_JSON(response))
```

**Implementation Considerations:**
- REXX interpreter already supports async/await
- Would need AWAIT_ALL or similar to handle promise arrays
- Could integrate with ADDRESS handlers for async I/O
- Error handling in async chains

---

## Non-Goals

The following are **not recommended** for implementation:

### ❌ Operator Overloading
- Adding custom operators beyond `|>` adds parser complexity
- REXX's simplicity is a feature, not a limitation

### ❌ Pattern Matching in Pipes
```rexx
-- Don't implement this level of complexity
LET result = data |> MATCH {
  [head, ...tail] => process(head)
  [] => empty()
}
```
- Pattern matching is a language-level feature, not a library concern
- Would require significant parser/interpreter changes

### ❌ Type System Integration
- REXX is dynamically typed by design
- Don't add compile-time type checking to pipes
- Runtime validation is sufficient

---

## Priority Recommendations

If implementing future enhancements, suggested priority order:

1. **High Priority:**
   - REDUCE/FOLD function (commonly requested, enables many patterns)
   - Multi-parameter lambdas (needed for REDUCE)
   - Basic FP functions (TAKE, DROP, FIND)

2. **Medium Priority:**
   - More FP patterns (PARTITION, GROUP_BY, ZIP)
   - Statistical operations (already mostly exist, just need pipe-friendly wrappers)
   - Improve string expression support

3. **Low Priority:**
   - Partial application helpers (placeholders work well enough)
   - Stream processing (premature optimization)
   - Async pipe helpers (existing async/await is sufficient)

---

## Contributing

When adding new features:

1. **Follow existing patterns:** Data-first parameter order, short aliases
2. **Comprehensive tests:** Add both unit and integration tests
3. **Documentation:** Update examples and migration guides
4. **Backward compatibility:** Never break existing code
5. **Performance:** Benchmark before/after for large datasets
