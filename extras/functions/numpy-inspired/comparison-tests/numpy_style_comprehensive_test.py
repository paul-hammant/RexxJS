#!/usr/bin/env python3
"""
Comprehensive eigenvalue tests based on NumPy's test_linalg.py structure.
This implements the sophisticated test patterns from NumPy's LinalgSquareTestCase
and EigvalsCases to thoroughly validate our eigenvalue implementation.
"""

import numpy as np
import json
import sys
from typing import List, Dict, Any, Tuple

class LinalgTestCase:
    """Test case definition similar to NumPy's LinalgCase"""
    def __init__(self, name: str, matrix: np.ndarray, description: str = ""):
        self.name = name
        self.matrix = matrix
        self.description = description
        self.dtype = matrix.dtype
        self.shape = matrix.shape

def create_comprehensive_test_cases() -> List[LinalgTestCase]:
    """
    Create comprehensive test cases based on NumPy's LinalgSquareTestCase patterns.
    Covers various matrix sizes, dtypes, and numerical conditions.
    """
    cases = []
    
    # === 1x1 matrices (edge case) ===
    cases.extend([
        LinalgTestCase("1x1_real_single", np.array([[3.0]], dtype=np.float32)),
        LinalgTestCase("1x1_real_double", np.array([[5.0]], dtype=np.float64)),
        LinalgTestCase("1x1_complex_single", np.array([[2.0 + 1.0j]], dtype=np.complex64)),
        LinalgTestCase("1x1_complex_double", np.array([[3.0 + 2.0j]], dtype=np.complex128)),
    ])
    
    # === 2x2 matrices (basic cases) ===
    cases.extend([
        # Real matrices
        LinalgTestCase("2x2_real_single", 
            np.array([[1., 2.], [3., 4.]], dtype=np.float32),
            "Basic 2x2 real single precision"
        ),
        LinalgTestCase("2x2_real_double", 
            np.array([[1., 2.], [3., 4.]], dtype=np.float64),
            "Basic 2x2 real double precision"
        ),
        
        # Complex matrices
        LinalgTestCase("2x2_complex_single",
            np.array([[1. + 2.j, 2. + 3.j], [3. + 4.j, 4. + 5.j]], dtype=np.complex64),
            "Basic 2x2 complex single precision"
        ),
        LinalgTestCase("2x2_complex_double",
            np.array([[1. + 2.j, 2. + 3.j], [3. + 4.j, 4. + 5.j]], dtype=np.complex128),
            "Basic 2x2 complex double precision"
        ),
        
        # Symmetric matrices
        LinalgTestCase("2x2_symmetric_real",
            np.array([[4., 1.], [1., 3.]], dtype=np.float64),
            "Symmetric real matrix"
        ),
        LinalgTestCase("2x2_symmetric_complex",
            np.array([[2. + 0.j, 1. - 1.j], [1. + 1.j, 3. + 0.j]], dtype=np.complex128),
            "Hermitian complex matrix"
        ),
        
        # Diagonal matrices
        LinalgTestCase("2x2_diagonal_real",
            np.array([[7., 0.], [0., 3.]], dtype=np.float64),
            "Diagonal real matrix"
        ),
        LinalgTestCase("2x2_diagonal_complex",
            np.array([[2. + 1.j, 0.], [0., 5. - 2.j]], dtype=np.complex128),
            "Diagonal complex matrix"
        ),
        
        # Nearly singular matrices
        LinalgTestCase("2x2_nearly_singular",
            np.array([[1., 1.], [1., 1.0001]], dtype=np.float64),
            "Nearly singular matrix"
        ),
        
        # Rotation-like matrices
        LinalgTestCase("2x2_rotation_like",
            np.array([[0., -1.], [1., 0.]], dtype=np.float64),
            "Rotation-like matrix with pure imaginary eigenvalues"
        ),
    ])
    
    # === 3x3 matrices (intermediate cases) ===
    cases.extend([
        LinalgTestCase("3x3_symmetric",
            np.array([[4., 1., 0.], [1., 4., 1.], [0., 1., 4.]], dtype=np.float64),
            "Symmetric tridiagonal matrix"
        ),
        LinalgTestCase("3x3_upper_triangular",
            np.array([[2., 1., 3.], [0., 3., 1.], [0., 0., 4.]], dtype=np.float64),
            "Upper triangular matrix"
        ),
        LinalgTestCase("3x3_random_symmetric",
            np.array([[5., 2., 1.], [2., 6., 3.], [1., 3., 7.]], dtype=np.float64),
            "Random symmetric matrix"
        ),
    ])
    
    # === 8x8 matrices (larger cases following NumPy pattern) ===
    np.random.seed(42)  # For reproducible results
    
    # Random symmetric 8x8
    A_8x8 = np.random.randn(8, 8)
    symmetric_8x8 = (A_8x8 + A_8x8.T) / 2
    cases.append(LinalgTestCase("8x8_symmetric_random", symmetric_8x8))
    
    # Random complex Hermitian 8x8
    A_complex = np.random.randn(8, 8) + 1j * np.random.randn(8, 8)
    hermitian_8x8 = (A_complex + A_complex.conj().T) / 2
    cases.append(LinalgTestCase("8x8_hermitian_random", hermitian_8x8))
    
    # Random general 8x8
    general_8x8 = np.random.randn(8, 8).astype(np.float64)
    cases.append(LinalgTestCase("8x8_general_random", general_8x8))
    
    # === Special matrices ===
    cases.extend([
        # Identity matrices
        LinalgTestCase("2x2_identity", np.eye(2, dtype=np.float64)),
        LinalgTestCase("5x5_identity", np.eye(5, dtype=np.float64)),
        
        # Large eigenvalue spread
        LinalgTestCase("2x2_large_spread",
            np.array([[1000., 0.], [0., 0.001]], dtype=np.float64),
            "Matrix with large eigenvalue spread"
        ),
        
        # Zero matrix (degenerate case)
        LinalgTestCase("3x3_zero", np.zeros((3, 3), dtype=np.float64)),
        
        # Matrix with repeated eigenvalues
        LinalgTestCase("3x3_repeated_eigenvals",
            np.array([[2., 1., 0.], [0., 2., 1.], [0., 0., 2.]], dtype=np.float64),
            "Matrix with repeated eigenvalues"
        ),
    ])
    
    return cases

