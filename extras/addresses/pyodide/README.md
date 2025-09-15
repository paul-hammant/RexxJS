# Pyodide ADDRESS Library for RexxJS

A Pyodide ADDRESS library for RexxJS, enabling Python execution from within REXX scripts.

## Usage

### REXX Code

```rexx
-- Load the Pyodide ADDRESS library
REQUIRE "pyodide-address"
ADDRESS PYODIDE

-- Method-call style (recommended)
LET result = run code="1 + 1"
SAY "Result: " result -- "Result: 2"

-- Command-string style
"print('Hello from a command string!')"

-- Using a more complex script
LET script = "
import sys
sys.version
"
LET python_version = run code=script
SAY "Python version: " python_version

-- Loading a package
"load_package numpy"
LET np_version = run code="import numpy as np; np.__version__"
SAY "Numpy version: " np_version

-- Using context variables
set_context key="my_rexx_var" value=42
LET result = run code="my_rexx_var * 2"
SAY "Result from context: " result

-- Get the status of the Pyodide service
LET status = status
SAY "Pyodide status: " status.result.status
SAY "Loaded packages: " status.result.loadedPackages
```

### Available Methods

- `run(code)` / `exec(code)` - Execute a Python script and return the result.
- `run_file(file)` - Execute a Python script from a file.
- `status()` - Get the status of the Pyodide service.
- `set_context(key, value)` - Set a variable in the Python context.
- `get_context(key)` - Get a variable from the Python context.
- `clear_context()` - Clear all variables from the Python context.

## Dependencies

- `pyodide` - The Pyodide library for running Python in the browser.

## Build

```bash
npm install
npm test
npm run build
```

## Generated Files

- `dist/pyodide-address.js`: The bundled address library.
