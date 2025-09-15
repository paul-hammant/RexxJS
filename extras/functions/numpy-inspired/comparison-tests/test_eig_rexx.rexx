-- REXX Script for Eigenvalue Testing
-- This script tests eigenvalue decomposition using our NumPy-inspired functions via REXX interpreter

-- Test Identity 2x2 matrix
LET identity_2x2 = "[[1.0, 0.0], [0.0, 1.0]]"
SAY "Testing Identity 2x2..."
LET result_identity = EIG matrix=identity_2x2
SAY "Identity 2x2 result: " || result_identity

-- Test Simple diagonal matrix
LET diagonal_simple = "[[3.0, 0.0], [0.0, 4.0]]"
SAY ""
SAY "Testing Simple diagonal..."
LET result_diagonal = EIG matrix=diagonal_simple
SAY "Simple diagonal result: " || result_diagonal

-- Test Symmetric 2x2 matrix
LET symmetric_2x2 = "[[2.0, 1.0], [1.0, 2.0]]"
SAY ""
SAY "Testing Symmetric 2x2..."
LET result_symmetric = EIG matrix=symmetric_2x2
SAY "Symmetric 2x2 result: " || result_symmetric

-- Test Symmetric 2x2 variant
LET symmetric_variant = "[[3.0, 1.0], [1.0, 3.0]]"
SAY ""
SAY "Testing Symmetric 2x2 (variant)..."
LET result_variant = EIG matrix=symmetric_variant
SAY "Symmetric variant result: " || result_variant

-- Test Non-symmetric 2x2 matrix
LET non_symmetric = "[[1.0, 2.0], [3.0, 4.0]]"
SAY ""
SAY "Testing Non-symmetric 2x2..."
LET result_non_symmetric = EIG matrix=non_symmetric
SAY "Non-symmetric result: " || result_non_symmetric

-- Test Symmetric 3x3 matrix
LET symmetric_3x3 = "[[4.0, 1.0, 0.0], [1.0, 4.0, 1.0], [0.0, 1.0, 4.0]]"
SAY ""
SAY "Testing Symmetric 3x3..."
LET result_3x3 = EIG matrix=symmetric_3x3
SAY "Symmetric 3x3 result: " || result_3x3

-- Test Nearly singular matrix
LET nearly_singular = "[[1.0, 1.0], [1.0, 1.0001]]"
SAY ""
SAY "Testing Nearly singular..."
LET result_singular = EIG matrix=nearly_singular
SAY "Nearly singular result: " || result_singular

SAY ""
SAY "REXX eigenvalue tests completed."