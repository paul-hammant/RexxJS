# Proposed RexxJS Language Improvements

Based on real-world usage and integration work with cloud services, here are proposed language features that would enhance RexxJS's capabilities and developer experience.

## 1. Native Environment Variable Functions

Currently missing built-in functions for environment variable management.

```rexx
-- Proposed syntax:
CALL SETENV "GOOGLE_APPLICATION_CREDENTIALS", keyFile
LET apiKey = GETENV("API_KEY")
IF HASENV("DEBUG") THEN SAY "Debug mode"

-- Would replace need for process.env manipulation in Node.js
```

## 2. Try-Catch Error Handling

Modern error handling would make RexxJS more robust for production use.

```rexx
TRY
  ADDRESS GCP
  "SHEETS SELECT * FROM 'Sheet1'"
CATCH error
  SAY "API Error: " error.message
  -- Graceful degradation
  CALL logError(error)
FINALLY
  CALL cleanup
END
```

## 4. Native JSON Manipulation

More intuitive JSON handling without string manipulation.

```rexx
-- Parse and stringify with formatting
LET config = JSON.PARSE(FILE_READ("config.json"))
config.sheets.retryLimit = 5
CALL FILE_WRITE "config.json", JSON.STRINGIFY(config, 2)

-- Deep path access
LET value = JSON.GET(data, "response.items[0].name")
CALL JSON.SET(data, "response.status", "complete")

-- JSON path queries
LET prices = JSON.QUERY(data, "$..items[?(@.price > 100)].price")
```

## 5. Better Type System/Validation

Optional type annotations for better error messages and IDE support.

```rexx
-- Function signatures with types
FUNCTION processSheet(sheetId: STRING, rowLimit: NUMBER = 100)
  ASSERT TYPE(sheetId) = "STRING", "Sheet ID must be a string"
  ASSERT rowLimit > 0, "Row limit must be positive"
  RETURN result: ARRAY
END

-- Variable type hints
LET count: NUMBER = 0
LET items: ARRAY<STRING> = []
```

## 6. Native Rate Limiting

Built-in rate limiting for ADDRESS and function calls.

```rexx
-- Rate limit ADDRESS calls
ADDRESS GCP WITH RATE_LIMIT(60, "per_minute")
DO i = 1 TO 100
  "SHEETS SELECT * FROM 'Sheet" || i || "'"
  -- Automatically throttled to 60 calls/minute
END

-- Rate limit function calls
FUNCTION apiCall() WITH RATE_LIMIT(10, "per_second")
  -- Implementation
END
```

## 7. Pattern Matching/Destructuring

Destructuring for cleaner code and pattern matching for control flow.

```rexx
-- Destructuring results
LET {title, sheets, rowCount} = ADDRESS GCP "SHEETS INFO"

-- Array destructuring
LET [first, second, ...rest] = getData()

-- Pattern matching
SELECT RESULT
  WHEN {success: TRUE, data: rows} THEN
    SAY "Got " || LENGTH(rows) || " rows"
  WHEN {error: message, code: 404} THEN
    SAY "Not found: " || message
  WHEN {error: message} THEN
    SAY "Error: " || message
  OTHERWISE
    SAY "Unexpected result"
END
```

## 8. Pipeline Operator

Chain operations more naturally for data processing.

```rexx
-- Data processing pipeline
LET result = FILE_READ("data.csv")
  |> CSV_PARSE()
  |> FILTER("row => row.amount > 100")
  |> MAP("row => row.total * 1.1")
  |> SORT_BY("total", "DESC")
  |> TAKE(10)

-- With ADDRESS integration
LET processed = ADDRESS GCP "SHEETS SELECT * FROM 'Raw'"
  |> FILTER("row => row.status == 'active'")
  |> ADDRESS GCP "SHEETS INSERT sheet='Processed'"
```

## 9. Native Module System

Better than REQUIRE for local modules with proper imports/exports.

```rexx
-- Import specific functions
MODULE IMPORT {SheetsHelper, validateData} FROM "./lib/sheets-utils.rexx"

-- Import everything
MODULE IMPORT * AS utils FROM "./utils.rexx"

-- Export from module
MODULE EXPORT FUNCTION processSpreadsheet(id)
  -- Implementation
END

MODULE EXPORT LET VERSION = "1.0.0"
```

