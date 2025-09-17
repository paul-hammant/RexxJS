/*!
 * TestRexxInterpreter - Enhanced REXX interpreter for test execution
 * Injects test functions into global namespace for clean test syntax
 * Copyright (c) 2025 Paul Hammant | MIT License
 */

const { RexxInterpreter } = require('./interpreter.js');

class TestRexxInterpreter extends RexxInterpreter {
  constructor(addressSender, variables = {}, outputHandler = null, commandLineArgs = [], options = {}) {
    super(addressSender, variables, outputHandler);
    
    // Store test runner options
    this.testOptions = options;
    
    // Set up command line arguments for PARSE ARG
    this.variables.set('ARG.0', commandLineArgs.length.toString());
    for (let i = 0; i < commandLineArgs.length; i++) {
      this.variables.set(`ARG.${i + 1}`, commandLineArgs[i]);
    }
    
    // Test state tracking
    this.testResults = {
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0
    };
    
    // Register test functions as subroutines
    this.registerTestFunctions();
  }
  
  registerTestFunctions() {
    // Create mock subroutine commands for test functions
    this.subroutines.set('PASS', {
      type: 'PROCEDURE',
      name: 'PASS',
      arguments: [],
      body: [] // Empty body - we'll handle in executeCall override
    });
    
    this.subroutines.set('FAIL', {
      type: 'PROCEDURE', 
      name: 'FAIL',
      arguments: ['message'],
      body: []
    });
    
    // Removed START_TEST, START_DESCRIBE and END_DESCRIBE - simplified to just count test subroutines
    
  }

  // Override executeCommand to handle test function calls
  async executeCommand(command) {
    // Handle CALL and FUNCTION_CALL commands for PASS and FAIL
    if (command.type === 'CALL' || command.type === 'FUNCTION_CALL') {
      const subroutineName = command.subroutine || command.command;
      
      if (subroutineName) {
        const upperSubroutine = subroutineName.toUpperCase();
        
        if (upperSubroutine === 'PASS' || upperSubroutine === 'FAIL') {
          // Extract arguments from the params or arguments
          const args = command.arguments || (command.params ? [command.params.value] : []);
          return this.executeCall(subroutineName, args);
        }
      }
    }
    
    // For all other commands, use parent implementation
    return super.executeCommand(command);
  }

  // Override handleOperationResult to output test-specific messages
  handleOperationResult(result) {
    // Output assertion/expectation messages for test debugging/tracing
    if (result.message && (result.operation === 'ASSERTION' || result.operation === 'EXPECTATION')) {
      this.outputHandler.output(result.message);
    }
    
    // Call parent implementation for any other handling
    super.handleOperationResult(result);
  }
  
  // Override executeCall to count test subroutines and handle test functions
  executeCall(subroutine, args) {
    const uppercaseSubroutine = subroutine.toUpperCase();
    
    // Check if this is a test subroutine (ends with 'Test')
    if (uppercaseSubroutine.endsWith('TEST')) {
      // Count this as a test execution
      this.handleTestSubroutineCall(subroutine);
    }
    
    // Handle test function calls
    switch (uppercaseSubroutine) {
      case 'PASS':
        return this.handlePass();
      case 'FAIL':
        let message = args.length > 0 ? args[0] : "Test failed";
        // Remove quotes if they exist
        if (typeof message === 'string' && message.startsWith('"') && message.endsWith('"')) {
          message = message.slice(1, -1);
        }
        return this.handleFail(message);
      default:
        // Fall back to parent class for regular subroutines
        return super.executeCall(subroutine, args);
    }
  }
  
  // Handle test subroutine execution (each test subroutine = one test)
  handleTestSubroutineCall(subroutineName) {
    const test = {
      name: subroutineName,
      passed: true, // Assume passed unless we hit an error
      output: [],
      startTime: new Date().toISOString(),
      endTime: null,
      error: null
    };
    this.testResults.tests.push(test);
    this.testResults.totalTests++;
    this.testResults.passedTests++; // Count as passed for now
    
    if (this.outputHandler) {
      this.outputHandler.output(`🔍 ${subroutineName}`);
    }
  }
  
