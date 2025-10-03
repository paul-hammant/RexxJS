/*!
 * Mock calculator service for testing ADDRESS functionality
 * @rexxjs-meta=CALCULATOR_SERVICE_MAIN
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

function CALCULATOR_SERVICE_MAIN() {
  return {
    type: 'address-target',
    name: 'Calculator Service',
    version: '1.0.0',
    description: 'Calculator operations service',
    provides: {
      addressTarget: 'calculator',
      commandSupport: true,
      methodSupport: true
    },
    dependencies: [],
    loaded: true,
    requirements: {
      environment: 'universal'
    }
  };
}

// ADDRESS target handler function
function ADDRESS_CALCULATOR_HANDLER(commandOrMethod, params = {}, sourceContext = null) {
  try {
    let resultPromise;
    
    switch (commandOrMethod.toLowerCase()) {
      case 'add':
        resultPromise = Promise.resolve({
          operation: 'add',
          result: Number(params.a) + Number(params.b),
          operands: [Number(params.a), Number(params.b)],
          timestamp: new Date().toISOString()
        });
        break;
        
      case 'subtract':
        resultPromise = Promise.resolve({
          operation: 'subtract',
          result: Number(params.a) - Number(params.b),
          operands: [Number(params.a), Number(params.b)],
          timestamp: new Date().toISOString()
        });
        break;
        
      case 'multiply':
        resultPromise = Promise.resolve({
          operation: 'multiply',
          result: Number(params.a) * Number(params.b),
          operands: [Number(params.a), Number(params.b)],
          timestamp: new Date().toISOString()
        });
        break;
        
      case 'divide':
        if (Number(params.b) === 0) {
          throw new Error('Division by zero');
        }
        resultPromise = Promise.resolve({
          operation: 'divide',
          result: Number(params.a) / Number(params.b),
          operands: [Number(params.a), Number(params.b)],
          timestamp: new Date().toISOString()
        });
        break;
        
      case 'power':
        resultPromise = Promise.resolve({
          operation: 'power',
          result: Math.pow(Number(params.base), Number(params.exponent)),
          operands: [Number(params.base), Number(params.exponent)],
          timestamp: new Date().toISOString()
        });
        break;
        
      case 'sqrt':
        resultPromise = Promise.resolve({
          operation: 'sqrt',
          result: Math.sqrt(Number(params.value)),
          operands: [Number(params.value)],
          timestamp: new Date().toISOString()
        });
        break;
        
      case 'status':
        resultPromise = Promise.resolve({
          service: 'calculator',
          version: '1.0.0',
          available: true,
          methods: ['add', 'subtract', 'multiply', 'divide', 'power', 'sqrt', 'status'],
          timestamp: new Date().toISOString()
        });
        break;
        
      default:
        throw new Error(`Unknown calculator method: ${commandOrMethod}`);
    }
    
    return resultPromise;
    
  } catch (error) {
    return Promise.reject(error);
  }
}

// METHOD definitions
const ADDRESS_CALCULATOR_METHODS = {
  add: {
    description: "Add two numbers",
    params: ["a", "b"],
    returns: "sum result"
  },
  subtract: {
    description: "Subtract two numbers",
    params: ["a", "b"], 
    returns: "difference result"
  },
  multiply: {
    description: "Multiply two numbers",
    params: ["a", "b"],
    returns: "product result"
  },
  divide: {
    description: "Divide two numbers",
    params: ["a", "b"],
    returns: "quotient result"
  },
  power: {
    description: "Raise number to power",
    params: ["base", "exponent"],
    returns: "power result"
  },
  sqrt: {
    description: "Square root of number",
    params: ["value"],
    returns: "square root result"
  },
  status: {
    description: "Get calculator service status",
    params: [],
    returns: "service information"
  }
};

// Export for global scope
if (typeof window !== 'undefined') {
  // Browser environment
  window.CALCULATOR_SERVICE_MAIN = CALCULATOR_SERVICE_MAIN;
  window.ADDRESS_CALCULATOR_HANDLER = ADDRESS_CALCULATOR_HANDLER;
  window.ADDRESS_CALCULATOR_METHODS = ADDRESS_CALCULATOR_METHODS;
} else if (typeof global !== 'undefined') {
  // Node.js environment  
  global.CALCULATOR_SERVICE_MAIN = CALCULATOR_SERVICE_MAIN;
  global.ADDRESS_CALCULATOR_HANDLER = ADDRESS_CALCULATOR_HANDLER;
  global.ADDRESS_CALCULATOR_METHODS = ADDRESS_CALCULATOR_METHODS;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CALCULATOR_SERVICE_MAIN,
    ADDRESS_CALCULATOR_HANDLER,
    ADDRESS_CALCULATOR_METHODS
  };
}