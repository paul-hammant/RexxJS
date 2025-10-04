/*!
 * rexxjs/jq-address v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta=JQ_ADDRESS_META
 */
/**
 * jq ADDRESS Library - Provides JSON query execution via ADDRESS interface
 * This is an ADDRESS target library, not a functions library
 * Uses system-installed jq binary for maximum performance
 *
 * Usage:
 *   REQUIRE "jq-address"
 *   ADDRESS JQ
 *   LET data = '{"name": "RexxJS"}'
 *   LET query = ".name"
 *   ADDRESS JQ "query"
 *   SAY RESULT  // "RexxJS"
 *
 * Note: Requires `jq` to be installed on the system (apt install jq / brew install jq)
 * For portable pure-JS version, use jq-wasm-address instead
 *
 * Copyright (c) 2025 RexxJS Project
 * Licensed under the MIT License
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Global context for command-string style queries
let jqDataContext = null;

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

// jq ADDRESS metadata function
function JQ_ADDRESS_META() {
  return {
    canonical: "org.rexxjs/jq-address",
    type: 'address-handler',
    name: 'jq JSON Query Service (Native)',
    version: '1.0.0',
    description: 'JSON query execution via ADDRESS interface using system jq binary (fast, requires jq installed)',
    provides: {
      addressTarget: 'jq',
      handlerFunction: 'ADDRESS_JQ_HANDLER',
      commandSupport: true,
      methodSupport: true
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

// ADDRESS target handler function
async function ADDRESS_JQ_HANDLER(commandOrMethod, params) {
  // Check if jq is available
  const available = await checkJqAvailable();
  if (!available) {
    throw new Error('jq binary not found. Please install jq (e.g., apt install jq, brew install jq)');
  }

  try {
    // Determine if this is a method call with parameters or a command string
    const method = commandOrMethod.toLowerCase();
    let resultPromise;

    switch (method) {
      case 'query':
      case 'run':
        // If params has data and query, this is a method call with parameters
        if (params && (params.data || params.json) && (params.query || params.q)) {
          resultPromise = executeJqQuery(params.data || params.json, params.query || params.q);
        } else {
          // Otherwise it's a command-string query
          resultPromise = handleJqCommand(commandOrMethod);
        }
        break;

      case 'raw':
        resultPromise = executeJqQuery(params.data || params.json, params.query || params.q, true);
        break;

      case 'keys':
        resultPromise = executeJqQuery(params.data || params.json, 'keys');
        break;

      case 'values':
        resultPromise = executeJqQuery(params.data || params.json, 'values');
        break;

      case 'length':
        resultPromise = executeJqQuery(params.data || params.json, 'length');
        break;

      case 'type':
        resultPromise = executeJqQuery(params.data || params.json, 'type');
        break;

      case 'setcontext':
      case 'set_context':
        jqDataContext = params.data || params.json || params.context;
        resultPromise = Promise.resolve({
          operation: 'SET_CONTEXT',
          success: true,
          message: 'Data context set for command-string queries',
          contextSet: jqDataContext !== null,
          timestamp: new Date().toISOString()
        });
        break;

      case 'getcontext':
      case 'get_context':
        resultPromise = Promise.resolve({
          operation: 'GET_CONTEXT',
          success: true,
          context: jqDataContext,
          hasContext: jqDataContext !== null,
          timestamp: new Date().toISOString()
        });
        break;

      case 'clearcontext':
      case 'clear_context':
        jqDataContext = null;
        resultPromise = Promise.resolve({
          operation: 'CLEAR_CONTEXT',
          success: true,
          message: 'Data context cleared',
          timestamp: new Date().toISOString()
        });
        break;

      case 'status':
        const version = await getJqVersion();
        resultPromise = Promise.resolve({
          service: 'jq',
          version: version,
          available: true,
          implementation: 'native',
          methods: ['query', 'raw', 'keys', 'values', 'length', 'type', 'setcontext', 'getcontext', 'clearcontext', 'status'],
          contextSet: jqDataContext !== null,
          timestamp: new Date().toISOString(),
          success: true
        });
        break;

      default:
        // Try to interpret as a direct jq query command
        resultPromise = handleJqCommand(commandOrMethod);
        break;
    }

    // Enhance result with proper REXX variable fields
    return resultPromise.then(result => {
      return formatJqResultForREXX(result);
    }).catch(error => {
      throw new Error(error.message);
    });

  } catch (error) {
    throw error;
  }
}

// Handle direct jq command strings (for classic ADDRESS usage)
async function handleJqCommand(command) {
  const cmd = command.trim();

  // Handle empty commands
  if (!cmd) {
    return {
      operation: 'NOOP',
      success: true,
      message: 'Empty jq command - no operation performed',
      result: null,
      timestamp: new Date().toISOString()
    };
  }

  // Check if we have a data context set
  if (jqDataContext === null) {
    throw new Error('jq command requires data context. Use: LET data = json_data, LET query = "' + cmd + '", then ADDRESS JQ "query"');
  }

  // Execute the query using the current context
  const result = await executeJqQuery(jqDataContext, cmd);

  // Check if the query was successful
  if (result.success === false) {
    throw new Error(`jq command execution failed: ${result.error || result.message}`);
  }

  return result;
}

// Execute jq query by shelling out to jq binary
async function executeJqQuery(data, query, raw = false) {
  try {
    // Parse JSON if string
    const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
    const queryStr = String(query);

    // Prepare the command
    const jsonInput = JSON.stringify(jsonData);
    const escapedQuery = queryStr.replace(/'/g, "'\\''");
    const cmd = raw
      ? `echo '${jsonInput.replace(/'/g, "'\\''")}' | jq -r '${escapedQuery}'`
      : `echo '${jsonInput.replace(/'/g, "'\\''")}' | jq '${escapedQuery}'`;

    // Execute jq
    const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });

    if (stderr && stderr.trim()) {
      throw new Error(stderr.trim());
    }

    // Parse result
    const resultText = stdout.trim();
    let parsedResult;

    if (raw) {
      parsedResult = resultText;
    } else {
      try {
        parsedResult = JSON.parse(resultText);
      } catch (e) {
        // If it's not valid JSON, return as string
        parsedResult = resultText;
      }
    }

    return {
      operation: 'QUERY',
      success: true,
      query: queryStr,
      result: parsedResult,
      message: 'jq query executed successfully',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      operation: 'QUERY',
      success: false,
      query: query,
      error: error.message,
      message: `jq query failed: ${error.message}`,
      timestamp: new Date().toISOString()
    };
  }
}

// Get jq version
async function getJqVersion() {
  try {
    const { stdout } = await execAsync('jq --version');
    return stdout.trim().replace('jq-', '');
  } catch (e) {
    return 'unknown';
  }
}

// Format result for REXX variables
function formatJqResultForREXX(result) {
  return {
    ...result,
    // Standard REXX ADDRESS variables
    output: result.result !== undefined ? result.result : result,
    errorCode: result.success === false ? 1 : 0,
    errorMessage: result.error || result.message
  };
}

// Export for Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    JQ_ADDRESS_META,
    ADDRESS_JQ_HANDLER
  };
}

// Make functions globally available
if (typeof global !== 'undefined') {
  global.JQ_ADDRESS_META = JQ_ADDRESS_META;
  global.ADDRESS_JQ_HANDLER = ADDRESS_JQ_HANDLER;
} else if (typeof window !== 'undefined') {
  window.JQ_ADDRESS_META = JQ_ADDRESS_META;
  window.ADDRESS_JQ_HANDLER = ADDRESS_JQ_HANDLER;
}
