# Graphviz Functions Library for RexxJS

A functions library that integrates Graphviz via WASM to provide powerful graph rendering capabilities directly within RexxJS.

## Usage

### REXX Code

```rexx
-- Load the Graphviz functions library
REQUIRE "graphviz-functions"

-- Define a simple graph in the DOT language
LET dot_string = "digraph { a -> b; b -> c; c -> a; }"

-- Render the graph to an SVG string
LET svg_output = GRAPHVIZ_RENDER(dot_string)

SAY "SVG Output Length: " svg_output.length

-- Render using a different layout engine
LET options = '{"engine": "neato"}'
LET neato_svg = GRAPHVIZ_RENDER(dot_string, options)

SAY "Neato SVG Output Length: " neato_svg.length
```

## Available Functions

### `GRAPHVIZ_RENDER(dot_string, [options])`

Renders a DOT language string into an SVG image.

-   **`dot_string`**: A string containing the graph definition in the DOT language.
-   **`options`** (optional): A JSON string with rendering options.
    -   `engine`: The layout engine to use. Can be `'circo'`, `'dot'`, `'fdp'`, `'neato'`, `'osage'`, `'patchwork'`, `'sfdp'`, or `'twopi'`. Defaults to `'dot'`.

## Dependencies

-   `graphviz-wasm`: The WASM-powered Graphviz library.

## Build & Test

```bash
# From within this directory (extras/functions/graphviz)
npm install
npm test
```
