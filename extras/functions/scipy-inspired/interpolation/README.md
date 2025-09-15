# SciPy Interpolation Functions

This library provides SciPy-style interpolation functions for RexxJS, enabling advanced interpolation, spline fitting, and numerical approximation capabilities within REXX scripts.

## Quick Start

```rexx
REQUIRE "scipy-inspired/interpolation"
LET x = [0, 1, 2, 3, 4]
LET y = [0, 1, 4, 9, 16]
LET interpolator = INTERP1D(x, y, {kind: "cubic"})
LET result = interpolator.interpolate([1.5, 2.5])
SAY "Interpolated values:" result
```

## Installation

```bash
npm install
npm test
```

## Function Categories

### 1D Interpolation

#### Basic Interpolation
- **INTERP1D(x, y, options)** - 1D interpolation with multiple methods
  - `kind`: 'linear', 'cubic', 'quadratic', 'nearest'
  - `bounds_error`: Handle out-of-bounds values
  - `fill_value`: Value for out-of-bounds points
- **PCHIP(x, y, options)** - Piecewise Cubic Hermite Interpolation
- **AKIMA1D(x, y, options)** - Shape-preserving Akima interpolation

#### Advanced Splines
- **CUBIC_SPLINE(x, y, options)** - Cubic splines with boundary conditions
  - `bc_type`: 'natural', 'not-a-knot', 'clamped', 'periodic'
  - `extrapolate`: Allow extrapolation beyond data bounds
- **UNISPLINE(x, y, options)** - Univariate smoothing splines
  - `s`: Smoothing factor
  - `w`: Weights for data points
- **LSQ_SPLINE(x, y, t, options)** - Least-squares spline fitting
  - `t`: Knot locations
  - `k`: Spline degree
  - `w`: Weights

#### Specialized Methods
- **BARYCENTRIC(x, y, options)** - Barycentric Lagrange interpolation
- **KROGH(x, y, options)** - Krogh interpolation using divided differences

### 2D Interpolation

#### Grid-Based Interpolation
- **INTERP2D(x, y, z, options)** - 2D interpolation on regular grids
  - `kind`: 'linear', 'cubic', 'quintic'
  - Bilinear and bicubic interpolation
- **REGULARGRID(points, values, options)** - Fast interpolation on regular grids
  - `method`: 'linear', 'nearest', 'cubic'
  - Multi-dimensional support

#### Scattered Data Interpolation
- **GRIDDATA(points, values, xi, options)** - Interpolate scattered data
  - `method`: 'nearest', 'linear', 'cubic'
  - Delaunay triangulation-based
- **RBF(x, y, function, options)** - Radial Basis Function interpolation
  - `function`: 'gaussian', 'multiquadric', 'inverse', 'linear', 'cubic'
  - `epsilon`: RBF shape parameter

### B-spline Functions

#### B-spline Operations
- **SPLREP(x, y, options)** - B-spline representation
  - `s`: Smoothing factor
  - `k`: Spline degree
  - `t`: Knot sequence
- **SPLEV(tck, x, options)** - Evaluate B-spline
  - `der`: Derivative order
  - `ext`: Extrapolation behavior

#### Parametric Splines
- **SPLPREP(x, options)** - Parametric spline preparation
  - `u`: Parameter values
  - `s`: Smoothing factor
  - `k`: Spline degree
- **SPLEV(tck, u, options)** - Evaluate parametric spline

### Piecewise Polynomials

#### Polynomial Representation
- **PPOLY(c, x, options)** - Piecewise polynomial
  - `c`: Coefficient matrix
  - `x`: Breakpoints
  - `extrapolate`: Extrapolation behavior

## Usage Examples

### Basic 1D Interpolation

