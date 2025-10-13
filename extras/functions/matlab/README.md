# MATLAB-inspired Functions Library for RexxJS

A functions library that provides MATLAB-inspired plotting capabilities directly within RexxJS.

## Usage

### REXX Code

```rexx
-- Load the MATLAB-inspired functions library
REQUIRE "matlab-functions"

-- Define some data to plot
LET my_data = '[1, 5, 3, 8, 2]'

-- Render the data to an SVG string
LET svg_output = PLOT(my_data)

SAY "SVG Output Length: " svg_output.length
```

## Available Functions

### `PLOT(data, [options])`

Renders a plot of the given data.

-   **`data`**: A Rexx array (or a string that can be interpreted as one) with the data to plot.
-   **`options`** (optional): A Rexx object (or a string that can be interpreted as one) with rendering options. (Currently unused).

## Dependencies

This module currently has no external dependencies.

## Build & Test

```bash
# From within this directory (extras/functions/matlab)
npm install
npm test
```
