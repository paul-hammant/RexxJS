/**
 * Mock ADDRESS Library - Comprehensive mock for testing ADDRESS target capabilities
 * This is an ADDRESS target library designed for testing ADDRESS functionality
 * 
 * Usage:
 *   REQUIRE "./tests/mock-address" AS MOCK
 *   ADDRESS MOCK
 *   "ECHO Hello World"
 *   "SET counter 5"
 *   "GET counter"
 *   "FAIL TestError"
 *   "STATUS"
 *
 * Test Coverage:
 * - Command parsing and execution
 * - State management across commands
 * - Variable setting and getting
 * - Error handling and propagation
 * - Response formatting
 * - Method vs command distinction
 * 
 * Copyright (c) 2025 Testing Framework
 * Licensed under the MIT License
 */

// Mock storage for testing state persistence
let mockState = {
  counter: 0,
  variables: {},
  commandHistory: [],
  lastResult: null,
  errors: []
};

// Reset function for tests
function resetMockState() {
  mockState.counter = 0;
  mockState.variables = {};
  // Keep the current command (RESET) in history
  const resetCommand = mockState.commandHistory[mockState.commandHistory.length - 1];
  mockState.commandHistory = resetCommand ? [resetCommand] : [];
  mockState.lastResult = null;
  mockState.errors = [];
}

// Primary detection function with ADDRESS target metadata
function MOCK_ADDRESS_MAIN() {
  return {
    type: 'address-target',
    name: 'Mock Testing Service',
    version: '2.0.0',
    description: 'Comprehensive mock ADDRESS target for testing capabilities',
    provides: {
      addressTarget: 'mock',
      commandSupport: true,
      methodSupport: true,
      stateManagement: true
    },
    interpreterHandlesInterpolation: true,
    dependencies: [],
    loaded: true,
    requirements: {
      environment: 'universal'
    },
    testUtilities: {
      resetState: resetMockState,
      getState: () => ({ ...mockState })
    }
  };
}

// ADDRESS target handler function
function ADDRESS_MOCK_HANDLER(commandOrMethod, params = {}) {
  try {
    // Record this command in history
    mockState.commandHistory.push({
      command: commandOrMethod,
      params: params,
      timestamp: new Date().toISOString()
    });

    // Handle method-call style vs command string style
    // Method calls have specific parameter names that make sense for the command
    // Command strings should not have user variables passed to them
    
    // Check if this looks like a method call by having reasonable parameters
    const validMethodParams = ['message', 'text', 'key', 'variable', 'value', 'amount'];
    const hasValidMethodParams = Object.keys(params).some(key => validMethodParams.includes(key));
    
    
    if (hasValidMethodParams) {
      // Filter to only valid method parameters
      const methodParams = {};
      for (const [key, value] of Object.entries(params)) {
        if (validMethodParams.includes(key)) {
          methodParams[key] = value;
        }
      }
      return handleMethodCall(commandOrMethod, methodParams);
    }

    // Handle command string style
    if (typeof commandOrMethod === 'string') {
      return handleCommandString(commandOrMethod);
    }

    throw new Error(`Invalid mock command format: ${commandOrMethod}`);

  } catch (error) {
    mockState.errors.push({
      error: error.message,
      command: commandOrMethod,
      params: params,
      timestamp: new Date().toISOString()
    });
    
    return formatMockErrorForREXX(error);
  }
}

