# DOM Element Objects - Implementation Plan

## Current State

RexxJS currently has **functional/stateless** DOM operations:

```rexx
LET count = DOM_QUERY selector=".items" operation="count"
LET text = DOM_QUERY selector="#title" operation="text"
DOM_CLICK selector="button"
DOM_TYPE selector="input[name=email]" text="user@example.com"
```

**Infrastructure Already Implemented:**
- ✅ **DOMElementManager** (`core/src/dom-element-manager.js`) - Complete element reference system
- ✅ **Stale element detection** - Automatically handles DOM changes
- ✅ **Element caching** - Opaque references like `dom_element_123`
- ✅ **Context-aware queries** - Parent/child relationships supported
- ✅ **Basic operations** - `clickElement`, `typeInElement`, `getElementText`, etc.

**Missing: REXX Function Bindings**
The core infrastructure exists but the REXX-callable functions from this document are not yet wired up. The TODO comment in `dom-functions.js` confirms this gap.

## Problem: Current Limitations

- **Repeated queries**: `DOM_QUERY selector="#same-element" operation="text"` multiple times is inefficient
- **No element relationships**: Can't navigate parent/child/sibling elements (though DOMElementManager supports this)
- **No element state**: Can't cache or pass elements between operations (though DOMElementManager provides this)
- **Performance**: Re-querying same elements repeatedly
- **Complex operations**: Hard to build dynamic UIs or process forms systematically

**Note**: The underlying capabilities exist in DOMElementManager but need REXX function wrappers to be accessible.

## Solution: DOM Element Objects

### Core Element Functions

```rexx
-- Get element references (NEEDS IMPLEMENTATION)
LET button = DOM_GET selector="button.submit"
LET form = DOM_GET selector="form#login"
LET inputs = DOM_GET_ALL selector="input"         -- Returns array of elements

-- Use element objects (NEEDS IMPLEMENTATION)
LET text = DOM_ELEMENT_TEXT element=button
DOM_ELEMENT_CLICK element=button
DOM_ELEMENT_SET_STYLE element=button property="color" value="red"
DOM_ELEMENT_SET_ATTR element=button name="disabled" value="true"
```

**Implementation Status**: 
- 🔧 **Backend Ready**: DOMElementManager provides `getElement()`, `getAllElements()`, `clickElement()`, etc.
- ❌ **Frontend Missing**: These functions need to be added to the REXX function registry

### Element Relationships

```rexx
-- Navigate DOM tree (NEEDS IMPLEMENTATION)
LET parent = DOM_ELEMENT_PARENT element=button
LET children = DOM_ELEMENT_CHILDREN element=form
LET children_filtered = DOM_ELEMENT_CHILDREN element=form selector="input"
LET siblings = DOM_ELEMENT_SIBLINGS element=button
LET next = DOM_ELEMENT_NEXT_SIBLING element=button
LET prev = DOM_ELEMENT_PREV_SIBLING element=button

-- Find within element (PARTIALLY IMPLEMENTED)
LET nested = DOM_ELEMENT_QUERY element=form selector=".error-message"
LET nested_all = DOM_ELEMENT_QUERY_ALL element=form selector="input"
```

**Implementation Status**: 
- 🔧 **Backend Ready**: DOMElementManager supports `queryElement()` for parent/child queries
- ❌ **Frontend Missing**: Navigation functions need REXX wrappers

### Element Properties

```rexx
-- Basic properties
LET tag = DOM_ELEMENT_TAG element=button        -- "BUTTON"
LET id = DOM_ELEMENT_ID element=button          -- "submit-btn"
LET classes = DOM_ELEMENT_CLASSES element=button -- ["submit", "primary"]
LET class_string = DOM_ELEMENT_CLASS element=button -- "submit primary"

-- Attributes
LET attrs = DOM_ELEMENT_ATTRIBUTES element=button   -- Object with all attrs
LET type = DOM_ELEMENT_ATTR element=button name="type"
LET has_attr = DOM_ELEMENT_HAS_ATTR element=button name="disabled"

-- Content
LET text = DOM_ELEMENT_TEXT element=button
LET html = DOM_ELEMENT_HTML element=button
LET value = DOM_ELEMENT_VALUE element=input   -- For form elements

-- Computed properties
LET visible = DOM_ELEMENT_VISIBLE element=button
LET rect = DOM_ELEMENT_BOUNDS element=button  -- {x, y, width, height}
LET style = DOM_ELEMENT_COMPUTED_STYLE element=button property="color"
```

### Element Manipulation

```rexx
-- Content manipulation
DOM_ELEMENT_SET_TEXT element=button text="Click Me"
DOM_ELEMENT_SET_HTML element=div html="<strong>Bold text</strong>"
DOM_ELEMENT_SET_VALUE element=input value="new value"

-- Attribute manipulation
DOM_ELEMENT_SET_ATTR element=button name="title" value="Tooltip"
DOM_ELEMENT_REMOVE_ATTR element=button name="disabled"

-- Class manipulation
DOM_ELEMENT_ADD_CLASS element=button class="active"
DOM_ELEMENT_REMOVE_CLASS element=button class="disabled" 
DOM_ELEMENT_TOGGLE_CLASS element=button class="selected"

-- Style manipulation
DOM_ELEMENT_SET_STYLE element=button property="backgroundColor" value="#blue"
DOM_ELEMENT_REMOVE_STYLE element=button property="color"
```

