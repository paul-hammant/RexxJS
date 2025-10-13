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
-- Load the library with a custom prefix
-- REQUIRE "org.rexxjs/graphviz-functions" AS "GVZ_"

-- Render the graph to an SVG string using the 'dot' engine
LET svg_output = GVZ_DOT(dot_string)

SAY "SVG Output Length: " svg_output.length

-- Render to a PNG image using the 'neato' engine
LET options = "{format: 'png'}"
LET neato_png = GVZ_NEATO(dot_string, options)

SAY "Neato PNG Output Length: " neato_png.length
```

## Available Functions

The library provides separate functions for each of the main Graphviz layout engines.

### `DOT(dot_string, [options])`
### `NEATO(dot_string, [options])`
### `FDP(dot_string, [options])`

Renders a DOT language string into an image format.

-   **`dot_string`**: A string containing the graph definition in the DOT language.
-   **`options`** (optional): A Rexx object (or a string that can be interpreted as one) with rendering options.
    -   `format`: The output format. Common values include `'svg'` (default), `'png'`, and `'jpg'`.

## Dependencies

-   `graphviz-wasm`: The WASM-powered Graphviz library.

## Build & Test

```bash
# From within this directory (extras/functions/graphviz)
npm install
npm test
```
