/**
 * Address Handler Utilities
 * Shared utilities for creating ADDRESS facility handlers in RexxJS
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

/**
 * String interpolation utility for ADDRESS handlers
 * Replaces {variable} patterns with values from the context
 * 
 * @param {string} template - Template string with {variable} patterns
 * @param {Object} context - Variable context object from ADDRESS handler call
 * @param {Object} options - Interpolation options
 * @param {boolean} options.throwOnMissing - Throw error if variable not found (default: false)
 * @param {string} options.missingPlaceholder - Placeholder for missing variables (default: original {var})
 * @param {Function} options.transform - Transform function for variable values
 * @returns {string} Interpolated string
 */
async function interpolateMessage(template, context, options = {}) {
  const {
    throwOnMissing = false,
    missingPlaceholder = null,
    transform = null
  } = options;
  
  // Get current interpolation pattern configuration
  let pattern;
  try {
    // Try to load interpolation config (Node.js or browser)
    if (typeof require !== 'undefined') {
      pattern = require('./interpolation').getCurrentPattern();
    } else if (typeof window !== 'undefined' && window.InterpolationConfig) {
      pattern = window.InterpolationConfig.getCurrentPattern();
    } else {
      // Fallback to default RexxJS pattern if config not available
      pattern = {
        regex: /\{([^}]+)\}/g,
        hasDelims: (str) => str.includes('{'),
        extractVar: (match) => match.slice(1, -1)
      };
    }
  } catch (error) {
    // Fallback to default pattern if config loading fails
    pattern = {
      regex: /\{([^}]+)\}/g,
      hasDelims: (str) => str.includes('{'),
      extractVar: (match) => match.slice(1, -1)
    };
  }
  
  // Handle case where there are no interpolation patterns
  if (!pattern.hasDelims(template)) {
    return template;
  }
  
  // Find all variable patterns using current configuration
  const matches = template.match(pattern.regex);
  if (!matches) return template;
  
  let result = template;
  
  // Process each variable pattern
  for (const match of matches) {
    const variableName = pattern.extractVar(match);
    let value;
    
    // Resolve variable value from context
    if (context.hasOwnProperty(variableName)) {
      value = context[variableName];
      
      // Apply transform function if provided
      if (transform && typeof transform === 'function') {
        value = await transform(variableName, value);
      }
      
      // Convert value to string
      value = String(value);
    } else {
      // Handle missing variable
      if (throwOnMissing) {
        throw new Error(`Variable '${variableName}' not found in context`);
      }
      
      value = missingPlaceholder !== null ? missingPlaceholder : match;
    }
    
    // Replace all occurrences of this pattern
    result = result.replace(new RegExp(escapeRegExp(match), 'g'), value);
  }
  
  return result;
}

/**
 * Extract variables used in a template string
 * Useful for validation or dependency analysis
 * 
 * @param {string} template - Template string with {variable} patterns
 * @returns {Array<string>} Array of variable names found
 */
function extractVariables(template) {
  // Get current interpolation pattern configuration
  let pattern;
  try {
    // Try to load interpolation config (Node.js or browser)
    if (typeof require !== 'undefined') {
      pattern = require('./interpolation').getCurrentPattern();
    } else if (typeof window !== 'undefined' && window.InterpolationConfig) {
      pattern = window.InterpolationConfig.getCurrentPattern();
    } else {
      // Fallback to default RexxJS pattern if config not available
      pattern = {
        regex: /\{([^}]+)\}/g,
        extractVar: (match) => match.slice(1, -1)
      };
    }
  } catch (error) {
    // Fallback to default pattern if config loading fails
    pattern = {
      regex: /\{([^}]+)\}/g,
      extractVar: (match) => match.slice(1, -1)
    };
  }
  
  const matches = template.match(pattern.regex);
  if (!matches) return [];
  
  return matches.map(match => pattern.extractVar(match));
}