```rexx
REQUIRE "scipy-inspired/interpolation"

-- Create sample data
LET x = [0, 1, 2, 3, 4, 5]
LET y = SIN(x)  -- Sine function values

-- Linear interpolation
LET linearInterp = INTERP1D(x, y, {kind: "linear"})
LET linearResult = linearInterp.interpolate([0.5, 1.5, 2.5])

-- Cubic spline interpolation
LET cubicInterp = INTERP1D(x, y, {kind: "cubic"})
LET cubicResult = cubicInterp.interpolate([0.5, 1.5, 2.5])

-- Compare results
PLOT(x, y, type="p", main="Interpolation Comparison")
LET xFine = SEQ(0, 5, by=0.1)
LINES(xFine, linearInterp.interpolate(xFine), col="red", lty=2)
LINES(xFine, cubicInterp.interpolate(xFine), col="blue")
LEGEND("topright", legend=c("Data", "Linear", "Cubic"), 
       col=c("black", "red", "blue"), pch=c(1, NA, NA), lty=c(NA, 2, 1))
```

### 2D Grid Interpolation

```rexx
REQUIRE "scipy-inspired/interpolation"

-- Create 2D grid data
LET x = [0, 1, 2, 3]
LET y = [0, 1, 2]
LET z = MATRIX([
    [0, 1, 4],
    [1, 2, 5], 
    [4, 5, 8],
    [9, 10, 13]
], nrow=4, ncol=3)

-- Create 2D interpolator
LET interp2d = INTERP2D(x, y, z, {kind: "linear"})

-- Interpolate at new points
LET xiNew = [0.5, 1.5, 2.5]
LET yiNew = [0.5, 1.5]
LET zInterp = interp2d.interpolate(xiNew, yiNew)

-- Regular grid interpolation (faster for regular grids)
LET gridInterp = REGULARGRID([x, y], z, {method: "linear"})
LET zGrid = gridInterp.interpolate([[0.5, 0.5], [1.5, 1.5]])
```

### Scattered Data Interpolation

```rexx
REQUIRE "scipy-inspired/interpolation"

-- Generate scattered data points
LET nPoints = 50
SET_SEED(42)
LET xScattered = RUNIF(nPoints, 0, 10)
LET yScattered = RUNIF(nPoints, 0, 10)
LET zScattered = SIN(xScattered) * COS(yScattered) + RNORM(nPoints, 0, 0.1)

-- Create regular grid for interpolation
LET xGrid = SEQ(0, 10, length.out=20)
LET yGrid = SEQ(0, 10, length.out=20)
LET gridPoints = EXPAND_GRID(x=xGrid, y=yGrid)

-- Interpolate using griddata
LET scatteredPoints = CBIND(xScattered, yScattered)
LET griddataResult = GRIDDATA(scatteredPoints, zScattered, gridPoints, {method: "linear"})

-- Alternative: RBF interpolation
LET rbfInterp = RBF(scatteredPoints, zScattered, "gaussian", {epsilon: 1.0})
LET rbfResult = rbfInterp.interpolate(gridPoints)
```

### Shape-Preserving Interpolation

```rexx
REQUIRE "scipy-inspired/interpolation"

-- Monotonic data
LET x = [0, 1, 2, 3, 4, 5]
LET y = [0, 1, 1.5, 2, 3, 5]  -- Monotonically increasing

-- Standard cubic spline (may oscillate)
LET cubicSpline = INTERP1D(x, y, {kind: "cubic"})

-- PCHIP (preserves monotonicity)
LET pchipInterp = PCHIP(x, y)

-- Akima (shape-preserving)
LET akimaInterp = AKIMA1D(x, y)

-- Compare on fine grid
LET xFine = SEQ(0, 5, by=0.05)
LET cubicVals = cubicSpline.interpolate(xFine)
LET pchipVals = pchipInterp.interpolate(xFine)
LET akimaVals = akimaInterp.interpolate(xFine)

-- Plot comparison
PAR(mfrow=c(2, 2))
PLOT(x, y, main="Original Data", pch=19)
PLOT(xFine, cubicVals, type="l", main="Cubic Spline", col="red")
POINTS(x, y, pch=19)
PLOT(xFine, pchipVals, type="l", main="PCHIP", col="green")
POINTS(x, y, pch=19)
PLOT(xFine, akimaVals, type="l", main="Akima", col="blue")
POINTS(x, y, pch=19)
```

### Advanced Spline Fitting

