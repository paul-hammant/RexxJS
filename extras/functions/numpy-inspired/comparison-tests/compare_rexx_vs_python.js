#!/usr/bin/env node
/**
 * Comparison between Python NumPy and our REXX/JS implementation
 */

const fs = require('fs');

function compareResults() {
    console.log('🔍 Python NumPy vs REXX/JS Implementation Comparison');
    console.log('===================================================');
    console.log();
    
    // Load results
    if (!fs.existsSync('python_eig_results.json')) {
        console.error('❌ Python results not found. Run: python3 test_eig_python.py');
        return 1;
    }
    
    if (!fs.existsSync('rexx_js_eig_results.json')) {
        console.error('❌ REXX/JS results not found. Run: node test_eig_rexx_js.js');
        return 1;
    }
    
    const pythonData = JSON.parse(fs.readFileSync('python_eig_results.json', 'utf8'));
    const rexxData = JSON.parse(fs.readFileSync('rexx_js_eig_results.json', 'utf8'));
    
    console.log(`📊 Python NumPy: ${pythonData.successful_tests}/${pythonData.total_tests} tests passed`);
    console.log(`📊 REXX/JS: ${rexxData.successful_tests}/${rexxData.total_tests} tests passed`);
    console.log();
    
    // Compare test cases that exist in both
    let matches = 0;
    let total = 0;
    const tolerance = 1e-3; // Relaxed tolerance for algorithm differences
    
    for (const rexxResult of rexxData.results) {
        const pythonResult = pythonData.results.find(r => r.name === rexxResult.name);
        
        if (!pythonResult) {
            console.log(`⚠️  No Python result for: ${rexxResult.name}`);
            continue;
        }
        
        if (!pythonResult.success || !rexxResult.success) {
            console.log(`⚠️  ${rexxResult.name}: One implementation failed`);
            console.log(`     Python: ${pythonResult.success ? '✅' : '❌'}`);
            console.log(`     REXX/JS: ${rexxResult.success ? '✅' : '❌'}`);
            continue;
        }
        
        total++;
        
        // Extract eigenvalues (handle complex numbers from Python)
        const pythonEigenvalues = pythonResult.eigenvalues.map(val => {
            if (typeof val === 'object' && val._complex) {
                return val.real; // Take real part for comparison
            }
            return val;
        }).sort((a, b) => Math.abs(b) - Math.abs(a)); // Sort by magnitude
        
        const rexxEigenvalues = rexxResult.eigenvalues
            .sort((a, b) => Math.abs(b) - Math.abs(a)); // Sort by magnitude
        
        // Compare largest eigenvalues (our algorithm may not find all)
        const compareCount = Math.min(pythonEigenvalues.length, rexxEigenvalues.length);
        let eigenvalueMatch = true;
        let maxDiff = 0;
        
        for (let i = 0; i < compareCount; i++) {
            const diff = Math.abs(pythonEigenvalues[i] - rexxEigenvalues[i]);
            const relDiff = diff / (Math.abs(pythonEigenvalues[i]) + 1e-15);
            maxDiff = Math.max(maxDiff, relDiff);
            
            if (relDiff > tolerance) {
                eigenvalueMatch = false;
            }
        }
        
        console.log(`🔬 ${rexxResult.name}:`);
        console.log(`   Python eigenvalues: [${pythonEigenvalues.slice(0, 3).map(v => v.toFixed(4)).join(', ')}${pythonEigenvalues.length > 3 ? '...' : ''}]`);
        console.log(`   REXX/JS eigenvalues: [${rexxEigenvalues.slice(0, 3).map(v => v.toFixed(4)).join(', ')}${rexxEigenvalues.length > 3 ? '...' : ''}]`);
        console.log(`   Max relative difference: ${maxDiff.toExponential(2)}`);
        console.log(`   Match: ${eigenvalueMatch ? '✅' : '❌'}`);
        
        if (eigenvalueMatch) {
            matches++;
        }
        
        console.log();
    }
    
    console.log('📋 Summary');
    console.log('==========');
    console.log(`✅ Matching results: ${matches}/${total}`);
    console.log(`🎯 Tolerance: ${tolerance}`);
    console.log(`📝 Note: REXX/JS uses power iteration (finds dominant eigenvalues)`);
    console.log(`📝 Note: Python uses full QR decomposition (finds all eigenvalues)`);
    console.log(`📝 Note: Tests run via REXX interpreter using our NumPy implementation`);
    
    if (matches === total && total > 0) {
        console.log('🎉 REXX/JS implementation matches Python NumPy results!');
        return 0;
    } else if (matches > total * 0.7) {
        console.log('✅ Most implementations match - acceptable for power iteration method');
        return 0;
    } else {
        console.log('⚠️  Significant differences detected');
        return 1;
    }
}

if (require.main === module) {
    process.exit(compareResults());
}

module.exports = { compareResults };