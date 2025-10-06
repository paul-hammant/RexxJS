# Function Piping Implementation Plan for REXX Interpreter

## Executive Summary

This document outlines the implementation plan for adding function piping capability to the REXX interpreter using the `|>` operator. This feature would allow data to flow through a chain of transformations in a readable left-to-right manner, improving code clarity and composability.

## Proposed Syntax

```rexx
-- Piping syntax
LET result = data |> UPPER |> TRIM |> SPLIT(" ") |> MAP("LENGTH(x)") |> SUM

-- Equivalent to traditional nested calls
LET result = SUM(MAP(SPLIT(TRIM(UPPER(data)), " "), "LENGTH(x)"))
```

## Operator Choice: `|>`

After evaluating multiple options, `|>` is recommended for the following reasons:
1. **Visual clarity**: Pipe symbol naturally represents data flow
2. **No conflicts**: REXX doesn't use `|` as an operator
3. **Industry standard**: Used in F#, Elixir, OCaml, and proposed for JavaScript
4. **Consistency**: Aligns with existing `→` operator in GCP address handler for result chains
5. **Parser-friendly**: Two-character operator is unambiguous to parse

Alternative operators considered:
- `|=>` - More verbose, less standard
- `->>` - Could conflict with negative numbers in some contexts
- `~>` - Less intuitive
- `:>` - Less common, might be confused with labels

## Function Compatibility Analysis

### Suitability Scores

Based on analysis of all built-in functions, here's the compatibility breakdown:

| Category | Functions | Score | Notes |
|----------|-----------|--------|-------|
| **Excellent (10/10)** | 45% | Perfect | Data-first functions that work without modification |
| **Good (7-9/10)** | 25% | Minor adaptation | Need simple wrapper for parameter order |
| **Fair (4-6/10)** | 20% | Moderate adaptation | Complex signatures requiring partial application |
| **Poor (1-3/10)** | 10% | Major rework | Side-effect functions or no data parameter |

### Category 1: Pipe-Ready Functions (Score: 10/10)
These functions have their primary data as the first parameter and work immediately with piping:

**String Functions:**
- UPPER, LOWER, LENGTH, TRIM, REVERSE, SLUG
- WORD_FREQUENCY, SENTIMENT_ANALYSIS, EXTRACT_KEYWORDS

**Array Functions:**
- ARRAY_LENGTH, ARRAY_REVERSE, ARRAY_UNIQUE, ARRAY_FLATTEN
- ARRAY_MIN, ARRAY_MAX, ARRAY_SUM, ARRAY_AVERAGE
- SPLIT, JOIN

**Encoding Functions:**
- BASE64_ENCODE, BASE64_DECODE
- URL_ENCODE, URL_DECODE
- CSV_TO_JSON, JSON_TO_CSV, XML_TO_JSON

**Validation Functions:**
- IS_EMAIL, IS_URL, IS_NUMBER, IS_INTEGER, IS_DATE, IS_EMPTY

### Category 2: Easy Adaptations (Score: 7-9/10)
Functions needing simple parameter reordering wrappers:

| Original Function | Piping Adapter | Example Usage |
|------------------|----------------|---------------|
| `POS(needle, haystack)` | `POS_IN(needle)` | `text |> POS_IN("search")` |
| `WORDPOS(phrase, string)` | `WORDPOS_IN(phrase)` | `text |> WORDPOS_IN("hello world")` |
| `ARRAY_INCLUDES(array, item)` | `INCLUDES(item)` | `list |> INCLUDES(5)` |
| `ARRAY_INDEXOF(array, item)` | `INDEXOF(item)` | `list |> INDEXOF("target")` |
| `ARRAY_GET(array, key)` | `GET(key)` | `data |> GET("name")` |

**Suggested Remedy:** Create wrapper functions that curry the non-data parameters:
```javascript
const POS_IN = (needle) => (haystack) => POS(needle, haystack);
const INCLUDES = (item) => (array) => ARRAY_INCLUDES(array, item);
```

### Category 3: Complex Adaptations (Score: 4-6/10)
Functions with multiple parameters or options:

| Function | Issue | Remedy |
|----------|-------|--------|
| `STRIP(string, option, char)` | Multiple modes | Create `STRIP_LEFT`, `STRIP_RIGHT`, `STRIP_BOTH` variants |
| `TRANSLATE(str, out, in)` | Table parameters | Create `TRANSLATE_WITH(out, in)` curry function |
| `SPACE(string, n, pad)` | Multiple params | Create `SPACE_WITH(n, pad)` curry function |
| `VERIFY(string, ref, opt, start)` | Complex params | Create mode-specific variants |
| `MAP(array, func)` | Function param | Already works with piping but may need syntax sugar |
| `FILTER(array, predicate)` | Predicate param | Works but benefits from lambda support |

**Suggested Remedy:** Implement partial application support:
```rexx
-- Allow partial application with placeholders
LET spacer = SPACE(_, 2, "*")  -- Creates partially applied function
result = text |> TRIM |> spacer
```

### Category 4: Non-Pipeable Functions (Score: 1-3/10)
Functions that don't fit the piping paradigm:

| Function | Issue | Remedy |
|----------|-------|--------|
| `DATE()`, `TIME()`, `NOW()` | No data input | Not applicable for piping |
| `UUID()`, `RANDOM_INT()` | Generators | Could pipe seed values |
| `SAY`, `PRINT` | Side effects | Could return input for chaining |
| `LET`, `SET` | Assignment | Language constructs, not functions |

**Suggested Remedy:** These remain as-is, not everything needs to be pipeable.

## Implementation Strategy

### Phase 1: Parser Enhancement
1. Add `|>` token to lexer
2. Implement pipe expression parsing with proper precedence
3. Transform piped expressions to nested function calls in AST

