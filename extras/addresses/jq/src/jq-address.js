/*!
 * rexxjs/jq-address v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta=JQ_ADDRESS_META
 */
/**
 * jq ADDRESS Library - Provides JSON query execution via ADDRESS interface
 * This is an ADDRESS target library, not a functions library
 * 
 * Usage:
 *   REQUIRE "jq-address" 
 *   ADDRESS JQ
 *   ".items[0]"                    // Query current JSON data
 *   LET result = query data=json_data query=".name"
 *   LET keys = keys data=json_data
 *
 * Note: Works in both Node.js and browser environments with jq-wasm
 * 
 * Copyright (c) 2025 RexxJS Project
 * Licensed under the MIT License
 */

// Import jq-wasm if available
let jq = null;
try {
  if (typeof require !== 'undefined') {
    // In test environment or if jq-wasm is actually available
    try {
      jq = require('jq-wasm');
    } catch (requireError) {
      // Fallback: check if jq is available globally (for tests)
      if (typeof global !== 'undefined' && global.jq) {
        jq = global.jq;
      }
    }
  } else if (typeof window !== 'undefined' && window.jq) {
    jq = window.jq;
  }
} catch (e) {
  // Will be available as metadata for error handling
}

// Global context for command-string style queries
let jqDataContext = null;
let jqContextMethods = {
  setContext: function(data) {
    jqDataContext = data;
  },
  getContext: function() {
    return jqDataContext;
  },
  clearContext: function() {
    jqDataContext = null;
  }
};

// jq ADDRESS metadata function
function JQ_ADDRESS_META() {
  // Check jq-wasm availability without throwing during registration
  let jqAvailable = false;
  try {
    if (jq && typeof jq.json === 'function') {
      jqAvailable = true;
    }
  } catch (e) {
    // Will be available as metadata for error handling
  }
  
  return {
    canonical: "org.rexxjs/jq-address",
    type: 'address-handler',
    name: 'jq JSON Query Service',
    version: '1.0.0',
    description: 'JSON query execution via ADDRESS interface (requires jq-wasm dependency)',
    provides: {
      addressTarget: 'jq',
      handlerFunction: 'ADDRESS_JQ_HANDLER',
      commandSupport: true,  // Indicates support for command-string style
      methodSupport: true    // Also supports method-call style for convenience
    },
    dependencies: {
      "jq-wasm": "1.1.0-jq-1.8.1"
    },
    envVars: [],
    loaded: true,
    requirements: {
      environment: 'nodejs', // Requires Node.js for jq-wasm dependency loading
      modules: ['jq-wasm']
    },
    jqAvailable: jqAvailable,
    jqVersion: jqAvailable && jq ? (jq.version ? jq.version() : 'unknown') : null
  };
}