```rexx
REQUIRE "scipy-inspired/interpolation"

-- Noisy data requiring smoothing
LET x = SEQ(0, 10, by=0.2)
LET yTrue = SIN(x) + 0.5 * COS(2*x)
LET yNoisy = yTrue + RNORM(LENGTH(x), 0, 0.2)

-- Exact interpolation (overfits noise)
LET exactSpline = CUBIC_SPLINE(x, yNoisy)

-- Smoothing spline (reduces overfitting)
LET smoothSpline = UNISPLINE(x, yNoisy, {s: 10})

-- Least-squares spline with custom knots
LET knots = SEQ(0, 10, by=1)  -- Coarser knots
LET lsqSpline = LSQ_SPLINE(x, yNoisy, knots, {k: 3})

-- Evaluate all splines
LET xEval = SEQ(0, 10, by=0.1)
LET exactVals = exactSpline.interpolate(xEval)
LET smoothVals = smoothSpline.interpolate(xEval)
LET lsqVals = lsqSpline.interpolate(xEval)

-- Plot comparison
PLOT(x, yNoisy, pch=1, main="Spline Smoothing Comparison")
LINES(xEval, exactVals, col="red", lwd=1)
LINES(xEval, smoothVals, col="green", lwd=2)
LINES(xEval, lsqVals, col="blue", lwd=2)
LINES(SEQ(0, 10, by=0.01), SIN(SEQ(0, 10, by=0.01)) + 0.5 * COS(2*SEQ(0, 10, by=0.01)), col="black", lty=2)
LEGEND("topright", legend=c("Data", "Exact", "Smoothing", "LSQ", "True"), 
       col=c("black", "red", "green", "blue", "black"),
       pch=c(1, NA, NA, NA, NA), lty=c(NA, 1, 1, 1, 2))
```

### Parametric Curve Interpolation

```rexx
REQUIRE "scipy-inspired/interpolation"

-- Define a 2D parametric curve (spiral)
LET t = SEQ(0, 4*PI, length.out=20)
LET x = t * COS(t)
LET y = t * SIN(t)

-- Prepare parametric spline
LET coords = LIST(x, y)  -- List of coordinate arrays
LET paramSpline = SPLPREP(coords, {s: 0})  -- No smoothing

-- Evaluate at finer parameter resolution
LET tFine = SEQ(0, 1, by=0.01)  -- Normalized parameter
LET interpCoords = paramSpline.evaluate(tFine)
LET xInterp = interpCoords[[1]]
LET yInterp = interpCoords[[2]]

-- Plot original and interpolated curves
PLOT(x, y, pch=19, main="Parametric Curve Interpolation", 
     xlab="X", ylab="Y", asp=1)
LINES(xInterp, yInterp, col="red", lwd=2)
LEGEND("topright", legend=c("Data Points", "Spline"), 
       col=c("black", "red"), pch=c(19, NA), lty=c(NA, 1))
```

### Radial Basis Function Interpolation

```rexx
REQUIRE "scipy-inspired/interpolation"

-- 2D RBF example with different basis functions
LET nData = 25
SET_SEED(123)
LET xData = RUNIF(nData, -2, 2)
LET yData = RUNIF(nData, -2, 2)
LET zData = EXP(-(xData^2 + yData^2))  -- Gaussian-like function

LET dataPoints = CBIND(xData, yData)

-- Create evaluation grid
LET xGrid = SEQ(-2, 2, by=0.1)
LET yGrid = SEQ(-2, 2, by=0.1) 
LET evalGrid = EXPAND_GRID(x=xGrid, y=yGrid)

-- Try different RBF functions
LET rbfGaussian = RBF(dataPoints, zData, "gaussian", {epsilon: 1.0})
LET rbfMultiquadric = RBF(dataPoints, zData, "multiquadric", {epsilon: 1.0})
LET rbfLinear = RBF(dataPoints, zData, "linear")

-- Evaluate on grid
LET zGaussian = rbfGaussian.interpolate(evalGrid)
LET zMultiquadric = rbfMultiquadric.interpolate(evalGrid)
LET zLinear = rbfLinear.interpolate(evalGrid)

-- Create contour plots for comparison
PAR(mfrow=c(2, 2))
FILLED_CONTOUR(xGrid, yGrid, MATRIX(zGaussian, nrow=LENGTH(xGrid)), 
               main="Gaussian RBF", color.palette=HEAT_COLORS)
FILLED_CONTOUR(xGrid, yGrid, MATRIX(zMultiquadric, nrow=LENGTH(xGrid)), 
               main="Multiquadric RBF", color.palette=HEAT_COLORS)
FILLED_CONTOUR(xGrid, yGrid, MATRIX(zLinear, nrow=LENGTH(xGrid)), 
               main="Linear RBF", color.palette=HEAT_COLORS)
```

