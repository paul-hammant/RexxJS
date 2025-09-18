/*!
 * test-framework-address v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta {"dependencies": {}}
 */

/**
 * REXX Test Framework ADDRESS Library
 * 
 * Provides native REXX syntax for testing with automatic test discovery,
 * execution tracking, and structured output for TUI navigation.
 * 
 * Usage:
 *   REQUIRE "test-framework-address"
 *   
 *   DESCRIBE "Math Functions"
 *     TEST "should add numbers correctly"
 *       LET result = 2 + 2
 *       EXPECT result TO_EQUAL 4
 *     END_TEST
 *     
 *     TEST "should handle edge cases"  
 *       EXPECT ABS(-5) TO_EQUAL 5
 *       EXPECT SQRT(16) TO_EQUAL 4
 *     END_TEST
 *   END_DESCRIBE
 * 
 * Copyright (c) 2025 RexxJS Project
 * Licensed under the MIT License
 */

// Global test state management
const TestFramework = {
  suites: [],
  currentSuite: null,
  currentTest: null,
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  startTime: null,
  endTime: null,
  output: [],
  
  // Test hierarchy for TUI navigation
  hierarchy: {
    suites: new Map(),
    currentPath: []
  }
};

// Test Suite class for organizing tests
class TestSuite {
  constructor(name, parent = null) {
    this.name = name;
    this.parent = parent;
    this.tests = [];
    this.subSuites = [];
    this.output = [];
    this.startTime = null;
    this.endTime = null;
    this.passed = 0;
    this.failed = 0;
    this.status = 'pending'; // pending, running, passed, failed
  }
  
  addTest(test) {
    this.tests.push(test);
  }
  
  addSubSuite(suite) {
    this.subSuites.push(suite);
  }
  
  getFullPath() {
    const path = [];
    let current = this;
    while (current) {
      path.unshift(current.name);
      current = current.parent;
    }
    return path.join(' > ');
  }
}

// Test Case class
class TestCase {
  constructor(name, suite) {
    this.name = name;
    this.suite = suite;
    this.expectations = [];
    this.output = [];
    this.startTime = null;
    this.endTime = null;
    this.status = 'pending'; // pending, running, passed, failed
    this.error = null;
  }
  
  addExpectation(expectation) {
    this.expectations.push(expectation);
  }
  
  addOutput(text) {
    this.output.push({
      timestamp: new Date().toISOString(),
      text: text.toString()
    });
  }
}

// Expectation class for tracking assertions
class Expectation {
  constructor(actual, matcher, expected, negated = false) {
    this.actual = actual;
    this.matcher = matcher;
    this.expected = expected;
    this.negated = negated;
    this.passed = false;
    this.message = '';
    this.timestamp = new Date().toISOString();
  }
}

// Matchers for expectations
const MATCHERS = {
  TO_EQUAL: (actual, expected) => actual === expected,
  TO_BE: (actual, expected) => actual === expected,
  TO_CONTAIN: (actual, expected) => {
    if (typeof actual === 'string') return actual.includes(expected);
    if (Array.isArray(actual)) return actual.includes(expected);
    return false;
  },
  TO_BE_GREATER_THAN: (actual, expected) => Number(actual) > Number(expected),
  TO_BE_LESS_THAN: (actual, expected) => Number(actual) < Number(expected),
  TO_HAVE_LENGTH: (actual, expected) => actual && actual.length === expected,
  TO_BE_TRUTHY: (actual) => !!actual,
  TO_BE_FALSY: (actual) => !actual,
  TO_BE_NULL: (actual) => actual === null,
  TO_BE_UNDEFINED: (actual) => actual === undefined,
  TO_MATCH: (actual, expected) => {
    const regex = expected instanceof RegExp ? expected : new RegExp(expected);
    return regex.test(String(actual));
  }
};

