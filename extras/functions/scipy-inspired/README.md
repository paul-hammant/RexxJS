# SciPy-Inspired Functions - REXX Reference Guide

A comprehensive implementation of SciPy-inspired scientific computing functions accessible from REXX. This module brings advanced scientific computing capabilities from the Python SciPy ecosystem to RexxJS environments.

## 🚀 **Quick Start**

```rexx
-- Load the SciPy-inspired functions
REQUIRE "scipy-inspired"

-- Statistical analysis
LET data = "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
LET stats = DESCRIBE x=data
SAY "Descriptive statistics: " || stats

-- Interpolation
LET x = "[0, 1, 2, 3, 4]"
LET y = "[0, 1, 4, 9, 16]"
LET interp = INTERP1D x=x y=y kind="cubic"
LET result = interp.interpolate "[1.5, 2.5]"
SAY "Interpolated values: " || result
```

## 📚 **Complete Function Reference**

### **Statistical Functions (`scipy.stats`)**

#### Continuous Distributions
```rexx
-- Normal distribution
LET norm_pdf = NORM_PDF x="[0, 1, 2]" mean=0 std=1      -- Probability density
LET norm_cdf = NORM_CDF x="[0, 1, 2]" mean=0 std=1      -- Cumulative distribution
LET norm_ppf = NORM_PPF p="[0.1, 0.5, 0.9]" mean=0 std=1  -- Percent point function

-- Student's t-distribution
LET t_pdf = T_PDF x="[0, 1, 2]" df=5                    -- t-distribution PDF
LET t_cdf = T_CDF x="[0, 1, 2]" df=5                    -- t-distribution CDF

-- Chi-squared distribution
LET chi2_pdf = CHI2_PDF x="[1, 2, 3]" df=2              -- Chi-squared PDF
LET chi2_cdf = CHI2_CDF x="[1, 2, 3]" df=2              -- Chi-squared CDF

-- F-distribution
LET f_pdf = F_PDF x="[1, 2, 3]" dfn=2 dfd=10            -- F-distribution PDF
```

#### Discrete Distributions
```rexx
-- Binomial distribution
LET binom_pmf = BINOM_PMF k="[0, 5, 10]" n=20 p=0.3     -- Binomial PMF
LET binom_cdf = BINOM_CDF k="[0, 5, 10]" n=20 p=0.3     -- Binomial CDF

-- Poisson distribution
LET poisson_pmf = POISSON_PMF k="[0, 2, 5]" mu=3        -- Poisson PMF
LET poisson_cdf = POISSON_CDF k="[0, 2, 5]" mu=3        -- Poisson CDF
```

#### Statistical Tests
```rexx
-- Independent samples t-test
LET group1 = "[23, 45, 56, 78, 32]"
LET group2 = "[34, 54, 67, 89, 43]"
LET ttest_result = TTEST_IND x=group1 y=group2
SAY "t-statistic: " || ttest_result.statistic || ", p-value: " || ttest_result.pvalue

-- Paired samples t-test
LET before = "[120, 135, 145, 160, 155]"
LET after = "[115, 130, 140, 150, 145]"
LET paired_ttest = TTEST_REL x=before y=after

-- Kolmogorov-Smirnov test
LET sample = "[1.2, 2.4, 1.8, 3.1, 2.9]"
LET ks_result = KSTEST x=sample distribution="norm"

-- Shapiro-Wilk test for normality
LET normality_test = SHAPIRO x=sample
```

#### Correlation Analysis
```rexx
-- Pearson correlation
LET x_vals = "[1, 2, 3, 4, 5]"
LET y_vals = "[2, 4, 6, 8, 10]"
LET pearson_r = PEARSONR x=x_vals y=y_vals
SAY "Correlation: " || pearson_r.correlation || ", p-value: " || pearson_r.pvalue

-- Spearman rank correlation
LET spearman_r = SPEARMANR x=x_vals y=y_vals
```

#### Descriptive Statistics
```rexx
LET data = "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"

-- Comprehensive descriptive statistics
LET desc_stats = DESCRIBE x=data                         -- Mean, std, min, max, quartiles
SAY desc_stats

-- Specialized means
LET geom_mean = GMEAN x=data                             -- Geometric mean
LET harm_mean = HMEAN x=data                             -- Harmonic mean
LET std_error = SEM x=data                               -- Standard error of mean

-- Distribution shape
LET skewness = SKEW x=data                               -- Skewness
LET kurt = KURTOSIS x=data                               -- Kurtosis

-- Mode calculation
LET mode_result = MODE x=data
```

