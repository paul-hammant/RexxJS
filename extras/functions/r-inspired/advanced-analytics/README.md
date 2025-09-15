# R Advanced Analytics Functions

This library provides R-style advanced analytics functions for RexxJS, including matrix operations, linear algebra, regression analysis, machine learning algorithms, and optimization functions.

## Quick Start

```rexx
REQUIRE "r-advanced-analytics"
LET matrix = MATRIX([1, 2, 3, 4], nrow=2, ncol=2)
LET inverse = SOLVE(matrix)
SAY "Matrix inverse:" inverse
```

## Installation

```bash
npm install
npm test
```

## Function Categories

### Matrix Operations

#### Matrix Creation and Structure
- **MATRIX(data, nrow, ncol)** - Create matrix from data
- **DIAG(x)** - Create diagonal matrix or extract diagonal
- **IDENTITY(n)** - Create n×n identity matrix
- **ZEROS(nrow, ncol)** - Create matrix of zeros
- **ONES(nrow, ncol)** - Create matrix of ones
- **ARRAY(data, dim)** - Create multi-dimensional array

#### Matrix Properties
- **DIM(x)** - Matrix dimensions
- **NROW(x)** - Number of rows
- **NCOL(x)** - Number of columns
- **LENGTH(x)** - Total number of elements
- **RANK(x)** - Matrix rank
- **TRACE(x)** - Matrix trace (sum of diagonal)

#### Matrix Operations
- **T(x)** - Matrix transpose
- **SOLVE(a, b)** - Solve linear system or matrix inverse
- **DET(x)** - Matrix determinant
- **EIGEN(x)** - Eigenvalues and eigenvectors
- **SVD(x)** - Singular value decomposition
- **QR(x)** - QR decomposition
- **CHOL(x)** - Cholesky decomposition

#### Matrix Arithmetic
- **CROSSPROD(x, y)** - Cross product X'Y
- **TCROSSPROD(x, y)** - Cross product XY'
- **OUTER(x, y, fun)** - Outer product with function
- **KRONECKER(x, y)** - Kronecker product

### Regression Analysis

#### Linear Models
- **LM(formula, data)** - Linear regression model
- **GLM(formula, data, family)** - Generalized linear model
- **ANOVA(model)** - Analysis of variance
- **SUMMARY_LM(model)** - Model summary statistics

#### Model Diagnostics
- **RESIDUALS(model)** - Extract residuals
- **FITTED(model)** - Extract fitted values
- **PREDICT(model, newdata)** - Make predictions
- **CONFINT(model)** - Confidence intervals
- **PLOT_RESIDUALS(model)** - Residual plots

#### Advanced Regression
- **STEP(model)** - Stepwise model selection
- **RIDGE(x, y, lambda)** - Ridge regression
- **LASSO(x, y, lambda)** - LASSO regression
- **ELASTIC_NET(x, y, alpha, lambda)** - Elastic net regression

### Machine Learning

#### Classification
- **KNN(train, test, k)** - K-nearest neighbors
- **NAIVE_BAYES(x, y)** - Naive Bayes classifier
- **SVM(x, y, kernel)** - Support vector machine
- **RANDOM_FOREST(x, y, ntree)** - Random forest classifier

#### Clustering
- **KMEANS(x, k)** - K-means clustering
- **HIERARCHICAL(x, method)** - Hierarchical clustering
- **DBSCAN(x, eps, minPts)** - Density-based clustering
- **PAM(x, k)** - Partitioning around medoids

#### Dimensionality Reduction
- **PCA(x, scale)** - Principal component analysis
- **LDA(x, y)** - Linear discriminant analysis
- **MDS(x, k)** - Multidimensional scaling
- **TSNE(x, perplexity)** - t-SNE visualization

#### Model Evaluation
- **CONFUSION_MATRIX(actual, predicted)** - Classification accuracy
- **ROC_CURVE(actual, scores)** - ROC analysis
- **CROSS_VALIDATE(model, k)** - K-fold cross validation
- **BOOTSTRAP(data, statistic, R)** - Bootstrap sampling

### Optimization

#### Optimization Algorithms
- **OPTIM(fn, par, method)** - General optimization
- **OPTIMIZE(fn, lower, upper)** - One-dimensional optimization
- **NLMINB(start, objective)** - Non-linear minimization
- **CONSTROPTIM(start, f, ui, ci)** - Constrained optimization

#### Root Finding
- **UNIROOT(fn, interval)** - Root finding in interval
- **POLYROOT(poly)** - Polynomial roots
- **NEWTON_RAPHSON(fn, dfn, start)** - Newton-Raphson method