function handleMethodCall(method, params) {
  switch (method.toUpperCase()) {
    case 'ECHO':
      const message = params.message || params.text || 'Empty message';
      mockState.lastResult = message;
      return {
        success: true,
        result: message,
        method: 'ECHO',
        timestamp: new Date().toISOString()
      };
      
    case 'SET':
      const key = params.key || params.variable;
      const value = params.value;
      if (!key) throw new Error('SET requires key parameter');
      
      // Try to parse as number if possible
      const numValue = isNaN(value) ? value : Number(value);
      mockState.variables[key] = numValue;
      mockState.counter++;
      return {
        success: true,
        result: `Set ${key} = ${numValue}`,
        method: 'SET',
        key: key,
        value: numValue,
        state: { ...mockState.variables }, // Include all variables for testing
        timestamp: new Date().toISOString()
      };
      
    case 'GET':
      const getKey = params.key || params.variable;
      if (!getKey) throw new Error('GET requires key parameter');
      
      const getValue = mockState.variables[getKey];
      mockState.lastResult = getValue; // Fix: Update lastResult like command string version
      return {
        success: true,
        result: getValue,
        method: 'GET',
        key: getKey,
        found: getValue !== undefined,
        timestamp: new Date().toISOString()
      };
      
    case 'INCREMENT':
    case 'INCR':
      const incrKey = params.key || params.variable;
      const amount = params.amount || 1;
      if (!incrKey) throw new Error('INCREMENT requires key parameter');
      
      const currentValue = mockState.variables[incrKey] || 0;
      const increment = Number(amount);
      
      if (isNaN(currentValue) || isNaN(increment)) {
        throw new Error('INCREMENT requires numeric values');
      }
      
      mockState.variables[incrKey] = currentValue + increment;
      mockState.counter++;
      mockState.lastResult = mockState.variables[incrKey];
      
      return {
        success: true,
        result: mockState.variables[incrKey],
        method: 'INCREMENT',
        key: incrKey,
        previous: currentValue,
        increment: increment,
        timestamp: new Date().toISOString()
      };
      
    case 'RESET':
      resetMockState();
      return {
        success: true,
        result: 'State reset',
        method: 'RESET',
        timestamp: new Date().toISOString()
      };
      
    case 'STATUS':
    case 'INFO':
      return {
        success: true,
        result: 'Mock ADDRESS target is operational',
        method: 'STATUS',
        state: {
          variableCount: Object.keys(mockState.variables).length,
          commandCount: mockState.commandHistory.length,
          counter: mockState.counter,
          lastResult: mockState.lastResult,
          errorCount: mockState.errors.length
        },
        timestamp: new Date().toISOString()
      };
      
    case 'VARIABLES':
    case 'VARS':
      return {
        success: true,
        result: mockState.variables,
        method: 'VARIABLES',
        count: Object.keys(mockState.variables).length,
        timestamp: new Date().toISOString()
      };
      
    default:
      throw new Error(`Unknown method: ${method}`);
  }
}