### Advanced DOM Operations

```rexx
-- Element creation
LET new_div = DOM_CREATE_ELEMENT tag="div"
LET new_input = DOM_CREATE_ELEMENT tag="input" type="text" name="username"
LET text_node = DOM_CREATE_TEXT text="Hello World"

-- Element insertion
DOM_ELEMENT_APPEND parent=form child=new_input
DOM_ELEMENT_PREPEND parent=form child=new_div
DOM_ELEMENT_INSERT_BEFORE reference=button new_element=new_div
DOM_ELEMENT_INSERT_AFTER reference=button new_element=new_div

-- Element removal/replacement
DOM_ELEMENT_REMOVE element=button
DOM_ELEMENT_REPLACE old_element=button new_element=new_button
LET cloned = DOM_ELEMENT_CLONE element=button deep=true
```

### Event Handling

```rexx
-- Event listeners
DOM_ELEMENT_ON_CLICK element=button handler="handleButtonClick"
DOM_ELEMENT_ON_CHANGE element=input handler="handleInputChange"  
DOM_ELEMENT_ON_EVENT element=div event="mouseover" handler="handleMouseover"

-- Event removal
DOM_ELEMENT_OFF_CLICK element=button handler="handleButtonClick"
DOM_ELEMENT_OFF_EVENT element=div event="mouseover" handler="handleMouseover"

-- Event dispatch
DOM_ELEMENT_TRIGGER_EVENT element=button event="click"
DOM_ELEMENT_TRIGGER_EVENT element=input event="change" data='{"detail": "custom"}'
```

## Use Cases

### 1. Form Processing

```rexx
LET form = DOM_GET selector="form.registration"
LET inputs = DOM_ELEMENT_QUERY_ALL element=form selector="input, select, textarea"

LET form_data = '{}'
DO i = 1 TO ARRAY_LENGTH(inputs)
  LET input = inputs.i
  LET name = DOM_ELEMENT_ATTR element=input name="name"
  LET value = DOM_ELEMENT_VALUE element=input
  LET form_data = JSON_SET object=form_data key=name value=value
END

SAY "Form data: " || JSON_STRINGIFY(form_data)
```

### 2. Dynamic UI Building

```rexx
LET container = DOM_GET selector=".dynamic-content"
DOM_ELEMENT_SET_HTML element=container html=""  -- Clear existing content

DO i = 1 TO 10
  LET item = DOM_CREATE_ELEMENT tag="div"
  DOM_ELEMENT_SET_TEXT element=item text="Item " || i
  DOM_ELEMENT_ADD_CLASS element=item class="list-item"
  DOM_ELEMENT_SET_ATTR element=item name="data-index" value=i
  
  -- Add click handler
  DOM_ELEMENT_ON_CLICK element=item handler="handleItemClick"
  
  DOM_ELEMENT_APPEND parent=container child=item
END
```

### 3. Table Processing

```rexx
LET table = DOM_GET selector="table.data"
LET rows = DOM_ELEMENT_QUERY_ALL element=table selector="tbody tr"

DO i = 1 TO ARRAY_LENGTH(rows)
  LET row = rows.i
  LET cells = DOM_ELEMENT_QUERY_ALL element=row selector="td"
  
  LET name = DOM_ELEMENT_TEXT element=cells.1
  LET email = DOM_ELEMENT_TEXT element=cells.2
  LET status = DOM_ELEMENT_TEXT element=cells.3
  
  IF status = "inactive" THEN
    DOM_ELEMENT_ADD_CLASS element=row class="inactive-row"
  ENDIF
  
  SAY "Row " || i || ": " || name || " (" || email || ") - " || status
END
```

### 4. Complex Animation/Interaction

```rexx
LET modal = DOM_GET selector=".modal"
LET overlay = DOM_GET selector=".modal-overlay"
LET close_btn = DOM_ELEMENT_QUERY element=modal selector=".close-button"

-- Show modal with animation
DOM_ELEMENT_ADD_CLASS element=modal class="visible"
DOM_ELEMENT_ADD_CLASS element=overlay class="visible"
DOM_ELEMENT_SET_STYLE element=modal property="opacity" value="0"

-- Animate in
DO opacity = 0 TO 100 BY 10
  DOM_ELEMENT_SET_STYLE element=modal property="opacity" value=(opacity / 100)
  -- Small delay would be nice here
END

-- Setup close handlers
DOM_ELEMENT_ON_CLICK element=close_btn handler="closeModal"
DOM_ELEMENT_ON_CLICK element=overlay handler="closeModal"
```

### 5. Form Validation