/**
 * Validate that all required variables are present in context
 * 
 * @param {string} template - Template string with {variable} patterns  
 * @param {Object} context - Variable context object
 * @param {Array<string>} required - Optional array of required variables (defaults to all found)
 * @returns {Object} Validation result with { valid: boolean, missing: string[] }
 */
function validateContext(template, context, required = null) {
  const variables = required || extractVariables(template);
  const missing = variables.filter(varName => !context.hasOwnProperty(varName));
  
  return {
    valid: missing.length === 0,
    missing: missing,
    found: variables.filter(varName => context.hasOwnProperty(varName))
  };
}

/**
 * Create a standardized ADDRESS handler response
 * 
 * @param {boolean} success - Whether the operation succeeded
 * @param {*} result - Result data (optional)
 * @param {string} message - Human-readable message (optional)
 * @param {Object} metadata - Additional metadata (optional)
 * @returns {Object} Standardized response object
 */
function createResponse(success, result = null, message = null, metadata = {}) {
  const response = {
    success,
    timestamp: new Date().toISOString(),
    ...metadata
  };
  
  if (result !== null) response.result = result;
  if (message) response.message = message;
  if (!success && !message) response.message = 'Operation failed';
  
  return response;
}

/**
 * Create an error response with standardized format
 * 
 * @param {string|Error} error - Error message or Error object
 * @param {string} operation - Operation that failed (optional)
 * @param {Object} metadata - Additional error metadata (optional)
 * @returns {Object} Standardized error response
 */
function createErrorResponse(error, operation = null, metadata = {}) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorName = error instanceof Error ? error.name : 'Error';
  
  return createResponse(false, null, errorMessage, {
    errorType: errorName,
    operation,
    ...metadata
  });
}

/**
 * Log ADDRESS handler activity with consistent format
 * Enhanced with EFS2-style colored progress reporting
 * 
 * @param {string} handlerName - Name of the ADDRESS handler
 * @param {string} operation - Operation being performed
 * @param {Object} details - Additional details to log
 * @param {string} level - Log level (info, warn, error, progress, success)
 */
function logActivity(handlerName, operation, details = {}, level = 'info') {
  const timestamp = new Date().toISOString();
  
  // EFS2-inspired colored progress reporting
  if (level === 'progress' && details.host) {
    // Format: [hostname]: Task N - description (EFS2 pattern)
    const taskInfo = details.taskNumber ? `Task ${details.taskNumber} - ` : '';
    const message = `${details.host}: ${taskInfo}${operation}`;
    
    // Use blue for progress (matching EFS2 pattern)
    if (typeof process !== 'undefined' && process.stdout && process.stdout.isTTY) {
      console.log(`\x1b[34m${message}\x1b[0m`); // Blue text
    } else {
      console.log(message);
    }
    return;
  }
  
  if (level === 'success' && details.host) {
    // Green for success (matching EFS2 pattern)
    const message = `${details.host}: ${operation}`;
    if (typeof process !== 'undefined' && process.stdout && process.stdout.isTTY) {
      console.log(`\x1b[32m${message}\x1b[0m`); // Green text
    } else {
      console.log(message);
    }
    return;
  }
  
  if (level === 'error' && details.host) {
    // Red for errors (matching EFS2 pattern)
    const message = `${details.host}: Error - ${operation}`;
    if (typeof process !== 'undefined' && process.stderr && process.stderr.isTTY) {
      console.error(`\x1b[31m${message}\x1b[0m`); // Red text
    } else {
      console.error(message);
    }
    return;
  }
  
  // Fallback to original JSON logging for non-progress messages
  const logEntry = {
    timestamp,
    handler: handlerName,
    operation,
    ...details
  };
  
  const prefix = `[ADDRESS:${handlerName.toUpperCase()}]`;
  
  switch (level) {
    case 'error':
      console.error(prefix, logEntry);
      break;
    case 'warn':
      console.warn(prefix, logEntry);
      break;
    default:
      console.log(prefix, logEntry);
      break;
  }
}

