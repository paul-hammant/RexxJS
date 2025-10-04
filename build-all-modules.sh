#!/bin/bash

# Build all RexxJS modules using hardcoded list
# Usage: ./build-all-modules.sh [clean]
# NOTE: This script must be run from the RexxJS root directory

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Clean dist directories if requested
if [ "$1" = "clean" ]; then
    print_info "Cleaning dist directories..."
    rm -rf ../dist/addresses/
    rm -rf ../dist/functions/
fi

# Create dist directories
mkdir -p ../dist/{addresses,functions}

print_info "Building RexxJS modules..."

# Address handlers
print_info "Building address handlers..."

# sqlite3-address
cd extras/addresses/sqlite3 && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../..
print_success "Built sqlite-address.bundle.js"
cp extras/addresses/sqlite3/src/sqlite-address.js ../dist/addresses/sqlite-address.js
print_success "Copied sqlite-address.js (unbundled)"

# jq-wasm-address
cd extras/addresses/jq-wasm-address && npx webpack --config src/webpack.bundle.config.js && cd ../../..
print_success "Built jq-wasm-address.bundle.js"
cp extras/addresses/jq-wasm-address/src/jq-address.js ../dist/addresses/jq-wasm-address.js
print_success "Copied jq-wasm-address.js (unbundled)"

# jq-address (native - no build needed, just copy)
cp extras/addresses/jq-address/src/jq-address.js ../dist/addresses/jq-address.js
print_success "Copied jq-address.js (native, unbundled)"

# claude-address
cd extras/addresses/anthropic-ai/claude && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built claude-address.bundle.js"
cp extras/addresses/anthropic-ai/claude/src/claude-address.js ../dist/addresses/claude-address.js
print_success "Copied claude-address.js (unbundled)"

# pyodide-address
cd extras/addresses/pyodide && npx webpack --config src/webpack.bundle.config.js && cd ../../..
print_success "Built pyodide-address.bundle.js"
cp extras/addresses/pyodide/src/pyodide-address.js ../dist/addresses/pyodide-address.js
print_success "Copied pyodide-address.js (unbundled)"

# duckdb-wasm-address
cd extras/addresses/duckdb-wasm-address && npx webpack --config src/webpack.bundle.config.js && cd ../../..
print_success "Built duckdb-wasm-address.bundle.js"
cp extras/addresses/duckdb-wasm-address/src/duckdb-wasm-address.js ../dist/addresses/duckdb-wasm-address.js
print_success "Copied duckdb-wasm-address.js (unbundled)"

# duckdb-address (native - no build needed, just copy)
cp extras/addresses/duckdb-address/src/duckdb-address.js ../dist/addresses/duckdb-address.js
print_success "Copied duckdb-address.js (native, unbundled)"

# system-address
cd extras/addresses/system && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../..
print_success "Built system-address.bundle.js"
cp extras/addresses/system/src/system-address.js ../dist/addresses/system-address.js
print_success "Copied system-address.js (unbundled)"

# gemini-address
cd extras/addresses/gemini-ai && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../..
print_success "Built gemini-pro.bundle.js"
cp extras/addresses/gemini-ai/src/gemini-pro.js ../dist/addresses/gemini-pro.js
print_success "Copied gemini-pro.js (unbundled)"

# openai-address
cd extras/addresses/open-ai/chat-completions && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built chat-completions.bundle.js"
cp extras/addresses/open-ai/chat-completions/src/chat-completions.js ../dist/addresses/chat-completions.js
print_success "Copied chat-completions.js (unbundled)"

# Provisioning and orchestration bundles
print_info "Building provisioning-and-orchestration bundles..."

cd extras/addresses/provisioning-and-orchestration && npx webpack --config webpack.config.js && cd ../../..
print_success "Built provisioning container-handlers.bundle.js"
cp extras/addresses/provisioning-and-orchestration/bundle-entry.js ../dist/addresses/bundle-entry.js
print_success "Copied bundle-entry.js (unbundled)"

cd extras/addresses/provisioning-and-orchestration && npx webpack --config webpack-remote.config.js && cd ../../..
print_success "Built provisioning-remote-handlers.bundle.js"
cp extras/addresses/provisioning-and-orchestration/bundle-entry-remote.js ../dist/addresses/bundle-entry-remote.js
print_success "Copied bundle-entry-remote.js (unbundled)"