```rexx
LET form = DOM_GET selector="form.contact"
LET submit_btn = DOM_ELEMENT_QUERY element=form selector="button[type=submit]"

-- Validate all inputs
LET is_valid = 1
LET inputs = DOM_ELEMENT_QUERY_ALL element=form selector="input[required]"

DO i = 1 TO ARRAY_LENGTH(inputs)
  LET input = inputs.i
  LET value = DOM_ELEMENT_VALUE element=input
  LET name = DOM_ELEMENT_ATTR element=input name="name"
  
  IF value = "" THEN
    DOM_ELEMENT_ADD_CLASS element=input class="error"
    LET error_msg = DOM_ELEMENT_QUERY element=form selector=".error-" || name
    DOM_ELEMENT_SET_TEXT element=error_msg text="This field is required"
    LET is_valid = 0
  ELSE
    DOM_ELEMENT_REMOVE_CLASS element=input class="error"
  ENDIF
END

-- Enable/disable submit button
IF is_valid THEN
  DOM_ELEMENT_REMOVE_ATTR element=submit_btn name="disabled"
  DOM_ELEMENT_ADD_CLASS element=submit_btn class="enabled"
ELSE
  DOM_ELEMENT_SET_ATTR element=submit_btn name="disabled" value="true"
  DOM_ELEMENT_REMOVE_CLASS element=submit_btn class="enabled"
ENDIF
```

## Implementation Considerations

### Element Storage ✅ COMPLETED
- **Opaque references**: Elements stored as strings like `"dom_element_123"` (implemented in DOMElementManager)
- **Internal mapping**: Map reference strings to actual DOM nodes (implemented via `elementCache` Map)
- **Cross-frame support**: Works with existing cross-iframe capabilities
- **Weak references**: Automatic cleanup when elements are removed from DOM

### Memory Management ✅ COMPLETED  
- **Automatic cleanup**: Remove references when elements are removed from DOM (implemented via `isStale()`)
- **Manual cleanup**: `DOM_ELEMENT_RELEASE element=element` for explicit cleanup (can use `clearAll()`)
- **Reference counting**: Track how many Rexx variables reference each element

### Error Handling ✅ COMPLETED
- **Stale references**: Handle elements that no longer exist in DOM (implemented with aggressive stale detection)
- **Invalid selectors**: Clear error messages for malformed selectors (implemented)
- **Type validation**: Ensure element references are valid before operations (implemented in `getElementFromRef()`)

### Performance ✅ MOSTLY COMPLETED
- **Batch operations**: Group multiple DOM changes to minimize reflows (needs REXX wrapper implementation)
- **Caching**: Cache computed properties that don't change frequently (implemented via `elementCache`)
- **Lazy evaluation**: Only query DOM when element properties are accessed (implemented)

## API Design Principles

1. **Consistent naming**: All element functions start with `DOM_ELEMENT_`
2. **Clear parameters**: `element=` parameter always comes first
3. **Return values**: Functions return useful values (text, attributes, new elements)
4. **Error resilience**: Functions handle missing/invalid elements gracefully
5. **Chainable operations**: Where possible, return elements for chaining

## Integration with Existing DOM Functions

The current DOM functions would remain for simple operations:
```rexx
-- Still valid for simple cases
DOM_CLICK selector="button"
DOM_TYPE selector="input" text="value"

-- But element objects are more efficient for repeated operations
LET button = DOM_GET selector="button"
DOM_ELEMENT_CLICK element=button
DOM_ELEMENT_SET_STYLE element=button property="color" value="green"
```

## Testing Strategy

- **Unit tests**: Test each DOM_ELEMENT_* function individually (needs implementation)
- **Integration tests**: Test complex scenarios like form processing (needs implementation)
- **Cross-browser tests**: Ensure compatibility across browsers (needs implementation)
- **Memory tests**: Verify element cleanup and no memory leaks (DOMElementManager already tested)
- **Performance tests**: Compare with current selector-based approach (needs implementation)

**Current Test Status**: DOMElementManager has underlying functionality but REXX function bindings need comprehensive test coverage.

## Next Steps for Implementation

**Phase 1: Core Element Functions (High Priority)**
- Add `DOM_GET` and `DOM_GET_ALL` to REXX function registry
- Implement `DOM_ELEMENT_CLICK`, `DOM_ELEMENT_TEXT`, `DOM_ELEMENT_SET_ATTR`
- Wire up existing DOMElementManager methods to REXX functions

**Phase 2: Element Navigation (Medium Priority)**  
- Add parent/child/sibling navigation functions
- Implement `DOM_ELEMENT_QUERY` and `DOM_ELEMENT_QUERY_ALL`

**Phase 3: Advanced Operations (Lower Priority)**
- Element creation (`DOM_CREATE_ELEMENT`)
- Event handling (`DOM_ELEMENT_ON_CLICK`)
- Animation and complex interactions

## Future Extensions

- **Element collections**: `DOM_COLLECTION` for operating on multiple elements
- **Custom elements**: Support for Web Components
- **Shadow DOM**: Navigate shadow roots and shadow trees
- **Drag and drop**: Built-in drag/drop element operations
- **Intersection observer**: Element visibility and intersection detection
- **Mutation observer**: Watch for element changes

---

**Summary**: The hard infrastructure work is done. We need ~60 REXX function wrappers to expose DOMElementManager capabilities.