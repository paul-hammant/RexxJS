/*!
 * mock-address v1.0.0 | (c) 2025 Paul Hammant | MIT License
 * @rexxjs-meta=MOCK_ADDRESS_MAIN
 * @rexxjs-meta {"dependencies":{},"type":"address-target","provides":{"addressTarget":"mock"},"interpreterHandlesInterpolation":true}
 */
/**
 * Mock ADDRESS handler for testing
 * Captures commands sent to it for test verification
 */

class MockAddressHandler {
  constructor() {
    this.calls = [];
    this.responses = [];
    this.defaultResponse = { success: true, operation: 'MOCK_OK' };
    this.variables = {};
    this.commandHistory = [];
    this.lastResult = null;
  }

  // Set up canned responses for testing
  setResponse(response) {
    this.defaultResponse = response;
  }

  // Queue multiple responses (for testing sequences)
  queueResponses(responses) {
    this.responses = [...responses];
  }

  // Clear call history
  clear() {
    this.calls = [];
    this.responses = [];
    this.variables = {};
    this.commandHistory = [];
    this.lastResult = null;
  }

  // Get call history for assertions
  getCalls() {
    return this.calls;
  }

  getLastCall() {
    return this.calls[this.calls.length - 1];
  }

  // Process mock commands
  processCommand(command) {
    const trimmed = command.trim();
    const parts = trimmed.split(' ');
    const action = parts[0].toUpperCase();

    const commandRecord = {
      command: trimmed,
      timestamp: Date.now()
    };
    this.commandHistory.push(commandRecord);

    switch (action) {
      case 'ECHO':
        this.lastResult = parts.slice(1).join(' ');
        return this.lastResult;
        
      case 'SET':
        if (parts.length >= 3) {
          const key = parts[1];
          const value = parts.slice(2).join(' ');
          // Try to parse as number
          const numValue = Number(value);
          this.variables[key] = isNaN(numValue) ? value : numValue;
          this.lastResult = this.variables[key];
        }
        return this.lastResult;
        
      case 'GET':
        if (parts.length >= 2) {
          const key = parts[1];
          this.lastResult = this.variables[key] !== undefined ? this.variables[key] : null;
        }
        return this.lastResult;
        
      case 'INCREMENT':
        if (parts.length >= 2) {
          const key = parts[1];
          const increment = parts.length >= 3 ? Number(parts[2]) || 1 : 1;
          if (this.variables[key] === undefined) {
            this.variables[key] = 0;
          }
          this.variables[key] = Number(this.variables[key]) + increment;
          this.lastResult = this.variables[key];
        }
        return this.lastResult;
        
      case 'RESET':
        this.variables = {};
        this.lastResult = 'reset';
        return {
          success: true,
          method: 'RESET',
          result: 'reset',
          timestamp: Date.now()
        };
        
      case 'VARIABLES':
        return {
          success: true,
          method: 'VARIABLES',
          result: this.variables,
          count: Object.keys(this.variables).length,
          timestamp: Date.now()
        };
        
      case 'STATUS':
        return {
          success: true,
          method: 'STATUS',
          state: {
            variableCount: Object.keys(this.variables).length,
            commandCount: this.commandHistory.length,
            variables: this.variables
          },
          timestamp: Date.now()
        };
        
      default:
        this.lastResult = `Unknown command: ${action}`;
        return this.lastResult;
    }
  }

  // Main handler function
  async handle(payload, params = {}, context = null) {
    const call = {
      payload,
      params,
      context,
      timestamp: Date.now()
    };
    
    this.calls.push(call);

    // Process as command if it's a string
    if (typeof payload === 'string') {
      this.processCommand(payload);
    }

    // Return queued response if available, otherwise default
    const response = this.responses.length > 0 
      ? this.responses.shift() 
      : this.defaultResponse;

    return response;
  }
}

// Create singleton instance for tests
const mockAddressHandler = new MockAddressHandler();

