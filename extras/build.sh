#!/bin/bash
# Note: Using set +e for canvas projects to handle native compilation failures gracefully
set -e

# Load nvm and use Node.js v20 for better canvas compatibility
export NVM_DIR="$HOME/.config/nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20 || echo "Warning: Could not switch to Node.js v20, using system version"

echo "🚀 Starting comprehensive build for RexxJS extras..."
echo "📋 Using Node.js $(node --version) for build compatibility"

# All ADDRESS projects with builds
echo "📦 Building ADDRESS projects..."

echo "  - jq"
cd addresses/jq
npm install
npm run build:all
cd ../..

echo "  - anthropic-ai/claude"
cd addresses/anthropic-ai/claude
npm install
npm run build
cd ../../..

echo "  - sqlite3"
cd addresses/sqlite3
npm install
npm run build
cd ../..

echo "  - gemini-ai"
cd addresses/gemini-ai
npm install
npm run build
cd ../..

echo "  - pyodide"
cd addresses/pyodide
npm install
npm run build
cd ../..

echo "  - pyodide/src"
cd addresses/pyodide/src
npm install
npm run build
cd ../../..

echo "  - duckdb-wasm/src"
cd addresses/duckdb-wasm/src
npm install
npm run build
cd ../../..

echo "  - system"
cd addresses/system
npm install
npm run build
cd ../..

echo "  - container-and-vm-orchestration"
cd addresses/container-and-vm-orchestration
npm install
npm run build
cd ../..

echo "  - remote"
cd addresses/remote
npm install
npm run build
cd ../..

# FUNCTION projects with builds
echo "📦 Building FUNCTION projects..."

echo "  - excel"
cd functions/excel
npm install
npm run build
cd ../..

echo "  - graphviz/src"
cd functions/graphviz/src
npm install
npm run build
cd ../../..

echo "  - r-inspired/advanced-analytics"
cd functions/r-inspired/advanced-analytics
npm install
npm run build
cd ../../..

echo "  - r-inspired/data-manipulation"
cd functions/r-inspired/data-manipulation
npm install
npm run build
cd ../../..

echo "  - r-inspired/data-types"
cd functions/r-inspired/data-types
npm install
npm run build
cd ../../..

echo "  - r-inspired/graphics"
cd functions/r-inspired/graphics
npm install
npm run build
cd ../../..

echo "  - r-inspired/math-stats"
cd functions/r-inspired/math-stats
npm install
npm run build
cd ../../..

echo "  - r-inspired/signal-processing"
cd functions/r-inspired/signal-processing
npm install
npm run build
cd ../../..

echo "  - scipy-inspired/interpolation"
cd functions/scipy-inspired/interpolation
npm install
npm run build
cd ../../..

echo "  - scipy-inspired/stats/src"
cd functions/scipy-inspired/stats/src
npm install
npm run build
cd ../../../..

echo "  - sympy-inspired/src"
cd functions/sympy-inspired/src
npm install
npm run build
cd ../../..

# Projects that only need dependency installation
echo "📦 Installing dependencies for non-building projects..."

echo "  - open-ai/chat-completions"
cd addresses/open-ai/chat-completions
npm install
cd ../../..

echo "  - duckdb-wasm"
cd addresses/duckdb-wasm
npm install
cd ../..

echo "  - functions/graphviz"
cd functions/graphviz
npm install
cd ../..

echo "  - functions/r-inspired"
cd functions/r-inspired
npm install
cd ../..

echo "  - functions/scipy-inspired/stats"
cd functions/scipy-inspired/stats
npm install
cd ../../..

echo "  - functions/numpy-inspired"
cd functions/numpy-inspired
npm install
cd ../..

echo "  - functions/sympy-inspired"
cd functions/sympy-inspired
npm install
cd ../..

echo "  - functions/numpy-via-pyoide"
cd functions/numpy-via-pyoide
npm install
cd ../..

# Root extras package
echo "📦 Building root extras..."
npm install
npm run build:all

echo "✅ All builds completed!"
echo "📄 Generated bundles are ready for distribution to @dist/"