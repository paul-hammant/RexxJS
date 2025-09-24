/* Test NumPy RENDER function in pure REXX */
/* Run with: ./rexxt extras/functions/numpy-inspired/test-numpy-render.rexx */

SAY "=== NumPy RENDER Function Tests ==="
SAY ""

/* Load NumPy functions */
REQUIRE lib="./extras/functions/numpy-inspired/numpy.js"
REQUIRE lib="./extras/functions/numpy-inspired/numpy-render.js"

/* Test 1: Basic histogram rendering */
SAY "Test 1: Histogram rendering"
LET data = [1, 2, 2, 3, 3, 3, 4, 4, 5]
SAY "Data: " || JSON_STRINGIFY(data)

LET hist = HISTOGRAM(data, 5)
SAY "Histogram bins: " || JSON_STRINGIFY(hist.bins)
SAY "Histogram counts: " || JSON_STRINGIFY(hist.counts)

LET output_file = "./test-histogram-rexx.png"
LET rendered = RENDER(hist, output_file, "REXX Histogram Test")
SAY "Rendered histogram to: " || rendered
SAY ""

/* Test 2: 2D histogram heatmap */
SAY "Test 2: 2D Histogram heatmap"
LET x_data = [1, 2, 3, 4, 5]
LET y_data = [2, 3, 4, 5, 6]
SAY "X data: " || JSON_STRINGIFY(x_data)
SAY "Y data: " || JSON_STRINGIFY(y_data)

LET hist2d = HISTOGRAM2D(x_data, y_data, 3)
SAY "2D histogram dimensions: " || ARRAY_LENGTH(hist2d.hist) || "x" || ARRAY_LENGTH(hist2d.hist[0])

LET output_file2 = "./test-histogram2d-rexx.png"
LET rendered2 = RENDER(hist2d, output_file2, "REXX 2D Histogram")
SAY "Rendered 2D histogram to: " || rendered2
SAY ""

/* Test 3: Correlation matrix */
SAY "Test 3: Correlation matrix"
LET matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
SAY "Input matrix: " || JSON_STRINGIFY(matrix)

LET corr_matrix = CORRCOEF(matrix)
SAY "Correlation matrix computed"

LET output_file3 = "./test-correlation-rexx.png"
LET rendered3 = RENDER(corr_matrix, output_file3, "REXX Correlation Matrix")
SAY "Rendered correlation matrix to: " || rendered3
SAY ""

/* Test 4: Covariance matrix */
SAY "Test 4: Covariance matrix"
LET cov_matrix = COV(matrix)
SAY "Covariance matrix computed"

LET output_file4 = "./test-covariance-rexx.png"
LET rendered4 = RENDER(cov_matrix, output_file4, "REXX Covariance Matrix", "hot")
SAY "Rendered covariance matrix to: " || rendered4
SAY ""

/* Test 5: Eigenvalues */
SAY "Test 5: Eigenvalue visualization"
LET small_matrix = [[2, 1], [1, 2]]
SAY "Matrix: " || JSON_STRINGIFY(small_matrix)

LET eig_result = EIG(small_matrix)
SAY "Eigenvalues: " || JSON_STRINGIFY(eig_result.eigenvalues)

LET output_file5 = "./test-eigenvalues-rexx.png"
LET rendered5 = RENDER(eig_result, output_file5, "REXX Eigenvalues")
SAY "Rendered eigenvalues to: " || rendered5
SAY ""

/* Test 6: 1D array line plot */
SAY "Test 6: 1D array line plot"
LET array_data = [1, 4, 2, 8, 5, 7]
SAY "Array data: " || JSON_STRINGIFY(array_data)

LET output_file6 = "./test-array-rexx.png"
LET rendered6 = RENDER(array_data, output_file6, "REXX Array Plot")
SAY "Rendered 1D array to: " || rendered6
SAY ""

/* Test 7: Different colormaps */
SAY "Test 7: Testing different colormaps"
LET test_matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]

LET colormaps = ["viridis", "hot", "cool", "grayscale"]
DO i = 1 TO ARRAY_LENGTH(colormaps)
    LET colormap = colormaps[i]
    LET output_name = "./test-colormap-" || colormap || "-rexx.png"
    LET rendered_cmap = RENDER(test_matrix, output_name, "Colormap: " || colormap, colormap)
    SAY "Rendered " || colormap || " colormap to: " || rendered_cmap
END
SAY ""

/* Test 8: Pipeline test - Matrix operations to visualization */
SAY "Test 8: Complete pipeline test"
LET raw_data = [[1, 4, 7], [2, 5, 8], [3, 6, 9]]
SAY "Raw data: " || JSON_STRINGIFY(raw_data)

/* Create correlation matrix */
LET pipeline_corr = CORRCOEF(raw_data)
LET pipeline_output1 = RENDER(pipeline_corr, "./pipeline-correlation.png", "Pipeline: Correlation")
SAY "Pipeline step 1 (correlation): " || pipeline_output1

/* Create covariance matrix */
LET pipeline_cov = COV(raw_data)
LET pipeline_output2 = RENDER(pipeline_cov, "./pipeline-covariance.png", "Pipeline: Covariance", "cool")
SAY "Pipeline step 2 (covariance): " || pipeline_output2

/* Eigenvalue analysis */
LET pipeline_eig = EIG(pipeline_corr)
LET pipeline_output3 = RENDER(pipeline_eig, "./pipeline-eigenvalues.png", "Pipeline: Eigenvalues")
SAY "Pipeline step 3 (eigenvalues): " || pipeline_output3
SAY ""

/* Test 9: Error handling */
SAY "Test 9: Error handling tests"

/* Test missing data parameter */
TRY
    LET bad_render1 = RENDER()
    SAY "ERROR: Should have failed for missing data"
CATCH
    SAY "✓ Correctly caught missing data error"
END

/* Test invalid data type */
TRY 
    LET invalid_data = "not valid data"
    LET bad_render2 = RENDER(invalid_data, "./bad.png")
    SAY "ERROR: Should have failed for invalid data"
CATCH
    SAY "✓ Correctly caught invalid data error"
END
SAY ""

/* Test 10: Large data performance test */
SAY "Test 10: Performance test with larger data"
LET large_data = ONES([20, 20])
SAY "Created 20x20 matrix of ones"

LET start_time = TIME()
LET large_output = RENDER(large_data, "./test-large-rexx.png", "Large Matrix Test")
LET end_time = TIME()
LET duration = end_time - start_time

SAY "Rendered large matrix to: " || large_output
SAY "Rendering took: " || duration || " seconds"
SAY ""

SAY "=== All NumPy RENDER Tests Completed ==="
SAY ""
SAY "Generated files:"
SAY "  - test-histogram-rexx.png"
SAY "  - test-histogram2d-rexx.png" 
SAY "  - test-correlation-rexx.png"
SAY "  - test-covariance-rexx.png"
SAY "  - test-eigenvalues-rexx.png"
SAY "  - test-array-rexx.png"
SAY "  - test-colormap-*-rexx.png (4 files)"
SAY "  - pipeline-*.png (3 files)"
SAY "  - test-large-rexx.png"
SAY ""
SAY "Total: 13 visualization files generated"