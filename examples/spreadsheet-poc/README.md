# RexxJS Spreadsheet POC

A proof-of-concept web spreadsheet powered by RexxJS expressions, built with React.

## Features

- **Cells with Values or Expressions**: Enter literal values or formulas starting with `=`
- **A1-Style Cell References**: Reference other cells using standard notation (A1, B2, etc.)
- **RexxJS Expression Evaluation**: Full RexxJS language support in formulas
- **Function Pipelines**: Use the `|>` operator for data transformation chains
- **Range Functions**: Built-in functions for working with cell ranges
- **Dependency Tracking**: Automatic recalculation when referenced cells change
- **Cell Comments & Formats**: Attach metadata to cells for documentation
- **Named Variables**: Define constants in Setup Script (e.g., `LET TAX_RATE = 0.07`)
- **Enhanced Info Panel**: Shows cell details, dependencies, type, comments
- **View Mode Hotkeys**: Press V/E/F/N to toggle between different views
- **Basic Styling**: Clean, modern UI with visual feedback

## Usage

### Keyboard Shortcuts (Hotkeys)

The spreadsheet supports view mode switching via keyboard:

- **V** - Values view: Show only literal values (formulas show blank)
- **E** - Expressions view: Show only formulas (value cells hidden)
- **F** - Formats view: Show format strings only
- **N** - Normal view: Standard spreadsheet view (default)

Press these keys while the grid is active (not editing a cell) to switch views.

**Use Cases:**
- Press **V** to audit which cells are hard-coded values
- Press **E** to review all formulas at once
- Press **F** to see formatting specifications
- Press **N** to return to normal operation

### Named Variables

Define constants and reusable values in the **⚙️ Setup** script:

```rexx
/* Setup Script */
LET TAX_RATE = 0.07
LET SHIPPING_COST = 15.00
LET DAYS_IN_YEAR = 365
```

Then use in any cell:
```rexx
=Revenue * TAX_RATE
=Subtotal + SHIPPING_COST
=Hours / DAYS_IN_YEAR
```

### Cell Comments & Formats

Cells can have metadata attached:
- **Comments**: Documentation notes (shown as 💬 icon in cell)
- **Formats**: Display formatting specs (shown as green border)

Access these via the Info Panel when a cell is selected, or hover over cells to see tooltips.

### Running Locally

1. **Build the RexxJS bundle** (if not already built):
   ```bash
   cd core/src/repl
   npm install
   npm run build
   ```

2. **Start a local server** from the repository root:
   ```bash
   npx http-server -p 8082 -c-1
   ```

3. **Open in browser**:
   ```
   http://localhost:8082/examples/spreadsheet-poc/index.html
   ```

### Sheet Name via Hash Parameter

The sheet name is specified via the URL hash:
- `#Sheet1` - Default sheet
- `#Budget2024` - Custom sheet name
- If no hash is provided, defaults to `Sheet1`

## Formula Examples

### Basic Arithmetic
```
=A1 + B1
=A2 * 2
=(A1 + A2) / 2
```

### Cell References
```
=A1 + A2 + A3
=B1 * C1
=SUM_RANGE("A1:A5")
```

### RexxJS String Functions
```
=UPPER("hello")
=SUBSTR("Hello World", 1, 5)
=LENGTH("test")
=REVERSE("stressed")
```

### Function Pipelines
```
="hello" |> UPPER |> LENGTH
=A1 |> UPPER |> SUBSTR(_, 1, 3)
="  trim me  " |> STRIP |> LENGTH
```

### Range Functions
```
=SUM_RANGE("A1:A5")
=AVERAGE_RANGE("B1:B10")
=MAX_RANGE("C1:C20")
=MIN_RANGE("D1:D15")
=COUNT_RANGE("E1:E10")
```

### Complex Expressions
```
=UPPER(A1) || " " || LOWER(B1)
=(A1 + A2) |> MULTIPLY(_, 2)
=LENGTH(A1) > 5
```

## Architecture

### Components

1. **spreadsheet-model.js**
   - Pure JavaScript spreadsheet model
   - Cell storage with A1-style addressing
   - Dependency tracking and recalculation
   - Testable with Jest (no DOM dependencies)

2. **spreadsheet-rexx-adapter.js**
   - Integration layer between SpreadsheetModel and RexxJS
   - Provides cell reference functions (A1(), B2(), etc.)
   - Range functions (SUM_RANGE, AVERAGE_RANGE, etc.)
   - Expression evaluation context

3. **spreadsheet-app.jsx**
   - React components for UI
   - Grid, Cell, FormulaBar components
   - State management and event handling

4. **index.html**
   - Main entry point
   - Loads RexxJS bundle or web loader
   - Loads React from CDN
   - Initializes the application

## Testing

### Jest Tests (Model)
```bash
cd core
npm test -- --testPathPattern="spreadsheet"
```

### Playwright Tests (UI)
```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test examples/spreadsheet-poc/tests/
```

## Limitations & Future Enhancements