/**
 * Parse command-style parameters from message
 * Useful for ADDRESS handlers that expect command-like syntax
 * 
 * Example: "create user name=John age=25 active=true"
 * Returns: { command: 'create', subcommand: 'user', params: { name: 'John', age: '25', active: 'true' } }
 * 
 * @param {string} message - Command message to parse
 * @returns {Object} Parsed command structure
 */
function parseCommand(message) {
  const parts = message.trim().split(/\s+/);
  const command = parts[0] || '';
  const subcommand = parts.length > 1 && !parts[1].includes('=') ? parts[1] : '';
  
  const params = {};
  const startIndex = subcommand ? 2 : 1;
  
  for (let i = startIndex; i < parts.length; i++) {
    const part = parts[i];
    if (part.includes('=')) {
      const [key, ...valueParts] = part.split('=');
      params[key] = valueParts.join('='); // Handle values with = in them
    }
  }
  
  return { command, subcommand, params };
}

/**
 * Create a wrapper function for ADDRESS handlers that provides common functionality
 * 
 * @param {string} handlerName - Name of the ADDRESS handler
 * @param {Function} handlerFn - The actual handler function
 * @param {Object} options - Wrapper options
 * @param {boolean} options.autoInterpolate - Automatically interpolate message (default: false)
 * @param {boolean} options.logCalls - Log all handler calls (default: false) 
 * @param {boolean} options.validateContext - Validate required variables are present (default: false)
 * @param {Array<string>} options.requiredVars - Required variables when validateContext is true
 * @returns {Function} Wrapped handler function
 */
function wrapHandler(handlerName, handlerFn, options = {}) {
  const {
    autoInterpolate = false,
    logCalls = false,
    validateContext = false,
    requiredVars = []
  } = options;
  
  return async function wrappedHandler(message, context, sourceContext) {
    try {
      if (logCalls) {
        logActivity(handlerName, 'call', { 
          message: message.substring(0, 100), // Truncate long messages
          contextKeys: Object.keys(context)
        });
      }
      
      // Validate context if requested
      if (validateContext) {
        const validation = validateVariables(message, context, requiredVars);
        if (!validation.valid) {
          return createErrorResponse(
            `Missing required variables: ${validation.missing.join(', ')}`,
            'context_validation'
          );
        }
      }
      
      // Auto-interpolate message if requested
      let processedMessage = message;
      if (autoInterpolate) {
        processedMessage = await interpolateMessage(message, context);
        if (logCalls) {
          logActivity(handlerName, 'interpolation', { 
            original: message,
            interpolated: processedMessage
          });
        }
      }
      
      // Call the actual handler
      const result = await handlerFn(processedMessage, context, sourceContext);
      
      // Ensure result is in standard format
      if (typeof result === 'object' && result !== null && 'success' in result) {
        return result; // Already in standard format
      } else {
        // Wrap non-standard results
        return createResponse(true, result, 'Operation completed');
      }
      
    } catch (error) {
      if (logCalls) {
        logActivity(handlerName, 'error', { error: error.message }, 'error');
      }
      return createErrorResponse(error, 'handler_execution');
    }
  };
}

/**
 * Utility function to escape special regex characters
 * @private
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Create a Rockferry-inspired resource with Spec + Status pattern
 * Provides consistent resource lifecycle management across all handlers
 * 
 * @param {string} kind - Resource kind (e.g., 'Machine', 'Container', 'Volume')
 * @param {string} id - Unique resource identifier
 * @param {Object} spec - Desired resource specification
 * @param {Object} status - Current resource status (optional)
 * @param {Object} annotations - Key-value metadata (optional)
 * @param {Object} owner - Owner reference (optional)
 * @returns {Object} Standardized resource object
 */
