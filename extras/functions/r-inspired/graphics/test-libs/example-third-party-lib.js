/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Example Third-Party RexxJS Library
 * 
 * Template for creating third-party libraries that work with REQUIRE system.
 * 
 * Repository: https://github.com/username/my-rexx-lib
 * Usage: REQUIRE "username/my-rexx-lib"
 * 
 * Guidelines for Third-Party Library Developers:
 * 1. Always include a PRIMARY_DETECTION_FUNCTION_MAIN as the first function
 * 2. Export to both browser (window) and Node.js (global) environments  
 * 3. Use a clear namespace like "myRexxLib" or "myLibraryName"
 * 4. Follow standard dist/ directory structure for published libraries
 * 5. Include comprehensive error handling and validation
 */

const myRexxLib = {
  // PRIMARY DETECTION FUNCTION (REQUIRED - must be first)
  'MY_REXX_LIB_MAIN': () => {
    return {
      type: 'library_info',
      name: 'My Rexx Library', 
      version: '1.0.0',
      author: 'Your Name',
      description: 'Example third-party library for RexxJS',
      functions: Object.keys(myRexxLib).filter(key => typeof myRexxLib[key] === 'function'),
      loaded: true,
      timestamp: new Date().toISOString()
    };
  },

  // Your custom functions
  'HELLO_WORLD': (name = 'World') => {
    try {
      if (typeof name !== 'string') {
        throw new Error('HELLO_WORLD: name must be a string');
      }
      return {
        type: 'greeting',
        message: `Hello, ${name}!`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { type: 'error', error: error.message };
    }
  },

  'CALCULATE_FIBONACCI': (n) => {
    try {
      const num = parseInt(n);
      if (isNaN(num) || num < 0) {
        throw new Error('CALCULATE_FIBONACCI: n must be a non-negative integer');
      }
      
      if (num === 0) return 0;
      if (num === 1) return 1;
      
      let a = 0, b = 1, temp;
      for (let i = 2; i <= num; i++) {
        temp = a + b;
        a = b;
        b = temp;
      }
      
      return {
        type: 'fibonacci',
        input: num,
        result: b,
        sequence: num <= 10 ? this.getFibonacciSequence(num) : null
      };
    } catch (error) {
      return { type: 'error', error: error.message };
    }
  },

  'CUSTOM_MATH_OPERATION': (operation, a, b) => {
    try {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      
      if (isNaN(numA) || isNaN(numB)) {
        throw new Error('CUSTOM_MATH_OPERATION: both operands must be numbers');
      }
      
      let result;
      switch (operation) {
        case 'add':
          result = numA + numB;
          break;
        case 'subtract':
          result = numA - numB;
          break;
        case 'multiply':
          result = numA * numB;
          break;
        case 'divide':
          if (numB === 0) throw new Error('Division by zero');
          result = numA / numB;
          break;
        case 'power':
          result = Math.pow(numA, numB);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
      
      return {
        type: 'math_result',
        operation: operation,
        operands: [numA, numB],
        result: result
      };
    } catch (error) {
      return { type: 'error', error: error.message };
    }
  },

  // Helper functions (private - not registered with RexxJS)
  getFibonacciSequence: function(n) {
    const sequence = [0, 1];
    for (let i = 2; i <= n; i++) {
      sequence[i] = sequence[i-1] + sequence[i-2];
    }
    return sequence.slice(0, n + 1);
  }
};

// EXPORT CONFIGURATION (REQUIRED)
// Support both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = { 'my-rexx-lib': myRexxLib };
  
  // Also export to global for RexxJS compatibility
  if (typeof global !== 'undefined') {
    global['my-rexx-lib'] = myRexxLib;
  }
} else if (typeof window !== 'undefined') {
  // Browser environment  
  window['my-rexx-lib'] = myRexxLib;
  
  // Optional: Auto-register with RexxJS if present
  if (typeof window.Interpreter !== 'undefined' || typeof window.RexxInterpreter !== 'undefined') {
    console.log('✓ my-rexx-lib loaded and ready for REQUIRE');
  }
}

/* 
USAGE EXAMPLES:

In Rexx code:
```rexx
-- Load the library
REQUIRE "username/my-rexx-lib"

-- Use the functions
LET greeting = HELLO_WORLD name="Alice"
SAY greeting.message

LET fib = CALCULATE_FIBONACCI n=10
SAY fib.result

LET math = CUSTOM_MATH_OPERATION operation="power" a=2 b=8
SAY math.result
```

DEPLOYMENT:
1. Create GitHub repo: username/my-rexx-lib
2. Put this file in: dist/my-rexx-lib.js
3. Users can then: REQUIRE "username/my-rexx-lib"

The system will automatically:
- Fetch from: https://raw.githubusercontent.com/username/my-rexx-lib/main/dist/my-rexx-lib.js  
- Detect via: MY_REXX_LIB_MAIN function
- Register all exported functions as Rexx built-ins
- Cache for subsequent uses
*/