/*!
 * rexxjs/jq-functions v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta=JQ_FUNCTIONS_META
 */
/**
 * jq Functions Library - JSON query execution functions
 * Uses system-installed jq binary for maximum performance
 *
 * Usage:
 *   REQUIRE "jq-functions"
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
 * Note: Requires `jq` to be installed on the system (apt install jq / brew install jq)
 * For portable pure-JS version, use jq-wasm-functions instead
 *
 * Copyright (c) 2025 RexxJS Project
 * Licensed under the MIT License
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Check if jq binary is available
let jqAvailable = null;

async function checkJqAvailable() {
  if (jqAvailable !== null) return jqAvailable;

  try {
    await execAsync('which jq');
    jqAvailable = true;
  } catch (e) {
    jqAvailable = false;
  }
  return jqAvailable;
}

// jq functions metadata
function JQ_FUNCTIONS_META() {
  return {
    canonical: "org.rexxjs/jq-functions",
    type: 'functions-library',
    name: 'jq JSON Query Functions (Native)',
    version: '1.0.0',
    description: 'JSON query execution functions using system jq binary (fast, requires jq installed)',
    provides: {
      functions: ['jqQuery', 'jqRaw', 'jqKeys', 'jqValues', 'jqLength', 'jqType']
    },
    dependencies: {},
    envVars: [],
    loaded: true,
    requirements: {
      environment: 'nodejs',
      systemBinaries: ['jq']
    }
  };
}

/**
 * Execute jq query and return the result
 * @param {string|object} data - JSON data (string or object)
 * @param {string} query - jq query expression
 * @returns {Promise<any>} Query result
 */
async function jqQuery(data, query) {
  const available = await checkJqAvailable();
  if (!available) {
    throw new Error('jq binary not found. Please install jq (e.g., apt install jq, brew install jq)');
  }

  try {
    // Parse JSON if string
    const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
    const queryStr = String(query);

    // Prepare the command
    const jsonInput = JSON.stringify(jsonData);
    const escapedQuery = queryStr.replace(/'/g, "'\\''");
    const cmd = `echo '${jsonInput.replace(/'/g, "'\\''")}' | jq '${escapedQuery}'`;

    // Execute jq
    const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });

    if (stderr && stderr.trim()) {
      throw new Error(stderr.trim());
    }

    // Parse result
    const resultText = stdout.trim();
    try {
      return JSON.parse(resultText);
    } catch (e) {
      // If it's not valid JSON, return as string
      return resultText;
    }
  } catch (error) {
    throw new Error(`jq query failed: ${error.message}`);
  }
}

/**
 * Execute jq query with raw output (-r flag)
 * @param {string|object} data - JSON data (string or object)
 * @param {string} query - jq query expression
 * @returns {Promise<string>} Raw string result
 */
async function jqRaw(data, query) {
  const available = await checkJqAvailable();
  if (!available) {
    throw new Error('jq binary not found. Please install jq (e.g., apt install jq, brew install jq)');
  }

  try {
    // Parse JSON if string
    const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
    const queryStr = String(query);

    // Prepare the command
    const jsonInput = JSON.stringify(jsonData);
    const escapedQuery = queryStr.replace(/'/g, "'\\''");
    const cmd = `echo '${jsonInput.replace(/'/g, "'\\''")}' | jq -r '${escapedQuery}'`;

    // Execute jq
    const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });

    if (stderr && stderr.trim()) {
      throw new Error(stderr.trim());
    }

    return stdout.trim();
  } catch (error) {
    throw new Error(`jq query failed: ${error.message}`);
  }
}

/**
 * Get object keys
 * @param {string|object} data - JSON data (string or object)
 * @returns {Promise<string[]>} Array of keys
 */
async function jqKeys(data) {
  return await jqQuery(data, 'keys');
}

/**
 * Get object values
 * @param {string|object} data - JSON data (string or object)
 * @returns {Promise<any[]>} Array of values
 */
async function jqValues(data) {
  return await jqQuery(data, 'values');
}

/**
 * Get array/object length
 * @param {string|object} data - JSON data (string or object)
 * @returns {Promise<number>} Length
 */
async function jqLength(data) {
  return await jqQuery(data, 'length');
}

/**
 * Get JSON type
 * @param {string|object} data - JSON data (string or object)
 * @returns {Promise<string>} Type (object, array, string, number, boolean, null)
 */
async function jqType(data) {
  return await jqQuery(data, 'type');
}

// Export functions to global scope
if (typeof window !== 'undefined') {
  // Browser environment
  window.JQ_FUNCTIONS_META = JQ_FUNCTIONS_META;
  window.jqQuery = jqQuery;
  window.jqRaw = jqRaw;
  window.jqKeys = jqKeys;
  window.jqValues = jqValues;
  window.jqLength = jqLength;
  window.jqType = jqType;
} else if (typeof global !== 'undefined') {
  // Node.js environment
  global.JQ_FUNCTIONS_META = JQ_FUNCTIONS_META;
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
    JQ_FUNCTIONS_META,
    jqQuery,
    jqRaw,
    jqKeys,
    jqValues,
    jqLength,
    jqType
  };
}