### **Interpolation Functions (`scipy.interpolate`)**

#### 1D Interpolation
```rexx
-- Basic interpolation methods
LET x = "[0, 1, 2, 3, 4]"
LET y = "[0, 1, 4, 9, 16]"

LET linear_interp = INTERP1D x=x y=y kind="linear"
LET cubic_interp = INTERP1D x=x y=y kind="cubic" 
LET quad_interp = INTERP1D x=x y=y kind="quadratic"

-- Advanced interpolation
LET pchip_interp = PCHIP x=x y=y                         -- Shape-preserving
LET akima_interp = AKIMA1D x=x y=y                       -- Akima interpolation
LET spline_interp = CUBIC_SPLINE x=x y=y bc_type="natural"
```

#### 2D and Scattered Data Interpolation
```rexx
-- 2D grid interpolation
LET x_grid = "[0, 1, 2]"
LET y_grid = "[0, 1, 2]"
LET z_grid = "[[0, 1, 4], [1, 2, 5], [4, 5, 8]]"
LET interp2d = INTERP2D x=x_grid y=y_grid z=z_grid kind="linear"

-- Scattered data interpolation
LET points = "[[0, 0], [1, 1], [2, 0], [1, 2]]"
LET values = "[1, 2, 3, 4]"
LET xi = "[[0.5, 0.5], [1.5, 1.5]]"
LET griddata_result = GRIDDATA points=points values=values xi=xi method="linear"

-- Radial Basis Function interpolation
LET rbf_interp = RBF points=points values=values function="gaussian" epsilon=1.0
LET rbf_result = rbf_interp.interpolate xi=xi
```

### **Signal Processing (`scipy.signal`)**

#### Convolution and Correlation
```rexx
-- 1D convolution
LET signal1 = "[1, 2, 3, 4]"
LET signal2 = "[1, 1, 1]"
LET conv_result = CONVOLVE a=signal1 v=signal2 mode="full"

-- Cross-correlation
LET corr_result = CORRELATE a=signal1 v=signal2 mode="full"
```

#### Digital Filtering
```rexx
-- Apply digital filter
LET signal = "[1, 2, 1, 3, 2, 1, 4, 2]"
LET b_coeffs = "[0.25, 0.5, 0.25]"  -- Filter numerator
LET a_coeffs = "[1]"                 -- Filter denominator
LET filtered = LFILTER b=b_coeffs a=a_coeffs x=signal

-- Median filter
LET med_filtered = MEDFILT x=signal kernel_size=3
```

#### Spectral Analysis
```rexx
-- Periodogram
LET time_series = "[1, 2, 1, 3, 2, 1, 4, 2, 1, 3]"
LET freqs, psd = PERIODOGRAM x=time_series fs=1.0

-- Welch's method
LET welch_freqs, welch_psd = WELCH x=time_series fs=1.0 nperseg=4
```

### **Linear Algebra (`scipy.linalg`)**

#### Matrix Operations
```rexx
LET matrix = "[[2, 1], [1, 2]]"
LET vector = "[3, 3]"

-- Basic operations
LET inv_matrix = INV a=matrix                            -- Matrix inverse
LET det_val = DET a=matrix                               -- Determinant
LET norm_val = NORM x=matrix ord=2                       -- Matrix norm

-- Solve linear systems
LET solution = SOLVE a=matrix b=vector                   -- Solve Ax = b
```

#### Matrix Decompositions
```rexx
-- LU decomposition
LET P, L, U = LU a=matrix                                -- LU decomposition
-- QR decomposition  
LET Q, R = QR a=matrix                                   -- QR decomposition
-- SVD
LET U, s, Vt = SVD a=matrix                             -- Singular Value Decomposition
-- Eigendecomposition
LET eigenvals, eigenvecs = EIG a=matrix                  -- Eigenvalues and vectors
-- Cholesky decomposition (for positive definite matrices)
LET chol_matrix = "[[4, 2], [2, 2]]"
LET L_chol = CHOLESKY a=chol_matrix
```

### **Optimization (`scipy.optimize`)**