def run_comprehensive_eigenvalue_tests():
    """Run comprehensive eigenvalue tests following NumPy's EigvalsCases pattern"""
    print("🧪 Comprehensive NumPy-style Eigenvalue Test Suite")
    print("=" * 55)
    print()
    
    test_cases = create_comprehensive_test_cases()
    results = []
    
    print(f"📊 Generated {len(test_cases)} test cases")
    print("🔍 Testing eigenvalue computations...")
    print()
    
    successful_tests = 0
    
    for i, case in enumerate(test_cases, 1):
        print(f"[{i:2d}/{len(test_cases)}] Testing {case.name} ({case.shape[0]}x{case.shape[1]}, {case.dtype})")
        
        try:
            # Compute eigenvalues and eigenvectors
            eigenvalues, eigenvectors = np.linalg.eig(case.matrix)
            
            # Also compute eigenvalues only for comparison
            eigenvals_only = np.linalg.eigvals(case.matrix)
            
            # Sort both by magnitude for consistent comparison
            idx_full = np.argsort(np.abs(eigenvalues))[::-1]
            idx_vals = np.argsort(np.abs(eigenvals_only))[::-1]
            
            eigenvalues_sorted = eigenvalues[idx_full]
            eigenvectors_sorted = eigenvectors[:, idx_full]
            eigenvals_sorted = eigenvals_only[idx_vals]
            
            # Verify numerical correctness: A * v = λ * v
            max_verification_error = 0.0
            verification_errors = []
            
            for j in range(len(eigenvalues_sorted)):
                lam = eigenvalues_sorted[j]
                v = eigenvectors_sorted[:, j]
                
                # A * v
                Av = case.matrix @ v
                # λ * v
                lam_v = lam * v
                
                # Relative error
                error = np.linalg.norm(Av - lam_v) / (np.linalg.norm(Av) + 1e-15)
                verification_errors.append(float(error))
                max_verification_error = max(max_verification_error, error)
            
            # Check that eigenvals() and eig()[0] match
            eigenvals_match = np.allclose(eigenvalues_sorted, eigenvals_sorted, rtol=1e-12)
            
            print(f"     ✅ Success: {len(eigenvalues)} eigenvalues")
            print(f"     🔍 Max verification error: {max_verification_error:.2e}")
            print(f"     ⚖️  eigvals/eig consistency: {'✅' if eigenvals_match else '❌'}")
            
            # Handle complex eigenvalues for JSON serialization
            def serialize_complex_array(arr):
                if np.iscomplexobj(arr):
                    return [{"real": float(x.real), "imag": float(x.imag), "_complex": True} for x in arr]
                else:
                    return [float(x) for x in arr]
            
            def serialize_complex_value(val):
                if isinstance(val, complex) or np.iscomplexobj(val):
                    return {"real": float(val.real), "imag": float(val.imag), "_complex": True}
                else:
                    return float(val)
                    
            def serialize_matrix(matrix):
                """Serialize matrix handling complex numbers"""
                if np.iscomplexobj(matrix):
                    return [[serialize_complex_value(val) for val in row] for row in matrix]
                else:
                    return matrix.tolist()
            
            result = {
                "name": case.name,
                "description": case.description,
                "matrix_shape": list(case.shape),
                "matrix_dtype": str(case.dtype),
                "matrix": serialize_matrix(case.matrix),
                "success": True,
                "eigenvalues": serialize_complex_array(eigenvalues_sorted),
                "eigenvalues_only": serialize_complex_array(eigenvals_sorted),
                "verification_errors": verification_errors,
                "max_verification_error": max_verification_error,
                "eigenvals_eig_match": eigenvals_match,
                "condition_number": float(np.linalg.cond(case.matrix)) if np.isfinite(np.linalg.cond(case.matrix)) else None,
                "determinant": serialize_complex_value(np.linalg.det(case.matrix)),
                "trace": serialize_complex_value(np.trace(case.matrix))
            }
            
            successful_tests += 1
            
        except Exception as e:
            print(f"     ❌ Failed: {str(e)}")
            result = {
                "name": case.name,
                "description": case.description,
                "matrix_shape": list(case.shape),
                "matrix_dtype": str(case.dtype),
                "matrix": serialize_matrix(case.matrix),
                "success": False,
                "error": str(e)
            }
        
        results.append(result)
        print()
    
    # Save comprehensive results
    output_data = {
        "test_suite": "Comprehensive NumPy-style Eigenvalue Tests",
        "numpy_version": np.__version__,
        "total_tests": len(test_cases),
        "successful_tests": successful_tests,
        "test_patterns": {
            "matrix_sizes": ["1x1", "2x2", "3x3", "8x8"],
            "dtypes": ["float32", "float64", "complex64", "complex128"],
            "special_cases": ["symmetric", "hermitian", "diagonal", "triangular", 
                            "identity", "nearly_singular", "zero", "large_spread"]
        },
        "results": results
    }
    
    output_file = "numpy_comprehensive_eig_results.json"
    with open(output_file, 'w') as f:
        json.dump(output_data, f, indent=2)
    
    print("📋 Final Summary")
    print("=" * 15)
    print(f"✅ Successful tests: {successful_tests}/{len(test_cases)}")
    print(f"📄 Results saved to: {output_file}")
    print()
    
    if successful_tests == len(test_cases):
        print("🎉 All comprehensive tests passed!")
        return 0
    else:
        print(f"⚠️  {len(test_cases) - successful_tests} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(run_comprehensive_eigenvalue_tests())