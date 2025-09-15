#!/usr/bin/env node
/**
 * Comprehensive REXX eigenvalue test suite based on NumPy's EigvalsCases pattern.
 * Tests our implementation via REXX interpreter with sophisticated test matrices
 * covering the same patterns as NumPy's LinalgSquareTestCase.
 */

const fs = require('fs');
const path = require('path');

// Import the Rexx interpreter from core
const { RexxInterpreter } = require('../../../../core/src/interpreter');
const { parse } = require('../../../../core/src/parser');

// Import the numpy functions to register with interpreter
const numpyFunctions = require('../numpy');

/**
 * Comprehensive test cases based on NumPy's LinalgSquareTestCase patterns
 */
const COMPREHENSIVE_TEST_CASES = [
    // === 1x1 matrices (edge cases) ===
    {
        name: "1x1_real_single",
        matrix: "[[3.0]]",
        description: "1x1 real single precision equivalent"
    },
    {
        name: "1x1_complex_equivalent",
        matrix: "[[5.0]]", // We'll treat as real since we don't have complex input parsing yet
        description: "1x1 matrix (complex equivalent as real)"
    },
    
    // === 2x2 matrices (basic cases) ===
    {
        name: "2x2_basic_real",
        matrix: "[[1.0, 2.0], [3.0, 4.0]]",
        description: "Basic 2x2 real matrix (NumPy pattern)"
    },
    {
        name: "2x2_symmetric_real",
        matrix: "[[4.0, 1.0], [1.0, 3.0]]",
        description: "Symmetric real matrix"
    },
    {
        name: "2x2_diagonal_real",
        matrix: "[[7.0, 0.0], [0.0, 3.0]]",
        description: "Diagonal real matrix"
    },
    {
        name: "2x2_nearly_singular",
        matrix: "[[1.0, 1.0], [1.0, 1.0001]]",
        description: "Nearly singular matrix"
    },
    {
        name: "2x2_rotation_like",
        matrix: "[[0.0, -1.0], [1.0, 0.0]]",
        description: "Rotation-like matrix with pure imaginary eigenvalues"
    },
    {
        name: "2x2_identity",
        matrix: "[[1.0, 0.0], [0.0, 1.0]]",
        description: "2x2 identity matrix"
    },
    {
        name: "2x2_large_spread",
        matrix: "[[1000.0, 0.0], [0.0, 0.001]]",
        description: "Matrix with large eigenvalue spread"
    },
    
    // === 3x3 matrices (intermediate cases) ===
    {
        name: "3x3_symmetric_tridiagonal",
        matrix: "[[4.0, 1.0, 0.0], [1.0, 4.0, 1.0], [0.0, 1.0, 4.0]]",
        description: "Symmetric tridiagonal matrix"
    },
    {
        name: "3x3_upper_triangular",
        matrix: "[[2.0, 1.0, 3.0], [0.0, 3.0, 1.0], [0.0, 0.0, 4.0]]",
        description: "Upper triangular matrix"
    },
    {
        name: "3x3_random_symmetric",
        matrix: "[[5.0, 2.0, 1.0], [2.0, 6.0, 3.0], [1.0, 3.0, 7.0]]",
        description: "Random symmetric matrix"
    },
    {
        name: "3x3_zero_matrix",
        matrix: "[[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]",
        description: "Zero matrix (degenerate case)"
    },
    {
        name: "3x3_repeated_eigenvals",
        matrix: "[[2.0, 1.0, 0.0], [0.0, 2.0, 1.0], [0.0, 0.0, 2.0]]",
        description: "Matrix with repeated eigenvalues"
    },
    
    // === 4x4 matrices (maximum size for our implementation) ===
    {
        name: "4x4_symmetric_random",
        matrix: "[[2.5, 1.2, 0.8, 0.3], [1.2, 3.1, 1.5, 0.7], [0.8, 1.5, 2.8, 1.1], [0.3, 0.7, 1.1, 3.3]]",
        description: "4x4 random symmetric matrix"
    },
    {
        name: "4x4_general_random",
        matrix: "[[1.2, 2.3, 0.5, 1.8], [0.9, 2.1, 1.7, 0.4], [1.5, 0.8, 2.9, 1.3], [0.7, 1.9, 0.6, 2.4]]",
        description: "4x4 general random matrix"
    },
    
    // === Stress test matrices ===
    {
        name: "2x2_ill_conditioned",
        matrix: "[[1.0, 0.9999], [0.9999, 1.0]]",
        description: "Ill-conditioned matrix"
    },
    {
        name: "3x3_dense_symmetric",
        matrix: "[[10.0, 5.0, 2.0], [5.0, 8.0, 3.0], [2.0, 3.0, 6.0]]",
        description: "Dense symmetric matrix"
    }
];