#### Function Minimization
```rexx
-- Minimize scalar function
LET result = MINIMIZE_SCALAR fun="x^2 + 2*x + 1" bounds="[-10, 10]"
SAY "Minimum at: " || result.x || ", value: " || result.fun

-- Minimize multivariate function
LET result_multi = MINIMIZE fun="x[0]^2 + x[1]^2" x0="[1, 1]" method="BFGS"
```

#### Root Finding
```rexx
-- Find roots of equation
LET root = FSOLVE fun="x^2 - 4" x0="1"                   -- Find root near x=1
LET brent_root = BRENTQ fun="x^2 - 4" a=0 b=5           -- Root in interval [0,5]
```

### **Fast Fourier Transform (`scipy.fft`)**

#### Discrete Fourier Transform
```rexx
-- 1D FFT
LET signal = "[1, 2, 3, 4]"
LET fft_result = FFT x=signal                            -- Forward FFT
LET ifft_result = IFFT x=fft_result                      -- Inverse FFT

-- 2D FFT
LET signal_2d = "[[1, 2], [3, 4]]"
LET fft2_result = FFT2 x=signal_2d                       -- 2D FFT
LET ifft2_result = IFFT2 x=fft2_result                   -- 2D inverse FFT
```

#### Specialized Transforms
```rexx
-- Discrete Cosine Transform
LET dct_result = DCT x=signal type=2                     -- DCT-II
LET idct_result = IDCT x=dct_result type=2               -- Inverse DCT-II

-- Discrete Sine Transform  
LET dst_result = DST x=signal type=1                     -- DST-I
```

## 📊 **Complete Analysis Workflows**

### Statistical Analysis Pipeline
```rexx
-- Load data
LET data = "[12, 15, 18, 20, 22, 25, 28, 30, 32, 35]"

-- Descriptive statistics
LET desc = DESCRIBE x=data
SAY "Dataset summary: " || desc

-- Test for normality
LET norm_test = SHAPIRO x=data
IF (norm_test.pvalue > 0.05) THEN DO
    SAY "Data appears normally distributed (p=" || norm_test.pvalue || ")"
    -- Use parametric tests
    LET ttest = TTEST_1SAMP x=data popmean=25
    SAY "One-sample t-test: t=" || ttest.statistic || ", p=" || ttest.pvalue
END
ELSE DO
    SAY "Data not normally distributed, using non-parametric tests"
END
```

### Signal Processing Pipeline
```rexx
-- Generate noisy signal
LET t = LINSPACE start=0 stop=1 num=100
LET clean_signal = SIN x=MULTIPLY a=t b="6.28"           -- 1 Hz sine wave
LET noise = RANDN size="100" scale=0.2
LET noisy_signal = ADD a=clean_signal b=noise

-- Filter the signal
LET filtered_signal = MEDFILT x=noisy_signal kernel_size=5

-- Spectral analysis
LET freqs, psd = WELCH x=filtered_signal fs=100 nperseg=25
-- Find dominant frequency
LET max_idx = ARGMAX a=psd
LET dominant_freq = INDEX array=freqs idx=max_idx
SAY "Dominant frequency: " || dominant_freq || " Hz"
```

### Interpolation and Curve Fitting
```rexx
-- Experimental data with gaps
LET x_data = "[0, 1, 3, 4, 6, 8, 10]"                   -- Missing points at 2, 5, 7, 9
LET y_data = "[1.0, 1.8, 4.2, 5.9, 8.8, 12.1, 16.3]"

-- Fill gaps using different methods
LET linear_fill = INTERP1D x=x_data y=y_data kind="linear"
LET cubic_fill = INTERP1D x=x_data y=y_data kind="cubic" 
LET pchip_fill = PCHIP x=x_data y=y_data

-- Evaluate at missing points
LET missing_x = "[2, 5, 7, 9]"
LET linear_est = linear_fill.interpolate x=missing_x
LET cubic_est = cubic_fill.interpolate x=missing_x
LET pchip_est = pchip_fill.interpolate x=missing_x

SAY "Linear estimates: " || linear_est
SAY "Cubic estimates: " || cubic_est  
SAY "PCHIP estimates: " || pchip_est
```

## ⚡ **Performance Considerations**

### Optimized for Scientific Computing
- **Vectorized operations**: Use array operations when possible
- **Memory efficient**: Optimized algorithms for large datasets
- **Numerical stability**: Robust implementations of mathematical functions
- **Error handling**: Comprehensive validation and error reporting

