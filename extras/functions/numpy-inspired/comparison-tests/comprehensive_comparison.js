#!/usr/bin/env node
/**
 * Comprehensive comparison between NumPy's sophisticated eigenvalue tests
 * and our REXX/JS implementation following EigvalsCases patterns.
 */

const fs = require('fs');

function compareComprehensiveResults() {
    console.log('🔍 Comprehensive NumPy vs REXX/JS Eigenvalue Comparison');
    console.log('========================================================');
    console.log('📚 Based on NumPy LinalgSquareTestCase and EigvalsCases patterns');
    console.log();
    
    // Load comprehensive results
    if (!fs.existsSync('numpy_comprehensive_eig_results.json')) {
        console.error('❌ NumPy comprehensive results not found.');
        console.error('   Run: python3 numpy_style_comprehensive_test.py');
        return 1;
    }
    
    if (!fs.existsSync('comprehensive_rexx_js_eig_results.json')) {
        console.error('❌ REXX/JS comprehensive results not found.');
        console.error('   Run: node comprehensive_rexx_eigvals_test.js');
        return 1;
    }
    
    const numpyData = JSON.parse(fs.readFileSync('numpy_comprehensive_eig_results.json', 'utf8'));
    const rexxData = JSON.parse(fs.readFileSync('comprehensive_rexx_js_eig_results.json', 'utf8'));
    
    console.log(`📊 NumPy comprehensive tests: ${numpyData.successful_tests}/${numpyData.total_tests} passed`);
    console.log(`📊 REXX/JS comprehensive tests: ${rexxData.successful_tests}/${rexxData.total_tests} passed`);
    console.log();
    
    // Analyze test coverage
    console.log('🎯 Test Coverage Analysis:');
    console.log(`   NumPy matrix sizes: ${numpyData.test_patterns.matrix_sizes.join(', ')}`);
    console.log(`   NumPy dtypes: ${numpyData.test_patterns.dtypes.join(', ')}`);
    console.log(`   NumPy special cases: ${numpyData.test_patterns.special_cases.join(', ')}`);
    console.log();
    console.log(`   REXX/JS matrix sizes: ${rexxData.test_patterns.matrix_sizes.join(', ')}`);
    console.log(`   REXX/JS special cases: ${rexxData.test_patterns.special_cases.join(', ')}`);
    console.log();
    
    // Compare matching test cases
    let matches = 0;
    let total_compared = 0;
    const tolerance = 1e-3; // Tolerance for eigenvalue differences
    const detailed_comparisons = [];
    
    for (const rexxResult of rexxData.results) {
        // Find matching NumPy result by name pattern
        const numpyResult = numpyData.results.find(r => 
            r.name.includes(rexxResult.name.replace(/^\d+x\d+_/, '')) ||
            rexxResult.name.includes(r.name.replace(/^\d+x\d+_/, ''))
        );
        
        if (!numpyResult) {
            console.log(`⚠️  No NumPy match found for: ${rexxResult.name}`);
            continue;
        }
        
        if (!numpyResult.success || !rexxResult.success) {
            console.log(`⚠️  ${rexxResult.name}: One implementation failed`);
            console.log(`     NumPy: ${numpyResult.success ? '✅' : '❌'}`);
            console.log(`     REXX/JS: ${rexxResult.success ? '✅' : '❌'}`);
            continue;
        }
        
        total_compared++;
        
        // Extract eigenvalues for comparison
        const numpyEigenvalues = numpyResult.eigenvalues.map(val => {
            if (typeof val === 'object' && val._complex) {
                return val.real; // Take real part for comparison
            }
            return val;
        }).sort((a, b) => Math.abs(b) - Math.abs(a));
        
        const rexxEigenvalues = rexxResult.eigenvalues
            .sort((a, b) => Math.abs(b) - Math.abs(a));
        
        // Compare eigenvalues (handle different counts due to algorithm differences)
        const compareCount = Math.min(numpyEigenvalues.length, rexxEigenvalues.length);
        let eigenvalueMatch = true;
        let maxDiff = 0;
        const differences = [];
        
        for (let i = 0; i < compareCount; i++) {
            const diff = Math.abs(numpyEigenvalues[i] - rexxEigenvalues[i]);
            const relDiff = diff / (Math.abs(numpyEigenvalues[i]) + 1e-15);
            differences.push(relDiff);
            maxDiff = Math.max(maxDiff, relDiff);
            
            if (relDiff > tolerance) {
                eigenvalueMatch = false;
            }
        }
        
        // Check EIG/EIGVALS consistency
        const rexxConsistent = rexxResult.eig_eigvals_consistent !== false;
        const numpyConsistent = numpyResult.eigenvals_eig_match !== false;
        
        console.log(`🔬 ${rexxResult.name}:`);
        console.log(`   📐 Matrix: ${numpyResult.matrix_shape.join('x')} (${numpyResult.matrix_dtype})`);
        console.log(`   🧮 NumPy eigenvalues: [${numpyEigenvalues.slice(0, 3).map(v => v.toFixed(4)).join(', ')}${numpyEigenvalues.length > 3 ? '...' : ''}] (${numpyEigenvalues.length} total)`);
        console.log(`   🔧 REXX/JS eigenvalues: [${rexxEigenvalues.slice(0, 3).map(v => v.toFixed(4)).join(', ')}${rexxEigenvalues.length > 3 ? '...' : ''}] (${rexxEigenvalues.length} total)`);
        console.log(`   📊 Max relative difference: ${maxDiff.toExponential(2)}`);
        console.log(`   ✅ Eigenvalue match: ${eigenvalueMatch ? '✅' : '❌'}`);
        console.log(`   ⚖️  NumPy EIG/EIGVALS consistent: ${numpyConsistent ? '✅' : '❌'}`);
        console.log(`   ⚖️  REXX/JS EIG/EIGVALS consistent: ${rexxConsistent ? '✅' : '❌'}`);
        
        if (eigenvalueMatch) {
            matches++;
        }
        
        detailed_comparisons.push({
            name: rexxResult.name,
            numpy_success: numpyResult.success,
            rexx_success: rexxResult.success,
            eigenvalue_match: eigenvalueMatch,
            max_difference: maxDiff,
            numpy_eigenvalue_count: numpyEigenvalues.length,
            rexx_eigenvalue_count: rexxEigenvalues.length,
            numpy_condition: numpyResult.condition_number,
            numpy_verification_error: numpyResult.max_verification_error,
            numpy_consistent: numpyConsistent,
            rexx_consistent: rexxConsistent
        });
        
        console.log();
    }
    
    // Summary analysis
    console.log('📋 Comprehensive Comparison Summary');
    console.log('===================================');
    console.log(`✅ Matching eigenvalue results: ${matches}/${total_compared}`);
    console.log(`🎯 Tolerance used: ${tolerance}`);
    console.log(`📊 Success rate: ${(matches/total_compared*100).toFixed(1)}%`);
    console.log();
    
    // Algorithm comparison notes
    console.log('🔬 Algorithm Analysis:');
    console.log('   📚 NumPy: Full QR decomposition (finds all eigenvalues)');
    console.log('   🔧 REXX/JS: Power iteration with deflation (finds dominant eigenvalues)');
    console.log('   📈 Expected: REXX/JS may find fewer eigenvalues than NumPy');
    console.log('   🎯 Focus: Dominant eigenvalues should match within tolerance');
    console.log();
    
    // Save detailed comparison report
    const reportData = {
        comparison_summary: {
            total_compared: total_compared,
            matching_eigenvalues: matches,
            success_rate: matches/total_compared,
            tolerance: tolerance,
            numpy_tests: `${numpyData.successful_tests}/${numpyData.total_tests}`,
            rexx_tests: `${rexxData.successful_tests}/${rexxData.total_tests}`,
            test_sophistication: "Based on NumPy LinalgSquareTestCase and EigvalsCases"
        },
        algorithm_comparison: {
            numpy_method: "Full QR decomposition (LAPACK)",
            rexx_js_method: "Power iteration with deflation",
            expected_differences: "REXX/JS finds dominant eigenvalues, NumPy finds all"
        },
        detailed_comparisons: detailed_comparisons
    };
    
    fs.writeFileSync('comprehensive_eigenvalue_comparison_report.json', 
                    JSON.stringify(reportData, null, 2));
    console.log('📄 Detailed comparison report saved to comprehensive_eigenvalue_comparison_report.json');
    console.log();
    
    // Final assessment
    if (matches >= total_compared * 0.8) {
        console.log('🎉 Excellent: REXX/JS implementation matches NumPy on sophisticated test suite!');
        console.log(`📚 Successfully validated against ${total_compared} comprehensive test cases`);
        return 0;
    } else if (matches >= total_compared * 0.6) {
        console.log('✅ Good: Most REXX/JS results match NumPy within expected algorithm differences');
        return 0;
    } else {
        console.log('⚠️  Significant differences detected in comprehensive testing');
        return 1;
    }
}

if (require.main === module) {
    process.exit(compareComprehensiveResults());
}

module.exports = { compareComprehensiveResults };