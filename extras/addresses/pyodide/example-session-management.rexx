#!/usr/bin/env rexx
// Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License

/* Example: Pyodide Session Management in RexxJS
 * This script demonstrates how to manage multiple Python sessions
 * within a single Rexx script, providing complete variable isolation.
 */

REQUIRE "./src/pyodide-address.js"

SAY "=== Pyodide Session Management Demo ==="
SAY ""

// Session 1: Data Science Setup
SAY "📊 Starting Data Science Session..."
ADDRESS PYODIDE
"load_package numpy"
"import numpy as np"
"data_array = np.array([1, 2, 3, 4, 5])"
"mean_value = np.mean(data_array)"
"session_type = 'data_science'"

LET ds_result = run code="f'Data Science: mean of {data_array.tolist()} = {mean_value}'"
SAY "Result:" ds_result.result

LET session1_vars = list_variables()
SAY "Variables in session 1:" session1_vars.result.totalVariables

// Close session 1 and start session 2
SAY ""
SAY "🔄 Closing Data Science session and starting Web Scraping session..."
close_session()
new_session()

// Session 2: Web/Text Processing Setup  
"import re"
"text_data = 'Hello World! Visit https://example.com for more info.'"
"url_pattern = r'https?://[^\s]+'"
"urls = re.findall(url_pattern, text_data)"
"session_type = 'web_scraping'"

LET web_result = run code="f'Web Scraping: found {len(urls)} URLs: {urls}'"
SAY "Result:" web_result.result

// Try to access data_array from session 1 (should fail)
LET isolation_test = run code="'data_array' in globals()"
SAY "Can access data_array from previous session:" isolation_test.result

LET session2_vars = session_info()
SAY "Variables in session 2:" session2_vars.result.totalVariables

// Start session 3 while keeping session 2's context
SAY ""
SAY "🎯 Starting Machine Learning session (new isolated context)..."
reset_session()

"load_package numpy"  
"import numpy as np"
"# Training data for simple linear model"
"X = np.array([[1], [2], [3], [4], [5]])"
"y = np.array([2, 4, 6, 8, 10])"
"# Simple linear regression (y = 2x)"
"slope = np.sum((X.flatten() - np.mean(X)) * (y - np.mean(y))) / np.sum((X.flatten() - np.mean(X))**2)"
"session_type = 'machine_learning'"

LET ml_result = run code="f'ML Session: learned slope = {slope:.2f} (expected: 2.0)'"
SAY "Result:" ml_result.result

// Show that each session was truly isolated
LET final_vars = list_variables()
SAY "Variables in final session:" final_vars.result.totalVariables

SAY ""
SAY "✅ Session management demo completed!"
SAY "Each session had completely isolated variables while maintaining"
SAY "persistent state within each session until explicitly closed."