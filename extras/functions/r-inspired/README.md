# R-Inspired Functions - REXX Reference Guide

A comprehensive implementation of R-inspired functions accessible from REXX. This module brings the statistical computing power and data manipulation capabilities of the R language to RexxJS environments.

## 🚀 **Quick Start**

```rexx
-- Load the R-inspired functions
REQUIRE "r-inspired"

-- Use statistical functions immediately
LET data = "[1, 2, 3, 4, 5]"
LET mean_val = MEAN data=data
LET std_val = SD data=data
SAY "Mean: " || mean_val || ", Standard Deviation: " || std_val

-- Create visualizations
LET hist_result = HIST data=data main="Sample Data"
SAY hist_result
```

## 📚 **Complete Function Reference**

### **Data Manipulation**

#### Data Reshaping Functions
```rexx
-- Combine data by columns and rows
LET matrix_a = "[[1, 2], [3, 4]]"
LET matrix_b = "[[5, 6], [7, 8]]"
LET combined_cols = CBIND a=matrix_a b=matrix_b  -- Column bind
LET combined_rows = RBIND a=matrix_a b=matrix_b  -- Row bind

-- Split data into groups
LET data = "[1, 2, 3, 4, 5, 6]"
LET groups = "[A, A, B, B, C, C]"
LET split_result = SPLIT x=data f=groups
```

#### Data Subsetting & Filtering
```rexx
LET data = "[10, 20, 30, 40, 50]"
LET head_data = HEAD x=data n=3                  -- First 3 elements
LET tail_data = TAIL x=data n=2                  -- Last 2 elements

-- Filtering and selection
LET filtered = FILTER data=data condition="x > 25"
LET selected = SELECT data=data columns="[1, 3, 5]"
```

#### String Manipulation
```rexx
-- String concatenation and manipulation
LET strings = "[Hello, World, REXX]"
LET pasted = PASTE x=strings sep=" "             -- "Hello World REXX"
LET substr_result = SUBSTR x="Hello World" start=7 length=5  -- "World"

-- Pattern matching
LET text = "[apple, banana, cherry]"
LET matches = GREP pattern="a.*a" x=text         -- Words with 'a...a'
LET replaced = GSUB pattern="a" replacement="@" x=text
```

### **Mathematical & Statistical Functions**

#### Statistical Distributions
```rexx
-- Normal distribution functions
LET norm_random = RNORM n=5 mean=0 sd=1          -- Random normal values
LET norm_density = DNORM x="[0, 1, 2]" mean=0 sd=1  -- Density values
LET norm_prob = PNORM x="[0, 1, 2]" mean=0 sd=1     -- Cumulative probabilities

-- Uniform distribution
LET unif_random = RUNIF n=5 min=0 max=1          -- Random uniform values
LET unif_density = DUNIF x="[0.2, 0.5, 0.8]" min=0 max=1

-- Binomial distribution
LET binom_random = RBINOM n=10 size=20 prob=0.3  -- Random binomial values
LET binom_prob = DBINOM x="[5, 10, 15]" size=20 prob=0.3
```

#### Statistical Tests
```rexx
-- t-test for comparing means
LET group1 = "[1, 2, 3, 4, 5]"
LET group2 = "[2, 3, 4, 5, 6]"
LET ttest_result = T_TEST x=group1 y=group2

-- Chi-squared test
LET observed = "[[10, 15], [20, 25]]"
LET chisq_result = CHISQ_TEST x=observed

-- Correlation test
LET x_vals = "[1, 2, 3, 4, 5]"
LET y_vals = "[2, 4, 6, 8, 10]"
LET cor_test = COR_TEST x=x_vals y=y_vals
```

#### Descriptive Statistics
```rexx
LET data = "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"

-- Basic statistics
LET variance = VAR x=data                        -- Variance
LET std_dev = SD x=data                          -- Standard deviation
LET correlation = COR x=data y=data              -- Correlation matrix
LET covariance = COV x=data y=data               -- Covariance

-- Quantiles and summaries
LET quantiles = QUANTILE x=data probs="[0.25, 0.5, 0.75]"
LET five_num = FIVENUM x=data                    -- Min, Q1, Median, Q3, Max
LET freq_table = TABLE x=data                    -- Frequency table
```