function handleCommandString(commandStr) {
  const trimmed = commandStr.trim();
  const parts = trimmed.split(/\s+/);
  const command = parts[0].toUpperCase();
  const args = parts.slice(1);
  
  switch (command) {
    case 'ECHO':
      const message = args.join(' ') || 'Empty echo';
      mockState.lastResult = message;
      return formatMockResultForREXX({
        success: true,
        result: message,
        method: 'ECHO'
      });
      
    case 'SET':
      if (args.length < 2) throw new Error('SET requires variable name and value');
      const key = args[0];
      const value = args.slice(1).join(' ');
      
      // Try to parse as number if possible
      const numValue = isNaN(value) ? value : Number(value);
      mockState.variables[key] = numValue;
      mockState.counter++;
      
      return formatMockResultForREXX({
        success: true,
        result: `Set ${key} = ${numValue}`,
        method: 'SET',
        key: key,
        value: numValue,
        state: { ...mockState.variables }
      });
      
    case 'GET':
      if (args.length < 1) throw new Error('GET requires variable name');
      const getKey = args[0];
      const getValue = mockState.variables[getKey];
      
      mockState.lastResult = getValue; // Update lastResult
      
      return formatMockResultForREXX({
        success: true,
        result: getValue,
        method: 'GET',
        key: getKey,
        found: getValue !== undefined
      });
      
    case 'INCR':
    case 'INCREMENT':
      if (args.length < 1) throw new Error('INCREMENT requires variable name');
      const incrKey = args[0];
      const currentValue = mockState.variables[incrKey] || 0;
      const increment = args[1] ? Number(args[1]) : 1;
      
      if (isNaN(currentValue) || isNaN(increment)) {
        throw new Error('INCREMENT requires numeric values');
      }
      
      mockState.variables[incrKey] = currentValue + increment;
      mockState.counter++;
      mockState.lastResult = mockState.variables[incrKey]; // Update lastResult
      
      return formatMockResultForREXX({
        success: true,
        result: mockState.variables[incrKey],
        method: 'INCREMENT',
        key: incrKey,
        previous: currentValue,
        increment: increment
      });
      
    case 'FAIL':
    case 'ERROR':
      const errorMsg = args.join(' ') || 'Mock error triggered';
      throw new Error(errorMsg);
      
    case 'STATUS':
    case 'INFO':
      return formatMockResultForREXX({
        success: true,
        result: 'Mock ADDRESS target is operational',
        method: 'STATUS',
        state: {
          variableCount: Object.keys(mockState.variables).length,
          commandCount: mockState.commandHistory.length,
          counter: mockState.counter,
          lastResult: mockState.lastResult,
          errorCount: mockState.errors.length
        }
      });
      
    case 'HISTORY':
      return formatMockResultForREXX({
        success: true,
        result: mockState.commandHistory,
        method: 'HISTORY',
        count: mockState.commandHistory.length
      });
      
    case 'VARIABLES':
    case 'VARS':
      return formatMockResultForREXX({
        success: true,
        result: mockState.variables,
        method: 'VARIABLES',
        count: Object.keys(mockState.variables).length
      });
      
    case 'RESET':
    case 'CLEAR':
      resetMockState();
      return formatMockResultForREXX({
        success: true,
        result: 'State reset successfully',
        method: 'RESET'
      });
      
    case 'JSON':
      if (args.length < 1) throw new Error('JSON requires JSON string');
      const jsonStr = args.join(' ');
      try {
        const parsed = JSON.parse(jsonStr);
        mockState.lastResult = parsed;
        return formatMockResultForREXX({
          success: true,
          result: parsed,
          method: 'JSON',
          type: typeof parsed
        });
      } catch (e) {
        throw new Error(`Invalid JSON: ${e.message}`);
      }
      
    case 'WAIT':
    case 'DELAY':
      const delay = args[0] ? Number(args[0]) : 100;
      if (isNaN(delay)) throw new Error('WAIT requires numeric milliseconds');
      
      // Simulate async operation (though this is sync for testing)
      const start = Date.now();
      while (Date.now() - start < Math.min(delay, 1000)) {
        // Busy wait for small delays (max 1 second for safety)
      }
      
      return formatMockResultForREXX({
        success: true,
        result: `Waited ${delay}ms`,
        method: 'WAIT',
        delay: delay
      });
      
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

// Format result for proper REXX variable handling (like SQL ADDRESS target)
function formatMockResultForREXX(result) {
  // Set up result object with standard REXX fields
  const rexxResult = {
    ...result, // Preserve original result structure
    errorCode: 0, // Success code for RC variable
    // Request interpreter to set domain-specific variables
    rexxVariables: {
      MOCKCODE: 0  // Mock-specific success code
    }
  };
  
  return rexxResult;
}

// Format error for proper REXX variable handling
function formatMockErrorForREXX(error) {
  const rexxResult = {
    operation: 'ERROR',
    success: false,
    errorCode: 1, // Error code for RC variable
    errorMessage: error.message,
    output: error.message,
    timestamp: new Date().toISOString(),
    // Request interpreter to set domain-specific variables
    rexxVariables: {
      MOCKCODE: -1  // Mock-specific error code
    }
  };
  
  return rexxResult;
}

// Export for Node.js environments (if applicable)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MOCK_ADDRESS_MAIN,
    ADDRESS_MOCK_HANDLER,
    resetMockState,
    getMockState: () => ({ ...mockState })
  };
}

// Global access for tests - make state accessible
if (typeof global !== 'undefined') {
  global._mockAddressState = mockState;
  global._resetMockAddress = () => {
    // Complete reset for tests - don't preserve any history
    mockState.counter = 0;
    mockState.variables = {};
    mockState.commandHistory = [];
    mockState.lastResult = null;
    mockState.errors = [];
  };
  global._getMockAddressState = () => ({ ...mockState });
}