#!/bin/bash

# Run Caddy web server for Pyodide tests with multiple static paths
# Usage: ./run-webserver.sh

set -e

echo "Starting Caddy multi-path web server for Pyodide tests..."
echo ""
echo "Available URLs:"
echo "  Test Harness: http://localhost:8083/test-harness-pyodide.html"
echo "  Test Spec: http://localhost:8083/pyodide-address-test.spec.js"
echo "  Core Source: http://localhost:8083/core-source/parser.js"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run Caddy with the Caddyfile
caddy run --config Caddyfile