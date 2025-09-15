# R Data Types Functions

This library provides R-style data type functions for RexxJS, including comprehensive datetime/temporal operations and factor (categorical data) manipulation functions.

## Quick Start

```rexx
REQUIRE "r-data-types"
LET currentTime = NOW()
LET formatted = FORMAT(currentTime, "%Y-%m-%d %H:%M:%S")
LET categories = FACTOR(["small", "medium", "large", "small"], levels=["small", "medium", "large"])
SAY "Current time:" formatted
SAY "Factor levels:" LEVELS(categories)
```

## Installation

```bash
npm install
npm test
```

## Function Categories

### DateTime Operations

#### Date Creation and Parsing
- **NOW()** - Current date and time
- **TODAY()** - Current date (no time)
- **AS_DATE(x)** - Convert to Date object
- **AS_POSIXCT(x)** - Convert to datetime with timezone
- **STRPTIME(x, format)** - Parse string to datetime
- **ISOdate(year, month, day)** - Create date from components
- **ISOdatetime(year, month, day, hour, min, sec)** - Create datetime

#### Date Formatting and Display
- **FORMAT(x, format)** - Format date/time as string
- **STRFTIME(x, format)** - Alternative formatting function
- **WEEKDAYS(x)** - Get weekday names
- **MONTHS(x)** - Get month names
- **QUARTERS(x)** - Get quarter names

#### Date Arithmetic and Sequences
- **DIFFTIME(time1, time2, units)** - Time difference
- **SEQ_DATE(from, to, by)** - Generate date sequence
- **SEQ_POSIXCT(from, to, by)** - Generate datetime sequence
- **ROUND_DATE(x, unit)** - Round to time unit
- **TRUNC_DATE(x, unit)** - Truncate to time unit

#### Date Components and Properties
- **YEAR(x)** - Extract year
- **MONTH(x)** - Extract month
- **MDAY(x)** - Extract day of month
- **WDAY(x)** - Extract day of week
- **YDAY(x)** - Extract day of year
- **HOUR(x)** - Extract hour
- **MINUTE(x)** - Extract minute
- **SECOND(x)** - Extract second

#### Timezone Operations
- **TZ(x)** - Get timezone
- **WITH_TZ(x, tzone)** - Change timezone (same instant)
- **FORCE_TZ(x, tzone)** - Force timezone (change instant)
- **OlsonNames()** - Available timezone names

#### Date Testing and Validation
- **IS_DATE(x)** - Test if date object
- **IS_POSIXCT(x)** - Test if datetime object
- **IS_FINITE_DATE(x)** - Test if finite date
- **LEAP_YEAR(year)** - Test if leap year
- **DAYS_IN_MONTH(date)** - Days in month for date

### Factor Operations

#### Factor Creation and Structure
- **FACTOR(x, levels, labels)** - Create factor from data
- **ORDERED(x, levels)** - Create ordered factor
- **AS_FACTOR(x)** - Convert to factor
- **AS_CHARACTER(x)** - Convert factor to character
- **AS_NUMERIC(x)** - Convert factor to numeric codes

#### Factor Properties
- **LEVELS(x)** - Get factor levels
- **NLEVELS(x)** - Number of levels
- **IS_FACTOR(x)** - Test if factor
- **IS_ORDERED(x)** - Test if ordered factor
- **TABLE(x)** - Frequency table

#### Factor Manipulation
- **DROPLEVELS(x)** - Remove unused levels
- **ADDNA(x, ifany)** - Add NA as level
- **RELEVEL(x, ref)** - Change reference level
- **REORDER(x, X, FUN)** - Reorder levels by statistic

#### Factor Transformation
- **CUT(x, breaks, labels)** - Convert numeric to factor
- **FINDINTERVAL(x, vec)** - Find interval indices
- **INTERACTION(...)** - Create interaction factors
- **GL(n, k, length, labels)** - Generate factor levels

#### Factor Comparison and Analysis
- **DUPLICATED_LEVELS(x)** - Find duplicate levels
- **MATCH_LEVELS(x, table)** - Match against level table
- **CONTRASTS(x)** - Get contrast matrix
- **C(x, contr, how.many)** - Set contrasts

## Usage Examples

### Basic DateTime Operations

```rexx
REQUIRE "r-data-types"

-- Current time and date
LET now = NOW()
LET today = TODAY()
SAY "Current datetime:" FORMAT(now, "%Y-%m-%d %H:%M:%S")
SAY "Today's date:" FORMAT(today, "%Y-%m-%d")

-- Create specific dates
LET birthday = ISOdate(1990, 5, 15)
LET meeting = ISOdatetime(2024, 12, 25, 14, 30, 0)

-- Extract components
SAY "Birth year:" YEAR(birthday)
SAY "Meeting month:" MONTH(meeting)
SAY "Meeting weekday:" WEEKDAYS(meeting)

-- Calculate age
LET age = DIFFTIME(now, birthday, units="days") / 365.25
SAY "Age in years:" ROUND(age, 1)
```