// ADDRESS target handler function with REXX variable management
function ADDRESS_JQ_HANDLER(commandOrMethod, params) {
  // Check if we have jq-wasm available
  if (!jq || typeof jq.json !== 'function') {
    throw new Error('jq ADDRESS library requires jq-wasm dependency to be loaded');
  }

  try {
    // Handle command-string style (traditional REXX ADDRESS)
    if (typeof commandOrMethod === 'string' && !params) {
      return handleJqCommand(commandOrMethod)
        .then(result => formatJqResultForREXX(result))
        .catch(error => {
          const formattedError = formatJqErrorForREXX(error);
          throw new Error(error.message); // Preserve original error throwing behavior
        });
    }
    
    // Handle method-call style (modern convenience)
    let resultPromise;
    switch (commandOrMethod.toLowerCase()) {
      case 'query':
      case 'run':
        resultPromise = handleJqQuery(params.data || params.json, params.query || params.q, params.flags);
        break;
        
      case 'raw':
        resultPromise = handleJqRaw(params.data || params.json, params.query || params.q, params.flags);
        break;
        
      case 'keys':
        resultPromise = handleJqQuery(params.data || params.json, 'keys');
        break;
        
      case 'values':
        resultPromise = handleJqQuery(params.data || params.json, 'values');
        break;
        
      case 'length':
        resultPromise = handleJqQuery(params.data || params.json, 'length');
        break;
        
      case 'type':
        resultPromise = handleJqQuery(params.data || params.json, 'type');
        break;
        
      case 'select':
        const condition = params.condition || params.where;
        resultPromise = handleJqQuery(params.data || params.json, `select(${condition})`);
        break;
        
      case 'map':
        const expression = params.expression || params.expr;
        resultPromise = handleJqQuery(params.data || params.json, `map(${expression})`);
        break;
        
      case 'filter':
        const filterCondition = params.condition || params.where;
        resultPromise = handleJqQuery(params.data || params.json, `map(select(${filterCondition}))`);
        break;
        
      case 'sort':
        const sortBy = params.by || params.key;
        const sortQuery = sortBy ? `sort_by(${sortBy})` : 'sort';
        resultPromise = handleJqQuery(params.data || params.json, sortQuery);
        break;
        
      case 'unique':
        resultPromise = handleJqQuery(params.data || params.json, 'unique');
        break;
        
      case 'reverse':
        resultPromise = handleJqQuery(params.data || params.json, 'reverse');
        break;
        
      case 'min':
        resultPromise = handleJqQuery(params.data || params.json, 'min');
        break;
        
      case 'max':
        resultPromise = handleJqQuery(params.data || params.json, 'max');
        break;
        
      case 'sum':
        resultPromise = handleJqQuery(params.data || params.json, 'add');
        break;
        
      case 'flatten':
        const depth = params.depth || 1;
        const flattenQuery = depth === 1 ? 'flatten' : `flatten(${depth})`;
        resultPromise = handleJqQuery(params.data || params.json, flattenQuery);
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
        resultPromise = Promise.resolve({
          service: 'jq',
          version: jq.version ? jq.version() : 'unknown',
          available: true,
          methods: ['query', 'raw', 'keys', 'values', 'length', 'type', 'select', 'map', 'filter', 'sort', 'unique', 'reverse', 'min', 'max', 'sum', 'flatten', 'setcontext', 'getcontext', 'clearcontext', 'status'],
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
      // For certain errors (like invalid queries), we should still throw
      const formattedError = formatJqErrorForREXX(error);
      throw new Error(error.message); // Preserve original error throwing behavior
    });
    
  } catch (error) {
    throw error;
  }
}

// Handle direct jq command strings (for classic ADDRESS usage)
function handleJqCommand(command) {
  return new Promise(async (resolve, reject) => {
    const cmd = command.trim();
    
    // Handle empty commands
    if (!cmd) {
      resolve({
        operation: 'NOOP',
        success: true,
        message: 'Empty jq command - no operation performed',
        result: null,
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    try {
      // Check if we have a data context set
      if (jqDataContext === null) {
        reject(new Error('jq command requires data context. Use: LET result = setcontext data=json_data, then "' + cmd + '"'));
        return;
      }
      
      // Execute the query using the current context
      const result = await handleJqQuery(jqDataContext, cmd);
      
      // Check if the query was successful
      if (result.success === false) {
        reject(new Error(`jq command execution failed: ${result.error || result.message}`));
        return;
      }
      
      resolve(result);
      
    } catch (error) {
      reject(new Error(`jq command execution failed: ${error.message}`));
    }
  });
}

// Handle jq queries with data and return parsed results
async function handleJqQuery(data, query, flags = []) {
  try {
    // Parse JSON if string
    const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
    const queryStr = String(query);
    const flagsArray = Array.isArray(flags) ? flags : [];
    
    const result = await jq.json(jsonData, queryStr, flagsArray);
    
    return {
      operation: 'QUERY',
      query: queryStr,
      flags: flagsArray,
      success: true,
      result: result,
      type: typeof result,
      message: 'jq query executed successfully',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      operation: 'QUERY',
      query: String(query),
      flags: flags,
      success: false,
      result: null,
      error: error.message,
      message: `jq query failed: ${error.message}`,
      timestamp: new Date().toISOString()
    };
  }
}

// Handle jq raw queries and return raw output
async function handleJqRaw(data, query, flags = []) {
  try {
    // Parse JSON if string
    const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
    const queryStr = String(query);
    const flagsArray = Array.isArray(flags) ? flags : [];
    
    const result = await jq.raw(jsonData, queryStr, flagsArray);
    
    return {
      operation: 'RAW',
      query: queryStr,
      flags: flagsArray,
      success: result.exitCode === 0,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.exitCode || 0,
      message: result.exitCode === 0 ? 'jq raw query executed successfully' : 'jq raw query failed',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      operation: 'RAW',
      query: String(query),
      flags: flags,
      success: false,
      stdout: '',
      stderr: error.message,
      exitCode: 1,
      error: error.message,
      message: `jq raw query failed: ${error.message}`,
      timestamp: new Date().toISOString()
    };
  }
}

// ADDRESS target methods metadata
const ADDRESS_JQ_METHODS = {
  query: {
    description: "Execute jq query on JSON data",
    params: ["data", "query", "flags"],
    returns: "parsed JSON result"
  },
  raw: {
    description: "Execute jq query and return raw output",
    params: ["data", "query", "flags"],
    returns: "object with stdout, stderr, exitCode"
  },
  keys: {
    description: "Get keys from JSON object",
    params: ["data"],
    returns: "array of keys"
  },
  values: {
    description: "Get values from JSON object",
    params: ["data"],
    returns: "array of values"
  },
  length: {
    description: "Get length of JSON array or object",
    params: ["data"],
    returns: "number"
  },
  type: {
    description: "Get type of JSON value",
    params: ["data"],
    returns: "string (null, boolean, number, string, array, object)"
  },
  select: {
    description: "Select objects matching condition",
    params: ["data", "condition"],
    returns: "filtered result"
  },
  map: {
    description: "Map over array/object using expression",
    params: ["data", "expression"],
    returns: "mapped result"
  },
  filter: {
    description: "Filter array using condition",
    params: ["data", "condition"],
    returns: "filtered array"
  },
  sort: {
    description: "Sort array, optionally by key",
    params: ["data", "by"],
    returns: "sorted array"
  },
  unique: {
    description: "Get unique values from array",
    params: ["data"],
    returns: "array with unique values"
  },
  reverse: {
    description: "Reverse array",
    params: ["data"],
    returns: "reversed array"
  },
  min: {
    description: "Get minimum value",
    params: ["data"],
    returns: "minimum value"
  },
  max: {
    description: "Get maximum value",
    params: ["data"],
    returns: "maximum value"
  },
  sum: {
    description: "Sum array values",
    params: ["data"],
    returns: "sum of values"
  },
  flatten: {
    description: "Flatten array",
    params: ["data", "depth"],
    returns: "flattened array"
  },
  status: {
    description: "Get jq service status",
    params: [],
    returns: "object with service information"
  },
  setcontext: {
    description: "Set data context for command-string queries",
    params: ["data"],
    returns: "operation status"
  },
  getcontext: {
    description: "Get current data context",
    params: [],
    returns: "current context data"
  },
  clearcontext: {
    description: "Clear data context",
    params: [],
    returns: "operation status"
  }
};

// Format jq result for proper REXX variable handling
function formatJqResultForREXX(result) {
  // Set up result object with standard REXX fields
  // RESULT = main result, RC = success code (0 or 1), ERRORTEXT = error message (only when present)
  const rexxResult = {
    ...result, // Preserve original result structure
    output: result.result !== undefined ? result.result : (result.stdout || result.message || ''), // RESULT variable content
    errorCode: result.success === false ? 1 : 0, // RC variable content
  };
  
  // Only set errorMessage if there's actually an error message
  if (result.error || result.stderr) {
    rexxResult.errorMessage = result.error || result.stderr;
  }
  
  return rexxResult;
}

// Format jq error for proper REXX variable handling
function formatJqErrorForREXX(error) {
  const rexxResult = {
    operation: 'ERROR',
    success: false,
    errorCode: 1, // RC = 1 for general error
    errorMessage: error.message, // ERRORTEXT = error message
    output: '', // RESULT = empty on error
    timestamp: new Date().toISOString()
  };
  
  return rexxResult;
}

// Export to global scope (required for REQUIRE system detection)
if (typeof window !== 'undefined') {
  // Browser environment
  window.JQ_ADDRESS_META = JQ_ADDRESS_META;
  window.ADDRESS_JQ_HANDLER = ADDRESS_JQ_HANDLER;
  window.ADDRESS_JQ_METHODS = ADDRESS_JQ_METHODS;
} else if (typeof global !== 'undefined') {
  // Node.js environment
  global.JQ_ADDRESS_META = JQ_ADDRESS_META;
  global.ADDRESS_JQ_HANDLER = ADDRESS_JQ_HANDLER;
  global.ADDRESS_JQ_METHODS = ADDRESS_JQ_METHODS;
}