## 10. Interpolated Strings

Template literals for cleaner string building.

```rexx
-- Basic interpolation
LET sheetId = "abc123"
LET range = "A1:Z100"
ADDRESS GCP `SHEETS SELECT * FROM '${sheetId}' RANGE '${range}'`

-- With expressions
SAY `Found ${RESULT.count} rows at ${TIME()}`

-- Multi-line with formatting
LET query = `
  SELECT * FROM orders
  WHERE customer_id = ${customerId}
    AND date >= '${startDate}'
    AND total > ${minAmount}
`
```

## 11. Native Credential Management

Built-in secure credential handling for cloud services.

```rexx
-- Store credentials securely
CREDENTIAL STORE "google-api" TYPE "service_account" FILE "key.json"
CREDENTIAL STORE "api-key" TYPE "bearer" TOKEN getenv("API_TOKEN")

-- Use credentials
ADDRESS GCP WITH CREDENTIAL "google-api"
"SHEETS SELECT * FROM 'Data'"

-- Credential rotation
CREDENTIAL ROTATE "api-key" WITH FUNCTION refreshToken
```

## 12. Better HEREDOC with Variables

Enhanced HEREDOC syntax supporting interpolation.

```rexx
-- Current HEREDOC is static, proposed enhancement:
LET date = DATE()
LET status = "pending"
LET workflow = <<SQL WITH INTERPOLATION
  SELECT * FROM orders
  WHERE date = '${date}'
  AND status = '${status}'
  ORDER BY total DESC
SQL

-- With conditional sections
LET query = <<QUERY WITH INTERPOLATION
  SELECT * FROM users
  ${IF filterActive THEN "WHERE status = 'active'" END}
  ${IF sortBy THEN "ORDER BY ${sortBy}" END}
QUERY
```

## 13. Native HTTP Client

Built-in HTTP client without needing ADDRESS.

```rexx
-- Simple requests
LET response = HTTP.GET("https://api.example.com/data")
LET result = HTTP.POST("https://api.example.com/users", {
  headers: {"Content-Type": "application/json"},
  body: userData
})

-- With configuration
HTTP.CONFIG({
  baseURL: "https://api.example.com",
  timeout: 5000,
  retry: 3
})
```

## 14. Debugger Integration

Built-in debugging capabilities.

```rexx
-- Breakpoint
BREAKPOINT

-- Conditional breakpoint
BREAKPOINT IF user.role == "admin"

-- Debug output
DEBUG "User data:", userData

-- Trace execution
TRACE ON
-- Code to trace
TRACE OFF
```

## 15. Native Test Framework

Built-in testing without external dependencies.

```rexx
TEST "Sheet operations" DO
  SETUP DO
    LET testSheet = createTestSheet()
  END

  TEST "should read data" DO
    LET result = readSheet(testSheet)
    ASSERT result.count > 0
  END

  TEST "should handle errors" DO
    ASSERT THROWS readSheet("invalid"), "Invalid sheet ID"
  END

  TEARDOWN DO
    deleteTestSheet(testSheet)
  END
END
```

## Implementation Priority

### High Priority (Most Impact)
1. Native Environment Variable Functions
2. Try-Catch Error Handling
3. Native JSON Manipulation
4. Interpolated Strings

### Medium Priority (Quality of Life)
5. Async/Await Pattern
6. Pattern Matching/Destructuring
7. Pipeline Operator
8. Better HEREDOC with Variables

### Lower Priority (Nice to Have)
9. Native Module System
10. Type System/Validation
11. Native Rate Limiting
12. Native Credential Management
13. Native HTTP Client
14. Debugger Integration
15. Native Test Framework

## Benefits

These improvements would:
- **Reduce boilerplate** in common operations
- **Improve error handling** and debugging
- **Enhance readability** with modern syntax
- **Better integrate** with cloud services and APIs
- **Increase type safety** without losing flexibility
- **Streamline testing** and development workflow

## Backwards Compatibility

All proposed features should be additive, maintaining full backwards compatibility with existing RexxJS scripts. New syntax would be optional enhancements rather than breaking changes.

## Summary

These proposed improvements would position RexxJS as a more powerful and modern scripting language while maintaining its classic REXX heritage and simplicity. The focus is on practical features that solve real-world problems encountered when building integrations, automating cloud services, and processing data.