### **Graphics and Visualization**

#### Basic Plotting Functions
```rexx
-- Create basic plots
LET x_data = "[1, 2, 3, 4, 5]"
LET y_data = "[2, 4, 6, 8, 10]"
LET plot_result = PLOT x=x_data y=y_data main="Linear Relationship"

-- Add elements to plots
LET line_result = LINES x=x_data y=y_data col="red"
LET point_result = POINTS x="[2.5, 3.5]" y="[5, 7]" pch=16

-- Specialized plots
LET hist_result = HIST x=data main="Data Distribution" xlab="Values"
LET box_result = BOXPLOT x=data main="Box Plot" ylab="Values"
LET bar_result = BARPLOT height=data names="[A, B, C, D, E]"
```

#### Advanced Graphics
```rexx
-- Scatter plot matrices
LET matrix_data = "[[1, 2, 3], [4, 5, 6], [7, 8, 9]]"
LET pairs_result = PAIRS x=matrix_data

-- Contour and perspective plots
LET z_data = "[[1, 2, 3], [4, 5, 6], [7, 8, 9]]"
LET contour_result = CONTOUR z=z_data
LET persp_result = PERSP z=z_data theta=30 phi=15
```

### **Advanced Analytics**

#### Matrix Operations
```rexx
LET matrix = "[[1, 2, 3], [4, 5, 6], [7, 8, 9]]"

-- Matrix manipulation
LET transposed = T a=matrix                      -- Transpose
LET diagonal = DIAG x=matrix                     -- Extract diagonal
LET solved = SOLVE a=matrix b="[1, 2, 3]"        -- Solve linear system

-- Matrix decompositions
LET eigen_result = EIGEN x=matrix                -- Eigendecomposition
LET svd_result = SVD x=matrix                    -- Singular Value Decomposition
LET qr_result = QR x=matrix                      -- QR decomposition
```

#### Machine Learning Functions
```rexx
-- Linear modeling
LET x_vars = "[[1, 2], [3, 4], [5, 6]]"
LET y_var = "[3, 7, 11]"
LET lm_result = LM formula="y ~ x" data=data

-- Clustering
LET data_matrix = "[[1, 2], [3, 4], [5, 6], [7, 8]]"
LET kmeans_result = KMEANS x=data_matrix centers=2
LET hclust_result = HCLUST d=dist_matrix method="complete"

-- Principal Component Analysis
LET pca_result = PRCOMP x=data_matrix scale=TRUE
```

### **Data Types and Utilities**

#### Type Checking and Conversion
```rexx
LET data = "[1, 2, 3]"
LET data_str = STR object=data                   -- Display structure
LET data_class = CLASS object=data               -- Get class
LET data_type = TYPEOF object=data               -- Get type

-- Type conversion
LET numeric_data = AS_NUMERIC x="[1, 2, 3]"
LET char_data = AS_CHARACTER x="[1, 2, 3]"
LET logical_data = AS_LOGICAL x="[TRUE, FALSE, TRUE]"
```

#### Utility Functions
```rexx
-- Ordering and sorting
LET data = "[3, 1, 4, 1, 5]"
LET order_indices = ORDER x=data                 -- Ordering indices
LET sorted_data = SORT x=data                    -- Sorted values
LET unique_vals = UNIQUE x=data                  -- Remove duplicates

-- Repetition and sequences
LET repeated = REP x="[1, 2]" times=3            -- [1, 2, 1, 2, 1, 2]
LET sequence = SEQ from=1 to=10 by=2             -- [1, 3, 5, 7, 9]
```

## 🎨 **Graphics Output**

The R-inspired graphics functions can generate various output formats:

```rexx
-- PNG image generation (automatic)
LET hist_result = HIST x=data main="Distribution" output="histogram.png"

-- Console output with ASCII art
LET plot_result = PLOT x=x_data y=y_data type="ascii"

-- Data summary output
LET summary_result = SUMMARY object=data
SAY summary_result
```

## 📊 **Statistical Analysis Workflows**