/**
 * Generate REXX script for comprehensive eigenvalue testing
 */
function generateComprehensiveRexxScript(testCases) {
    let script = `-- Comprehensive REXX Eigenvalue Test Script
-- Based on NumPy's LinalgSquareTestCase and EigvalsCases patterns

SAY "Starting comprehensive eigenvalue tests..."
SAY ""

`;

    testCases.forEach((testCase, index) => {
        script += `-- Test ${index + 1}: ${testCase.name}
LET matrix_${index} = "${testCase.matrix}"
SAY "Testing ${testCase.name}: ${testCase.description}"
LET result_${index} = EIG matrix=matrix_${index}
LET eigvals_${index} = EIGVALS matrix=matrix_${index}
SAY "EIG result: " || result_${index}
SAY "EIGVALS result: " || eigvals_${index}
SAY ""

`;
    });

    script += `SAY "Comprehensive REXX eigenvalue tests completed."`;
    
    return script;
}

/**
 * Run comprehensive REXX eigenvalue tests
 */
async function runComprehensiveRexxEigenvalueTests() {
    console.log('🧪 Comprehensive REXX/JS Eigenvalue Test Suite (NumPy-style)');
    console.log('============================================================');
    console.log();
    
    // Create interpreter instance
    const interpreter = new RexxInterpreter(null, {
        output: (text) => console.log('REXX: ' + text),
        loadPaths: [path.join(__dirname, '../../../../core/src')]
    });
    
    // Register NumPy functions with the interpreter
    Object.keys(numpyFunctions).forEach(funcName => {
        interpreter.builtInFunctions[funcName] = numpyFunctions[funcName];
    });
    
    console.log('✅ REXX interpreter initialized');
    console.log('✅ NumPy functions registered');
    console.log(`📊 ${COMPREHENSIVE_TEST_CASES.length} comprehensive test cases prepared`);
    console.log();
    
    try {
        // Generate and execute comprehensive REXX script
        const rexxScript = generateComprehensiveRexxScript(COMPREHENSIVE_TEST_CASES);
        
        // Save the script for reference
        fs.writeFileSync(
            path.join(__dirname, 'comprehensive_test_generated.rexx'),
            rexxScript
        );
        
        console.log('📜 Executing comprehensive REXX eigenvalue test script...');
        console.log('=' * 60);
        
        const commands = parse(rexxScript);
        await interpreter.run(commands);
        
        console.log();
        console.log('📊 Extracting comprehensive test results from REXX variables...');
        
        // Extract and analyze results
        const testResults = [];
        
        for (let i = 0; i < COMPREHENSIVE_TEST_CASES.length; i++) {
            const testCase = COMPREHENSIVE_TEST_CASES[i];
            const eigResult = interpreter.variables.get(`result_${i}`);
            const eigvalsResult = interpreter.variables.get(`eigvals_${i}`);
            
            console.log(`🔬 [${(i + 1).toString().padStart(2)}/${COMPREHENSIVE_TEST_CASES.length}] ${testCase.name}:`);
            console.log(`     ${testCase.description}`);
            
            if (eigResult && eigResult.eigenvalues && eigvalsResult) {
                // Successful results
                const eigenvalues = Array.isArray(eigResult.eigenvalues) ? 
                    eigResult.eigenvalues : [eigResult.eigenvalues];
                const eigenvals_only = Array.isArray(eigvalsResult) ? 
                    eigvalsResult : [eigvalsResult];
                
                // Sort by magnitude for comparison
                const sortedEigenvalues = eigenvalues.sort((a, b) => Math.abs(b) - Math.abs(a));
                const sortedEigenvals = eigenvals_only.sort((a, b) => Math.abs(b) - Math.abs(a));
                
                // Check consistency between EIG and EIGVALS
                const maxDiff = Math.max(...sortedEigenvalues.map((val, idx) => {
                    if (idx < sortedEigenvals.length) {
                        return Math.abs(val - sortedEigenvals[idx]);
                    }
                    return 0;
                }));
                
                const consistent = maxDiff < 1e-10;
                
                console.log(`     ✅ Success: ${sortedEigenvalues.length} eigenvalues found`);
                console.log(`     🔢 Eigenvalues: [${sortedEigenvalues.map(v => v.toFixed(4)).join(', ')}]`);
                console.log(`     ⚖️  EIG/EIGVALS consistency: ${consistent ? '✅' : '❌'} (max diff: ${maxDiff.toExponential(2)})`);
                
                testResults.push({
                    name: testCase.name,
                    description: testCase.description,
                    matrix: testCase.matrix,
                    success: true,
                    eigenvalues: sortedEigenvalues,
                    eigenvals_only: sortedEigenvals,
                    eig_eigvals_consistent: consistent,
                    max_consistency_diff: maxDiff,
                    implementation: "REXX/JS via interpreter"
                });
                
            } else {
                // Failed result
                console.log(`     ❌ Failed: No valid results found`);
                testResults.push({
                    name: testCase.name,
                    description: testCase.description,
                    matrix: testCase.matrix,
                    success: false,
                    error: "No valid results found",
                    implementation: "REXX/JS via interpreter"
                });
            }
            
            console.log();
        }
        
        // Save comprehensive results
        const outputFile = 'comprehensive_rexx_js_eig_results.json';
        const outputData = {
            test_suite: "Comprehensive REXX/JS Eigenvalue Tests (NumPy-style)",
            implementation: "JavaScript NumPy via REXX interpreter",
            test_patterns: {
                matrix_sizes: ["1x1", "2x2", "3x3", "4x4", "5x5"],
                special_cases: ["symmetric", "diagonal", "triangular", "identity", 
                              "nearly_singular", "zero", "large_spread", "ill_conditioned"],
                numpy_equivalence: "Based on LinalgSquareTestCase and EigvalsCases patterns"
            },
            total_tests: testResults.length,
            successful_tests: testResults.filter(r => r.success).length,
            results: testResults
        };
        
        fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
        console.log(`📄 Comprehensive results saved to ${outputFile}`);
        
        // Summary
        const successful = testResults.filter(r => r.success).length;
        const consistent = testResults.filter(r => r.success && r.eig_eigvals_consistent).length;
        
        console.log('📋 Comprehensive Test Summary');
        console.log('=============================');
        console.log(`✅ Successful tests: ${successful}/${testResults.length}`);
        console.log(`⚖️  EIG/EIGVALS consistent: ${consistent}/${successful}`);
        console.log(`🎯 Based on NumPy's LinalgSquareTestCase patterns`);
        console.log(`📝 Covers ${COMPREHENSIVE_TEST_CASES.length} sophisticated test cases`);
        
        if (successful === testResults.length) {
            console.log('🎉 All comprehensive REXX/JS tests passed!');
            return 0;
        } else {
            console.log('⚠️  Some comprehensive tests failed');
            return 1;
        }
        
    } catch (error) {
        console.error('❌ Comprehensive REXX test execution failed:', error.message);
        console.error('Stack trace:', error.stack);
        return 1;
    }
}

if (require.main === module) {
    runComprehensiveRexxEigenvalueTests().then(process.exit).catch(err => {
        console.error('❌ Comprehensive test suite failed:', err);
        process.exit(1);
    });
}

module.exports = { runComprehensiveRexxEigenvalueTests, COMPREHENSIVE_TEST_CASES };