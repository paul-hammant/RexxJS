-- Calculator Automation Script using INTERPRET_JS
-- This demonstrates Rexx calling JavaScript functions directly via INTERPRET_JS
-- As if an LLM had processed introspection results and created this automation
-- 
-- Copyright (c) 2025 Paul Hammant
-- Licensed under the MIT License

SAY "Starting calculator automation with INTERPRET_JS..."
CHECKPOINT("demo_start", "Calculator automation with INTERPRET_JS started")

-- Read initial display
LET initial_display = INTERPRET_JS("document.getElementById('box').textContent")
SAY "Initial display: '" || initial_display || "'"

-- Test case 1: Simple addition (5 + 3 = 8)
SAY "=== Test Case 1: 5 + 3 ==="

-- Clear calculator first
SAY "Clearing calculator..."
INTERPRET_JS("button_clear()")
LET after_clear = INTERPRET_JS("document.getElementById('box').textContent")
SAY "After clear: '" || after_clear || "'"
CHECKPOINT("cleared", "Calculator cleared, display: " || after_clear)

-- Enter 5
SAY "Pressing 5..."
INTERPRET_JS("button_number(5)")
LET after_5 = INTERPRET_JS("document.getElementById('box').textContent")
SAY "After pressing 5: '" || after_5 || "'"

-- Press + operator
SAY "Pressing +..."
INTERPRET_JS("button_number('+')")
LET after_plus = INTERPRET_JS("document.getElementById('box').textContent")
SAY "After pressing +: '" || after_plus || "'"

-- Enter 3
SAY "Pressing 3..."
INTERPRET_JS("button_number(3)")
LET after_3 = INTERPRET_JS("document.getElementById('box').textContent")
SAY "After pressing 3: '" || after_3 || "'"

-- Press equals
SAY "Pressing =..."
INTERPRET_JS("button_number('=')")
LET result1 = INTERPRET_JS("document.getElementById('box').textContent")
SAY "Final result: '" || result1 || "'"

LET test1_result = "Test 1: 5 + 3 = " || result1
CHECKPOINT("test1_complete", test1_result)

-- Test case 2: Multiplication (7 * 6)
SAY "=== Test Case 2: 7 * 6 ==="

INTERPRET_JS("button_clear()")
LET clear_2 = INTERPRET_JS("document.getElementById('box').textContent")
SAY "Cleared for test 2: '" || clear_2 || "'"

INTERPRET_JS("button_number(7)")
INTERPRET_JS("button_number('*')")
INTERPRET_JS("button_number(6)")
INTERPRET_JS("button_number('=')")

LET result2 = INTERPRET_JS("document.getElementById('box').textContent")
SAY "Test 2 result: '" || result2 || "'"

LET test2_result = "Test 2: 7 * 6 = " || result2
CHECKPOINT("test2_complete", test2_result)

-- Test case 3: Decimal calculation (2.5 + 1.5)
SAY "=== Test Case 3: 2.5 + 1.5 ==="

INTERPRET_JS("button_clear()")
INTERPRET_JS("button_number(2)")
INTERPRET_JS("button_number('.')")
INTERPRET_JS("button_number(5)")
INTERPRET_JS("button_number('+')")
INTERPRET_JS("button_number(1)")
INTERPRET_JS("button_number('.')")
INTERPRET_JS("button_number(5)")
INTERPRET_JS("button_number('=')")

LET result3 = INTERPRET_JS("document.getElementById('box').textContent")
SAY "Test 3 result: '" || result3 || "'"

LET test3_result = "Test 3: 2.5 + 1.5 = " || result3
CHECKPOINT("test3_complete", test3_result)

-- Test advanced functions
SAY "=== Test Case 4: Advanced functions ==="

INTERPRET_JS("button_clear()")
INTERPRET_JS("button_number(1)")
INTERPRET_JS("button_number(0)")
INTERPRET_JS("button_number(0)")

-- Try percentage function (learned from introspection)
INTERPRET_JS("calculate_percentage()")
LET result4 = INTERPRET_JS("document.getElementById('box').textContent")
SAY "100% calculation: '" || result4 || "'"

LET test4_result = "Test 4: 100% = " || result4  
CHECKPOINT("test4_complete", test4_result)

SAY "=== CALCULATOR AUTOMATION COMPLETE ==="
SAY "Successfully demonstrated Rexx → JavaScript function calls using INTERPRET_JS"

LET final_display = INTERPRET_JS("document.getElementById('box').textContent")
LET summary = "Automation complete. All tests passed. Final display: " || final_display
CHECKPOINT("automation_complete", summary)