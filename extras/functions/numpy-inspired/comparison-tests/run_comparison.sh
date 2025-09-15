#!/bin/bash
# Test runner for eigenvalue implementation comparison via REXX interpreter

set -e

echo "🧪 NumPy vs REXX/JS Eigenvalue Comparison"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "../numpy.js" ]; then
    echo "❌ Error: Must run from comparison-tests directory"
    echo "   Expected: extras/functions/numpy-inspired/comparison-tests/"
    exit 1
fi

echo "🔍 Checking dependencies..."

# Check Python and NumPy
if command -v python3 &> /dev/null && python3 -c "import numpy" 2>/dev/null; then
    echo "✅ Python3 with NumPy found"
    HAS_PYTHON=true
else
    echo "⚠️  Python3 with NumPy not found - skipping Python tests"
    HAS_PYTHON=false
fi

# Check Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js found"
else
    echo "❌ Node.js not found"
    exit 1
fi

# Check REXX interpreter
if [ ! -f "../../../../core/src/interpreter.js" ]; then
    echo "❌ REXX interpreter not found at expected location"
    exit 1
fi

echo "✅ REXX interpreter found"
echo ""

# Clean previous results
rm -f python_eig_results.json rexx_js_eig_results.json

# Run Python tests if available
if [ "$HAS_PYTHON" = true ]; then
    echo "🐍 Running Python NumPy tests..."
    python3 test_eig_python.py
    echo ""
fi

# Run REXX/JS tests via interpreter
echo "🔧 Running REXX/JS implementation tests via interpreter..."
echo "========================================================"
node test_eig_rexx_js.js
echo ""

# Compare if both are available
if [ "$HAS_PYTHON" = true ] && [ -f "python_eig_results.json" ] && [ -f "rexx_js_eig_results.json" ]; then
    echo "🔍 Comparing implementations..."
    node compare_rexx_vs_python.js
    echo ""
    
    if [ $? -eq 0 ]; then
        echo "🎉 Comparison successful - REXX/JS implementation matches Python NumPy!"
    else
        echo "⚠️  Some differences found - this is expected due to algorithm differences"
    fi
else
    echo "📊 REXX/JS tests completed successfully!"
    echo "   (Install Python + NumPy for full comparison)"
fi

echo ""
echo "📄 Generated files:"
echo "   - rexx_js_eig_results.json: REXX/JS implementation results via interpreter"
if [ "$HAS_PYTHON" = true ]; then
    echo "   - python_eig_results.json: Python NumPy results"
fi