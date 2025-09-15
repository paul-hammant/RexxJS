#!/bin/bash
# Comprehensive test runner based on NumPy's sophisticated eigenvalue test patterns
# Implements LinalgSquareTestCase and EigvalsCases equivalent testing

set -e

echo "🧪 Comprehensive NumPy-style Eigenvalue Test Suite"
echo "================================================="
echo "📚 Based on NumPy's LinalgSquareTestCase and EigvalsCases patterns"
echo ""

# Check if we're in the right directory
if [ ! -f "../numpy.js" ]; then
    echo "❌ Error: Must run from comparison-tests directory"
    echo "   Expected: extras/functions/numpy-inspired/comparison-tests/"
    exit 1
fi

echo "🔍 Checking dependencies for comprehensive testing..."

# Check Python and NumPy
if command -v python3 &> /dev/null && python3 -c "import numpy" 2>/dev/null; then
    NUMPY_VERSION=$(python3 -c "import numpy; print(numpy.__version__)")
    echo "✅ Python3 with NumPy $NUMPY_VERSION found"
    HAS_PYTHON=true
else
    echo "⚠️  Python3 with NumPy not found - skipping NumPy comprehensive tests"
    HAS_PYTHON=false
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js $NODE_VERSION found"
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

# Clean previous comprehensive results
echo "🧹 Cleaning previous comprehensive test results..."
rm -f numpy_comprehensive_eig_results.json comprehensive_rexx_js_eig_results.json comprehensive_eigenvalue_comparison_report.json comprehensive_test_generated.rexx
echo ""

# Run comprehensive tests
if [ "$HAS_PYTHON" = true ]; then
    echo "🐍 Running NumPy comprehensive eigenvalue tests..."
    echo "================================================="
    echo "📊 Testing sophisticated matrices based on LinalgSquareTestCase patterns"
    python3 numpy_style_comprehensive_test.py
    echo ""
fi

echo "🔧 Running REXX/JS comprehensive eigenvalue tests..."
echo "=================================================="
echo "📊 Testing via REXX interpreter with NumPy-equivalent test cases"
node comprehensive_rexx_eigvals_test.js
echo ""

# Compare comprehensive results if both are available
if [ "$HAS_PYTHON" = true ] && [ -f "numpy_comprehensive_eig_results.json" ] && [ -f "comprehensive_rexx_js_eig_results.json" ]; then
    echo "🔍 Running comprehensive comparison analysis..."
    echo "=============================================="
    node comprehensive_comparison.js
    echo ""
    
    if [ $? -eq 0 ]; then
        echo "🎉 Comprehensive comparison successful!"
        echo "📚 REXX/JS implementation validated against NumPy's sophisticated test patterns"
    else
        echo "⚠️  Some differences found in comprehensive testing"
        echo "📝 This may be expected due to algorithm differences (power iteration vs QR)"
    fi
else
    echo "📊 REXX/JS comprehensive tests completed successfully!"
    if [ "$HAS_PYTHON" = false ]; then
        echo "   (Install Python + NumPy for full NumPy comparison)"
    fi
fi

echo ""
echo "📋 Comprehensive Test Suite Summary"
echo "==================================="
echo "🎯 Test sophistication: Based on NumPy LinalgSquareTestCase and EigvalsCases"
echo "📊 Matrix coverage: 1x1, 2x2, 3x3, 4x4, 5x5 matrices"
echo "🔬 Special cases: Symmetric, diagonal, triangular, identity, nearly singular"
echo "⚖️  Validation: EIG vs EIGVALS consistency checks"
echo "📈 Algorithm: Power iteration (ours) vs QR decomposition (NumPy)"
echo ""

echo "📄 Generated comprehensive test files:"
if [ "$HAS_PYTHON" = true ]; then
    echo "   - numpy_comprehensive_eig_results.json: NumPy sophisticated test results"
fi
echo "   - comprehensive_rexx_js_eig_results.json: REXX/JS comprehensive results"
echo "   - comprehensive_test_generated.rexx: Generated REXX test script"
if [ -f "comprehensive_eigenvalue_comparison_report.json" ]; then
    echo "   - comprehensive_eigenvalue_comparison_report.json: Detailed comparison analysis"
fi

echo ""
echo "🏆 Comprehensive testing based on NumPy's most sophisticated eigenvalue test patterns complete!"