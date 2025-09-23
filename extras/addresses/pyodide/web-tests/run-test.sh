#!/bin/bash

# Run Pyodide Playwright test
# Usage: ./run-test.sh

set -e

echo "Starting HTTP server for Pyodide tests..."
python3 -m http.server 8083 &
SERVER_PID=$!

# Wait for server to start
sleep 2

echo "Running Playwright test..."
cd ../../../core
PLAYWRIGHT_HTML_OPEN=never npx playwright test ../extras/addresses/pyodide/web-tests/pyodide-address-test.spec.js --config=playwright.config.js --project=chromium --timeout=120000

# Kill the server
kill $SERVER_PID 2>/dev/null || true

echo "Test completed!"