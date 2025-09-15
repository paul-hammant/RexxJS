/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Calculator Service Library - ADDRESS Target Example
 * Demonstrates how to create a REQUIRE-able library that registers ADDRESS targets
 */

// Primary detection function (must be first for REQUIRE system)
function CALCULATOR_SERVICE_MAIN() {
  return {
    type: 'address-target',
    name: 'Calculator Service',
    version: '1.0.0',
    description: 'Basic arithmetic operations service',
    provides: {
      addressTarget: 'calculator',
      methods: ['add', 'subtract', 'multiply', 'divide', 'power', 'sqrt', 'status']
    },
    dependencies: [],
    loaded: true
  };
}

// ADDRESS target handler function
// Convention: ADDRESS_<TARGET>_HANDLER where TARGET matches the ADDRESS name
function ADDRESS_CALCULATOR_HANDLER(method, params) {
  switch (method) {
    case 'add':
      const a = parseFloat(params.a ?? params.x ?? 0);
      const b = parseFloat(params.b ?? params.y ?? 0);
      return {
        operation: 'add',
        operands: [a, b],
        result: a + b,
        timestamp: new Date().toISOString()
      };
      
    case 'subtract':
      const x = parseFloat(params.a ?? params.x ?? 0);
      const y = parseFloat(params.b ?? params.y ?? 0);
      return {
        operation: 'subtract', 
        operands: [x, y],
        result: x - y,
        timestamp: new Date().toISOString()
      };
      
    case 'multiply':
      const m1 = parseFloat(params.a ?? params.x ?? 0);
      const m2 = parseFloat(params.b ?? params.y ?? 0);
      return {
        operation: 'multiply',
        operands: [m1, m2], 
        result: m1 * m2,
        timestamp: new Date().toISOString()
      };
      
    case 'divide':
      const d1 = parseFloat(params.a ?? params.x ?? 0);
      const d2 = parseFloat(params.b ?? params.y ?? 1);
      if (d2 === 0) {
        throw new Error('Division by zero');
      }
      return {
        operation: 'divide',
        operands: [d1, d2],
        result: d1 / d2, 
        timestamp: new Date().toISOString()
      };
      
    case 'power':
      const base = parseFloat(params.base ?? params.a ?? 0);
      const exponent = parseFloat(params.exponent ?? params.b ?? 1);
      return {
        operation: 'power',
        operands: [base, exponent],
        result: Math.pow(base, exponent),
        timestamp: new Date().toISOString()
      };
      
    case 'sqrt':
      const value = parseFloat(params.value ?? params.x ?? params.a ?? 0);
      if (value < 0) {
        throw new Error('Cannot take square root of negative number');
      }
      return {
        operation: 'sqrt',
        operands: [value],
        result: Math.sqrt(value),
        timestamp: new Date().toISOString()
      };
      
    case 'status':
      return {
        service: 'calculator',
        version: '1.0.0',
        methods: Object.keys(ADDRESS_CALCULATOR_METHODS),
        timestamp: new Date().toISOString()
      };
      
    default:
      throw new Error(`Unknown calculator method: ${method}`);
  }
}

// ADDRESS target methods metadata
// Convention: ADDRESS_<TARGET>_METHODS object describing available methods
const ADDRESS_CALCULATOR_METHODS = {
  add: {
    description: "Add two numbers",
    params: ["a", "b"],
    returns: "object with operation details and result"
  },
  subtract: {
    description: "Subtract two numbers", 
    params: ["a", "b"],
    returns: "object with operation details and result"
  },
  multiply: {
    description: "Multiply two numbers",
    params: ["a", "b"], 
    returns: "object with operation details and result"
  },
  divide: {
    description: "Divide two numbers",
    params: ["a", "b"],
    returns: "object with operation details and result"
  },
  power: {
    description: "Raise base to exponent power",
    params: ["base", "exponent"],
    returns: "object with operation details and result"
  },
  sqrt: {
    description: "Calculate square root",
    params: ["value"],
    returns: "object with operation details and result"
  },
  status: {
    description: "Get calculator service status",
    params: [],
    returns: "object with service information"
  }
};

// Export to global scope (required for REQUIRE system detection)
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