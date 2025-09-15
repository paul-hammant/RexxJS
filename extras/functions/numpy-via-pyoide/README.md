# Real NumPy via PyOdide - 100% Compatible Option

**Authentic NumPy** with perfect accuracy through PyOdide integration. This module provides **100% NumPy compatibility** by running real Python NumPy, not JavaScript approximations.

## 🔄 **Identical REXX Experience**

The REXX syntax is **100% identical** to [numpy-inspired](../numpy-inspired/). Only the REQUIRE line differs:

```rexx
-- This module: 100% NumPy accuracy, slower startup
REQUIRE "numpy-via-pyoide"

-- Alternative: Fast startup, ~60% accuracy  
-- REQUIRE "numpy-inspired"

-- All code below is IDENTICAL for both options
LET matrix = "[[4, 1], [1, 3]]"
LET eigenvals = EIGVALS matrix=matrix
LET complex_matrix = "[[0, -1], [1, 0]]"
LET complex_eigenvals = EIGVALS matrix=complex_matrix  -- Finds complex eigenvalues!
SAY "Eigenvalues: " || eigenvals
```

## 📚 **Complete Function Reference**

👉 **See [numpy-inspired README](../numpy-inspired/README.md)** for the complete REXX function reference with examples. All functions work identically.

## 🎯 **Key Differences: Performance vs Accuracy**

| Aspect | numpy-inspired | **numpy-via-pyoide (this module)** |
|--------|----------------|-------------------------------------|
| **REXX Syntax** | ✅ Identical | ✅ Identical |
| **Startup Time** | ✅ Instant (~1ms) | ⏳ ~10 seconds (PyOdide load) |
| **Function Calls** | ✅ ~1ms per call | ✅ ~1ms per call (after warmup) |
| **Eigenvalue Accuracy** | ⚠️ ~60% NumPy match | ✅ **100% NumPy identical** |
| **Complex Numbers** | ❌ Limited | ✅ **Full complex support** |
| **Matrix Size Limits** | ❌ 4x4 maximum | ✅ **No limits** |
| **Bundle Size** | ✅ ~50KB | ⏳ ~15MB |
| **Algorithm** | JavaScript approximation | **Real Python NumPy** |

## 🚀 **Implementation Details**

### **Under the Hood**
- **Real NumPy**: Executes authentic Python NumPy via PyOdide
- **LAPACK Algorithms**: Same numerical libraries as installing NumPy
- **No Approximations**: 100% identical results to `pip install numpy`
- **Existing Infrastructure**: Leverages `extras/addresses/pyodide/`

### **Session Management**
```rexx
-- First function call initializes PyOdide session (~10 seconds)
LET result1 = EIGVALS matrix="[[1,2],[3,4]]"  -- 10 seconds (cold start)

-- Subsequent calls are fast (~1ms each)
LET result2 = EIGVALS matrix="[[2,1],[1,2]]"  -- 1ms (warm)
LET result3 = DET matrix="[[1,2],[3,4]]"      -- 1ms (warm)
```

### **Complex Eigenvalue Example**
```rexx
-- Rotation matrix with pure imaginary eigenvalues
LET rotation = "[[0, -1], [1, 0]]"
LET eigenvals = EIGVALS matrix=rotation

-- numpy-inspired: Misses complex eigenvalues (finds 0 eigenvalues)
-- numpy-via-pyoide: Finds ±i correctly (2 complex eigenvalues)
SAY "Complex eigenvalues: " || eigenvals
```

### **Large Matrix Example**  
```rexx
-- 10x10 matrix (beyond numpy-inspired 4x4 limit)
LET large_identity = EYE n=10
LET large_det = DET matrix=large_identity  -- Works perfectly
SAY "10x10 determinant: " || large_det     -- Outputs: 1.0
```

## 🎯 **When to Choose This Option**

### **Use numpy-via-pyoide (this module) When:**
✅ **Scientific computing accuracy required**  
✅ **Complex eigenvalue analysis needed**  
✅ **Large matrix operations** (5x5+ matrices)  
✅ **Production applications** requiring perfect results  
✅ **Research/academic work** where accuracy is critical  
✅ **Can tolerate 10-second startup** for perfect results  

### **Use [numpy-inspired](../numpy-inspired/) When:**
⚡ **Fast startup is critical** (demos, interactive use)  
⚡ **Bundle size matters** (embedded applications)  
⚡ **Simple matrices** (2x2, 3x3 operations)  
⚡ **Educational purposes** (learning linear algebra)  
⚡ **Good-enough accuracy** is acceptable  

## 🌐 **Web & Node.js Compatibility**

### **Node.js Usage**
```javascript
const numpy = require('./numpy');
await numpy.initializePyodide();
const result = await numpy.eigvals([[1,2],[3,4]]);
```

### **Browser Usage**
```html
<!-- 1. Include PyOdide -->
<script src="https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js"></script>

<!-- 2. Include PyOdide ADDRESS handler -->
<script src="../../addresses/pyodide/src/pyodide-address.js"></script>

<!-- 3. Include NumPy via PyOdide -->
<script src="numpy.js"></script>

<script>
async function useRealNumPy() {
  // Initialize PyOdide session
  await numpy.initializePyodide();
  
  // Use authentic NumPy functions
  const matrix = [[2, 1], [1, 2]];
  const eigenvals = await numpy.eigvals(matrix);
  console.log('100% NumPy eigenvalues:', eigenvals);
}

useRealNumPy();
</script>
```

**⚠️ Browser Requirements:**
- PyOdide ADDRESS handler must be loaded before numpy.js
- PyOdide itself must be available globally
- All dependencies are automatically detected and loaded

## 📖 **Dependencies**

- **PyOdide**: Automatically loaded via existing `extras/addresses/pyodide/`
- **NumPy**: Automatically installed when PyOdide initializes
- **No Additional Setup**: Leverages existing project infrastructure
- **Web Compatible**: Works in both Node.js and browsers

## 🔄 **Migration Path**

Switching is trivial - change one line:

```rexx
-- From: Fast approximations
-- REQUIRE "numpy-inspired"

-- To: Perfect accuracy
REQUIRE "numpy-via-pyoide"

-- Everything else stays identical!
```

---

**💡 For complete function documentation with REXX examples**, see the [numpy-inspired README](../numpy-inspired/README.md) - all examples work identically with this module, but with **100% NumPy accuracy**!