### Current Limitations
- No persistence (no save/load functionality)
- No backend integration
- Basic styling only
- Limited to 100 rows × 26 columns
- No undo/redo
- No copy/paste

### Potential Enhancements
- Add more Excel-like functions (IF, VLOOKUP, etc.)
- Cell formatting (colors, fonts, borders)
- Multi-sheet support
- Import/export (CSV, JSON)
- Collaborative editing
- Cell comments and annotations
- Charts and visualizations
- Keyboard navigation (arrow keys, Tab)
- Cell selection ranges

## RexxJS Functions Available

The spreadsheet has access to three levels of functions:

### 1. Built-in RexxJS Functions (from `core/src/*`)

Always available without any setup:

**String Functions:**
- `UPPER`, `LOWER`, `LENGTH`, `SUBSTR`, `STRIP`, `REVERSE`
- `INDEX`, `POS`, `LASTPOS`, `WORDPOS`
- `LEFT`, `RIGHT`, `CENTER`
- `TRANSLATE`, `COPIES`, `SPACE`

**Math Functions:**
- `ABS`, `CEIL`, `FLOOR`, `ROUND`, `SQRT`, `POW`
- `MIN`, `MAX`, `SUM`, `AVERAGE`
- `RANDOM`, `SIGN`, `TRUNC`

**JSON Functions:**
- `JSON_PARSE`, `JSON_STRINGIFY`
- `JSON_GET`, `JSON_SET`

**Array Functions:**
- `MAP`, `FILTER`, `REDUCE`
- `SORT`, `REVERSE`, `JOIN`
- `SLICE`, `CONCAT`

**Date/Time Functions:**
- `DATE`, `TIME`, `FORMAT_DATE`
- `PARSE_DATE`, `ADD_DAYS`, `DIFF_DAYS`

### 2. Custom Spreadsheet Functions (from `examples/spreadsheet-poc/*`)

Spreadsheet-specific functions for working with cell ranges:

- `SUM_RANGE(rangeRef)` - Sum cells in range (e.g., `SUM_RANGE("A1:A5")`)
- `AVERAGE_RANGE(rangeRef)` - Average of cells in range
- `COUNT_RANGE(rangeRef)` - Count non-empty cells
- `MIN_RANGE(rangeRef)` - Minimum value in range
- `MAX_RANGE(rangeRef)` - Maximum value in range
- `CELL(ref)` - Get cell value by reference
- `ROW(ref)` - Get row number of cell
- `COLUMN(ref)` - Get column number of cell

### 3. Extra Function Libraries (from `extras/functions/*`)

Extended function libraries can be loaded via the **Setup Script** feature.

#### Loading Extra Libraries via Setup Button

Click the **⚙️ Setup** button in the header to open the setup editor. Add REQUIRE statements for the libraries you want to use:

**Example Setup Script:**
```rexx
// Load Excel-like functions (VLOOKUP, SUMIF, etc.)
REQUIRE "cwd:../../extras/functions/excel/src/excel-functions.js"

// Load R-inspired statistical functions
REQUIRE "cwd:../../extras/functions/r-inspired/src/r-statistics-functions.js"

// Load GraphViz visualization
REQUIRE "cwd:../../extras/functions/graphviz/src/graphviz-functions.js"
```

Click **Save & Execute** to load the libraries. Now all functions are available in all cells:

**Excel Functions:**
```rexx
=VLOOKUP(A1, B1:D10, 2, 0)
=SUMIF(A1:A10, ">5", B1:B10)
```

**R-Inspired Statistical Functions:**
```rexx
=MEAN([1,2,3,4,5])
=MEDIAN([1,2,3,4,5])
=SD([1,2,3,4,5])
```

**GraphViz Visualization:**
```rexx
=DIGRAPH("A -> B -> C")
```

**Benefits of Setup Script Approach:**
- ✅ Load libraries once, use everywhere
- ✅ Clean formulas (no REQUIRE in each cell)
- ✅ Easy to see what libraries are loaded
- ✅ Setup script is saved with spreadsheet data

**Note:** Extra libraries require proper path resolution. Use `cwd:` prefix for relative paths from the HTML file location.

## Development

### File Structure
```
examples/spreadsheet-poc/
├── README.md                      # This file
├── index.html                     # Main HTML entry point
├── spreadsheet-model.js           # Core spreadsheet logic
├── spreadsheet-rexx-adapter.js    # RexxJS integration layer
├── spreadsheet-app.jsx            # React components
├── spreadsheet-styles.css         # Stylesheet
└── tests/                         # Test files
    ├── spreadsheet-model.test.js  # Jest tests
    └── spreadsheet-ui.spec.js     # Playwright tests
```

### Code Organization

- **No spreadsheet logic in core/**: All spreadsheet-specific code is in `examples/`
- **Reusable RexxJS libraries**: Could be extracted to `extras/` if needed
- **REQUIRE system**: Libraries can be loaded via RexxJS `REQUIRE` statements

## License

Same as RexxJS - MIT License
