/* Simple test of NumPy functions without render */
/* Run with: ./rexxt extras/functions/numpy-inspired/test-simple.rexx */

SAY "=== Simple NumPy Function Test ==="
SAY ""

/* Load only NumPy functions - no render for now */
REQUIRE lib="./extras/functions/numpy-inspired/numpy.js"

/* Test 1: Basic histogram data */
SAY "Test 1: Basic histogram creation"
LET data = [1, 2, 2, 3, 3, 3, 4, 4, 5]
SAY "Data: " || JSON_STRINGIFY(data)

LET hist = HISTOGRAM(data, 5)
SAY "Histogram bins: " || JSON_STRINGIFY(hist.bins)
SAY "Histogram counts: " || JSON_STRINGIFY(hist.counts)
SAY ""

/* Test 2: 2D histogram */
SAY "Test 2: 2D Histogram creation"  
LET x_data = [1, 2, 3, 4, 5]
LET y_data = [2, 3, 4, 5, 6]
SAY "X data: " || JSON_STRINGIFY(x_data)
SAY "Y data: " || JSON_STRINGIFY(y_data)

LET hist2d = HISTOGRAM2D(x_data, y_data, 3)
SAY "2D histogram created successfully"
SAY ""

/* Test 3: Correlation matrix */
SAY "Test 3: Correlation matrix"
LET matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
SAY "Input matrix: " || JSON_STRINGIFY(matrix)

LET corr_matrix = CORRCOEF(matrix)
SAY "Correlation matrix created successfully"  
SAY ""

/* Test 4: Basic array operations */
SAY "Test 4: Basic array operations"
LET arr1 = ONES([3, 3])
SAY "Created 3x3 array of ones"

LET arr2 = ZEROS([2, 2])  
SAY "Created 2x2 array of zeros"

LET arr3 = ARANGE(1, 10, 2)
SAY "Created range array: " || JSON_STRINGIFY(arr3)
SAY ""

SAY "=== All basic tests passed ==="