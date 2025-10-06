-- Test DO...OVER functionality with arrays
-- This test replicates the DO...OVER issues seen in web tests

-- Test 1: Simple array iteration
SAY "Test 1: Simple array iteration"
LET fruits = ["apple", "banana", "orange", "grape", "kiwi"]
SAY "Created array with " || ARRAY_LENGTH(fruits) || " items"

-- First test the index-based approach (should work)
SAY ""
SAY "Index-based iteration:"
DO i = 1 TO ARRAY_LENGTH(fruits)
    LET fruit = ARRAY_GET(fruits, i)
    SAY "  Item " || i || ": " || fruit
END

-- Now test DO...OVER (this might fail)
SAY ""
SAY "DO...OVER iteration:"
DO fruit OVER fruits
    SAY "  Processing: " || fruit
END
SAY "DO...OVER completed"

-- Test 2: Nested DO...OVER
SAY ""
SAY "Test 2: Nested arrays with DO...OVER"
LET categories = [["red", "green", "blue"], ["cat", "dog", "bird"], ["one", "two", "three"]]

DO category OVER categories
    SAY "Category:"
    DO item OVER category
        SAY "  - " || item
    END
END

-- Test 3: Empty array
SAY ""
SAY "Test 3: Empty array"
LET empty = []
SAY "Processing empty array with DO...OVER:"
DO item OVER empty
    SAY "Should not print this: " || item
END
SAY "Empty array processed"

-- Test 4: Single item array
SAY ""
SAY "Test 4: Single item array"
LET single = ["lonely"]
DO item OVER single
    SAY "Single item: " || item
END

-- Test 5: Mixed types in array
SAY ""
SAY "Test 5: Mixed types in array"
LET mixed = [1, "two", 3.14, true, false]
DO item OVER mixed
    SAY "Mixed item: " || item || " (type: " || TYPEOF(item) || ")"
END

SAY ""
SAY "All DO...OVER tests completed!"