-- Comprehensive REXX Eigenvalue Test Script
-- Based on NumPy's LinalgSquareTestCase and EigvalsCases patterns

SAY "Starting comprehensive eigenvalue tests..."
SAY ""

-- Test 1: 1x1_real_single
LET matrix_0 = "[[3.0]]"
SAY "Testing 1x1_real_single: 1x1 real single precision equivalent"
LET result_0 = EIG matrix=matrix_0
LET eigvals_0 = EIGVALS matrix=matrix_0
SAY "EIG result: " || result_0
SAY "EIGVALS result: " || eigvals_0
SAY ""

-- Test 2: 1x1_complex_equivalent
LET matrix_1 = "[[5.0]]"
SAY "Testing 1x1_complex_equivalent: 1x1 matrix (complex equivalent as real)"
LET result_1 = EIG matrix=matrix_1
LET eigvals_1 = EIGVALS matrix=matrix_1
SAY "EIG result: " || result_1
SAY "EIGVALS result: " || eigvals_1
SAY ""

-- Test 3: 2x2_basic_real
LET matrix_2 = "[[1.0, 2.0], [3.0, 4.0]]"
SAY "Testing 2x2_basic_real: Basic 2x2 real matrix (NumPy pattern)"
LET result_2 = EIG matrix=matrix_2
LET eigvals_2 = EIGVALS matrix=matrix_2
SAY "EIG result: " || result_2
SAY "EIGVALS result: " || eigvals_2
SAY ""

-- Test 4: 2x2_symmetric_real
LET matrix_3 = "[[4.0, 1.0], [1.0, 3.0]]"
SAY "Testing 2x2_symmetric_real: Symmetric real matrix"
LET result_3 = EIG matrix=matrix_3
LET eigvals_3 = EIGVALS matrix=matrix_3
SAY "EIG result: " || result_3
SAY "EIGVALS result: " || eigvals_3
SAY ""

-- Test 5: 2x2_diagonal_real
LET matrix_4 = "[[7.0, 0.0], [0.0, 3.0]]"
SAY "Testing 2x2_diagonal_real: Diagonal real matrix"
LET result_4 = EIG matrix=matrix_4
LET eigvals_4 = EIGVALS matrix=matrix_4
SAY "EIG result: " || result_4
SAY "EIGVALS result: " || eigvals_4
SAY ""

-- Test 6: 2x2_nearly_singular
LET matrix_5 = "[[1.0, 1.0], [1.0, 1.0001]]"
SAY "Testing 2x2_nearly_singular: Nearly singular matrix"
LET result_5 = EIG matrix=matrix_5
LET eigvals_5 = EIGVALS matrix=matrix_5
SAY "EIG result: " || result_5
SAY "EIGVALS result: " || eigvals_5
SAY ""

-- Test 7: 2x2_rotation_like
LET matrix_6 = "[[0.0, -1.0], [1.0, 0.0]]"
SAY "Testing 2x2_rotation_like: Rotation-like matrix with pure imaginary eigenvalues"
LET result_6 = EIG matrix=matrix_6
LET eigvals_6 = EIGVALS matrix=matrix_6
SAY "EIG result: " || result_6
SAY "EIGVALS result: " || eigvals_6
SAY ""

-- Test 8: 2x2_identity
LET matrix_7 = "[[1.0, 0.0], [0.0, 1.0]]"
SAY "Testing 2x2_identity: 2x2 identity matrix"
LET result_7 = EIG matrix=matrix_7
LET eigvals_7 = EIGVALS matrix=matrix_7
SAY "EIG result: " || result_7
SAY "EIGVALS result: " || eigvals_7
SAY ""

-- Test 9: 2x2_large_spread
LET matrix_8 = "[[1000.0, 0.0], [0.0, 0.001]]"
SAY "Testing 2x2_large_spread: Matrix with large eigenvalue spread"
LET result_8 = EIG matrix=matrix_8
LET eigvals_8 = EIGVALS matrix=matrix_8
SAY "EIG result: " || result_8
SAY "EIGVALS result: " || eigvals_8
SAY ""