### Date Sequences and Ranges

```rexx
REQUIRE "r-data-types"

-- Generate date sequences
LET startDate = AS_DATE("2024-01-01")
LET endDate = AS_DATE("2024-12-31")
LET monthlyDates = SEQ_DATE(startDate, endDate, by="month")
SAY "Monthly dates:" LENGTH(monthlyDates)

-- Business days (exclude weekends)
LET allDays = SEQ_DATE(startDate, endDate, by="day")
LET businessDays = allDays[WDAY(allDays) NOT IN c(1, 7)]  -- Exclude Sunday(1), Saturday(7)
SAY "Business days in 2024:" LENGTH(businessDays)

-- Quarterly reporting dates
LET quarters = SEQ_DATE(startDate, endDate, by="quarter")
LET quarterEnds = quarters + DAYS_IN_MONTH(quarters) - 1  -- Last day of quarter
```

### Date Formatting and Parsing

```rexx
REQUIRE "r-data-types"

-- Various format examples
LET date = AS_DATE("2024-03-15")
SAY "ISO format:" FORMAT(date, "%Y-%m-%d")
SAY "US format:" FORMAT(date, "%m/%d/%Y")
SAY "European format:" FORMAT(date, "%d.%m.%Y")
SAY "Long format:" FORMAT(date, "%B %d, %Y")
SAY "Abbreviated:" FORMAT(date, "%b %d, '%y")

-- Parse different formats
LET dates = c("2024-03-15", "03/15/2024", "Mar 15, 2024")
LET parsed1 = STRPTIME(dates[1], "%Y-%m-%d")
LET parsed2 = STRPTIME(dates[2], "%m/%d/%Y")
LET parsed3 = STRPTIME(dates[3], "%b %d, %Y")

-- Handle different locales
LET germanDate = STRPTIME("15. März 2024", "%d. %B %Y")
```

### Timezone Operations

```rexx
REQUIRE "r-data-types"

-- Create datetime with timezone
LET utcTime = AS_POSIXCT("2024-03-15 12:00:00", tz="UTC")
LET nyTime = WITH_TZ(utcTime, "America/New_York")
LET tokyoTime = WITH_TZ(utcTime, "Asia/Tokyo")

SAY "UTC time:" FORMAT(utcTime, "%Y-%m-%d %H:%M:%S %Z")
SAY "NY time:" FORMAT(nyTime, "%Y-%m-%d %H:%M:%S %Z")
SAY "Tokyo time:" FORMAT(tokyoTime, "%Y-%m-%d %H:%M:%S %Z")

-- List available timezones
LET allTZ = OlsonNames()
LET usTZ = allTZ[GREPL("^America/", allTZ)]
SAY "US timezones:" LENGTH(usTZ)
```

### Basic Factor Operations

```rexx
REQUIRE "r-data-types"

-- Create factors
LET sizes = c("small", "large", "medium", "small", "medium", "large")
LET sizeFactors = FACTOR(sizes, levels=c("small", "medium", "large"))
SAY "Factor levels:" LEVELS(sizeFactors)
SAY "Number of levels:" NLEVELS(sizeFactors)

-- Create ordered factor
LET ratings = c("poor", "good", "excellent", "fair", "good")
LET ratingFactors = ORDERED(ratings, levels=c("poor", "fair", "good", "excellent"))

-- Frequency table
LET sizeTable = TABLE(sizeFactors)
SAY "Size frequency:" sizeTable
```

### Factor Manipulation and Analysis

```rexx
REQUIRE "r-data-types"

-- Convert numeric to factor
LET scores = c(85, 92, 78, 88, 95, 73, 89)
LET grades = CUT(scores, breaks=c(0, 70, 80, 90, 100), 
                 labels=c("F", "C", "B", "A"))
SAY "Grade distribution:" TABLE(grades)

-- Work with unused levels
LET colors = FACTOR(c("red", "blue", "red"), levels=c("red", "blue", "green"))
SAY "Before dropping:" LEVELS(colors)
LET colorsDropped = DROPLEVELS(colors)
SAY "After dropping:" LEVELS(colorsDropped)

-- Reorder factor by statistic
LET groups = FACTOR(c("A", "B", "C", "A", "B", "C"))
LET values = c(10, 25, 15, 12, 28, 18)
LET groupData = DATA_FRAME("group"=groups, "value"=values)
LET reordered = REORDER(groups, values, MEAN)
```

### Advanced DateTime Analysis

