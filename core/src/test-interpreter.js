/*!
 * TestRexxInterpreter - Enhanced REXX interpreter for test execution
 * Injects test functions into global namespace for clean test syntax
 * Copyright (c) 2025 Paul Hammant | MIT License
 */

const { RexxInterpreter } = require('./interpreter.js');

class TestRexxInterpreter extends RexxInterpreter {
  constructor(addressSender, variables = {}, outputHandler = null, commandLineArgs = []) {
    super(addressSender, variables, outputHandler);
    
    // Set up command line arguments for PARSE ARG
    this.variables.set('ARG.0', commandLineArgs.length.toString());
    for (let i = 0; i < commandLineArgs.length; i++) {
      this.variables.set(`ARG.${i + 1}`, commandLineArgs[i]);
    }
    
    // Test state tracking
    this.testResults = {
      describes: [],
      currentDescribe: null,
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
    
    this.subroutines.set('START_TEST', {
      type: 'PROCEDURE',
      name: 'START_TEST', 
      arguments: ['name'],
      body: []
    });
    
    this.subroutines.set('START_DESCRIBE', {
      type: 'PROCEDURE',
      name: 'START_DESCRIBE',
      arguments: ['name'], 
      body: []
    });
    
    this.subroutines.set('END_DESCRIBE', {
      type: 'PROCEDURE',
      name: 'END_DESCRIBE',
      arguments: [],
      body: []
    });
    
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
  
  // Override executeCall to handle our test functions
  async executeCall(command) {
    const { subroutine, arguments: args } = command;
    
    // Handle test function calls
    switch (subroutine) {
      case 'PASS':
        return this.handlePass();
      case 'FAIL':
        let message = args.length > 0 ? args[0] : "Test failed";
        // Remove quotes if they exist
        if (typeof message === 'string' && message.startsWith('"') && message.endsWith('"')) {
          message = message.slice(1, -1);
        }
        return this.handleFail(message);
      case 'START_TEST':
        let testName = args.length > 0 ? args[0] : "Unnamed test";
        // Remove quotes if they exist
        if (typeof testName === 'string' && testName.startsWith('"') && testName.endsWith('"')) {
          testName = testName.slice(1, -1);
        }
        return this.handleStartTest(testName);
      case 'START_DESCRIBE':
        let describeName = args.length > 0 ? args[0] : "Unnamed describe";
        // Remove quotes if they exist
        if (typeof describeName === 'string' && describeName.startsWith('"') && describeName.endsWith('"')) {
          describeName = describeName.slice(1, -1);
        }
        return this.handleStartDescribe(describeName);  
      case 'END_DESCRIBE':
        return this.handleEndDescribe();
      default:
        // For variable-based calls, resolve the variable first
        let resolvedSubroutine = subroutine;
        let uppercaseSubroutine = subroutine.toUpperCase();
        
        // Check if it's a variable containing subroutine name (like parent class does)
        if (!this.subroutines.has(uppercaseSubroutine)) {
          const variableValue = this.variables.get(subroutine);
          if (variableValue !== undefined && typeof variableValue === 'string') {
            resolvedSubroutine = variableValue;
            uppercaseSubroutine = variableValue.toUpperCase();
          }
        }
        
        // Check if the resolved subroutine is a describe subroutine
        if (this.isDescribeSubroutine(uppercaseSubroutine)) {
          // Auto-call START_DESCRIBE with inferred name (use original case)
          const describeName = this.inferDescribeName(resolvedSubroutine);
          this.handleStartDescribe(describeName);
        }
        // Fall back to parent class for regular subroutines
        return super.executeCall(command);
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

  handleStartTest(name) {
    this.endCurrentTestIfRunning();
    if (this.testResults.currentDescribe) {
      const test = {
        name: name,
        passed: null,
        output: [],
        startTime: new Date().toISOString(),
        endTime: null,
        error: null
      };
      this.testResults.currentDescribe.tests.push(test);
      this.testResults.totalTests++;
      
      if (this.outputHandler) {
        this.outputHandler.output(`  🔍 ${name}`);
      }
    }
  }
  
  handleStartDescribe(name) {
    this.endCurrentTestIfRunning();
    const describe = {
      name: name,
      tests: [],
      startTime: new Date().toISOString(),
      passed: 0,
      failed: 0,
      endTime: null
    };
    this.testResults.describes.push(describe);
    this.testResults.currentDescribe = describe;
    
    if (this.outputHandler) {
      this.outputHandler.output(`📋 ${name}`);
    }
  }
  
  handleEndDescribe() {
    this.endCurrentTestIfRunning();
    if (this.testResults.currentDescribe) {
      this.testResults.currentDescribe.endTime = new Date().toISOString();
      if (this.outputHandler) {
        this.outputHandler.output(`  📋 ${this.testResults.currentDescribe.name} completed`);
      }
    }
  }
}

module.exports = { TestRexxInterpreter };