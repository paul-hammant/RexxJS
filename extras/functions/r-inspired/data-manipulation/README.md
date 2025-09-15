# R Data Manipulation Functions

This library provides R-style data manipulation and transformation functions for RexxJS, enabling powerful data processing, dataframe operations, string manipulation, and set operations within REXX scripts.

## Quick Start

```rexx
REQUIRE "r-data-manipulation"
LET df = DATA_FRAME("name"=["Alice", "Bob", "Charlie"], "age"=[25, 30, 35])
LET filtered = SUBSET(df, "age > 28")
SAY "Filtered data:" filtered
```

## Installation

```bash
npm install
npm test
```

## Function Categories

### DataFrame Operations

#### Creation and Structure
- **DATA_FRAME(...)** - Create dataframe from named vectors
- **RBIND(df1, df2)** - Bind rows together
- **CBIND(df1, df2)** - Bind columns together
- **HEAD(df, n)** - Show first n rows
- **TAIL(df, n)** - Show last n rows
- **NROW(df)** - Number of rows
- **NCOL(df)** - Number of columns
- **DIM(df)** - Dimensions [rows, cols]

#### Data Selection and Filtering
- **SUBSET(df, condition)** - Filter rows by condition
- **SELECT(df, columns)** - Select specific columns
- **SLICE(df, start, end)** - Select row range
- **FILTER(df, predicate)** - Apply filtering function

#### Data Transformation
- **MUTATE(df, transformations)** - Add/modify columns
- **ARRANGE(df, columns)** - Sort by columns
- **GROUP_BY(df, columns)** - Group data for operations
- **SUMMARIZE(df, operations)** - Aggregate grouped data

### String Manipulation

#### Basic String Operations
- **PASTE(...)** - Concatenate strings with separator
- **PASTE0(...)** - Concatenate without separator
- **SUBSTR(x, start, length)** - Extract substring
- **NCHAR(x)** - Number of characters
- **TOUPPER(x)** - Convert to uppercase
- **TOLOWER(x)** - Convert to lowercase

#### Pattern Matching
- **GREP(pattern, x)** - Find pattern matches
- **GREPL(pattern, x)** - Test for pattern matches
- **SUB(pattern, replacement, x)** - Replace first match
- **GSUB(pattern, replacement, x)** - Replace all matches
- **STRSPLIT(x, pattern)** - Split strings by pattern

#### String Transformation
- **TRIMWS(x)** - Remove leading/trailing whitespace
- **SPRINTF(format, ...)** - Format strings with placeholders
- **CHARTR(old, new, x)** - Translate characters
- **REVERSE_STRING(x)** - Reverse character order

### Set Operations

#### Basic Set Functions
- **UNION(x, y)** - Union of two sets
- **INTERSECT(x, y)** - Intersection of two sets
- **SETDIFF(x, y)** - Set difference (x - y)
- **SETEQUAL(x, y)** - Test set equality
- **IS_ELEMENT(x, set)** - Test membership

#### Set Analysis
- **CARDINALITY(set)** - Number of unique elements
- **POWERSET(set)** - All subsets of a set
- **CARTESIAN_PRODUCT(x, y)** - Cartesian product
- **SYMMETRIC_DIFFERENCE(x, y)** - Elements in either set but not both

### Data Processing

#### List Operations
- **LIST(...)** - Create named list
- **APPEND(list, values)** - Add elements to list
- **PREPEND(list, values)** - Add elements to front
- **REVERSE(x)** - Reverse order of elements
- **SORT(x)** - Sort elements
- **ORDER(x)** - Get sorting indices

#### Apply Functions
- **APPLY(data, margin, fun)** - Apply function over arrays
- **LAPPLY(list, fun)** - Apply function to list elements
- **SAPPLY(list, fun)** - Simplify lapply results
- **MAPPLY(fun, ...)** - Multivariate apply

## Usage Examples

### DataFrame Operations

```rexx
REQUIRE "r-data-manipulation"

-- Create dataframe
LET employees = DATA_FRAME(
    "name" = ["Alice", "Bob", "Charlie", "Diana"],
    "department" = ["IT", "Sales", "IT", "HR"],
    "salary" = [75000, 65000, 80000, 70000],
    "years" = [3, 5, 2, 4]
)

-- Basic info
SAY "Dimensions:" DIM(employees)
SAY "First 2 rows:"
LET preview = HEAD(employees, 2)

-- Filter high earners
LET highEarners = SUBSET(employees, "salary > 70000")
SAY "High earners:" NROW(highEarners)

-- Add calculated column
LET enhanced = MUTATE(employees, "annual_bonus" = "salary * 0.1")

-- Sort by salary
LET sorted = ARRANGE(employees, "salary")
```

### String Processing

