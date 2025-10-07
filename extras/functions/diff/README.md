# diff-functions

Text diffing and patching functions for RexxJS using the `diff` library.

## Description

Provides comprehensive text comparison and patching capabilities, including unified diff generation, patch application, and reverse patches. Includes both DIFF and PATCH functions.

## Installation

Install via REQUIRE in your RexxJS script:

```rexx
REQUIRE "registry:org.rexxjs/diff-functions"
```

## Usage

### Basic Diffing

```rexx
/* Compare two texts */
LET original = "line1\nline2\nline3"
LET modified = "line1\nline2 changed\nline3"
LET patch = DIFF(text1=original, text2=modified)
SAY patch  /* Outputs unified diff */
```

### Applying Patches

```rexx
/* Apply a patch to text */
LET original = "line1\nline2\nline3"
LET modified = "line1\nline2 changed\nline3"
LET patch = DIFF(text1=original, text2=modified)
LET result = PATCH(text=original, patch=patch)
SAY result  /* Outputs: line1\nline2 changed\nline3 */
```

### Multiple Patches

```rexx
/* Apply multiple patches in sequence */
LET patches = [patch1, patch2, patch3]
LET result = PATCH_APPLY_MULTIPLE(text=original, patches=patches)
```

### Reverse Patches (Undo)

```rexx
/* Create a reverse patch to undo changes */
LET reversePatch = PATCH_CREATE_REVERSE(patch=patch)
LET original = PATCH(text=modified, patch=reversePatch)
```

## Available Functions

### DIFF Functions

- **DIFF(text1, text2, options)** - Compare texts and return diff
  - **format**: 'unified' (default), 'lines', 'words', 'chars', 'json', 'summary', 'patch'
  - **context**: Lines of context for unified diff (default: 3)
  - **filename1**: First filename for patch header (default: 'a')
  - **filename2**: Second filename for patch header (default: 'b')

- **DIFF_APPLY(text, patch)** - Apply a patch (alias for PATCH)

- **DIFF_PATCH(text1, text2, options)** - Create structured patch object
  - **filename1**: First filename
  - **filename2**: Second filename

### PATCH Functions

- **PATCH(text, patch, options)** - Apply unified diff patch
  - **fuzz**: Fuzz factor for inexact matching (default: 0)
  - **returnResult**: Return detailed result object (default: false)
  - **compareLine**: Custom line comparison function

- **PATCH_CHECK(text, patch, options)** - Check if patch can be applied
  - Returns: `{canApply: boolean, conflicts: array}`

- **PATCH_APPLY_MULTIPLE(text, patches, options)** - Apply multiple patches
  - **stopOnError**: Stop on first error (default: true)
  - **returnResults**: Return array of results (default: false)

- **PATCH_CREATE_REVERSE(patch)** - Create reverse patch for undo

## Examples

### Different Diff Formats

```rexx
/* Unified diff (default) */
LET unified = DIFF(text1=old, text2=new, format="unified")

/* Line-by-line diff */
LET lines = DIFF(text1=old, text2=new, format="lines")

/* Word-by-word diff */
LET words = DIFF(text1=old, text2=new, format="words")

/* Character-by-character diff */
LET chars = DIFF(text1=old, text2=new, format="chars")

/* Summary statistics */
LET summary = DIFF(text1=old, text2=new, format="summary")
/* Returns: {added: N, removed: N, unchanged: N, total: N} */
```

### Patch Validation

```rexx
/* Check if patch can be applied before applying */
LET check = PATCH_CHECK(text=original, patch=patch)
IF check.canApply THEN DO
  LET result = PATCH(text=original, patch=patch)
END
ELSE DO
  SAY "Cannot apply patch:"
  SAY check.conflicts
END
```

### Sequential Patches with Error Handling

```rexx
/* Apply multiple patches, continue on errors */
LET results = PATCH_APPLY_MULTIPLE(
  text=original,
  patches=[patch1, patch2, patch3],
  stopOnError=false,
  returnResults=true
)

/* Check which patches succeeded */
DO i = 1 TO LENGTH(results)
  IF results[i].success THEN
    SAY "Patch" i "succeeded"
  ELSE
    SAY "Patch" i "failed:" results[i].error
END
```

## Dependencies

- **diff** (^8.0.2): Fast JavaScript text diffing library

## License

MIT License - Copyright (c) 2025 RexxJS Project
