# R Mathematical and Statistical Functions

This library provides R-style mathematical, statistical, and logical functions for RexxJS, enabling advanced mathematical computations and statistical analysis within REXX scripts.

## Quick Start

```rexx
REQUIRE "r-math-stats"
LET numbers = [1, 2, 3, 4, 5]
LET average = MEAN(numbers)
LET standardDev = SD(numbers)
SAY "Mean:" average "SD:" standardDev
```

## Installation

```bash
npm install
npm test
```

## Function Categories

### Mathematical Functions

#### Basic Math
- **ABS(x)** - Absolute value
- **SQRT(x)** - Square root
- **EXP(x)** - Exponential (e^x)
- **LOG(x)** - Natural logarithm
- **LOG10(x)** - Base-10 logarithm

#### Trigonometric Functions
- **SIN(x)**, **COS(x)**, **TAN(x)** - Basic trigonometric functions
- **ASIN(x)**, **ACOS(x)**, **ATAN(x)** - Inverse trigonometric functions

#### Power and Root Functions
- **POW(x, y)** - x raised to power y
- **CEILING(x)** - Round up to nearest integer
- **FLOOR(x)** - Round down to nearest integer
- **ROUND(x, digits)** - Round to specified decimal places

#### Special Functions
- **FACTORIAL(n)** - Factorial of n
- **GAMMA(x)** - Gamma function
- **BETA(a, b)** - Beta function

### Statistical Functions

#### Central Tendency
- **MEAN(x)** - Arithmetic mean
- **MEDIAN(x)** - Middle value
- **MODE(x)** - Most frequent value

#### Variability
- **VAR(x)** - Variance
- **SD(x)** - Standard deviation
- **IQR(x)** - Interquartile range
- **RANGE(x)** - Min to max range

#### Distribution Functions
- **QUANTILE(x, probs)** - Sample quantiles
- **SUMMARY(x)** - Five-number summary
- **FIVENUM(x)** - Min, Q1, median, Q3, max

#### Aggregation Functions
- **SUM(x)** - Sum of values
- **PROD(x)** - Product of values
- **MIN(x)** - Minimum value
- **MAX(x)** - Maximum value
- **LENGTH(x)** - Number of elements

### Logical Functions

#### Comparison
- **ALL(x)** - Test if all elements are TRUE
- **ANY(x)** - Test if any element is TRUE
- **WHICH(x)** - Return indices of TRUE elements
- **WHICH_MAX(x)** - Index of maximum value
- **WHICH_MIN(x)** - Index of minimum value

#### Set Operations
- **UNIQUE(x)** - Remove duplicate elements
- **DUPLICATED(x)** - Identify duplicate elements
- **IS_NA(x)** - Test for missing values
- **COMPLETE_CASES(x)** - Identify complete cases

## Usage Examples

### Basic Statistics

```rexx
REQUIRE "r-math-stats"

-- Sample data
LET scores = [85, 92, 78, 96, 88, 75, 89, 91]

-- Central tendency
LET meanScore = MEAN(scores)
LET medianScore = MEDIAN(scores)
SAY "Mean score:" meanScore
SAY "Median score:" medianScore

-- Variability
LET variance = VAR(scores)
LET stdDev = SD(scores)
SAY "Variance:" variance
SAY "Standard deviation:" stdDev
```

### Mathematical Computations

```rexx
REQUIRE "r-math-stats"

-- Trigonometric calculations
LET angle = 3.14159 / 4  -- 45 degrees in radians
LET sine = SIN(angle)
LET cosine = COS(angle)
SAY "sin(45°):" sine
SAY "cos(45°):" cosine

-- Exponential and logarithmic
LET eValue = EXP(1)      -- e^1
LET logValue = LOG(10)   -- ln(10)
SAY "e:" eValue
SAY "ln(10):" logValue
```

### Logical Operations

```rexx
REQUIRE "r-math-stats"

-- Boolean testing
LET values = [1, 0, 1, 1, 0]
LET allTrue = ALL(values)
LET anyTrue = ANY(values) 
SAY "All true:" allTrue
SAY "Any true:" anyTrue

-- Finding elements
LET data = [10, 5, 8, 12, 3]
LET maxIndex = WHICH_MAX(data)
LET minIndex = WHICH_MIN(data)
SAY "Max at position:" maxIndex
SAY "Min at position:" minIndex
```

### Statistical Analysis

```rexx
REQUIRE "r-math-stats"

-- Dataset analysis
LET dataset = [23, 45, 67, 34, 56, 78, 23, 45, 67, 89]

-- Summary statistics
LET summary = SUMMARY(dataset)
SAY "Five-number summary:"
SAY "Min:" summary[1] "Q1:" summary[2] "Median:" summary[3] "Q3:" summary[4] "Max:" summary[5]

-- Identify unique values
LET uniqueVals = UNIQUE(dataset)
SAY "Unique values:" uniqueVals.length

-- Check for duplicates
LET hasDuplicates = ANY(DUPLICATED(dataset))
SAY "Has duplicates:" hasDuplicates
```

## Advanced Features

### Quantile Calculations

```rexx
REQUIRE "r-math-stats"

LET data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

-- Calculate quartiles
LET quartiles = QUANTILE(data, [0.25, 0.5, 0.75])
SAY "Q1:" quartiles[1]
SAY "Q2 (median):" quartiles[2] 
SAY "Q3:" quartiles[3]

-- Calculate percentiles
LET percentiles = QUANTILE(data, [0.1, 0.9])
SAY "10th percentile:" percentiles[1]
SAY "90th percentile:" percentiles[2]
```

### Special Mathematical Functions

```rexx
REQUIRE "r-math-stats"

-- Factorial calculations
LET fact5 = FACTORIAL(5)
SAY "5! =" fact5

-- Gamma function
LET gamma = GAMMA(5.5)
SAY "Γ(5.5) =" gamma

-- Beta function
LET beta = BETA(2, 3)
SAY "B(2,3) =" beta
```

## Error Handling

```rexx
REQUIRE "r-math-stats"

-- Handle empty arrays
LET empty = []
IF LENGTH(empty) = 0 THEN
    SAY "Cannot compute mean of empty array"
ELSE
    LET mean = MEAN(empty)
ENDIF

-- Handle invalid operations
LET negative = -4
IF negative < 0 THEN
    SAY "Cannot compute square root of negative number"
ELSE
    LET sqrt = SQRT(negative)
ENDIF
```

## Data Types Supported

- **Arrays** - Primary data structure for multi-value operations
- **Numbers** - Integer and floating-point values
- **Booleans** - TRUE/FALSE values for logical operations
- **Missing Values** - Handled appropriately in statistical calculations

## Performance Notes

- Functions are optimized for typical statistical datasets
- Memory usage is proportional to data size
- Complex operations (e.g., sorting for median) have appropriate complexity
- Suitable for datasets up to several thousand elements

## Integration

This library integrates with:
- RexxJS core interpreter
- Other R function libraries in the extras collection
- Standard REXX variable and array systems
- REXX error handling patterns

## Testing

Run the comprehensive test suite:

```bash
npm test
```

Tests cover:
- All mathematical functions with edge cases
- Statistical calculations with various data distributions  
- Logical operations and set functions
- Error conditions and boundary cases
- Integration with REXX interpreter

Part of the RexxJS extras collection.