#### Numerical Integration
- **INTEGRATE(fn, lower, upper)** - Numerical integration
- **SIMPSON(fn, a, b, n)** - Simpson's rule
- **TRAPEZOID(fn, a, b, n)** - Trapezoidal rule

## Usage Examples

### Matrix Operations

```rexx
REQUIRE "r-advanced-analytics"

-- Create matrices
LET A = MATRIX([1, 2, 3, 4, 5, 6], nrow=2, ncol=3)
LET B = MATRIX([7, 8, 9, 10, 11, 12], nrow=3, ncol=2)

-- Basic operations
SAY "A dimensions:" DIM(A)
SAY "A transpose:" T(A)
LET C = CROSSPROD(A, B)  -- A'B
SAY "Cross product:" C

-- Square matrix operations
LET square = MATRIX([4, 2, 1, 3], nrow=2, ncol=2)
SAY "Determinant:" DET(square)
SAY "Inverse:" SOLVE(square)
SAY "Eigenvalues:" EIGEN(square)$values
```

### Linear Regression

```rexx
REQUIRE "r-advanced-analytics"

-- Create sample data
LET data = DATA_FRAME(
    "x" = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "y" = [2.1, 3.9, 6.2, 7.8, 10.1, 12.2, 14.1, 15.8, 18.2, 19.9]
)

-- Fit linear model
LET model = LM("y ~ x", data)
SAY "Model summary:"
SUMMARY_LM(model)

-- Make predictions
LET newData = DATA_FRAME("x" = [11, 12, 13])
LET predictions = PREDICT(model, newData)
SAY "Predictions:" predictions

-- Model diagnostics
LET residuals = RESIDUALS(model)
LET fitted = FITTED(model)
PLOT_RESIDUALS(model)
```

### Principal Component Analysis

```rexx
REQUIRE "r-advanced-analytics"

-- Sample multivariate data
LET data = MATRIX([
    [2.5, 2.4], [0.5, 0.7], [2.2, 2.9], [1.9, 2.2], [3.1, 3.0],
    [2.3, 2.7], [2, 1.6], [1, 1.1], [1.5, 1.6], [1.1, 0.9]
], nrow=10, ncol=2)

-- Perform PCA
LET pcaResult = PCA(data, scale=TRUE)
SAY "Principal components:" pcaResult$rotation
SAY "Proportion of variance:" pcaResult$sdev^2 / SUM(pcaResult$sdev^2)

-- Transform data
LET transformed = data %*% pcaResult$rotation
SAY "Transformed data:" transformed[1:5, ]
```

### K-means Clustering

```rexx
REQUIRE "r-advanced-analytics"

-- Generate sample data
LET set.seed(123)
LET data = RBIND(
    MATRIX(RNORM(50, 0, 1), nrow=25, ncol=2),
    MATRIX(RNORM(50, 3, 1), nrow=25, ncol=2)
)

-- Perform clustering
LET clusters = KMEANS(data, k=2)
SAY "Cluster centers:" clusters$centers
SAY "Cluster assignments:" clusters$cluster
SAY "Within-cluster sum of squares:" clusters$withinss

-- Evaluate clustering
LET totalSS = SUM((data - COLMEANS(data))^2)
LET betweenSS = totalSS - SUM(clusters$withinss)
SAY "Between-cluster SS:" betweenSS
SAY "Total SS:" totalSS
```

### Optimization

```rexx
REQUIRE "r-advanced-analytics"

-- Minimize quadratic function
LET quadratic = FUNCTION(x) (x[1] - 2)^2 + (x[2] - 1)^2
LET result = OPTIM(quadratic, c(0, 0), method="BFGS")
SAY "Minimum at:" result$par
SAY "Minimum value:" result$value

-- Find root of equation
LET equation = FUNCTION(x) x^3 - 2*x^2 - x + 2
LET root = UNIROOT(equation, c(-2, 0))
SAY "Root found at:" root$root

-- Numerical integration
LET integrand = FUNCTION(x) x^2 * EXP(-x^2)
LET integral = INTEGRATE(integrand, 0, Inf)
SAY "Integral value:" integral$value
```

### Support Vector Machine