```rexx
REQUIRE "r-data-types"

-- Time series analysis with dates
LET dates = SEQ_DATE(AS_DATE("2023-01-01"), AS_DATE("2023-12-31"), by="day")
LET sales = RNORM(LENGTH(dates), 1000, 200)  -- Random sales data

-- Group by month
LET months = FORMAT(dates, "%Y-%m")
LET monthlySales = TAPPLY(sales, months, SUM)
SAY "Monthly total sales:" LENGTH(monthlySales)

-- Find weekend vs weekday patterns
LET weekdays = WDAY(dates)
LET weekendSales = MEAN(sales[weekdays IN c(1, 7)])  -- Sunday, Saturday
LET weekdaySales = MEAN(sales[!(weekdays IN c(1, 7))])
SAY "Weekend avg:" ROUND(weekendSales, 2)
SAY "Weekday avg:" ROUND(weekdaySales, 2)

-- Seasonal analysis
LET seasons = CUT(MONTH(dates), breaks=c(0, 3, 6, 9, 12), 
                  labels=c("Winter", "Spring", "Summer", "Fall"))
LET seasonalSales = TAPPLY(sales, seasons, MEAN)
```

### Working with Business Calendar

```rexx
REQUIRE "r-data-types"

-- Define holidays
LET holidays = c(
    AS_DATE("2024-01-01"),  -- New Year
    AS_DATE("2024-07-04"),  -- Independence Day
    AS_DATE("2024-12-25")   -- Christmas
)

-- Generate business calendar
LET year2024 = SEQ_DATE(AS_DATE("2024-01-01"), AS_DATE("2024-12-31"), by="day")
LET weekdays = year2024[!(WDAY(year2024) IN c(1, 7))]  -- Remove weekends
LET businessDays = weekdays[!(weekdays IN holidays)]   -- Remove holidays

SAY "Total business days 2024:" LENGTH(businessDays)

-- Calculate working days between dates
FUNCTION workingDaysBetween(start, end) {
    LET allDays = SEQ_DATE(start, end, by="day")
    LET workDays = allDays[!(WDAY(allDays) IN c(1, 7))]
    LET workDaysNoHolidays = workDays[!(workDays IN holidays)]
    RETURN LENGTH(workDaysNoHolidays)
}

LET projectStart = AS_DATE("2024-06-01")
LET projectEnd = AS_DATE("2024-08-15")
LET workingDays = workingDaysBetween(projectStart, projectEnd)
SAY "Working days for project:" workingDays
```

### Categorical Data Analysis

```rexx
REQUIRE "r-data-types"

-- Survey response analysis
LET responses = c("Agree", "Disagree", "Neutral", "Agree", "Strongly Agree", 
                  "Disagree", "Agree", "Neutral", "Strongly Disagree", "Agree")
LET likert = ORDERED(responses, levels=c(
    "Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"
))

-- Create response table
LET responseTable = TABLE(likert)
LET proportions = responseTable / SUM(responseTable)
SAY "Response proportions:"
FOR (i IN 1:LENGTH(proportions)) {
    SAY NAMES(proportions)[i] ":" ROUND(proportions[i] * 100, 1) "%"
}

-- Cross-tabulation with another factor
LET gender = FACTOR(c("M", "F", "F", "M", "F", "M", "F", "M", "F", "M"))
LET crossTab = TABLE(gender, likert)
SAY "Cross-tabulation:"
PRINT(crossTab)
```

## Error Handling

```rexx
REQUIRE "r-data-types"

-- Handle invalid dates
LET safeParse = FUNCTION(dateString, format) {
    TRY({
        STRPTIME(dateString, format)
    }, ERROR = {
        SAY "Invalid date format:" dateString
        RETURN NA
    })
}

-- Validate date ranges
LET startDate = AS_DATE("2024-12-31")
LET endDate = AS_DATE("2024-01-01")
IF (startDate > endDate) {
    SAY "Warning: Start date is after end date"
    LET temp = startDate
    startDate = endDate
    endDate = temp
}

-- Handle timezone conversion errors
LET safeTimezone = FUNCTION(datetime, tz) {
    IF (tz NOT IN OlsonNames()) {
        SAY "Unknown timezone:" tz "Using UTC"
        tz = "UTC"
    }
    RETURN WITH_TZ(datetime, tz)
}
```

## Performance Tips

- Use vectorized date operations when possible
- Cache timezone conversions for repeated operations
- Pre-define factor levels to avoid automatic level creation
- Use appropriate date classes (Date vs POSIXct) based on precision needs
- Consider using numeric representations for high-frequency calculations

## Integration

This library integrates with:
- RexxJS core interpreter
- R math-stats functions for temporal statistics
- R data-manipulation for date-based filtering and grouping
- Standard REXX variable and array systems
- REXX error handling and control flow

## Testing

Run the comprehensive test suite:

```bash
npm test
```

Tests cover:
- Date creation, parsing, and formatting
- Date arithmetic and sequence generation
- Timezone operations and conversions
- Factor creation and manipulation
- Categorical data analysis
- Error conditions and edge cases
- Integration with REXX interpreter

Part of the RexxJS extras collection.