  isDescribeSubroutine(subroutineName) {
    // Check if the subroutine name matches describe patterns (handle both cases)
    const upperName = subroutineName.toUpperCase();
    return upperName.startsWith('DESCRIBE_') ||
           subroutineName.startsWith('Describe_') ||
           upperName.includes('TEST') ||
           upperName.includes('SPEC') ||
           upperName.includes('OPERATIONS') ||
           upperName.includes('FUNCTIONS') ||
           upperName.includes('VALIDATION') ||
           upperName.includes('HANDLING') ||
           upperName.includes('TESTING');
  }
  
  inferDescribeName(subroutineName) {
    // Convert subroutine name to human-readable describe name
    const upperName = subroutineName.toUpperCase();
    if (upperName.startsWith('DESCRIBE_') || subroutineName.startsWith('Describe_')) {
      // Remove DESCRIBE_ or Describe_ prefix and convert underscores to spaces
      const prefix = upperName.startsWith('DESCRIBE_') ? 'DESCRIBE_'.length : 'Describe_'.length;
      return subroutineName.substring(prefix).replace(/_/g, ' ');
    } else {
      // Convert CamelCase to space-separated words
      return subroutineName.replace(/([A-Z])/g, ' $1').trim();
    }
  }

  handlePass() {
    if (this.testResults.currentDescribe && 
        this.testResults.currentDescribe.tests.length > 0) {
      const currentTest = this.testResults.currentDescribe.tests[
        this.testResults.currentDescribe.tests.length - 1
      ];
      currentTest.passed = true;
      currentTest.endTime = new Date().toISOString();
      this.testResults.currentDescribe.passed++;
      this.testResults.passedTests++;
      
      // Still output for visual feedback
      if (this.outputHandler) {
        this.outputHandler.output("    ✅ PASSED");
      }
    }
  }
  
  handleFail(message) {
    if (this.testResults.currentDescribe && 
        this.testResults.currentDescribe.tests.length > 0) {
      const currentTest = this.testResults.currentDescribe.tests[
        this.testResults.currentDescribe.tests.length - 1
      ];
      currentTest.passed = false;
      currentTest.endTime = new Date().toISOString();
      currentTest.error = message;
      this.testResults.currentDescribe.failed++;
      this.testResults.failedTests++;
      
      if (this.outputHandler) {
        this.outputHandler.output(`    ❌ FAILED: ${message}`);
      }
    }
  }
  
  endCurrentTestIfRunning() {
    if (this.testResults.currentDescribe &&
        this.testResults.currentDescribe.tests.length > 0) {
      const currentTest = this.testResults.currentDescribe.tests[
        this.testResults.currentDescribe.tests.length - 1
      ];
      if (currentTest.passed === null) {
        // Test completed without an explicit PASS or FAIL, so it passes.
        this.handlePass();
      }
    }
  }

  // Removed handleStartTest - no longer needed with simplified approach
  
  // Removed handleStartDescribe and handleEndDescribe - simplified to just START_TEST
  
  // Override run method to write test results at the end
  async run(commands, source, fileName) {
    try {
      const result = await super.run(commands, source, fileName);
      // Write test results to temp file after execution
      this.writeTestResultsToFile();
      return result;
    } catch (error) {
      // Even on error, try to write partial results
      this.writeTestResultsToFile();
      throw error;
    }
  }
  
  // Write test results to temp file for rexxt to read
  writeTestResultsToFile() {
    const fs = require('fs');
    const tempFile = '.rexxt-test-results.tmp';
    try {
      const resultsData = {
        totalTests: this.testResults.totalTests,
        passedTests: this.testResults.passedTests,
        failedTests: this.testResults.failedTests,
        tests: this.testResults.tests
      };
      fs.writeFileSync(tempFile, JSON.stringify(resultsData, null, 2));
    } catch (error) {
      // Ignore write errors
    }
  }
}

module.exports = { TestRexxInterpreter };