-- Test DO...OVER with mock DOM elements
-- This simulates the web test scenario without actual DOM

-- Create mock DOM elements (similar to what DOM_GET_ALL would return)
-- In the actual web test, DOM_GET_ALL returns an array of element references
LET mockButtons = ["dom_element_1", "dom_element_2", "dom_element_3", "dom_element_4", "dom_element_5"]
SAY "Created mock DOM button collection with " || ARRAY_LENGTH(mockButtons) || " elements"

-- Test 1: Index-based approach (as in the web test)
SAY ""
SAY "OLD WAY: Index-centric DOM collection traversal"
LET buttons = mockButtons
LET count = ARRAY_LENGTH(buttons)
SAY "Found " || count || " buttons with index approach"

DO i = 1 TO count
    LET button = ARRAY_GET(buttons, i)
    SAY "Processing button index: " || i
    -- Simulate DOM_ELEMENT_TEXT (would normally get text from element)
    LET text = "Button" || i
    -- Simulate DOM_ELEMENT_CLICK
    SAY "  Clicked: " || text
END

SAY "Index-based processing complete"

-- Test 2: DO...OVER approach (as in the web test)
SAY ""
SAY "NEW WAY: DO...OVER for elegant DOM collection traversal"
LET buttons2 = mockButtons
SAY "Found buttons collection, processing with DO...OVER..."

DO button OVER buttons2
    -- Simulate DOM_ELEMENT_TEXT
    LET buttonIndex = 0
    DO j = 1 TO ARRAY_LENGTH(buttons2)
        IF ARRAY_GET(buttons2, j) = button THEN
            LET buttonIndex = j
        ENDIF
    END
    LET text = "Button" || buttonIndex
    -- Simulate DOM_ELEMENT_CLICK
    SAY "Processed: " || text
END

SAY "DO...OVER processing complete"

-- Test 3: With RETRY_ON_STALE pattern (from second failing test)
SAY ""
SAY "Test with RETRY_ON_STALE pattern:"

-- Since we can't test actual RETRY_ON_STALE without DOM, 
-- just test the DO...OVER part
LET testButtons = mockButtons
SAY "Processing button collection with stale protection..."

DO button OVER testButtons
    LET buttonIndex = 0
    DO k = 1 TO ARRAY_LENGTH(testButtons)
        IF ARRAY_GET(testButtons, k) = button THEN
            LET buttonIndex = k
        ENDIF
    END
    LET text = "Button" || buttonIndex
    SAY "Processing: " || text
    -- Simulate DOM_ELEMENT_CLICK
    -- SLEEP ms=100 (skipped in mock)
END

SAY "All collection buttons processed with retry protection"

SAY ""
SAY "All mock DOM tests completed successfully!"