```rexx
REQUIRE "r-data-manipulation"

-- Basic string operations
LET names = ["alice smith", "bob jones", "charlie brown"]
LET uppercase = TOUPPER(names)
LET firstNames = SAPPLY(names, FUNCTION(x) STRSPLIT(x, " ")[1])

-- Pattern matching
LET emails = ["alice@company.com", "bob@email.org", "invalid-email"]
LET validEmails = emails[GREPL("@.*\\.", emails)]
SAY "Valid emails:" LENGTH(validEmails)

-- String transformation
LET text = "  Hello, World!  "
LET cleaned = TRIMWS(text)
LET formatted = SPRINTF("Message: %s (length: %d)", cleaned, NCHAR(cleaned))
```

### Set Operations

```rexx
REQUIRE "r-data-manipulation"

-- Set operations
LET setA = [1, 2, 3, 4, 5]
LET setB = [4, 5, 6, 7, 8]

LET unionSet = UNION(setA, setB)
LET intersection = INTERSECT(setA, setB)  
LET difference = SETDIFF(setA, setB)

SAY "Union:" unionSet
SAY "Intersection:" intersection
SAY "A - B:" difference

-- Membership testing
LET isInA = IS_ELEMENT(3, setA)
LET areEqual = SETEQUAL(setA, setB)
```

### Advanced Data Processing

```rexx
REQUIRE "r-data-manipulation"

-- Complex dataframe operations
LET sales = DATA_FRAME(
    "region" = ["North", "South", "North", "East", "South"],
    "product" = ["A", "B", "A", "C", "B"],
    "revenue" = [100000, 150000, 120000, 80000, 140000]
)

-- Group and summarize
LET byRegion = GROUP_BY(sales, "region")
LET summary = SUMMARIZE(byRegion, 
    "total_revenue" = "SUM(revenue)",
    "avg_revenue" = "MEAN(revenue)",
    "count" = "N()"
)

-- Apply custom functions
LET processed = LAPPLY(sales.revenue, FUNCTION(x) x * 1.1)  -- 10% increase
```

### String Pattern Matching

```rexx
REQUIRE "r-data-manipulation"

-- Advanced string operations
LET text = "The quick brown fox jumps over the lazy dog"
LET words = STRSPLIT(text, " ")

-- Find words containing specific letters
LET wordsWithO = words[GREPL("o", words)]

-- Replace patterns
LET phoneNumbers = ["123-456-7890", "987.654.3210", "555 123 4567"]
LET normalized = GSUB("[-.\\s]", "", phoneNumbers)  -- Remove separators

-- Extract patterns
LET emails = ["Contact us at support@company.com or sales@company.com"]
LET extractedEmails = REGMATCHES(emails, "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b")
```

## Data Transformation Pipeline

```rexx
REQUIRE "r-data-manipulation"

-- Pipeline example
LET rawData = DATA_FRAME(
    "Name" = ["  Alice Smith  ", "bob jones", "CHARLIE BROWN"],
    "Email" = ["alice@CO.com", "BOB@email.org", "charlie@SITE.NET"],
    "Score" = ["85.5", "92.0", "78.3"]
)

-- Clean and transform data
LET cleaned = rawData
LET cleaned.Name = TRIMWS(cleaned.Name)                    -- Remove whitespace
LET cleaned.Name = SAPPLY(cleaned.Name, FUNCTION(x) {      -- Title case
    LET words = STRSPLIT(x, " ")
    PASTE(SAPPLY(words, FUNCTION(w) PASTE0(TOUPPER(SUBSTR(w, 1, 1)), TOLOWER(SUBSTR(w, 2)))), " ")
})
LET cleaned.Email = TOLOWER(cleaned.Email)                 -- Normalize email
LET cleaned.Score = AS_NUMERIC(cleaned.Score)              -- Convert to numbers

-- Add calculated columns
LET final = MUTATE(cleaned,
    "Grade" = "CASE_WHEN(Score >= 90, 'A', Score >= 80, 'B', 'C')",
    "Domain" = "SAPPLY(Email, FUNCTION(x) STRSPLIT(x, '@')[2])"
)
```

## Error Handling

```rexx
REQUIRE "r-data-manipulation"

-- Handle missing data
LET dataWithNA = DATA_FRAME("values" = [1, 2, NA, 4, 5])
LET cleanData = dataWithNA[!IS_NA(dataWithNA.values), ]

-- Validate operations
LET result = TRY({
    SUBSET(employees, "invalid_column > 0")
}, ERROR = {
    SAY "Column not found, using default filter"
    SUBSET(employees, "salary > 0")
})

-- Safe string operations
LET text = NULL
LET safeLength = IF(IS_NULL(text), 0, NCHAR(text))
```

## Performance Tips

- Use vectorized operations when possible
- Filter data early in processing pipelines
- Use appropriate data types for columns
- Consider memory usage with large datasets
- Cache frequently used transformations

## Integration

This library integrates with:
- RexxJS core interpreter
- Other R function libraries (math-stats, advanced-analytics)
- Standard REXX variable and array systems
- REXX error handling and control flow

## Testing

Run the comprehensive test suite:

```bash
npm test
```

Tests cover:
- DataFrame creation, manipulation, and querying
- String processing and pattern matching
- Set operations and mathematical operations
- Complex data transformation pipelines
- Error conditions and edge cases
- Integration with REXX interpreter

Part of the RexxJS extras collection.