function createResource(kind, id, spec, status = {}, annotations = {}, owner = null) {
  return {
    kind,
    id,
    spec,
    status: {
      phase: 'pending',
      lastUpdated: new Date().toISOString(),
      ...status
    },
    annotations,
    owner,
    metadata: {
      created: new Date().toISOString(),
      version: 1
    }
  };
}

/**
 * Update resource status with reconciliation tracking
 * Rockferry-inspired status management
 * 
 * @param {Object} resource - Resource object to update
 * @param {Object} newStatus - New status to merge
 * @param {string} phase - New phase (optional)
 * @returns {Object} Updated resource
 */
function updateResourceStatus(resource, newStatus, phase = null) {
  resource.status = {
    ...resource.status,
    ...newStatus,
    lastUpdated: new Date().toISOString()
  };
  
  if (phase) {
    resource.status.phase = phase;
  }
  
  resource.metadata.version++;
  return resource;
}

/**
 * Enhanced progress reporting for multi-host operations
 * EFS2-inspired parallel execution tracking
 * 
 * @param {string} handlerName - Handler performing the operation
 * @param {Array} hosts - Array of host identifiers
 * @param {Function} operation - Async operation to perform on each host
 * @param {Object} options - Execution options
 * @returns {Array} Results from all hosts
 */
async function executeOnHosts(handlerName, hosts, operation, options = {}) {
  const { parallel = false, taskDescription = 'operation' } = options;
  const results = [];
  let taskNumber = 0;
  
  if (parallel) {
    // EFS2-style parallel execution
    const promises = hosts.map(async (host, index) => {
      try {
        logActivity(handlerName, `Starting ${taskDescription}`, { 
          host, 
          taskNumber: index + 1 
        }, 'progress');
        
        const result = await operation(host);
        
        logActivity(handlerName, `Completed ${taskDescription}`, { 
          host 
        }, 'success');
        
        return { host, success: true, result };
      } catch (error) {
        logActivity(handlerName, `Failed ${taskDescription}: ${error.message}`, { 
          host 
        }, 'error');
        
        return { host, success: false, error: error.message };
      }
    });
    
    return await Promise.all(promises);
  } else {
    // Sequential execution with progress reporting
    for (const host of hosts) {
      taskNumber++;
      try {
        logActivity(handlerName, `Starting ${taskDescription}`, { 
          host, 
          taskNumber 
        }, 'progress');
        
        const result = await operation(host);
        
        logActivity(handlerName, `Completed ${taskDescription}`, { 
          host 
        }, 'success');
        
        results.push({ host, success: true, result });
      } catch (error) {
        logActivity(handlerName, `Failed ${taskDescription}: ${error.message}`, { 
          host 
        }, 'error');
        
        results.push({ host, success: false, error: error.message });
      }
    }
  }
  
  return results;
}

// Alias for backward compatibility
const validateVariables = validateContext;

// UMD pattern for both Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    interpolateMessage,
    extractVariables,
    validateContext,
    validateVariables, // alias
    createResponse,
    createErrorResponse,
    logActivity,
    parseCommand,
    wrapHandler,
    // New Rockferry/EFS2-inspired utilities
    createResource,
    updateResourceStatus,
    executeOnHosts
  };
} else if (typeof window !== 'undefined') {
  // Browser environment - attach to global window
  const AddressHandlerUtils = {
    interpolateMessage,
    extractVariables,
    validateContext,
    validateVariables, // alias
    createResponse,
    createErrorResponse,
    logActivity,
    parseCommand,
    wrapHandler,
    // New Rockferry/EFS2-inspired utilities
    createResource,
    updateResourceStatus,
    executeOnHosts
  };
  
  window.AddressHandlerUtils = AddressHandlerUtils;
  
  // Also expose individual functions for convenience
  window.interpolateMessage = interpolateMessage;
  window.createResponse = createResponse;
  window.createErrorResponse = createErrorResponse;
  window.createResource = createResource;
  window.executeOnHosts = executeOnHosts;
}