/*!
 * rexxjs/jq-wasm-functions v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta=JQ_WASM_FUNCTIONS_META
 */
/**
 * jq WASM Functions Library - JSON query execution functions
 * Uses jq-wasm for portable, pure-JavaScript implementation
 *
 * Usage:
 *   REQUIRE "jq-wasm-functions"
 *   LET result = jqQuery('{"name": "RexxJS"}', '.name')
 *   SAY result  // "RexxJS"
 *
 * Available functions:
 *   jqQuery(data, query) - Execute jq query, return parsed result
 *   jqRaw(data, query) - Execute jq query with -r flag, return raw string
 *   jqKeys(data) - Get object keys
 *   jqValues(data) - Get object values
 *   jqLength(data) - Get array/object length
 *   jqType(data) - Get JSON type
 *
 * Note: Works in both Node.js and browser environments with jq-wasm
 * For better performance with system jq binary, use jq-functions (native) instead
 *
 * Copyright (c) 2025 RexxJS Project
 * Licensed under the MIT License
 */

// Import jq-wasm if available
let jq = null;
try {
  if (typeof require !== 'undefined') {
    try {
      jq = require('jq-wasm');
    } catch (requireError) {
      // Fallback: check if jq is available globally
      if (typeof global !== 'undefined' && global.jq) {
        jq = global.jq;
      }
    }
  } else if (typeof window !== 'undefined' && window.jq) {
    jq = window.jq;
  }
} catch (e) {
  // Will be loaded later
}

// jq WASM functions metadata
function JQ_WASM_FUNCTIONS_META() {
  // Check jq-wasm availability
  let jqAvailable = false;
  try {
    if (jq && typeof jq.json === 'function') {
      jqAvailable = true;
    }
  } catch (e) {
    // Not available
  }

  return {
    canonical: "org.rexxjs/jq-wasm-functions",
    type: 'functions-library',
    name: 'jq JSON Query Functions (WASM)',
    version: '1.0.0',
    description: 'JSON query execution functions using jq-wasm (portable, pure-JS)',
    provides: {
      functions: ['jqQuery', 'jqRaw', 'jqKeys', 'jqValues', 'jqLength', 'jqType']
    },
    dependencies: {
      'jq-wasm': '1.1.0-jq-1.8.1'
    },
    envVars: [],
    loaded: true,
    requirements: {
      environment: 'nodejs',
      modules: ['jq-wasm']
    },
    jqAvailable: jqAvailable
  };
}

/**
 * Execute jq query and return the result
 * @param {string|object} data - JSON data (string or object)
 * @param {string} query - jq query expression
 * @returns {any} Query result
 */
function jqQuery(data, query) {
  if (!jq || typeof jq.json !== 'function') {
    throw new Error('jq-wasm not available. Please install jq-wasm: npm install jq-wasm');
  }

  try {
    // Parse JSON if string
    const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
    const queryStr = String(query);

    // Execute jq query using jq-wasm
    const result = jq.json(jsonData, queryStr);

    return result;
  } catch (error) {
    throw new Error(`jq query failed: ${error.message}`);
  }
}

/**
 * Execute jq query with raw output
 * @param {string|object} data - JSON data (string or object)
 * @param {string} query - jq query expression
 * @returns {string} Raw string result
 */
function jqRaw(data, query) {
  if (!jq || typeof jq.json !== 'function') {
    throw new Error('jq-wasm not available. Please install jq-wasm: npm install jq-wasm');
  }

  try {
    // Parse JSON if string
    const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
    const queryStr = String(query);

    // Execute jq query - jq-wasm doesn't have a -r flag equivalent
    // We need to execute the query and stringify the result
    const result = jq.json(jsonData, queryStr);

    // Convert result to string (raw output)
    if (typeof result === 'string') {
      return result;
    } else if (result === null) {
      return 'null';
    } else if (typeof result === 'object') {
      return JSON.stringify(result);
    } else {
      return String(result);
    }
  } catch (error) {
    throw new Error(`jq query failed: ${error.message}`);
  }
}

/**
 * Get object keys
 * @param {string|object} data - JSON data (string or object)
 * @returns {string[]} Array of keys
 */
function jqKeys(data) {
  return jqQuery(data, 'keys');
}

/**
 * Get object values
 * @param {string|object} data - JSON data (string or object)
 * @returns {any[]} Array of values
 */
function jqValues(data) {
  return jqQuery(data, 'values');
}

/**
 * Get array/object length
 * @param {string|object} data - JSON data (string or object)
 * @returns {number} Length
 */
function jqLength(data) {
  return jqQuery(data, 'length');
}

/**
 * Get JSON type
 * @param {string|object} data - JSON data (string or object)
 * @returns {string} Type (object, array, string, number, boolean, null)
 */
function jqType(data) {
  return jqQuery(data, 'type');
}

// Export functions to global scope
if (typeof window !== 'undefined') {
  // Browser environment
  window.JQ_WASM_FUNCTIONS_META = JQ_WASM_FUNCTIONS_META;
  window.jqQuery = jqQuery;
  window.jqRaw = jqRaw;
  window.jqKeys = jqKeys;
  window.jqValues = jqValues;
  window.jqLength = jqLength;
  window.jqType = jqType;
} else if (typeof global !== 'undefined') {
  // Node.js environment
  global.JQ_WASM_FUNCTIONS_META = JQ_WASM_FUNCTIONS_META;
  global.jqQuery = jqQuery;
  global.jqRaw = jqRaw;
  global.jqKeys = jqKeys;
  global.jqValues = jqValues;
  global.jqLength = jqLength;
  global.jqType = jqType;
}

// CommonJS export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    JQ_WASM_FUNCTIONS_META,
    jqQuery,
    jqRaw,
    jqKeys,
    jqValues,
    jqLength,
    jqType
  };
}
