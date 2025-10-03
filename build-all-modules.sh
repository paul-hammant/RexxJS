#!/bin/bash

# Build all RexxJS modules using hardcoded list
# Usage: ./build-all-modules.sh [clean]

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

cd extras/addresses/sqlite3 && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../..
print_success "Built sqlite3-address"

cd extras/addresses/jq && npx webpack --config src/webpack.bundle.config.js && cd ../../..
print_success "Built jq-address"

cd extras/addresses/anthropic-ai/claude && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built claude-address"

cd extras/addresses/pyodide && npx webpack --config src/webpack.bundle.config.js && cd ../../..
print_success "Built pyodide-address"

cd extras/addresses/duckdb-wasm && npx webpack --config src/webpack.bundle.config.js && cd ../../..
print_success "Built duckdb-wasm-address"

cd extras/addresses/system && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../..
print_success "Built system-address"

# Provisioning and orchestration bundles
print_info "Building provisioning-and-orchestration bundles..."

cd extras/addresses/provisioning-and-orchestration && npx webpack --config webpack.config.js && cd ../../..
print_success "Built provisioning container-handlers bundle"

cd extras/addresses/provisioning-and-orchestration && npx webpack --config webpack-remote.config.js && cd ../../..
print_success "Built provisioning remote-handlers bundle"

# Function libraries
print_info "Building function libraries..."

cd extras/functions/graphviz && npx webpack --config src/webpack.bundle.config.js && cd ../../..
print_success "Built graphviz-functions"

cd extras/functions/excel && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../..
print_success "Built excel-functions"

cd extras/functions/r-inspired/advanced-analytics && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built r-regression-functions"

cd extras/functions/r-inspired/data-manipulation && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built r-set-functions"

cd extras/functions/r-inspired/data-types && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built r-factor-functions"

cd extras/functions/r-inspired/graphics && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built graphics-functions"

cd extras/functions/r-inspired/math-stats && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built r-summary-functions"

cd extras/functions/r-inspired/signal-processing && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built r-timeseries-functions"

cd extras/functions/scipy-inspired/interpolation && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built sp-interpolation-functions"

cd extras/functions/scipy-inspired/stats && npx webpack --config src/webpack.bundle.config.js && cd ../../../..
print_success "Built sp-stats-functions"

cd extras/functions/sympy-inspired && npx webpack --config src/webpack.bundle.config.js && cd ../../..
print_success "Built sympy-functions"

# Show results
print_info "Build Summary:"
echo ""
echo "ADDRESS handlers (8):"
ls -lh ../dist/addresses/ 2>/dev/null | grep -v "^total" | awk '{print "  " $5 " " $9}' || echo "  (none)"
echo ""
echo "Function libraries (10):"
ls -lh ../dist/functions/ 2>/dev/null | grep -v "^total" | awk '{print "  " $5 " " $9}' || echo "  (none)"
echo ""

print_success "Build complete! All 18 modules built successfully."