# Function libraries
print_info "Building function libraries..."

# graphviz-functions
cd extras/functions/graphviz && npx webpack --config src/webpack.bundle.config.js && cd ../../..
print_success "Built graphviz-functions.bundle.js"
cp extras/functions/graphviz/src/graphviz-functions.js ../dist/functions/graphviz-functions.js
print_success "Copied graphviz-functions.js (unbundled)"

# excel-functions
cd extras/functions/excel && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../..
print_success "Built excel-functions.bundle.js"
cp extras/functions/excel/src/excel-functions.js ../dist/functions/excel-functions.js
print_success "Copied excel-functions.js (unbundled)"

# r-regression-functions
cd extras/functions/r-inspired/advanced-analytics && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built r-regression-functions.bundle.js"
cp extras/functions/r-inspired/advanced-analytics/src/r-regression-functions.js ../dist/functions/r-regression-functions.js
print_success "Copied r-regression-functions.js (unbundled)"

# r-set-functions
cd extras/functions/r-inspired/data-manipulation && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built r-set-functions.bundle.js"
cp extras/functions/r-inspired/data-manipulation/src/r-set-functions.js ../dist/functions/r-set-functions.js
print_success "Copied r-set-functions.js (unbundled)"

# r-factor-functions
cd extras/functions/r-inspired/data-types && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built r-factor-functions.bundle.js"
cp extras/functions/r-inspired/data-types/src/r-factor-functions.js ../dist/functions/r-factor-functions.js
print_success "Copied r-factor-functions.js (unbundled)"

# graphics-functions
cd extras/functions/r-inspired/graphics && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built graphics-functions.bundle.js"
cp extras/functions/r-inspired/graphics/src/graphics-functions.js ../dist/functions/graphics-functions.js
print_success "Copied graphics-functions.js (unbundled)"

# r-summary-functions
cd extras/functions/r-inspired/math-stats && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built r-summary-functions.bundle.js"
cp extras/functions/r-inspired/math-stats/src/r-summary-functions.js ../dist/functions/r-summary-functions.js
print_success "Copied r-summary-functions.js (unbundled)"

# r-timeseries-functions
cd extras/functions/r-inspired/signal-processing && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built r-timeseries-functions.bundle.js"
cp extras/functions/r-inspired/signal-processing/src/r-timeseries-functions.js ../dist/functions/r-timeseries-functions.js
print_success "Copied r-timeseries-functions.js (unbundled)"

# sp-interpolation-functions
cd extras/functions/scipy-inspired/interpolation && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built sp-interpolation-functions.bundle.js"
cp extras/functions/scipy-inspired/interpolation/src/sp-interpolation-functions.js ../dist/functions/sp-interpolation-functions.js
print_success "Copied sp-interpolation-functions.js (unbundled)"

# sp-stats-functions
cd extras/functions/scipy-inspired/stats && npx webpack --config src/webpack.bundle.config.js && cd ../../../..
print_success "Built sp-stats-functions.bundle.js"
cp extras/functions/scipy-inspired/stats/src/sp-stats-functions.js ../dist/functions/sp-stats-functions.js
print_success "Copied sp-stats-functions.js (unbundled)"

# sympy-functions
cd extras/functions/sympy-inspired && npx webpack --config src/webpack.bundle.config.js && cd ../../..
print_success "Built sympy-functions.bundle.js"
cp extras/functions/sympy-inspired/src/sympy-functions.js ../dist/functions/sympy-functions.js
print_success "Copied sympy-functions.js (unbundled)"

# Strip dependencies from all bundles
print_info "Stripping dependencies from bundles..."
node build-scripts/strip-bundle-dependencies.js
print_success "Dependencies stripped from all bundles"

# Show results
print_info "Build Summary:"
echo ""
echo "ADDRESS handlers (bundled + unbundled):"
ls -lh ../dist/addresses/ 2>/dev/null | grep -v "^total" | awk '{print "  " $5 " " $9}' || echo "  (none)"
echo ""
echo "Function libraries (bundled + unbundled):"
ls -lh ../dist/functions/ 2>/dev/null | grep -v "^total" | awk '{print "  " $5 " " $9}' || echo "  (none)"
echo ""

print_success "Build complete! All modules built successfully."