### Phase 2: Core Implementation
```javascript
// Parser transformation
// Input:  data |> FUNC1(args) |> FUNC2 |> FUNC3(more)
// Output: FUNC3(FUNC2(FUNC1(data, args)), more)

function parsePipeExpression(expr) {
  let result = expr.left;
  for (const pipe of expr.pipes) {
    if (pipe.args && pipe.args.length > 0) {
      // Function with arguments
      result = {
        type: 'FUNCTION_CALL',
        name: pipe.name,
        args: [result, ...pipe.args]
      };
    } else {
      // Function without arguments
      result = {
        type: 'FUNCTION_CALL',
        name: pipe.name,
        args: [result]
      };
    }
  }
  return result;
}
```

### Phase 3: Adapter Library
Create a new module `src/pipe-adapters.js`:
```javascript
// Curry wrappers for common patterns
exports.createPipeAdapters = (interpreter) => {
  return {
    // Position/search adapters
    POS_IN: (needle) => (haystack) => interpreter.POS(needle, haystack),
    WORDPOS_IN: (phrase) => (string) => interpreter.WORDPOS(phrase, string),
    
    // Array adapters
    INCLUDES: (item) => (array) => interpreter.ARRAY_INCLUDES(array, item),
    INDEXOF: (item) => (array) => interpreter.ARRAY_INDEXOF(array, item),
    GET: (key) => (obj) => interpreter.ARRAY_GET(obj, key),
    SET: (key, val) => (obj) => interpreter.ARRAY_SET(obj, key, val),
    
    // String adapters
    STRIP_LEFT: (char) => (str) => interpreter.STRIP(str, 'L', char),
    STRIP_RIGHT: (char) => (str) => interpreter.STRIP(str, 'T', char),
    STRIP_BOTH: (char) => (str) => interpreter.STRIP(str, 'B', char),
    
    // Partial application helpers
    SPACE_WITH: (n, pad) => (str) => interpreter.SPACE(str, n, pad),
    TRANSLATE_WITH: (out, inp) => (str) => interpreter.TRANSLATE(str, out, inp),
  };
};
```

### Phase 4: Optional Enhancements

#### 4.1 Lambda Support
Enable inline functions in pipes:
```rexx
result = data |> MAP(x => x * 2) |> FILTER(x => x > 10)
```

#### 4.2 Pipe Placeholders
Allow explicit parameter positioning:
```rexx
result = data |> POS("search", _) |> SUBSTR(_, 1, 5)
-- Where _ represents the piped value
```

#### 4.3 Multi-line Piping
Support readable multi-line chains:
```rexx
LET result = data
  |> TRIM
  |> UPPER
  |> SPLIT(" ")
  |> MAP("LENGTH(x)")
  |> FILTER("x > 3")
  |> SUM
```

## Testing Strategy

### Unit Tests
1. Basic piping: `"hello" |> UPPER` → `"HELLO"`
2. Multi-stage: `" hello " |> TRIM |> UPPER |> LENGTH` → `5`
3. With arguments: `"a,b,c" |> SPLIT(",") |> ARRAY_LENGTH` → `3`
4. Adapter functions: `"hello world" |> POS_IN("world")` → `7`
5. Error handling: Invalid pipe targets, type mismatches

### Integration Tests
1. Complex data transformations with mixed function types
2. Piping with ADDRESS handlers
3. Performance comparison with nested calls
4. Edge cases: empty pipes, null values, error propagation

### Backwards Compatibility
- All existing code continues to work
- Piping is purely additive syntax
- No changes to existing function signatures
- Adapter functions are separate from core functions

## Migration Guide

### For Users
```rexx
-- Before (nested calls)
LET result = ARRAY_SUM(MAP(FILTER(SPLIT(TRIM(UPPER(text)), " "), "LENGTH(x) > 3"), "LENGTH(x)"))

-- After (piped)
LET result = text 
  |> UPPER 
  |> TRIM 
  |> SPLIT(" ") 
  |> FILTER("LENGTH(x) > 3") 
  |> MAP("LENGTH(x)") 
  |> ARRAY_SUM
```

### For Library Authors
To make functions pipe-friendly:
1. Put the primary data as the first parameter
2. Return transformed data (not undefined)
3. Avoid side effects where possible
4. Provide curried variants for multi-parameter functions

## Performance Considerations

1. **Compile-time transformation**: Piping is resolved during parsing, no runtime overhead
2. **Same execution path**: Piped code executes identically to nested calls
3. **Memory efficiency**: No intermediate variables or closures created
4. **Optimization opportunity**: Could enable future stream processing optimizations

## Timeline

- **Week 1**: Parser enhancement and basic piping
- **Week 2**: Core built-in function testing and adapter creation
- **Week 3**: Extended function library compatibility
- **Week 4**: Documentation, examples, and migration guide
- **Week 5**: Performance testing and optimization
- **Week 6**: Release candidate and community feedback

## Success Metrics

1. **Adoption**: 50% of new scripts using piping within 3 months
2. **Readability**: 80% of users report improved code clarity
3. **Performance**: No measurable performance degradation
4. **Compatibility**: 100% backwards compatibility maintained
5. **Coverage**: 75% of functions usable in pipes (directly or via adapters)

## Conclusion

Function piping with the `|>` operator would be a valuable addition to the REXX interpreter, providing:
- Improved code readability through left-to-right data flow
- Better composability of operations
- Alignment with modern functional programming patterns
- Full backwards compatibility

The implementation is straightforward, with most complexity in creating adapter functions for non-pipe-friendly signatures. The 70% of functions that are already pipe-ready would provide immediate value, while adapters enable the remaining 30% to participate in piping workflows.