### Complete Data Analysis Example
```rexx
-- Load and explore data
LET data = "[23, 45, 56, 78, 32, 67, 89, 12, 34, 56]"
LET summary = SUMMARY object=data
LET structure = STR object=data

-- Descriptive statistics
LET mean_val = MEAN x=data
LET median_val = MEDIAN x=data  
LET sd_val = SD x=data
LET quantiles = QUANTILE x=data probs="[0.25, 0.5, 0.75]"

-- Visualization
LET hist = HIST x=data main="Data Distribution" xlab="Values"
LET boxplot = BOXPLOT x=data main="Box Plot"

-- Statistical tests
LET normality = SHAPIRO_TEST x=data              -- Test for normality
LET ttest = T_TEST x=data mu=50                  -- One-sample t-test

SAY "Analysis complete. Mean: " || mean_val || ", SD: " || sd_val
```

## 🔧 **Advanced Features**

### Custom Graphics Devices
```rexx
-- Control graphics output
CALL PNG filename="myplot.png" width=800 height=600
LET plot_result = PLOT x=x_data y=y_data
CALL DEV_OFF                                     -- Close graphics device
```

### Data Frame Operations
```rexx
-- Work with structured data
LET df_data = CREATE_DATAFRAME x="[1,2,3]" y="[4,5,6]" z="[A,B,C]"
LET subset_df = SUBSET x=df_data condition="x > 1"
LET transformed = TRANSFORM data=df_data new_col="x * 2"
```

## ⚡ **Performance Considerations**

### Optimized for REXX Integration
- **Fast function calls**: Direct JavaScript implementation
- **Memory efficient**: Optimized data structures
- **Graphics acceleration**: Canvas-based rendering for PNG output
- **Statistical accuracy**: Implements standard R algorithms

### Best Practices
```rexx
-- Use vectorized operations when possible
LET result = MEAN x=large_data              -- Better than loops

-- Chain operations efficiently  
LET processed = SCALE x=SORT x=UNIQUE x=data    -- Multiple operations

-- Control graphics output size for performance
LET plot = PLOT x=data y=data width=400 height=300
```

## 🛠️ **Error Handling**

```rexx
-- Standard REXX error handling
SIGNAL ON ERROR

LET data = "[1, 2, 3, NA, 5]"
LET result = MEAN x=data na_rm=TRUE              -- Handle missing values
SIGNAL OFF ERROR
GOTO CONTINUE

ERROR:
SAY "Error in statistical computation: " || CONDITION('D')
RETURN

CONTINUE:
SAY "Result: " || result
```

## 📖 **Module Organization**

The R-inspired functions are organized into specialized modules:

- **`data-manipulation/`**: Data reshaping, subsetting, and transformation
- **`math-stats/`**: Statistical functions and distributions  
- **`graphics/`**: Plotting and visualization functions
- **`advanced-analytics/`**: Matrix operations and machine learning
- **`data-types/`**: Type checking and conversion utilities
- **`signal-processing/`**: Time series and signal analysis

Each module can be loaded independently:
```rexx
REQUIRE "r-inspired/math-stats"     -- Load only statistical functions
REQUIRE "r-inspired/graphics"       -- Load only graphics functions
REQUIRE "r-inspired"                -- Load all modules
```

## 🎯 **R Compatibility**

This implementation aims for high compatibility with base R functions:

✅ **Fully Compatible**
- Basic statistical functions (mean, median, sd, var)
- Data manipulation (cbind, rbind, subset)
- Distribution functions (rnorm, runif, etc.)
- Graphics functions (plot, hist, boxplot)

⚠️ **Partial Compatibility** 
- Complex statistical models (simplified implementations)
- Advanced graphics (core functionality only)
- Large dataset operations (memory constraints)

❌ **Not Implemented Yet**
- See `TODO.md` for planned functions
- Package-specific functions (dplyr, ggplot2)
- Interactive graphics

## 🚀 **Future Development**

See `TODO.md` for the complete roadmap including:
- Additional statistical tests
- More visualization types  
- Enhanced machine learning functions
- Time series analysis capabilities
- Advanced matrix decompositions

---

**💡 Need NumPy-style functions?** Check out [numpy-inspired](../numpy-inspired/) for array-focused mathematical computing!