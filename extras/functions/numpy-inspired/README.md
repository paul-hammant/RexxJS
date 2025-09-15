# NumPy-Inspired Functions - REXX Reference Guide

A comprehensive implementation of NumPy-inspired functions accessible from REXX. This is the **lightweight, fast-startup** option with JavaScript implementations that provide good accuracy for most use cases.

## 🚀 **Quick Start**

```rexx
-- Load the NumPy-inspired functions
REQUIRE "numpy-inspired"

-- Use any function immediately (no initialization needed)
LET matrix = "[[4, 1], [1, 3]]"
LET eigenvals = EIGVALS matrix=matrix
SAY "Eigenvalues: " || eigenvals
```

## 📚 **Complete Function Reference**

### **Array Creation Functions**

#### `ZEROS(shape)`
Create array filled with zeros
```rexx
LET arr1 = ZEROS shape="5"           -- [0,0,0,0,0]
LET arr2 = ZEROS shape="[2,3]"       -- [[0,0,0],[0,0,0]]
```

#### `ONES(shape)`
Create array filled with ones
```rexx
LET arr1 = ONES shape="3"            -- [1,1,1]
LET arr2 = ONES shape="[2,2]"        -- [[1,1],[1,1]]
```

#### `FULL(shape, fill_value)`
Create array filled with specified value
```rexx
LET arr = FULL shape="[2,3]" fill_value=7  -- [[7,7,7],[7,7,7]]
```

#### `EYE(n)` / `IDENTITY(n)`
Create identity matrix
```rexx
LET identity = EYE n=3               -- [[1,0,0],[0,1,0],[0,0,1]]
```

#### `ARANGE(start, stop, step)`
Create array with evenly spaced values
```rexx
LET arr1 = ARANGE start=0 stop=5 step=1      -- [0,1,2,3,4]
LET arr2 = ARANGE start=0 stop=10 step=2     -- [0,2,4,6,8]
```

#### `LINSPACE(start, stop, num)`
Create array with linearly spaced values
```rexx
LET arr = LINSPACE start=0 stop=1 num=5      -- [0,0.25,0.5,0.75,1]
```

#### `LOGSPACE(start, stop, num, base)`
Create array with logarithmically spaced values
```rexx
LET arr = LOGSPACE start=1 stop=3 num=3 base=10  -- [10,100,1000]
```

### **Mathematical Functions**

#### Trigonometric Functions
```rexx
-- Basic trigonometry
LET sin_vals = SIN x="[0, 1.5708, 3.1416]"   -- sin(0°, 90°, 180°)
LET cos_vals = COS x="[0, 1.5708, 3.1416]"   -- cos values
LET tan_vals = TAN x="[0, 0.7854, 1.5708]"   -- tan values

-- Inverse trigonometry  
LET arcsin_vals = ARCSIN x="[0, 0.5, 1]"     -- arcsin values
LET arccos_vals = ARCCOS x="[1, 0.5, 0]"     -- arccos values
LET arctan_vals = ARCTAN x="[0, 1, 1.732]"   -- arctan values
```

#### Hyperbolic Functions
```rexx
LET sinh_vals = SINH x="[0, 1, 2]"           -- hyperbolic sine
LET cosh_vals = COSH x="[0, 1, 2]"           -- hyperbolic cosine
LET tanh_vals = TANH x="[0, 1, 2]"           -- hyperbolic tangent
```

#### Exponential & Logarithmic Functions
```rexx
LET exp_vals = EXP x="[0, 1, 2]"             -- e^x
LET log_vals = LOG x="[1, 2.718, 7.389]"     -- natural log
LET log10_vals = LOG10 x="[1, 10, 100]"      -- base-10 log
LET log2_vals = LOG2 x="[1, 2, 4, 8]"        -- base-2 log
```

#### Other Mathematical Functions
```rexx
LET sqrt_vals = SQRT x="[1, 4, 9, 16]"       -- square root
LET square_vals = SQUARE x="[1, 2, 3, 4]"    -- x²
LET abs_vals = ABS x="[-2, -1, 0, 1, 2]"     -- absolute value
LET sign_vals = SIGN x="[-5, 0, 5]"          -- sign function (-1, 0, 1)
```

