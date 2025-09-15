# Using Real NumPy via Existing PyOdide ADDRESS for Full Compatibility

When our eigenvalue functions don't meet your precision requirements, you can use the **existing PyOdide ADDRESS** integration to run real NumPy with full compatibility.

## 🚀 Using the Existing PyOdide ADDRESS Integration

The project already includes a complete PyOdide integration at `extras/addresses/pyodide/`. You can leverage this directly without creating duplicate infrastructure.

### 1. REXX Script Approach (Recommended)

```rexx
-- Load the PyOdide ADDRESS integration
REQUIRE "pyodide-address"
ADDRESS PYODIDE

-- Load NumPy package
"load_package numpy"

-- Set up our test matrix
LET matrix_data = "[[1.2, 2.3, 0.5, 1.8], [0.9, 2.1, 1.7, 0.4], [1.5, 0.8, 2.9, 1.3], [0.7, 1.9, 0.6, 2.4]]"

-- Execute NumPy eigenvalue calculation
LET numpy_script = "import numpy as np" || CHR(10) ||,
                   "matrix = np.array(" || matrix_data || ")" || CHR(10) ||,
                   "eigenvals = np.linalg.eigvals(matrix)" || CHR(10) ||,
                   "print('NumPy eigenvalues:', eigenvals.tolist())" || CHR(10) ||,
                   "eigenvals.tolist()"

LET numpy_result = run code=numpy_script

-- Compare with our implementation
LET our_result = EIGVALS matrix=matrix_data

SAY "Our implementation: " || our_result
SAY "NumPy result: " || numpy_result
```

### 2. JavaScript Orchestration Using Existing ADDRESS

```javascript
const { RexxInterpreter } = require('../../core/src/interpreter');
const { parse } = require('../../core/src/parser');

// Load the existing PyOdide ADDRESS handler
const pyodideAddress = require('./extras/addresses/pyodide/src/pyodide-address');

async function compareWithNumpyViaPyodide(matrix) {
  // Use the existing ADDRESS handler directly
  const pyodideHandler = pyodideAddress.ADDRESS_PYODIDE_HANDLER;
  
  // Load NumPy
  await pyodideHandler('run', { 
    code: 'import numpy as np' 
  });
  
  // Set matrix in Python context
  await pyodideHandler('set_context', { 
    key: 'test_matrix', 
    value: matrix 
  });
  
  // Calculate eigenvalues with NumPy
  const numpyResult = await pyodideHandler('run', {
    code: `
import numpy as np
matrix = np.array(test_matrix)
eigenvals = np.linalg.eigvals(matrix)
eigenvals.tolist()
    `
  });
  
  // Compare with our implementation
  const ourImplementation = require('./numpy');
  const ourResult = ourImplementation.eigvals(matrix);
  
  return {
    numpy: numpyResult.result,
    ours: ourResult,
    match: compareEigenvalues(numpyResult.result, ourResult)
  };
}

function compareEigenvalues(numpy, ours, tolerance = 1e-3) {
  const minLength = Math.min(numpy.length, ours.length);
  for (let i = 0; i < minLength; i++) {
    const diff = Math.abs(numpy[i] - ours[i]);
    const relDiff = diff / (Math.abs(numpy[i]) + 1e-15);
    if (relDiff > tolerance) return false;
  }
  return true;
}
```

## ⚖️ When to Choose Each Approach

### Use Our Implementation When:
- ✅ Fast load times matter (instant vs ~10 seconds)
- ✅ Bundle size is critical (~50KB vs ~15MB)
- ✅ Simple matrices (2x2, 3x3)
- ✅ Educational/demo purposes
- ✅ Offline environments

### Use PyOdide + NumPy When:
- 🎯 Scientific computing accuracy required
- 🎯 Complex eigenvalue support needed
- 🎯 Large matrix analysis (5x5+)
- 🎯 Production applications
- 🎯 Full NumPy ecosystem access

## 📊 Performance Comparison

| Metric | Our Implementation | PyOdide + NumPy |
|--------|-------------------|------------------|
| Load Time | < 1ms | ~10 seconds |
| Bundle Size | ~50KB | ~15MB |
| 2x2 Matrix | ~0.1ms | ~1ms |
| 4x4 Matrix | ~1ms | ~2ms |
| Accuracy | Good | Perfect |
| Complex Numbers | ❌ | ✅ |
| Offline Support | ✅ | ✅ |

## 🎯 Hybrid Approach (Recommended)

```javascript
class SmartEigenvalueCalculator {
  constructor() {
    this.numpyRunner = null;
    this.fallbackReady = false;
  }

  async calculateEigenvalues(matrix, requirePrecision = false) {
    const size = matrix.length;
    
    // Use our fast implementation for simple cases
    if (!requirePrecision && size <= 3 && this.isWellConditioned(matrix)) {
      return require('./numpy').eigvals(matrix);
    }
    
    // Fall back to PyOdide for complex cases
    if (!this.fallbackReady) {
      this.numpyRunner = new NumpyRunner();
      await this.numpyRunner.initialize();
      this.fallbackReady = true;
    }
    
    return this.numpyRunner.eigenvalues(matrix);
  }

  isWellConditioned(matrix) {
    // Simple heuristic - check for diagonal dominance
    const n = matrix.length;
    for (let i = 0; i < n; i++) {
      const diag = Math.abs(matrix[i][i]);
      const offDiag = matrix[i].reduce((sum, val, j) => 
        i !== j ? sum + Math.abs(val) : sum, 0);
      if (diag < offDiag) return false;
    }
    return true;
  }
}
```

This gives you the best of both worlds: fast performance for simple cases, full precision when needed.