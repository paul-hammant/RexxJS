# Local Testing Guide

## Overview
For testing changes locally without committing/pushing, you can serve the repository locally and test the REPL with your modifications.

## Setup Local Web Server

1. Start a local web server from the RexxJS repository root:
   ```bash
   cd /path/to/RexxJS
   python3 -m http.server 9000 --bind 127.0.0.1
   ```

2. Access the REPL at: `http://127.0.0.1:9000/core/src/repl/index.html`

## Testing Histogram Auto-Rendering

After making changes to the graphics functions, you can test histogram rendering:

1. Load the REXX interpreter in the REPL
2. Run the histogram demo from the dropdown, or manually execute:
   ```rexx
   REQUIRE "org.rexxjs/r-graphics-functions"
   LET data = JSON_PARSE text="[1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 6]"
   LET histogram = HIST data=data breaks=5 main="Test Histogram" col="steelblue"
   ```

3. Verify that:
   - A canvas element appears with the actual histogram (not just placeholder text)
   - The REPL automatically scrolls to show the new graphics content
   - The auto-render checkbox controls work properly

## Local File Dependencies

When testing locally, the REPL will load:
- Graphics functions from: `/extras/functions/r-inspired/graphics/src/graphics-functions.js`
- Bundled functions from: `/dist/functions/r-graphics-functions.bundle.js`
- Histogram renderers from: `/extras/functions/r-inspired/graphics/histogram-browser-renderer.js`

## Rebuilding Bundles

If you modify the graphics functions source, rebuild the bundle:
```bash
cd extras/functions/r-inspired/graphics
npm run build
```

## Port Conflicts

If port 9000 is in use, try other ports:
```bash
# Check what ports are in use
netstat -tuln | grep :90

# Try alternative ports
python3 -m http.server 9001 --bind 127.0.0.1
python3 -m http.server 8888 --bind 127.0.0.1
```

## Testing Workflow

1. Make changes to source files
2. Rebuild bundles if needed (`npm run build`)
3. Refresh browser tab with REPL
4. Test functionality
5. Repeat until satisfied
6. Run Playwright tests: `PLAYWRIGHT_HTML_OPEN=never npx playwright test`

This workflow avoids the need to commit/push changes during development and testing.