```rexx
REQUIRE "r-advanced-analytics"

-- Classification example
LET training = DATA_FRAME(
    "x1" = [1, 2, 3, 4, 5, 6, 7, 8],
    "x2" = [2, 1, 4, 3, 6, 5, 8, 7],
    "class" = ["A", "A", "A", "A", "B", "B", "B", "B"]
)

-- Train SVM model
LET svmModel = SVM(training[, c("x1", "x2")], training$class, kernel="radial")
SAY "Support vectors:" LENGTH(svmModel$support)

-- Make predictions
LET testData = DATA_FRAME("x1" = [2.5, 6.5], "x2" = [2.5, 6.5])
LET predictions = PREDICT(svmModel, testData)
SAY "Predictions:" predictions
```

## Advanced Examples

### Multiple Regression with Model Selection

```rexx
REQUIRE "r-advanced-analytics"

-- Create dataset with multiple predictors
LET data = DATA_FRAME(
    "y" = RNORM(100, 0, 1),
    "x1" = RNORM(100, 0, 1),
    "x2" = RNORM(100, 0, 1),
    "x3" = RNORM(100, 0, 1),
    "x4" = RNORM(100, 0, 1)
)
LET data$y = data$y + 2*data$x1 + 0.5*data$x2  -- True relationship

-- Full model
LET fullModel = LM("y ~ x1 + x2 + x3 + x4", data)

-- Stepwise selection
LET bestModel = STEP(fullModel)
SAY "Selected variables:" NAMES(bestModel$coefficients)

-- Compare models
LET aicFull = AIC(fullModel)
LET aicBest = AIC(bestModel)
SAY "AIC comparison - Full:" aicFull "Best:" aicBest
```

### Time Series Decomposition with SVD

```rexx
REQUIRE "r-advanced-analytics"

-- Create time series matrix (Hankel matrix)
LET ts = SIN(2*PI*(1:100)/12) + RNORM(100, 0, 0.1)
LET L = 50  -- Window length
LET hankel = MATRIX(NA, nrow=L, ncol=100-L+1)

-- Fill Hankel matrix
FOR i IN 1:(100-L+1) {
    hankel[, i] = ts[i:(i+L-1)]
}

-- SVD decomposition
LET svdResult = SVD(hankel)
SAY "Singular values:" svdResult$d[1:10]

-- Reconstruct with first few components
LET nComp = 3
LET reconstructed = svdResult$u[, 1:nComp] %*% DIAG(svdResult$d[1:nComp]) %*% T(svdResult$v[, 1:nComp])

-- Extract diagonal for reconstructed series
LET tsReconstructed = NUMERIC(L + 100 - L)
FOR k IN 1:LENGTH(tsReconstructed) {
    LET indices = WHICH(ROW(reconstructed) + COL(reconstructed) - 1 == k + L - 1)
    tsReconstructed[k] = MEAN(reconstructed[indices])
}
```

## Error Handling

```rexx
REQUIRE "r-advanced-analytics"

-- Handle singular matrices
LET singularMatrix = MATRIX([1, 2, 2, 4], nrow=2, ncol=2)
LET safeInverse = TRY({
    SOLVE(singularMatrix)
}, ERROR = {
    SAY "Matrix is singular, using pseudo-inverse"
    GINV(singularMatrix)  -- Moore-Penrose pseudo-inverse
})

-- Validate optimization convergence
LET objective = FUNCTION(x) (x[1] - 1)^2 + 100*(x[2] - x[1]^2)^2  -- Rosenbrock
LET result = OPTIM(objective, c(-1.2, 1), method="BFGS")
IF (result$convergence != 0) {
    SAY "Optimization did not converge, code:" result$convergence
    SAY "Try different starting values or method"
}

-- Check model assumptions
LET model = LM("y ~ x", data)
LET residuals = RESIDUALS(model)
LET shapiroTest = SHAPIRO_TEST(residuals)
IF (shapiroTest$p.value < 0.05) {
    SAY "Residuals may not be normally distributed"
    SAY "Consider data transformation or different model"
}
```

## Performance Tips

- Use vectorized operations for matrix calculations
- Consider sparse matrix representations for large, sparse data
- Use appropriate algorithms for matrix size (QR for tall matrices, Cholesky for positive definite)
- Cache decompositions when performing multiple operations
- Use appropriate convergence criteria for iterative algorithms

## Integration

This library integrates with:
- RexxJS core interpreter
- R math-stats functions for basic operations
- R data-manipulation for data preprocessing
- Standard REXX variable and array systems
- REXX error handling and control flow

## Testing

Run the comprehensive test suite:

```bash
npm test
```

Tests cover:
- Matrix operations and linear algebra
- Regression modeling and diagnostics
- Machine learning algorithms
- Optimization and root finding
- Numerical methods and integration
- Error conditions and edge cases
- Integration with REXX interpreter

Part of the RexxJS extras collection.