### Best Practices
```rexx
-- Vectorized operations are faster
LET large_array = RANDN size="10000"
LET result = MEAN x=large_array                          -- Better than loops

-- Use appropriate precision for your needs
LET high_precision = NORM_CDF x=data mean=0 std=1        -- Full precision
LET approx_result = NORM_CDF x=data mean=0 std=1 method="approx"  -- Faster approximation

-- Cache expensive computations
LET interp = INTERP1D x=x_data y=y_data kind="cubic"     -- Create once
LET result1 = interp.interpolate x=new_x1                -- Reuse multiple times
LET result2 = interp.interpolate x=new_x2
```

## 🛠️ **Error Handling and Validation**

```rexx
-- Handle statistical edge cases
SIGNAL ON ERROR

LET small_sample = "[1, 2]"
LET result = TRY({
    SHAPIRO x=small_sample
}, ERROR = {
    SAY "Sample too small for Shapiro-Wilk test"
    RETURN NULL
})

-- Validate interpolation inputs
LET x_vals = "[1, 2, 2, 3]"  -- Contains duplicate
LET y_vals = "[1, 4, 4, 9]"
LET interp_result = TRY({
    INTERP1D x=x_vals y=y_vals kind="cubic"
}, ERROR = {
    SAY "Input validation failed: " || CONDITION('D')
    -- Use linear interpolation with cleaned data
    LET clean_x, clean_y = REMOVE_DUPLICATES x=x_vals y=y_vals
    INTERP1D x=clean_x y=clean_y kind="linear"
})

SIGNAL OFF ERROR
```

## 📖 **Module Organization**

The SciPy-inspired functions are organized into specialized modules:

- **`stats/`**: Statistical distributions, tests, and descriptive statistics
- **`interpolation/`**: 1D/2D interpolation and spline fitting (comprehensive implementation)
- **`signal/`**: Signal processing, filtering, and spectral analysis  
- **`linalg/`**: Linear algebra operations and matrix decompositions
- **`optimize/`**: Function minimization and root finding
- **`fft/`**: Fast Fourier transforms and frequency domain analysis

Load specific modules:
```rexx
REQUIRE "scipy-inspired/stats"           -- Statistical functions only
REQUIRE "scipy-inspired/interpolation"   -- Interpolation functions only
REQUIRE "scipy-inspired"                 -- All modules
```

## 🎯 **SciPy Compatibility**

This implementation provides REXX-accessible versions of core SciPy functionality:

✅ **Fully Implemented**
- Statistical distributions and tests
- 1D/2D interpolation (comprehensive)
- Basic linear algebra operations
- Signal processing fundamentals
- FFT operations

⚠️ **Partial Implementation**
- Advanced optimization algorithms
- Specialized matrix decompositions
- Complex signal processing filters

❌ **Planned for Future**
- Sparse matrix operations
- Advanced spatial algorithms
- Image processing functions
- See `TODO.md` for complete roadmap

## 🚀 **Integration with Other Modules**

SciPy-inspired functions integrate seamlessly with:
- **[R-inspired](../r-inspired/)**: Statistical analysis and graphics
- **[NumPy-inspired](../numpy-inspired/)**: Array operations and linear algebra  
- **Core REXX**: Variables, control flow, and error handling

```rexx
-- Combined workflow example
REQUIRE "scipy-inspired"
REQUIRE "r-inspired" 
REQUIRE "numpy-inspired"

-- Generate data with NumPy-inspired functions
LET x = LINSPACE start=0 stop=10 num=50
LET y_true = SIN x=x
LET noise = RANDN size="50" scale=0.1  
LET y_noisy = ADD a=y_true b=noise

-- Interpolate with SciPy-inspired functions
LET interp = CUBIC_SPLINE x=x y=y_noisy s=0.1
LET x_smooth = LINSPACE start=0 stop=10 num=200
LET y_smooth = interp.interpolate x=x_smooth

-- Visualize with R-inspired graphics
LET plot_result = PLOT x=x y=y_noisy pch=1 main="Data Smoothing"
LET line_result = LINES x=x_smooth y=y_smooth col="red" lwd=2
```

---

**💡 Need NumPy-style arrays?** Check out [numpy-inspired](../numpy-inspired/) for comprehensive array computing!
**💡 Need R-style statistics?** Check out [r-inspired](../r-inspired/) for statistical analysis and visualization!