// Handler function for ADDRESS target registration
async function handleMockAddress(payload, params, context) {
  return await mockAddressHandler.handle(payload, params, context);
}

// Global state management functions for tests
function _resetMockAddress() {
  mockAddressHandler.clear();
}

function _getMockAddressState() {
  return {
    commandHistory: mockAddressHandler.commandHistory,
    lastResult: mockAddressHandler.lastResult,
    variables: mockAddressHandler.variables,
    counter: mockAddressHandler.commandHistory.length
  };
}

// ADDRESS target detection function
function MOCK_ADDRESS_MAIN() {
  return {
    type: 'address-target',
    name: 'Mock ADDRESS Target',
    version: '1.0.0',
    description: 'Mock ADDRESS target for testing',
    provides: {
      addressTarget: 'mock',
      commandSupport: true,
      methodSupport: true
    },
    dependencies: [],
    loaded: true,
    requirements: {
      environment: 'universal'
    },
    interpreterHandlesInterpolation: true
  };
}

// ADDRESS target handler function for command strings
function ADDRESS_MOCK_HANDLER(commandOrMethod, params = {}, sourceContext = null) {
  try {
    // Handle method-call style first - check for actual method parameters, not just any non-empty params
    // Method calls have specific parameters like {key: 'foo', value: 'bar'}, not REXX variables like {RC: 0, RESULT: {}}
    const isMethodCall = params && typeof params === 'object' && 
      (params.key !== undefined || params.name !== undefined || params.message !== undefined || params.value !== undefined || params.amount !== undefined);
    
    if (isMethodCall) {
      // Method call style - convert to result format
      const methodName = commandOrMethod.toLowerCase();
      
      switch (methodName) {
        case 'echo':
          const message = params.message || '';
          mockAddressHandler.lastResult = message;
          
          // Record in command history for consistency with command strings
          mockAddressHandler.commandHistory.push({
            command: `ECHO message="${message}"`,
            timestamp: Date.now()
          });
          
          return Promise.resolve({
            success: true,
            method: 'ECHO',
            result: message,
            timestamp: Date.now()
          });
          
        case 'set':
          const key = params.key || params.name;
          const value = params.value;
          if (key) {
            const numValue = Number(value);
            mockAddressHandler.variables[key] = isNaN(numValue) ? value : numValue;
            mockAddressHandler.lastResult = mockAddressHandler.variables[key];
          }
          
          // Record in command history for consistency with command strings
          mockAddressHandler.commandHistory.push({
            command: `SET ${key} ${value}`,
            timestamp: Date.now()
          });
          
          return Promise.resolve({
            success: true,
            method: 'SET',
            key: key,
            value: mockAddressHandler.variables[key],
            state: mockAddressHandler.variables,
            timestamp: Date.now()
          });
          
        case 'get':
          const getKey = params.key || params.name;
          const result = mockAddressHandler.variables[getKey];
          const found = result !== undefined;
          mockAddressHandler.lastResult = result;
          
          // Record in command history for consistency with command strings
          mockAddressHandler.commandHistory.push({
            command: `GET ${getKey}`,
            timestamp: Date.now()
          });
          
          return Promise.resolve({
            success: true,
            method: 'GET',
            key: getKey,
            result: result,
            found: found,
            timestamp: Date.now()
          });
          
        case 'increment':
          const incrKey = params.key || params.name;
          const amount = Number(params.amount) || 1;
          const previous = mockAddressHandler.variables[incrKey] || 0;
          const newValue = previous + amount;
          mockAddressHandler.variables[incrKey] = newValue;
          mockAddressHandler.lastResult = newValue;
          
          // Record in command history for consistency with command strings
          mockAddressHandler.commandHistory.push({
            command: `INCREMENT ${incrKey} ${amount}`,
            timestamp: Date.now()
          });
          
          return Promise.resolve({
            success: true,
            method: 'INCREMENT',
            key: incrKey,
            result: newValue,
            previous: previous,
            increment: amount,
            timestamp: Date.now()
          });
          
        case 'reset':
          mockAddressHandler.variables = {};
          mockAddressHandler.lastResult = 'reset';
          
          // Record in command history for consistency with command strings
          mockAddressHandler.commandHistory.push({
            command: 'RESET',
            timestamp: Date.now()
          });
          
          return Promise.resolve({
            success: true,
            method: 'RESET',
            result: 'reset',
            timestamp: Date.now()
          });
          
        case 'status':
          // Record in command history for consistency with command strings
          mockAddressHandler.commandHistory.push({
            command: 'STATUS',
            timestamp: Date.now()
          });
          
          return Promise.resolve({
            success: true,
            method: 'STATUS',
            state: {
              variableCount: Object.keys(mockAddressHandler.variables).length,
              commandCount: mockAddressHandler.commandHistory.length,
              variables: mockAddressHandler.variables
            },
            timestamp: Date.now()
          });
          
        case 'variables':
          // Record in command history for consistency with command strings
          mockAddressHandler.commandHistory.push({
            command: 'VARIABLES',
            timestamp: Date.now()
          });
          
          return Promise.resolve({
            success: true,
            method: 'VARIABLES',
            result: mockAddressHandler.variables,
            count: Object.keys(mockAddressHandler.variables).length,
            timestamp: Date.now()
          });
          
        default:
          throw new Error(`Unknown method: ${methodName}`);
      }
    }
    
    // Handle command string style
    if (typeof commandOrMethod === 'string') {
      const result = mockAddressHandler.processCommand(commandOrMethod);
      
      // If processCommand returned a structured response (object with success/method), return it directly
      if (result && typeof result === 'object' && result.success !== undefined) {
        return Promise.resolve(result);
      }
      
      // Otherwise wrap simple results in the standard response format
      return Promise.resolve({
        success: true,
        result: result,
        command: commandOrMethod,
        timestamp: Date.now()
      });
    }
    
    throw new Error(`Invalid command or method: ${commandOrMethod}`);
    
  } catch (error) {
    return Promise.resolve({
      success: false,
      error: error.message,
      command: commandOrMethod,
      params: params,
      timestamp: Date.now()
    });
  }
}