### **Statistical Functions**

#### Basic Statistics
```rexx
LET data = "[1, 2, 3, 4, 5]"
LET mean_val = MEAN a=data                    -- 3.0
LET median_val = MEDIAN a=data                -- 3.0
LET std_val = STD a=data                      -- standard deviation
LET var_val = VAR a=data                      -- variance
```

#### Aggregation Functions
```rexx
LET data = "[1, 2, 3, 4, 5]"
LET sum_val = SUM a=data                      -- 15
LET prod_val = PROD a=data                    -- 120
LET min_val = AMIN a=data                     -- 1
LET max_val = AMAX a=data                     -- 5
```

### **Linear Algebra Functions**

#### Basic Matrix Operations
```rexx
LET matrix_a = "[[1, 2], [3, 4]]"
LET matrix_b = "[[2, 0], [1, 2]]"
LET vector_a = "[1, 2, 3]"
LET vector_b = "[4, 5, 6]"

-- Dot product
LET dot_result = DOT a=matrix_a b=matrix_b    -- Matrix multiplication
LET vec_dot = DOT a=vector_a b=vector_b       -- Vector dot product: 32

-- Matrix multiplication (same as DOT for 2D)
LET matmul_result = MATMUL a=matrix_a b=matrix_b
```

#### Matrix Properties
```rexx
LET matrix = "[[1, 2], [3, 4]]"
LET det_val = DET matrix=matrix               -- -2.0
LET slogdet_result = SLOGDET matrix=matrix    -- {sign: -1, logdet: 0.693}
```

#### Matrix Inversion & Solving
```rexx
LET matrix = "[[2, 1], [1, 2]]"
LET inv_result = INV matrix=matrix            -- Matrix inverse

LET coeffs = "[[2, 1], [1, 2]]"
LET constants = "[3, 3]"
LET solution = SOLVE a=coeffs b=constants     -- Solve Ax = b

-- Pseudo-inverse (for non-square matrices)
LET rect_matrix = "[[1, 2], [3, 4], [5, 6]]"
LET pinv_result = PINV matrix=rect_matrix
```

#### **Eigenvalue Functions** ⚠️
```rexx
LET matrix = "[[4, 1], [1, 3]]"

-- Eigenvalues only
LET eigenvals = EIGVALS matrix=matrix         -- ~60% NumPy compatibility

-- Full eigendecomposition  
LET eig_result = EIG matrix=matrix            -- Returns {eigenvalues, eigenvectors}
SAY "Eigenvalues: " || eig_result.eigenvalues
SAY "Eigenvectors: " || eig_result.eigenvectors

-- For symmetric matrices
LET symmetric = "[[2, 1], [1, 2]]" 
LET eigh_result = EIGH matrix=symmetric       -- Optimized for symmetric matrices
```

**⚠️ Eigenvalue Limitations:**
- Uses power iteration (not QR decomposition like NumPy)
- ~60% match rate with NumPy on complex matrices
- Finds dominant REAL eigenvalues only
- Matrix size limited to 4x4
- For 100% NumPy compatibility, see [numpy-via-pyoide](../numpy-via-pyoide/)

### **Random Number Generation**

#### Basic Random Functions
```rexx
-- Seed for reproducibility
CALL SEED value=42

-- Random arrays
LET rand1 = RAND shape="5"                    -- 5 random numbers [0,1)
LET rand2 = RAND shape="[2,3]"                -- 2x3 random matrix
LET randn1 = RANDN shape="5"                  -- 5 normal distribution numbers
```

#### Integer Random Numbers
```rexx
LET randint1 = RANDINT low=1 high=10 size="5"        -- 5 integers [1,10)
LET randint2 = RANDINT low=0 high=100 size="[2,2]"   -- 2x2 integer matrix
```

#### Distribution Sampling
```rexx
LET choices = "[1, 2, 3, 4, 5]"
LET sampled = CHOICE a=choices size="3"       -- Sample 3 elements

-- Normal distribution
LET normal = NORMAL loc=0 scale=1 size="5"    -- Mean=0, StdDev=1

-- Uniform distribution  
LET uniform = UNIFORM low=0 high=10 size="3"  -- Uniform [0,10)
```

### **Array Manipulation Functions**

