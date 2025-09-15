#!/usr/bin/env node
/**
 * REXX/JS test suite for eigenvalue decomposition.
 * This tests our NumPy implementation via the REXX interpreter.
 */

const fs = require('fs');
const path = require('path');

// Import the Rexx interpreter from core
const { RexxInterpreter } = require('../../../../core/src/interpreter');
const { parse } = require('../../../../core/src/parser');

// Import the numpy functions to register with interpreter
const numpyFunctions = require('../numpy');

/**
 * Test eigenvalue decomposition using REXX interpreter
 */
async function runRexxEigenvalueTests() {
    console.log('🧪 REXX/JS Eigenvalue Test Suite');
    console.log('=================================');
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
    console.log();
    
    try {
        // Read and execute the REXX test script
        const rexxScript = fs.readFileSync(
            path.join(__dirname, 'test_eig_rexx.rexx'), 
            'utf8'
        );
        
        console.log('📜 Executing REXX eigenvalue test script...');
        console.log('===========================================');
        
        const commands = parse(rexxScript);
        await interpreter.run(commands);
        
        console.log();
        console.log('📊 Extracting test results from REXX variables...');
        
        // Extract results from interpreter variables
        const testResults = [];
        const testCases = [
            { name: "Identity 2x2", variable: "result_identity" },
            { name: "Simple diagonal", variable: "result_diagonal" },
            { name: "Symmetric 2x2", variable: "result_symmetric" },
            { name: "Symmetric 2x2 (variant)", variable: "result_variant" },
            { name: "Non-symmetric 2x2", variable: "result_non_symmetric" },
            { name: "Symmetric 3x3", variable: "result_3x3" },
            { name: "Nearly singular", variable: "result_singular" }
        ];
        
        for (const testCase of testCases) {
            const result = interpreter.variables.get(testCase.variable);
            
            console.log(`🔬 ${testCase.name}:`);
            
            if (result && result.eigenvalues) {
                // Successful result
                const eigenvalues = Array.isArray(result.eigenvalues) ? 
                    result.eigenvalues : [result.eigenvalues];
                
                // Sort by magnitude for comparison consistency
                const sortedEigenvalues = eigenvalues.sort((a, b) => Math.abs(b) - Math.abs(a));
                
                console.log(`   ✅ Success: ${sortedEigenvalues.length} eigenvalues found`);
                console.log(`   🔢 Eigenvalues: [${sortedEigenvalues.map(v => v.toFixed(4)).join(', ')}]`);
                
                testResults.push({
                    name: testCase.name,
                    success: true,
                    eigenvalues: sortedEigenvalues,
                    eigenvectors: result.eigenvectors || null,
                    implementation: "REXX/JS via interpreter"
                });
                
            } else if (result && typeof result === 'string') {
                // Check if it's an error message
                if (result.toLowerCase().includes('error') || result.toLowerCase().includes('failed')) {
                    console.log(`   ❌ Failed: ${result}`);
                    testResults.push({
                        name: testCase.name,
                        success: false,
                        error: result,
                        implementation: "REXX/JS via interpreter"
                    });
                } else {
                    // Try to parse as simple result
                    console.log(`   ⚠️  Unexpected result format: ${result}`);
                    testResults.push({
                        name: testCase.name,
                        success: false,
                        error: "Unexpected result format",
                        raw_result: result,
                        implementation: "REXX/JS via interpreter"
                    });
                }
            } else {
                console.log(`   ❌ No result found for variable: ${testCase.variable}`);
                testResults.push({
                    name: testCase.name,
                    success: false,
                    error: "No result found",
                    implementation: "REXX/JS via interpreter"
                });
            }
            
            console.log();
        }
        
        // Save results to JSON for comparison
        const outputFile = 'rexx_js_eig_results.json';
        const outputData = {
            test_suite: "REXX/JS linalg.eig",
            implementation: "JavaScript NumPy via REXX interpreter",
            total_tests: testResults.length,
            successful_tests: testResults.filter(r => r.success).length,
            results: testResults
        };
        
        fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
        console.log(`📄 Results saved to ${outputFile}`);
        
        // Summary
        const successful = testResults.filter(r => r.success).length;
        console.log(`📊 Summary: ${successful}/${testResults.length} tests successful`);
        
        if (successful === testResults.length) {
            console.log('🎉 All REXX/JS tests passed!');
            return 0;
        } else {
            console.log('⚠️  Some tests failed');
            return 1;
        }
        
    } catch (error) {
        console.error('❌ REXX test execution failed:', error.message);
        console.error('Stack trace:', error.stack);
        return 1;
    }
}

if (require.main === module) {
    runRexxEigenvalueTests().then(process.exit).catch(err => {
        console.error('❌ Test suite failed:', err);
        process.exit(1);
    });
}

module.exports = { runRexxEigenvalueTests };