### Performance Comparison

```rexx
REQUIRE "scipy-inspired/interpolation"

-- Generate test data
LET n = 100
LET x = SEQ(0, 10, length.out=n)
LET y = SIN(x) + 0.1 * RNORM(n)
LET xEval = SEQ(0, 10, length.out=1000)

-- Time different interpolation methods
FUNCTION timeInterpolation(method, x, y, xEval) {
    LET startTime = PROC_TIME()
    
    IF (method == "linear") {
        LET interp = INTERP1D(x, y, {kind: "linear"})
    } ELSE IF (method == "cubic") {
        LET interp = INTERP1D(x, y, {kind: "cubic"})
    } ELSE IF (method == "pchip") {
        LET interp = PCHIP(x, y)
    } ELSE IF (method == "akima") {
        LET interp = AKIMA1D(x, y)
    }
    
    LET result = interp.interpolate(xEval)
    LET endTime = PROC_TIME()
    
    RETURN LIST(time = endTime - startTime, result = result)
}

-- Benchmark different methods
LET methods = c("linear", "cubic", "pchip", "akima")
LET times = SAPPLY(methods, FUNCTION(m) timeInterpolation(m, x, y, xEval)$time)

-- Display results
LET timingDF = DATA_FRAME(method = methods, time_seconds = times)
PRINT(timingDF)

-- Plot timing comparison
BARPLOT(times, names.arg = methods, main="Interpolation Method Timing",
        ylab="Time (seconds)", col=RAINBOW(LENGTH(methods)))
```

## Error Handling

```rexx
REQUIRE "scipy-inspired/interpolation"

-- Safe interpolation wrapper
FUNCTION safeInterpolation(x, y, xi, method = "cubic") {
    LET result = TRY({
        LET interp = INTERP1D(x, y, {kind: method})
        interp.interpolate(xi)
    }, ERROR = {
        SAY "Interpolation failed with method:" method
        SAY "Falling back to linear interpolation"
        LET interp = INTERP1D(x, y, {kind: "linear"})
        interp.interpolate(xi)
    })
    
    RETURN result
}

-- Handle insufficient data
LET xShort = [1, 2]
LET yShort = [1, 4]
LET result = TRY({
    AKIMA1D(xShort, yShort)
}, ERROR = {
    SAY "Not enough data for Akima interpolation"
    SAY "Using linear interpolation instead"
    INTERP1D(xShort, yShort, {kind: "linear"})
})

-- Validate input data
FUNCTION validateData(x, y) {
    IF (LENGTH(x) != LENGTH(y)) {
        SAY "Error: x and y arrays must have same length"
        RETURN FALSE
    }
    
    IF (ANY(IS_NA(x)) || ANY(IS_NA(y))) {
        SAY "Warning: Data contains missing values"
    }
    
    IF (ANY(DUPLICATED(x))) {
        SAY "Warning: x contains duplicate values"
    }
    
    RETURN TRUE
}
```

## Performance Tips

- Use linear interpolation for simple cases and when speed is critical
- PCHIP and Akima are good for shape-preserving interpolation
- Use RBF for scattered data with smooth underlying functions
- Regular grid interpolation is fastest for grid-based data
- Consider data preprocessing (sorting, duplicate removal) for better performance
- Use appropriate smoothing for noisy data to avoid overfitting

## Integration

This library integrates with:
- RexxJS core interpreter
- R-inspired math and graphics functions
- Standard REXX variable and array systems
- REXX error handling and control flow
- Scientific computing workflows

## Testing

Run the comprehensive test suite:

```bash
npm test
```

Tests cover:
- All interpolation methods and variants
- 1D and 2D interpolation scenarios
- Scattered data interpolation
- Spline fitting and evaluation
- Parametric curve interpolation
- Error conditions and edge cases
- Performance and accuracy comparisons
- Integration with REXX interpreter

Part of the RexxJS extras collection.