#### Shape Operations
```rexx
LET array = "[[1, 2, 3], [4, 5, 6]]"
LET shape_info = SHAPE a=array                -- [2, 3]
LET reshaped = RESHAPE a=array newshape="[3,2]" -- [[1,2],[3,4],[5,6]]
LET transposed = TRANSPOSE a=array            -- [[1,4],[2,5],[3,6]]
```

#### Flattening & Combining
```rexx
LET matrix = "[[1, 2], [3, 4]]"
LET flat1 = RAVEL a=matrix                    -- [1, 2, 3, 4]
LET flat2 = FLATTEN a=matrix                  -- [1, 2, 3, 4]

-- Concatenation
LET arr1 = "[[1, 2], [3, 4]]"
LET arr2 = "[[5, 6], [7, 8]]"
LET combined = CONCATENATE arrays="[arr1, arr2]" axis=0  -- Vertical stack
LET hcombined = HSTACK arrays="[arr1, arr2]"            -- Horizontal stack
LET vcombined = VSTACK arrays="[arr1, arr2]"            -- Vertical stack
```

## ⚡ **Performance & Accuracy Comparison**

| Feature Category    | numpy-inspired      | [numpy-via-pyoide](../numpy-via-pyoide/) |
|---------------------|---------------------|-------------------------------------------|
| **Startup Time**    | ✅ Instant (~1ms)    | ⏳ ~10 seconds (PyOdide load)            |
| **Function Calls**  | ✅ ~1ms per call     | ✅ ~1ms per call (after init)            |
| **Bundle Size**     | ✅ ~50KB lightweight | ⏳ ~15MB (includes full Python)          |
| **Basic Functions** | ✅ Comprehensive     | ✅ Comprehensive                          |
| **Eigenvalues**     | ⚠️ ~60% NumPy match  | ✅ 100% NumPy identical                   |

## ⚠️ **Algorithm Limitations and Accuracy Caveats**

### **Important Note on Implementation Accuracy**

This module provides **JavaScript approximations** of NumPy functions, prioritizing speed and lightweight deployment over mathematical precision. **All functions may have accuracy differences compared to NumPy**, with eigenvalue functions being subject to the most comprehensive analysis.

### **Eigenvalue Functions - Detailed Analysis**

Our eigenvalue implementation (`EIG`, `EIGH`, `EIGVALS`) uses **power iteration with deflation**, which differs significantly from NumPy's **QR decomposition (LAPACK)** approach. This leads to expected differences in results.

#### **🎯 When Eigenvalue Functions Work Well (95-100% NumPy Compatible)**

- **Small matrices (1x1, 2x2)**: Perfect compatibility
- **Diagonal matrices**: Exact eigenvalue extraction  
- **Identity matrices**: Perfect results
- **Upper/lower triangular**: High accuracy
- **Well-conditioned symmetric matrices**: Good accuracy

#### **⚠️ Known Eigenvalue Limitations**

1. **Eigenvalue Count Differences**
   - **NumPy**: Finds ALL eigenvalues (including complex pairs)
   - **Our Implementation**: Finds dominant REAL eigenvalues only
   - **Impact**: May return fewer eigenvalues than NumPy

2. **Complex Eigenvalue Handling**
   - **NumPy**: Full complex eigenvalue support
   - **Our Implementation**: Real eigenvalues only (skips pure imaginary)
   - **Example**: Rotation matrices with pure imaginary eigenvalues

3. **Accuracy on Large/Complex Matrices**
   - **NumPy**: Machine precision via LAPACK
   - **Our Implementation**: Iterative approximation (tolerance: 1e-10)
   - **Impact**: May have larger numerical errors on ill-conditioned matrices

#### **📊 Eigenvalue Compatibility Matrix**

| Matrix Type | Compatibility | Notes |
|-------------|---------------|-------|
| 1x1 matrices | 100% | Perfect match |
| 2x2 simple | 100% | Excellent accuracy |
| 2x2 diagonal | 100% | Exact eigenvalues |
| 2x2 identity | 100% | Perfect results |
| 3x3 triangular | 95% | Very good accuracy |
| 3x3 symmetric | 70% | Good for dominant eigenvalues |
| 4x4+ complex | 50% | Algorithm differences apparent |
| Rotation-like | 0% | No real eigenvalues found |