// ADDRESS handlers
const ADDRESS_HANDLERS = {
  // DESCRIBE "suite name"
  describe: {
    handler: function(interpreter, command, args) {
      const suiteName = args.trim().replace(/^["']|["']$/g, '');
      
      const suite = new TestSuite(suiteName, TestFramework.currentSuite);
      
      if (TestFramework.currentSuite) {
        TestFramework.currentSuite.addSubSuite(suite);
      } else {
        TestFramework.suites.push(suite);
      }
      
      TestFramework.currentSuite = suite;
      TestFramework.hierarchy.currentPath.push(suiteName);
      
      suite.startTime = new Date().toISOString();
      suite.status = 'running';
      
      // Log suite start
      const message = `📝 Starting suite: ${suite.getFullPath()}`;
      console.log(message);
      TestFramework.output.push({
        type: 'suite-start',
        suite: suiteName,
        path: suite.getFullPath(),
        timestamp: suite.startTime,
        message
      });
      
      return Promise.resolve({
        operation: 'DESCRIBE',
        success: true,
        suite: suiteName,
        message: `Suite "${suiteName}" started`,
        timestamp: suite.startTime
      });
    }
  },
  
  // END_DESCRIBE  
  end_describe: {
    handler: function(interpreter, command, args) {
      if (!TestFramework.currentSuite) {
        throw new Error('END_DESCRIBE without matching DESCRIBE');
      }
      
      const suite = TestFramework.currentSuite;
      suite.endTime = new Date().toISOString();
      
      // Calculate suite results
      suite.passed = suite.tests.filter(t => t.status === 'passed').length;
      suite.failed = suite.tests.filter(t => t.status === 'failed').length;
      suite.status = suite.failed > 0 ? 'failed' : 'passed';
      
      const message = `✅ Suite completed: ${suite.name} (${suite.passed}/${suite.tests.length} passed)`;
      console.log(message);
      
      TestFramework.output.push({
        type: 'suite-end',
        suite: suite.name,
        path: suite.getFullPath(),
        passed: suite.passed,
        failed: suite.failed,
        total: suite.tests.length,
        timestamp: suite.endTime,
        message
      });
      
      // Pop back to parent suite
      TestFramework.currentSuite = suite.parent;
      TestFramework.hierarchy.currentPath.pop();
      
      return Promise.resolve({
        operation: 'END_DESCRIBE',
        success: true,
        suite: suite.name,
        results: { passed: suite.passed, failed: suite.failed, total: suite.tests.length },
        message,
        timestamp: suite.endTime
      });
    }
  },
  
  // TEST "test name"
  test: {
    handler: function(interpreter, command, args) {
      const testName = args.trim().replace(/^["']|["']$/g, '');
      
      if (!TestFramework.currentSuite) {
        throw new Error('TEST must be inside a DESCRIBE block');
      }
      
      const test = new TestCase(testName, TestFramework.currentSuite);
      TestFramework.currentSuite.addTest(test);
      TestFramework.currentTest = test;
      TestFramework.totalTests++;
      
      test.startTime = new Date().toISOString();
      test.status = 'running';
      
      const message = `🧪 Running test: ${testName}`;
      console.log(message);
      
      TestFramework.output.push({
        type: 'test-start',
        test: testName,
        suite: TestFramework.currentSuite.name,
        path: `${TestFramework.currentSuite.getFullPath()} > ${testName}`,
        timestamp: test.startTime,
        message
      });
      
      return Promise.resolve({
        operation: 'TEST',
        success: true,
        test: testName,
        message: `Test "${testName}" started`,
        timestamp: test.startTime
      });
    }
  },
  
  // END_TEST
  end_test: {
    handler: function(interpreter, command, args) {
      if (!TestFramework.currentTest) {
        throw new Error('END_TEST without matching TEST');
      }
      
      const test = TestFramework.currentTest;
      test.endTime = new Date().toISOString();
      
      // Check if all expectations passed
      const failedExpectations = test.expectations.filter(e => !e.passed);
      test.status = failedExpectations.length > 0 ? 'failed' : 'passed';
      
      if (test.status === 'passed') {
        TestFramework.passedTests++;
      } else {
        TestFramework.failedTests++;
        test.error = failedExpectations.map(e => e.message).join('; ');
      }
      
      const message = test.status === 'passed' 
        ? `✅ Test passed: ${test.name}`
        : `❌ Test failed: ${test.name} - ${test.error}`;
      
      console.log(message);
      
      TestFramework.output.push({
        type: 'test-end',
        test: test.name,
        suite: test.suite.name,
        path: `${test.suite.getFullPath()} > ${test.name}`,
        status: test.status,
        passed: test.expectations.filter(e => e.passed).length,
        failed: failedExpectations.length,
        total: test.expectations.length,
        error: test.error,
        timestamp: test.endTime,
        message
      });
      
      TestFramework.currentTest = null;
      
      return Promise.resolve({
        operation: 'END_TEST',
        success: test.status === 'passed',
        test: test.name,
        status: test.status,
        expectations: { passed: test.expectations.filter(e => e.passed).length, failed: failedExpectations.length },
        error: test.error,
        message,
        timestamp: test.endTime
      });
    }
  },
  
  // EXPECT actual matcher expected
  expect: {
    handler: function(interpreter, command, args) {
      if (!TestFramework.currentTest) {
        throw new Error('EXPECT must be inside a TEST block');
      }
      
      // Parse expectation: "variable TO_EQUAL value" or "variable NOT TO_EQUAL value"
      const parts = args.trim().split(/\s+/);
      if (parts.length < 3) {
        throw new Error(`Invalid EXPECT syntax: "${args}". Expected: EXPECT actual matcher expected`);
      }
      
      let actual, matcher, expected, negated = false;
      
      if (parts[1].toUpperCase() === 'NOT') {
        negated = true;
        actual = parts[0];
        matcher = parts[2];
        expected = parts.slice(3).join(' ');
      } else {
        actual = parts[0];
        matcher = parts[1];
        expected = parts.slice(2).join(' ');
      }
      
      // Resolve actual value from interpreter context
      let actualValue;
      try {
        actualValue = interpreter.getVariable(actual);
        if (actualValue === undefined) {
          // Try to evaluate as expression
          actualValue = interpreter.evaluateExpression(actual);
        }
      } catch (e) {
        // Treat as literal value
        actualValue = actual;
      }
      
      // Parse expected value
      let expectedValue;
      try {
        expectedValue = interpreter.getVariable(expected);
        if (expectedValue === undefined) {
          // Try to parse as literal (number, string, etc.)
          if (/^-?\d+\.?\d*$/.test(expected)) {
            expectedValue = Number(expected);
          } else if (expected === 'true') {
            expectedValue = true;
          } else if (expected === 'false') {
            expectedValue = false;
          } else if (expected === 'null') {
            expectedValue = null;
          } else if (expected === 'undefined') {
            expectedValue = undefined;
          } else {
            // Remove quotes if present
            expectedValue = expected.replace(/^["']|["']$/g, '');
          }
        }
      } catch (e) {
        expectedValue = expected;
      }
      
      const expectation = new Expectation(actualValue, matcher, expectedValue, negated);
      
      // Execute matcher
      const matcherFn = MATCHERS[matcher.toUpperCase()];
      if (!matcherFn) {
        throw new Error(`Unknown matcher: ${matcher}`);
      }
      
      let result;
      try {
        result = matcherFn(actualValue, expectedValue);
        expectation.passed = negated ? !result : result;
      } catch (e) {
        expectation.passed = false;
        expectation.message = `Matcher error: ${e.message}`;
      }
      
      if (!expectation.message) {
        if (expectation.passed) {
          expectation.message = `Expected ${actualValue} ${negated ? 'not ' : ''}${matcher.toLowerCase()} ${expectedValue} ✅`;
        } else {
          expectation.message = `Expected ${actualValue} ${negated ? 'not ' : ''}${matcher.toLowerCase()} ${expectedValue} ❌`;
        }
      }
      
      TestFramework.currentTest.addExpectation(expectation);
      
      const message = expectation.passed ? `✅ ${expectation.message}` : `❌ ${expectation.message}`;
      console.log(`    ${message}`);
      
      TestFramework.output.push({
        type: 'expectation',
        test: TestFramework.currentTest.name,
        suite: TestFramework.currentTest.suite.name,
        actual: actualValue,
        matcher: matcher,
        expected: expectedValue,
        negated: negated,
        passed: expectation.passed,
        message: expectation.message,
        timestamp: expectation.timestamp
      });
      
      return Promise.resolve({
        operation: 'EXPECT',
        success: expectation.passed,
        actual: actualValue,
        matcher: matcher,
        expected: expectedValue,
        negated: negated,
        passed: expectation.passed,
        message: expectation.message,
        timestamp: expectation.timestamp
      });
    }
  },
  
  // RUN_TESTS - Execute all tests and generate report
  run_tests: {
    handler: function(interpreter, command, args) {
      TestFramework.startTime = new Date().toISOString();
      
      const report = {
        startTime: TestFramework.startTime,
        endTime: new Date().toISOString(),
        totalSuites: TestFramework.suites.length,
        totalTests: TestFramework.totalTests,
        passedTests: TestFramework.passedTests,
        failedTests: TestFramework.failedTests,
        suites: TestFramework.suites,
        output: TestFramework.output,
        hierarchy: generateHierarchy()
      };
      
      const message = `🎯 Test run completed: ${TestFramework.passedTests}/${TestFramework.totalTests} passed`;
      console.log(message);
      
      // Generate JSON report for TUI
      const reportPath = './test-results.json';
      require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      TestFramework.output.push({
        type: 'run-complete',
        report: reportPath,
        timestamp: report.endTime,
        message
      });
      
      return Promise.resolve({
        operation: 'RUN_TESTS',
        success: TestFramework.failedTests === 0,
        report: report,
        reportPath: reportPath,
        message,
        timestamp: report.endTime
      });
    }
  }
};

// Generate hierarchical structure for TUI navigation
function generateHierarchy() {
  function processSuite(suite) {
    return {
      name: suite.name,
      path: suite.getFullPath(),
      status: suite.status,
      passed: suite.passed,
      failed: suite.failed,
      total: suite.tests.length,
      startTime: suite.startTime,
      endTime: suite.endTime,
      tests: suite.tests.map(test => ({
        name: test.name,
        status: test.status,
        expectations: test.expectations.length,
        passed: test.expectations.filter(e => e.passed).length,
        failed: test.expectations.filter(e => !e.passed).length,
        output: test.output,
        error: test.error,
        startTime: test.startTime,
        endTime: test.endTime,
        details: test.expectations.map(e => ({
          matcher: e.matcher,
          actual: e.actual,
          expected: e.expected,
          negated: e.negated,
          passed: e.passed,
          message: e.message,
          timestamp: e.timestamp
        }))
      })),
      subSuites: suite.subSuites.map(processSuite)
    };
  }
  
  return TestFramework.suites.map(processSuite);
}

// Main ADDRESS handler
function TEST_FRAMEWORK_ADDRESS_MAIN() {
  return {
    type: 'address-target',
    name: 'REXX Native Test Framework',
    description: 'Native REXX syntax for testing with structured output',
    provides: {
      addressTarget: 'test',
      commandSupport: true,
      methodSupport: true
    },
    dependencies: [],
    version: '1.0.0',
    commands: Object.keys(ADDRESS_HANDLERS),
    matchers: Object.keys(MATCHERS),
    metadata: {
      author: 'RexxJS Project',
      license: 'MIT',
      homepage: 'https://github.com/rexx-js/rexx-lite-rpc'
    }
  };
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TEST_FRAMEWORK_ADDRESS_MAIN,
    ADDRESS_HANDLERS,
    TestFramework,
    MATCHERS
  };
}

// Register with RexxJS ADDRESS system
if (typeof global !== 'undefined' && global.rexxAddressHandlers) {
  Object.entries(ADDRESS_HANDLERS).forEach(([command, config]) => {
    global.rexxAddressHandlers.set(`test.${command}`, config.handler);
  });
}