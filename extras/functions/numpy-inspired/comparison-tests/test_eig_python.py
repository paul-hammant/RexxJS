#!/usr/bin/env python3
"""
Python NumPy linalg.eig test suite for comparison with REXX/JS implementation.

This script tests numpy.linalg.eig on various matrix types and saves results
in JSON format for comparison with our REXX/JS implementation.
"""

import numpy as np
import json
import sys
from typing import List, Dict, Any

def serialize_complex(obj):
    """Convert complex numbers to a serializable format."""
    if isinstance(obj, complex):
        return {"real": obj.real, "imag": obj.imag, "_complex": True}
    elif isinstance(obj, np.ndarray):
        return [serialize_complex(x) for x in obj.tolist()]
    elif isinstance(obj, list):
        return [serialize_complex(x) for x in obj]
    else:
        return obj

def test_matrix_eigenvalues(name: str, matrix: List[List[float]]) -> Dict[str, Any]:
    """Test eigenvalue decomposition for a given matrix."""
    print(f"Testing {name}...")
    
    # Convert to numpy array
    A = np.array(matrix, dtype=float)
    
    try:
        # Compute eigenvalues and eigenvectors
        eigenvalues, eigenvectors = np.linalg.eig(A)
        
        # Sort eigenvalues and eigenvectors by eigenvalue magnitude (descending)
        # This helps with comparison since order can vary
        idx = np.argsort(np.abs(eigenvalues))[::-1]
        eigenvalues_sorted = eigenvalues[idx]
        eigenvectors_sorted = eigenvectors[:, idx]
        
        # Verify the decomposition: A * v = λ * v
        verification_errors = []
        for i in range(len(eigenvalues_sorted)):
            lam = eigenvalues_sorted[i]
            v = eigenvectors_sorted[:, i]
            
            # A * v
            Av = A @ v
            # λ * v  
            lam_v = lam * v
            
            # Compute relative error
            error = np.linalg.norm(Av - lam_v) / (np.linalg.norm(Av) + 1e-15)
            verification_errors.append(float(error))
        
        result = {
            "name": name,
            "matrix": matrix,
            "success": True,
            "eigenvalues": serialize_complex(eigenvalues_sorted),
            "eigenvectors": serialize_complex(eigenvectors_sorted),
            "verification_errors": verification_errors,
            "max_verification_error": max(verification_errors),
            "condition_number": float(np.linalg.cond(A)),
            "determinant": float(np.linalg.det(A)),
            "trace": float(np.trace(A))
        }
        
        print(f"  ✅ Success: {len(eigenvalues)} eigenvalues found")
        print(f"  📊 Max verification error: {max(verification_errors):.2e}")
        print(f"  🔢 Eigenvalues: {[f'{abs(x):.4f}' for x in eigenvalues_sorted]}")
        
        return result
        
    except Exception as e:
        print(f"  ❌ Failed: {str(e)}")
        return {
            "name": name,
            "matrix": matrix,
            "success": False,
            "error": str(e)
        }

def main():
    """Run comprehensive eigenvalue tests."""
    print("🧪 Python NumPy linalg.eig Test Suite")
    print("=====================================")
    
    # Test matrices with known eigenvalues
    test_cases = [
        {
            "name": "Identity 2x2",
            "matrix": [[1.0, 0.0], [0.0, 1.0]],
            "expected_eigenvalues": [1.0, 1.0]
        },
        {
            "name": "Simple diagonal",
            "matrix": [[3.0, 0.0], [0.0, 4.0]],
            "expected_eigenvalues": [4.0, 3.0]
        },
        {
            "name": "Symmetric 2x2",
            "matrix": [[2.0, 1.0], [1.0, 2.0]],
            "expected_eigenvalues": [3.0, 1.0]
        },
        {
            "name": "Symmetric 2x2 (variant)",
            "matrix": [[3.0, 1.0], [1.0, 3.0]],
            "expected_eigenvalues": [4.0, 2.0]
        },
        {
            "name": "Non-symmetric 2x2",
            "matrix": [[1.0, 2.0], [3.0, 4.0]],
            "expected_eigenvalues": "complex"
        },
        {
            "name": "Rotation-like matrix",
            "matrix": [[0.0, -1.0], [1.0, 0.0]],
            "expected_eigenvalues": "complex (±i)"
        },
        {
            "name": "Symmetric 3x3",
            "matrix": [
                [4.0, 1.0, 0.0],
                [1.0, 4.0, 1.0], 
                [0.0, 1.0, 4.0]
            ],
            "expected_eigenvalues": "real"
        },
        {
            "name": "Upper triangular 3x3",
            "matrix": [
                [2.0, 1.0, 3.0],
                [0.0, 3.0, 1.0],
                [0.0, 0.0, 4.0]
            ],
            "expected_eigenvalues": [4.0, 3.0, 2.0]
        },
        {
            "name": "Nearly singular",
            "matrix": [[1.0, 1.0], [1.0, 1.0001]],
            "expected_eigenvalues": "one near zero"
        },
        {
            "name": "Large eigenvalue spread",
            "matrix": [[1000.0, 0.0], [0.0, 0.001]],
            "expected_eigenvalues": [1000.0, 0.001]
        }
    ]
    
    results = []
    
    for test_case in test_cases:
        result = test_matrix_eigenvalues(
            test_case["name"], 
            test_case["matrix"]
        )
        results.append(result)
        print()
    
    # Save results to JSON for comparison
    output_file = "python_eig_results.json"
    with open(output_file, 'w') as f:
        json.dump({
            "test_suite": "Python NumPy linalg.eig",
            "numpy_version": np.__version__,
            "total_tests": len(results),
            "successful_tests": sum(1 for r in results if r.get("success", False)),
            "results": results
        }, f, indent=2)
    
    print(f"📄 Results saved to {output_file}")
    
    # Summary
    successful = sum(1 for r in results if r.get("success", False))
    print(f"📊 Summary: {successful}/{len(results)} tests successful")
    
    if successful == len(results):
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())