-- Test 10: 3x3_symmetric_tridiagonal
LET matrix_9 = "[[4.0, 1.0, 0.0], [1.0, 4.0, 1.0], [0.0, 1.0, 4.0]]"
SAY "Testing 3x3_symmetric_tridiagonal: Symmetric tridiagonal matrix"
LET result_9 = EIG matrix=matrix_9
LET eigvals_9 = EIGVALS matrix=matrix_9
SAY "EIG result: " || result_9
SAY "EIGVALS result: " || eigvals_9
SAY ""

-- Test 11: 3x3_upper_triangular
LET matrix_10 = "[[2.0, 1.0, 3.0], [0.0, 3.0, 1.0], [0.0, 0.0, 4.0]]"
SAY "Testing 3x3_upper_triangular: Upper triangular matrix"
LET result_10 = EIG matrix=matrix_10
LET eigvals_10 = EIGVALS matrix=matrix_10
SAY "EIG result: " || result_10
SAY "EIGVALS result: " || eigvals_10
SAY ""

-- Test 12: 3x3_random_symmetric
LET matrix_11 = "[[5.0, 2.0, 1.0], [2.0, 6.0, 3.0], [1.0, 3.0, 7.0]]"
SAY "Testing 3x3_random_symmetric: Random symmetric matrix"
LET result_11 = EIG matrix=matrix_11
LET eigvals_11 = EIGVALS matrix=matrix_11
SAY "EIG result: " || result_11
SAY "EIGVALS result: " || eigvals_11
SAY ""

-- Test 13: 3x3_zero_matrix
LET matrix_12 = "[[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]"
SAY "Testing 3x3_zero_matrix: Zero matrix (degenerate case)"
LET result_12 = EIG matrix=matrix_12
LET eigvals_12 = EIGVALS matrix=matrix_12
SAY "EIG result: " || result_12
SAY "EIGVALS result: " || eigvals_12
SAY ""

-- Test 14: 3x3_repeated_eigenvals
LET matrix_13 = "[[2.0, 1.0, 0.0], [0.0, 2.0, 1.0], [0.0, 0.0, 2.0]]"
SAY "Testing 3x3_repeated_eigenvals: Matrix with repeated eigenvalues"
LET result_13 = EIG matrix=matrix_13
LET eigvals_13 = EIGVALS matrix=matrix_13
SAY "EIG result: " || result_13
SAY "EIGVALS result: " || eigvals_13
SAY ""

-- Test 15: 4x4_symmetric_random
LET matrix_14 = "[[2.5, 1.2, 0.8, 0.3], [1.2, 3.1, 1.5, 0.7], [0.8, 1.5, 2.8, 1.1], [0.3, 0.7, 1.1, 3.3]]"
SAY "Testing 4x4_symmetric_random: 4x4 random symmetric matrix"
LET result_14 = EIG matrix=matrix_14
LET eigvals_14 = EIGVALS matrix=matrix_14
SAY "EIG result: " || result_14
SAY "EIGVALS result: " || eigvals_14
SAY ""

-- Test 16: 4x4_general_random
LET matrix_15 = "[[1.2, 2.3, 0.5, 1.8], [0.9, 2.1, 1.7, 0.4], [1.5, 0.8, 2.9, 1.3], [0.7, 1.9, 0.6, 2.4]]"
SAY "Testing 4x4_general_random: 4x4 general random matrix"
LET result_15 = EIG matrix=matrix_15
LET eigvals_15 = EIGVALS matrix=matrix_15
SAY "EIG result: " || result_15
SAY "EIGVALS result: " || eigvals_15
SAY ""

-- Test 17: 2x2_ill_conditioned
LET matrix_16 = "[[1.0, 0.9999], [0.9999, 1.0]]"
SAY "Testing 2x2_ill_conditioned: Ill-conditioned matrix"
LET result_16 = EIG matrix=matrix_16
LET eigvals_16 = EIGVALS matrix=matrix_16
SAY "EIG result: " || result_16
SAY "EIGVALS result: " || eigvals_16
SAY ""

-- Test 18: 3x3_dense_symmetric
LET matrix_17 = "[[10.0, 5.0, 2.0], [5.0, 8.0, 3.0], [2.0, 3.0, 6.0]]"
SAY "Testing 3x3_dense_symmetric: Dense symmetric matrix"
LET result_17 = EIG matrix=matrix_17
LET eigvals_17 = EIGVALS matrix=matrix_17
SAY "EIG result: " || result_17
SAY "EIGVALS result: " || eigvals_17
SAY ""

SAY "Comprehensive REXX eigenvalue tests completed."