// METHOD definitions for RexxJS integration
const ADDRESS_MOCK_METHODS = {
  echo: {
    description: "Echo a message",
    params: ["message"],
    returns: "echoed message"
  },
  set: {
    description: "Set a variable",
    params: ["key", "value"],
    returns: "set result"
  },
  get: {
    description: "Get a variable",
    params: ["key"],
    returns: "variable value"
  },
  increment: {
    description: "Increment a variable",
    params: ["key", "amount"],
    returns: "new value"
  },
  reset: {
    description: "Reset all variables",
    params: [],
    returns: "reset confirmation"
  },
  status: {
    description: "Get mock status",
    params: [],
    returns: "status information"
  },
  variables: {
    description: "Get all variables",
    params: [],
    returns: "variables object"
  }
};

// Export for global scope (for RexxJS interpreter)
if (typeof global !== 'undefined') {
  global.MockAddressHandler = MockAddressHandler;
  global.mockAddressHandler = mockAddressHandler;
  global.handleMockAddress = handleMockAddress;
  global._resetMockAddress = _resetMockAddress;
  global._getMockAddressState = _getMockAddressState;
  global.MOCK_ADDRESS_MAIN = MOCK_ADDRESS_MAIN;
  global.ADDRESS_MOCK_HANDLER = ADDRESS_MOCK_HANDLER;
  global.ADDRESS_MOCK_METHODS = ADDRESS_MOCK_METHODS;
}

// Export for module systems (for Jest tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MockAddressHandler,
    mockAddressHandler,
    handleMockAddress,
    _resetMockAddress,
    _getMockAddressState,
    MOCK_ADDRESS_MAIN,
    ADDRESS_MOCK_HANDLER,
    ADDRESS_MOCK_METHODS
  };
}