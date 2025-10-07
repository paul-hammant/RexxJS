# Minimatch Functions

Enhanced pattern matching functions using the [minimatch](https://www.npmjs.com/package/minimatch) library.

## Overview

The core RexxJS shell functions (LS, FIND) support simple wildcard patterns using `*` and `?`. This module enhances them with full glob pattern support.

## Installation

This module is **optional** and only needed for advanced pattern matching.

```rexx
REQUIRE "extras/functions/minimatch/minimatch-functions"
```

**Important:** Requiring this module **replaces** the built-in `LS` and `FIND` functions with enhanced versions. You continue using `LS()` and `FIND()` normally - they just gain advanced pattern support.

## What You Get

### Simple Wildcards (Core - No Module Needed)

```rexx
-- These work without loading this module
LET files1 = LS(path=".", pattern="*.txt")        -- All .txt files
LET files2 = LS(path=".", pattern="test?.js")     -- test1.js, testA.js, etc.
LET files3 = LS(path=".", pattern="data*")        -- Anything starting with "data"
```

### Advanced Patterns (Requires This Module)

```rexx
REQUIRE "extras/functions/minimatch/minimatch-functions"

-- Character classes
LET files1 = LS(path=".", pattern="[A-Z]*.js")    -- Files starting with uppercase
LET files2 = LS(path=".", pattern="[!0-9]*")      -- Files NOT starting with digit

-- Brace expansion
LET files3 = LS(path=".", pattern="*.{js,ts}")    -- .js or .ts files
LET files4 = LS(path=".", pattern="{foo,bar}*")   -- Files starting with foo or bar

-- Negation
LET files5 = LS(path=".", pattern="!(*.txt)")     -- Everything except .txt files

-- Extended globs
LET files6 = LS(path=".", pattern="@(test|spec).js")  -- test.js or spec.js
```

## Functions

### Enhanced LS and FIND

When you load this module, LS and FIND automatically gain advanced pattern support:

```rexx
REQUIRE "extras/functions/minimatch/minimatch-functions"

-- Now LS supports full globs
LET sourceFiles = LS(path="src", pattern="**/*.{js,ts}", recursive=true)

-- FIND also enhanced
LET testFiles = FIND(path=".", name="*.spec.{js,ts}")
```

### MINIMATCH Function

Direct access to pattern matching:

```rexx
REQUIRE "extras/functions/minimatch/minimatch-functions"

LET matches = MINIMATCH(filename="TestFile.js", pattern="[A-Z]*.js")
SAY matches  -- true

LET noMatch = MINIMATCH(filename="readme.md", pattern="*.{js,ts}")
SAY noMatch  -- false
```

## Pattern Syntax

See [minimatch documentation](https://github.com/isaacs/minimatch#features) for full syntax.

### Common Patterns

| Pattern | Matches |
|---------|---------|
| `*.txt` | All .txt files (simple wildcard) |
| `test?.js` | test1.js, testA.js (simple wildcard) |
| `[A-Z]*` | Files starting with uppercase letter |
| `[!.].*` | Files not starting with dot |
| `{foo,bar}*` | Files starting with foo or bar |
| `*.{js,ts}` | Files ending in .js or .ts |
| `!(*.txt)` | All files except .txt |
| `?(a|b).js` | a.js, b.js, or .js |
| `+(a|b).js` | a.js, b.js, aa.js, ab.js, etc. |
| `@(a|b).js` | Exactly a.js or b.js |

## Performance

- **Simple patterns** (`*`, `?`) use optimized core matching
- **Advanced patterns** use minimatch library (slightly slower but more powerful)
- The module automatically detects pattern complexity and uses the best method

## Node.js Only

This module requires Node.js and is not available in browser mode. Use it for:
- Build scripts
- File processing tasks
- Command-line tools

## Dependencies

- `minimatch` ^9.0.3 (automatically installed with RexxJS)
