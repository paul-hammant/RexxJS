# sed-functions

Stream editing functions for RexxJS using the `sed-lite` library.

## Description

Provides sed-like text transformation capabilities for RexxJS, including pattern substitution, deletion, insertion, and line-based operations.

## Installation

Install via REQUIRE in your RexxJS script:

```rexx
REQUIRE "registry:org.rexxjs/sed-functions"
```

## Usage

### Basic Substitution

```rexx
/* Simple find and replace */
LET text = "Hello world, hello universe"
LET result = SED(text=text, pattern="s/hello/goodbye/gi")
SAY result  /* Outputs: "goodbye world, goodbye universe" */
```

### Multiple Operations

```rexx
/* Apply multiple sed operations */
LET text = "line 1\nline 2\nline 3"
LET result = SED(
  text=text,
  pattern="s/line/LINE/g; 2d"  /* Replace "line" and delete line 2 */
)
```

### Line-based Operations

```rexx
/* Delete specific lines */
LET result = SED_DELETE(text=text, lines="2,3")  /* Delete lines 2-3 */

/* Keep only specific lines */
LET result = SED_KEEP(text=text, lines="1,5")  /* Keep lines 1-5 */

/* Insert text */
LET result = SED_INSERT(text=text, line=2, content="New line")
```

## Available Functions

- **SED(text, pattern, options)** - Apply sed pattern to text
  - **text**: Input text to transform
  - **pattern**: sed pattern string (e.g., "s/old/new/g")
  - **options**: Optional sed options

- **SED_SUBSTITUTE(text, search, replace, options)** - Search and replace
  - **search**: Pattern to search for (regex or string)
  - **replace**: Replacement text
  - **options**: Flags like 'g' (global), 'i' (case-insensitive)

- **SED_DELETE(text, lines)** - Delete specific lines
  - **lines**: Line numbers or ranges (e.g., "2", "2,5", "2,$")

- **SED_KEEP(text, lines)** - Keep only specific lines

- **SED_INSERT(text, line, content)** - Insert text at line
  - **line**: Line number where to insert
  - **content**: Text to insert

- **SED_APPEND(text, line, content)** - Append text after line

## Examples

### Substitution Patterns

```rexx
/* Global case-insensitive replace */
LET result = SED(text=input, pattern="s/error/warning/gi")

/* Replace only first occurrence */
LET result = SED(text=input, pattern="s/foo/bar/")

/* Replace with regex groups */
LET result = SED(text=input, pattern="s/(\\d+)px/$1pt/g")
```

### Line Operations

```rexx
/* Delete empty lines */
LET result = SED(text=input, pattern="/^$/d")

/* Delete lines containing pattern */
LET result = SED(text=input, pattern="/DEBUG/d")

/* Keep only lines matching pattern */
LET result = SED(text=input, pattern="/ERROR/!d")
```

### Multiple Transformations

```rexx
/* Chain multiple operations */
LET result = SED(
  text=input,
  pattern="s/foo/bar/g; s/old/new/g; /^#/d"
)
```

## Dependencies

- **sed-lite** (^1.1.0): JavaScript implementation of sed

## License

MIT License - Copyright (c) 2025 RexxJS Project
