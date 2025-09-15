# Excel Functions for RexxJS

A comprehensive Excel/spreadsheet functions library for the RexxJS REXX interpreter.

## Installation

This library is designed to be used as part of the RexxJS ecosystem. It can be imported directly or used as an external function library.

## Functions

### Lookup Functions
- `VLOOKUP(lookupValue, tableArray, colIndex, exactMatch)` - Vertical lookup in a table
- `HLOOKUP(lookupValue, tableArray, rowIndex, exactMatch)` - Horizontal lookup in a table  
- `INDEX(array, row, col)` - Returns value at specified row/column
- `MATCH(lookupValue, array, matchType)` - Finds position of value in array

### Mathematical Functions
- `SUM(range)` - Sum of values
- `AVERAGE(range)` - Average of values
- `COUNT(range)` - Count of numeric values
- `COUNTA(range)` - Count of non-empty values
- `MAX(range)` - Maximum value
- `MIN(range)` - Minimum value

### Text Functions
- `CONCATENATE(...args)` - Joins text strings
- `TRIM(text)` - Removes extra spaces
- `UPPER(text)` - Converts to uppercase
- `LOWER(text)` - Converts to lowercase
- `PROPER(text)` - Proper case conversion
- `LEN(text)` - Text length

### Date Functions
- `TODAY()` - Current date
- `NOW()` - Current date and time
- `YEAR(date)` - Extract year
- `MONTH(date)` - Extract month
- `DAY(date)` - Extract day
- `WEEKDAY(date)` - Day of week

### Logical Functions
- `IF(condition, trueValue, falseValue)` - Conditional logic
- `AND(...conditions)` - Logical AND
- `OR(...conditions)` - Logical OR
- `NOT(condition)` - Logical NOT

## Usage in REXX

```rexx
/* Load the Excel functions library */
ADDRESS SYSTEM
"LOAD_FUNCTIONS excel-functions"

/* Use Excel functions */
data = '[[\"Apple\",10,2.5],[\"Banana\",15,1.8],[\"Cherry\",5,3.2]]'
price = VLOOKUP("Banana", data, 3, "true")
SAY "Banana price:" price

/* Mathematical operations */
numbers = "[10,20,30,40,50]"
total = SUM(numbers)
avg = AVERAGE(numbers)
SAY "Total:" total "Average:" avg

/* Text operations */
result = CONCATENATE("Hello", " ", "World")
SAY UPPER(result)
```

## Testing

Run the test suite:

```bash
npm test
```

Run with coverage:

```bash
npm run test:coverage
```

## License

MIT License - see LICENSE file for details.