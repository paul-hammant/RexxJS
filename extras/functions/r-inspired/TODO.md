    # TODO for R-inspired functions

This file lists functions from the R language that could be implemented in the `r-inspired` directory.

## Data Manipulation

### Data Reshaping
- `cbind()`: Combine vectors, matrices or data frames by columns.
- `rbind()`: Combine vectors, matrices or data frames by rows.
- `merge()`: Merge two data frames by common columns or row names.
- `split()`: Divide a data vector into groups.
- `subset()`: Create subsets of a vector, matrix or data frame.
- `transform()`: Modify a data frame.
- `aggregate()`: Splits the data into subsets, computes summary statistics for each, and returns the result in a convenient form.
- `reshape()`: Reshapes a data frame between 'wide' and 'long' format.

### Data Subsetting & Filtering
- `head()`: Return the first or last parts of an object.
- `tail()`: Return the first or last parts of an object.
- `filter()` (from dplyr): Return rows with matching conditions.
- `select()` (from dplyr): Select columns by name.
- `arrange()` (from dplyr): Reorder rows.
- `mutate()` (from dplyr): Create new variables.

### String Manipulation
- `paste()`: Concatenate vectors after converting to character.
- `substr()`: Extract or replace substrings in a character vector.
- `grep()`, `grepl()`: Pattern matching and replacement.
- `sub()`, `gsub()`: Pattern matching and replacement.
- `tolower()`, `toupper()`: Case conversion.
- `nchar()`: Get the number of characters.

### Other
- `by()`: Apply a function to a data frame split by factors.
- `order()`: Returns a permutation which rearranges its first argument into ascending or descending order.
- `sort()`: Sort a vector or factor.
- `unique()`: Remove duplicate elements.
- `rep()`: Replicate elements of vectors and lists.
- `cut()`: Convert numeric to factor.
- `which()`: Which indices are TRUE?
- `which.min()`, `which.max()`: Which index is minimal/maximal?
- `na.omit()`, `na.fail()`: Handle missing values.
- `complete.cases()`: Find complete cases.

## Math & Stats

### Statistical Distributions
- `rnorm()`, `dnorm()`, `pnorm()`, `qnorm()`: Normal distribution.
- `runif()`, `dunif()`, `punif()`, `qunif()`: Uniform distribution.
- `rbinom()`, `dbinom()`, `pbinom()`, `qbinom()`: Binomial distribution.
- `rpois()`, `dpois()`, `ppois()`, `qpois()`: Poisson distribution.
- `rt()`, `dt()`, `pt()`, `qt()`: t-distribution.
- `rf()`, `df()`, `pf()`, `qf()`: F-distribution.
- `rchisq()`, `dchisq()`, `pchisq()`, `qchisq()`: Chi-squared distribution.

### Statistical Tests
- `t.test()`: Student's t-test.
- `prop.test()`: Test of proportions.
- `chisq.test()`: Chi-squared contingency table tests and goodness-of-fit tests.
- `cor.test()`: Test for association/correlation between paired samples.
- `wilcox.test()`: Wilcoxon rank sum and signed rank tests.
- `aov()`: Analysis of Variance.
- `anova()`: Compute analysis of variance tables for one or more fitted model objects.
- `ks.test()`: Kolmogorov-Smirnov tests.
- `shapiro.test()`: Shapiro-Wilk test for normality.

### Descriptive Statistics
- `var()`: Variance.
- `sd()`: Standard Deviation.
- `cov()`: Covariance.
- `cor()`: Correlation.
- `quantile()`: Sample Quantiles.
- `fivenum()`: Tukey's five number summary.
- `table()`: Create a frequency table.
- `xtabs()`: Cross-tabulation.

### Other Math Functions
- `seq()`: Generate regular sequences.
- `outer()`: Outer product of two arrays.
- `kronecker()`: Kronecker product.
- `integrate()`: Integration of a function.
- `D()`: Symbolic differentiation.

## Graphics

- `plot()`: Generic function for plotting of R objects.
- `lines()`: Add connected line segments to a plot.
- `points()`: Add points to a plot.
- `text()`: Add text to a plot.
- `legend()`: Add a legend to a plot.
- `axis()`: Add an axis to a plot.
- `boxplot()`: Box plots.
- `barplot()`: Bar plots.
- `pie()`: Pie charts.
- `stem()`: Stem-and-leaf plot.
- `mosaicplot()`: Mosaic plot.
- `pairs()`: Scatterplot matrices.
- `image()`: Create a grid of colored rectangles.
- `contour()`: Contour plots.
- `persp()`: Perspective plots.
- `dev.new()`, `dev.off()`: Device management.
- `png()`, `jpeg()`, `pdf()`: Graphics devices.

## Data Types

- `str()`: Display the internal structure of an R object.
- `class()`: Get or set the class of an object.
- `typeof()`: Get the type of an object.
- `as.numeric()`, `as.character()`, `as.logical()`, `as.factor()`: Coercion functions.
- `is.numeric()`, `is.character()`, `is.logical()`, `is.factor()`: Type checking functions.
- `levels()`: Get or set levels of a factor.
- `Sys.Date()`, `Sys.time()`: Get current date and time.
- `as.Date()`: Coerce to Date object.

## Advanced Analytics

### Matrix Operations
- `t()`: Matrix transpose.
- `diag()`: Extract or replace the diagonal of a matrix, or construct a diagonal matrix.
- `solve()`: Solve a system of linear equations or invert a matrix.
- `eigen()`: Spectral decomposition of a matrix.
- `svd()`: Singular Value Decomposition of a matrix.
- `qr()`: QR decomposition of a matrix.
- `chol()`: Cholesky decomposition.
- `%*%`: Matrix multiplication.

### Machine Learning
- `lm()`: Fitting linear models.
- `glm()`: Fitting generalized linear models.
- `predict()`: Model predictions.
- `residuals()`: Extract model residuals.
- `coefficients()`: Extract model coefficients.
- `summary.lm()`: Summary for a linear model fit.
- `kmeans()`: K-means clustering.
- `hclust()`: Hierarchical clustering.
- `dist()`: Distance matrix computation.
- `princomp()`, `prcomp()`: Principal components analysis.
- `loess()`: Local polynomial regression fitting.

## Signal Processing
- `fft()`: Fast Fourier Transform.
- `filter()`: Linear filtering on a time series.
- `acf()`: Auto-correlation function.
- `pacf()`: Partial auto-correlation function.
- `arima()`: ARIMA modelling of time series.
- `spec.pgram()`: Periodogram.
