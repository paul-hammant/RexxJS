#!/usr/bin/env ../../../core/rexxt

// SQLite3 Multiline Showcase - Elegant ADDRESS HEREDOC Patterns
// Copyright (c) 2025 Paul Hammant

REQUIRE "../../../core/src/expectations-address.js"
REQUIRE "./sqlite-address.js"

SAY "🗄️ SQLite3 Multiline ADDRESS HEREDOC Showcase"

// Showcase 1: Complex table with constraints
ADDRESS sqlite3
<<CREATE_TABLE
CREATE TABLE employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  salary REAL CHECK(salary > 0),
  hire_date TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE_TABLE

ADDRESS EXPECTATIONS
"{RESULT.success} should equal true"
"{RESULT.operation} should equal 'CREATE_TABLE'"

SAY "✓ Complex table created"

// Showcase 2: Batch insert with multiline VALUES
ADDRESS sqlite3
<<INSERT_VALUES
INSERT INTO employees (name, department, salary) VALUES
  ('Alice Johnson', 'Engineering', 75000),
  ('Bob Smith', 'Sales', 55000),
  ('Carol Davis', 'Engineering', 80000),
  ('David Wilson', 'Marketing', 50000);
INSERT_VALUES

SAY "✓ Batch insert: " || RESULT.rowsAffected || " employees added"

// Showcase 3: Complex query with aggregation
ADDRESS sqlite3
<<AGGREGATE_QUERY
SELECT
  department,
  COUNT(*) as employee_count,
  AVG(salary) as avg_salary,
  MAX(salary) as max_salary
FROM employees
GROUP BY department
ORDER BY avg_salary DESC;
AGGREGATE_QUERY

SAY "✓ Aggregation query executed"
SAY "📊 Department analysis complete - " || RESULT.count || " departments"

// Showcase 4: Elegant results iteration
DO dept OVER RESULT.rows
  SAY "  🏢 " || dept.department || ":"
  SAY "    👥 Employees: " || dept.employee_count
  SAY "    💰 Avg Salary: $" || dept.avg_salary
  SAY "    🔝 Max Salary: $" || dept.max_salary
  SAY ""
END

// Showcase 5: Conditional query with complex WHERE
ADDRESS sqlite3
<<WHERE_QUERY
SELECT name, department, salary
FROM employees
WHERE salary > 60000
  AND department IN ('Engineering', 'Sales')
ORDER BY salary DESC;
WHERE_QUERY

SAY "✓ High earners query: " || RESULT.count || " results"

DO emp OVER RESULT.rows
  SAY "  💼 " || emp.name || " (" || emp.department || ") - $" || emp.salary
END

SAY "🎯 Multiline ADDRESS HEREDOC showcase complete!"
SAY "✨ Elegant, readable, powerful SQL with RexxJS!"
