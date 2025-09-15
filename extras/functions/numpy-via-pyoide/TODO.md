# TODO for NumPy-inspired functions

This file lists functions and modules from the NumPy library that could be implemented in the `numpy-inspired` directory.

## Array creation routines

-   ✅ `empty`: Return a new array of given shape and type, without initializing entries.
-   ✅ `eye`: Return a 2-D array with ones on the diagonal and zeros elsewhere.
-   ✅ `identity`: Return the identity array.
-   ✅ `ones`: Return a new array of given shape and type, filled with ones.
-   ✅ `zeros`: Return a new array of given shape and type, filled with zeros.
-   ✅ `full`: Return a new array of given shape and type, filled with `fill_value`.
-   ✅ `array`: Create an array.
-   ✅ `asarray`: Convert the input to an array.
-   ✅ `arange`: Return evenly spaced values within a given interval.
-   ✅ `linspace`: Return evenly spaced numbers over a specified interval.
-   ✅ `logspace`: Return numbers spaced evenly on a log scale.
-   ✅ `meshgrid`: Return coordinate matrices from coordinate vectors.

## Array manipulation routines

-   ✅ `reshape`: Gives a new shape to an array without changing its data.
-   ✅ `ravel`: Return a contiguous flattened array.
-   ✅ `flatten`: Return a copy of the array collapsed into one dimension.
-   ✅ `transpose`: Permute the dimensions of an array.
-   ✅ `concatenate`: Join a sequence of arrays along an existing axis.
-   ✅ `stack`: Join a sequence of arrays along a new axis.
-   ✅ `hstack`: Stack arrays in sequence horizontally (column wise).
-   ✅ `vstack`: Stack arrays in sequence vertically (row wise).
-   ✅ `split`: Split an array into multiple sub-arrays.
-   ✅ `hsplit`: Split an array into multiple sub-arrays horizontally (column-wise).
-   ✅ `vsplit`: Split an array into multiple sub-arrays vertically (row-wise).
-   ✅ `tile`: Construct an array by repeating A the number of times given by reps.
-   ✅ `repeat`: Repeat elements of an array.
-   ✅ `delete`: Return a new array with sub-arrays along an axis deleted.
-   ✅ `insert`: Insert values along the given axis before the given indices.
-   ✅ `append`: Append values to the end of an array.
-   ✅ `resize`: Return a new array with the specified shape.
-   ✅ `flip`: Reverse the order of elements in an array along the given axis.
-   ✅ `fliplr`: Flip array in the left/right direction.
-   ✅ `flipud`: Flip array in the up/down direction.
-   ✅ `roll`: Roll array elements along a given axis.

## Mathematical functions

Many of these are already in `r-inspired/math-stats`, but we should have numpy-named aliases.

-   ✅ **Trigonometric functions:** `sin`, `cos`, `tan`, `arcsin`, `arccos`, `arctan`.
-   ✅ **Hyperbolic functions:** `sinh`, `cosh`, `tanh`, `arcsinh`, `arccosh`, `arctanh`.
-   ✅ **Rounding:** `around`, `round_`, `rint`, `fix`, `floor`, `ceil`, `trunc`.
-   ✅ **Sums, products, differences:** `sum`, `prod`, `cumsum`, `cumprod`, `diff`.
-   ✅ **Exponents and logarithms:** `exp`, `expm1`, `log`, `log10`, `log2`, `log1p`.
-   ✅ **Other special functions:** `sqrt`, `square`, `cbrt`, `reciprocal`.
-   ✅ **Floating point routines:** `sign`, `abs`.

## Linear algebra (`numpy.linalg`)

-   ✅ `dot`: Dot product of two arrays.
-   ✅ `vdot`: Return the dot product of two vectors.
-   ✅ `inner`: Inner product of two arrays.
-   ✅ `outer`: Compute the outer product of two vectors.
-   ✅ `matmul`: Matrix product of two arrays.
-   ✅ `tensordot`: Compute tensor dot product along specified axes.
-   ✅ `linalg.det`: Compute the determinant of an array.
-   ✅ `linalg.slogdet`: Compute the sign and (natural) logarithm of the determinant of an array.
-   ✅ `linalg.eig`: Compute the eigenvalues and right eigenvectors of a square array.
-   ✅ `linalg.eigh`: Return the eigenvalues and eigenvectors of a complex Hermitian (conjugate symmetric) or a real symmetric matrix.
-   ✅ `linalg.eigvals`: Compute the eigenvalues of a general matrix.
-   ✅ `linalg.inv`: Compute the (multiplicative) inverse of a matrix.
-   ✅ `linalg.pinv`: Compute the (Moore-Penrose) pseudo-inverse of a matrix.
-   ✅ `linalg.solve`: Solve a linear matrix equation, or system of linear scalar equations.
-   ✅ `linalg.lstsq`: Return the least-squares solution to a linear matrix equation.

## Random sampling (`numpy.random`)

-   ✅ `random.rand`: Random values in a given shape.
-   ✅ `random.randn`: Return a sample (or samples) from the "standard normal" distribution.
-   ✅ `random.randint`: Return random integers from `low` (inclusive) to `high` (exclusive).
-   ✅ `random.choice`: Generates a random sample from a given 1-D array.
-   ✅ `random.shuffle`: Shuffle array in-place.
-   ✅ `random.permutation`: Randomly permute a sequence, or return a permuted range.
-   ✅ `random.normal`: Draw random samples from a normal (Gaussian) distribution.
-   ✅ `random.uniform`: Draw samples from a uniform distribution.
-   ✅ `random.seed`: Seed the generator.

## Statistics

-   ✅ `amin`, `amax`: Return the minimum/maximum of an array or minimum/maximum along an axis.
-   ✅ `ptp`: Range of values (maximum - minimum) along an axis.
-   ✅ `percentile`: Compute the q-th percentile of the data along the specified axis.
-   ✅ `quantile`: Compute the q-th quantile of the data along the specified axis.
-   ✅ `median`: Compute the median along the specified axis.
-   ✅ `average`: Compute the weighted average along the specified axis.
-   ✅ `mean`: Compute the arithmetic mean along the specified axis.
-   ✅ `std`: Compute the standard deviation along the specified axis.
-   ✅ `var`: Compute the variance along the specified axis.
-   ✅ `corrcoef`: Return Pearson product-moment correlation coefficients.
-   ✅ `cov`: Estimate a covariance matrix, given data and weights.
-   ✅ `histogram`: Compute the histogram of a set of data.
-   ✅ `histogram2d`: Compute the bi-dimensional histogram of two data samples.