#### **Expected Limitations in Other Functions**

While eigenvalue functions received detailed analysis, **similar accuracy differences should be expected** across other mathematical functions including:

- **Linear algebra operations** (matrix decomposition, solving linear systems)
- **Advanced statistical functions** (distribution fitting, hypothesis tests)
- **Numerical integration and optimization**
- **Complex number operations**
- **High-precision mathematical constants**

These differences reflect the trade-off between performance/size and mathematical precision inherent in JavaScript implementations versus native LAPACK/BLAS libraries.

#### **🚀 Recommended Use Cases**

✅ **Good for:**
- Educational/demo purposes
- Simple matrix analysis
- Dominant eigenvalue extraction
- Lightweight applications without external dependencies
- Small to medium well-conditioned matrices

❌ **Not recommended for:**
- Scientific computing requiring full precision
- Complex eigenvalue analysis
- Large matrix decomposition
- Production applications requiring NumPy compatibility

#### **🐍 When to Use Real NumPy Instead**

For applications requiring full NumPy compatibility, consider using **[numpy-via-pyoide](../numpy-via-pyoide/)** which provides 100% authentic NumPy results through PyOdide integration.

| **Complex Numbers** | ❌ Limited support   | ✅ Full complex support                   |
| **Large Matrices**  | ❌ Limited to 4x4    | ✅ No size limits                         |
| **Error Handling**  | ✅ Standard REXX     | ✅ Enhanced Python errors                 |
| **Offline Use**     | ✅ Full offline      | ✅ Full offline (after PyOdide load)     |
| **REXX Experience** | ✅ Identical syntax  | ✅ Identical syntax                       |

## 🎯 **When to Use Each Option**

### **Use numpy-inspired (this module) When:**
✅ **Fast startup is critical** (demos, interactive use)  
✅ **Bundle size matters** (embedded applications)  
✅ **Simple matrices** (2x2, 3x3 operations)  
✅ **Educational purposes** (learning linear algebra)  
✅ **Basic mathematical functions** (sin, cos, sqrt, etc.)  
✅ **Good-enough accuracy** is acceptable  

### **Use [numpy-via-pyoide](../numpy-via-pyoide/) When:**
🎯 **Scientific computing accuracy required**  
🎯 **Complex eigenvalue analysis needed**  
🎯 **Large matrix operations** (5x5+ matrices)  
🎯 **Production applications** with strict accuracy requirements  
🎯 **100% NumPy compatibility** is essential  
🎯 **Can tolerate 10-second startup** for perfect results  

## 🔄 **Switching Between Implementations**

The REXX code is **100% identical** between both options - only change the REQUIRE line:

```rexx
-- Option 1: Fast startup, good accuracy
REQUIRE "numpy-inspired"

-- Option 2: Slower startup, perfect accuracy  
-- REQUIRE "numpy-via-pyoide"

-- All code below is identical for both options
LET matrix = "[[4, 1], [1, 3]]"
LET eigenvals = EIGVALS matrix=matrix
LET det_result = DET matrix=matrix
SAY "Eigenvalues: " || eigenvals
SAY "Determinant: " || det_result
```

## 🛠️ **Error Handling**

```rexx
-- Standard REXX error handling works with all functions
SIGNAL ON ERROR

LET matrix = "[[1, 2], [3, 4]]"
LET result = EIGVALS matrix=matrix
SIGNAL OFF ERROR
GOTO CONTINUE

ERROR:
SAY "Error occurred: " || CONDITION('D')
RETURN

CONTINUE:
SAY "Result: " || result
```

## 📖 **Algorithm Details**

This implementation uses pure JavaScript algorithms:
- **Eigenvalues**: Power iteration with deflation
- **Matrix inversion**: Gauss-Jordan elimination
- **Linear solving**: LU decomposition
- **Statistics**: Direct mathematical computation

For algorithms identical to NumPy (LAPACK-based), see [numpy-via-pyoide](../numpy-via-pyoide/).

---

**💡 Need 100% NumPy compatibility?** Switch to [numpy-via-pyoide](../numpy-via-pyoide/) - same REXX syntax, perfect accuracy!