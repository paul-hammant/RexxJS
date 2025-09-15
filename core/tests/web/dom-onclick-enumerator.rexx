-- Generic DOM onclick handler enumeration using CHECKPOINT discovery
-- 
-- Copyright (c) 2025 Paul Hammant
-- Licensed under the MIT License
LET discovery = "Starting DOM onclick enumeration"
LET checkpoint1 = CHECKPOINT("start", discovery)

-- Discover all interactive buttons using parameterized selector
LET all_buttons = QUERY selector="%TARGET_SELECTOR% button" operation="count"
LET button_discovery = "Found " || all_buttons || " buttons in application"
LET checkpoint2 = CHECKPOINT("buttons_found", button_discovery)

-- Discover each button's properties using universal indexed access
DO button_index = 1 TO all_buttons
  SAY "=== Processing button " || button_index || " of " || all_buttons || " ==="
  
  -- Use universal selector with index parameter (0-based, so subtract 1)
  LET element_index = button_index - 1
  LET button_exists = QUERY selector="%TARGET_SELECTOR% button" operation="exists" index=element_index
  
  SAY "Checking element index " || element_index || " exists=" || button_exists
  
  IF button_exists = true THEN
    LET button_text = QUERY selector="%TARGET_SELECTOR% button" operation="text" index=element_index
    LET button_id = QUERY selector="%TARGET_SELECTOR% button" operation="id" index=element_index
    LET button_onclick = QUERY selector="%TARGET_SELECTOR% button" operation="attribute" attribute="onclick" index=element_index
    LET button_value = QUERY selector="%TARGET_SELECTOR% button" operation="attribute" attribute="value" index=element_index
    LET button_class = QUERY selector="%TARGET_SELECTOR% button" operation="attribute" attribute="class" index=element_index
    
    -- Build CSS selector - prefer ID if available, otherwise use indexed approach
    IF button_id \= "" THEN
      LET css_selector = "#" || button_id
    ELSE
      -- Use the same indexed selector approach as the QUERY operation
      -- This matches exactly how we're querying: "#calculator button" with index
      LET css_selector = "%TARGET_SELECTOR% button:nth-of-type(" || button_index || ")"
    ENDIF
    LET button_detail = "Btn" || button_index || "/" || all_buttons || ": '" || button_text || "' onclick=" || button_onclick
    IF button_id \= "" THEN
      LET button_detail = button_detail || " id=" || button_id
    ENDIF
    IF button_value \= "" THEN
      LET button_detail = button_detail || " val=" || button_value
    ENDIF
    IF button_class \= "" THEN
      LET button_detail = button_detail || " cls=" || button_class
    ENDIF
    LET button_detail = button_detail || " selector=" || css_selector
    
    -- Output comprehensive info for this button (keep SAY for debugging)
    SAY button_detail
    
    -- Create individual btn_X variable and CHECKPOINT for streaming
    LET btn_variable_content = button_detail
    LET btn_var_name = "btn_" || button_index
    LET checkpoint_result = CHECKPOINT(btn_var_name, btn_variable_content)
  ELSE
    SAY "Button " || button_index || " not found at index " || element_index
  ENDIF
END

LET final_discovery = "Onclick enumeration complete - discovered " || all_buttons || " interactive elements"
LET checkpoint_final = CHECKPOINT("complete", final_discovery)