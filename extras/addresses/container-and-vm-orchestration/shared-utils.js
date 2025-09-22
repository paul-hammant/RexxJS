/*!
 * Container Orchestration Shared Utilities
 * Common functions used across Docker, Podman, and systemd-nspawn handlers
 * Copyright (c) 2025 RexxJS Project | MIT License
 */

/**
 * Simple string interpolation for {variable} patterns
 * @param {string} template - Template string with {variable} placeholders
 * @param {Object} context - Object containing variable values
 * @returns {Promise<string>} - Interpolated string
 */
async function interpolateMessage(template, context = {}) {
  if (!template || typeof template !== 'string') return template;
  
  return template.replace(/\{([^}]+)\}/g, (match, varName) => {
    const value = context[varName];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Simple activity logging for container operations
 * @param {string} handlerName - Name of the handler (e.g., 'ADDRESS_DOCKER')
 * @param {string} operation - Operation being performed
 * @param {Object} details - Additional details to log
 */
function logActivity(handlerName, operation, details = {}) {
  // Only log in debug/development modes to avoid noise
  if (typeof process !== 'undefined' && process.env.DEBUG) {
    console.log(`[${handlerName}] ${operation}`, details);
  }
}

/**
 * Logging wrapper that creates a handler-specific log function
 * @param {string} handlerName - Name of the handler (e.g., 'ADDRESS_DOCKER')
 * @returns {Function} - Handler-specific log function
 */
function createLogFunction(handlerName) {
  return function log(operation, details) {
    logActivity(handlerName, operation, details);
  };
}

/**
 * Parse command parts respecting quoted strings
 * @param {string} command - Command string to parse
 * @returns {Array<string>} - Array of command parts
 */
function parseCommandParts(command) {
  const parts = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < command.length; i++) {
    const char = command[i];
    
    if (!inQuotes && (char === '"' || char === "'")) {
      inQuotes = true;
      quoteChar = char;
    } else if (inQuotes && char === quoteChar) {
      inQuotes = false;
      quoteChar = '';
    } else if (!inQuotes && /\s/.test(char)) {
      if (current) {
        parts.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  
  if (current) {
    parts.push(current);
  }

  return parts;
}

/**
 * Parse ADDRESS command into operation and parameters
 * @param {string} command - Command string to parse
 * @returns {Object} - Object with operation and params properties
 */
function parseCommand(command) {
  const trimmed = command.trim();
  
  // Handle simple commands
  if (!trimmed) {
      return { operation: '', params: {} };
  }
  if (['status', 'list'].includes(trimmed)) {
    return { operation: trimmed, params: {} };
  }

  // Parse complex commands with parameters
  const parts = parseCommandParts(trimmed);
  const operation = parts[0] || '';
  const params = {};

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part.includes('=')) {
      const [key, ...valueParts] = part.split('=');
      params[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
    } else {
      params[part] = true;
    }
  }

  return { operation, params };
}

/**
 * Parse memory limit strings (e.g., "512m", "2g") into bytes
 * @param {string} memoryStr - Memory string to parse (e.g., "512m", "2g")
 * @returns {number} - Memory limit in bytes
 */
function parseMemoryLimit(memoryStr) {
  if (!memoryStr) return 0;
  
  const units = {
    'k': 1024,
    'm': 1024 * 1024,
    'g': 1024 * 1024 * 1024,
    't': 1024 * 1024 * 1024 * 1024
  };
  
  const match = memoryStr.toLowerCase().match(/^(\d+)([kmgt]?)$/);
  if (!match) return 0;
  
  const value = parseInt(match[1]);
  const unit = match[2] || '';
  
  return value * (units[unit] || 1);
}

/**
 * Test if a container runtime is available by running its --version command
 * @param {string} runtime - Name of the runtime to test (e.g., 'docker', 'podman', 'systemd-nspawn')
 * @returns {Promise<boolean>} - Promise that resolves to true if runtime is available
 */
function testRuntime(runtime) {
  const { spawn } = require('child_process');
  
  return new Promise((resolve, reject) => {
    const process = spawn(runtime, ['--version'], { stdio: 'pipe' });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`${runtime} test failed with code ${code}`));
      }
    });

    process.on('error', (error) => {
      reject(new Error(`${runtime} not found: ${error.message}`));
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      process.kill();
      reject(new Error(`${runtime} test timeout`));
    }, 5000);
  });
}

/**
 * Validate a command against security policies
 * @param {string} command - Command to validate
 * @param {Set} bannedCommands - Set of banned command patterns
 * @returns {Array<string>} - Array of violation messages
 */
function validateCommand(command, bannedCommands) {
  const violations = [];
  
  for (const bannedCmd of bannedCommands) {
    if (command.includes(bannedCmd)) {
      violations.push(`Command contains banned pattern: ${bannedCmd}`);
    }
  }
  
  // Check for dangerous patterns
  const dangerousPatterns = [
    /rm\s+-rf\s+\/[^\/]/,  // rm -rf /something
    /dd\s+if=/,            // dd commands
    />\s*\/dev\/null/,     // output redirection to /dev/null
    /&\s*$/,               // background processes
    /;\s*rm\s+/            // chained rm commands
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(command)) {
      violations.push(`Command contains dangerous pattern: ${pattern.source}`);
    }
  }
  
  return violations;
}

/**
 * Validate volume path against security policy
 * @param {string} hostPath - Host path to validate
 * @param {string} securityMode - Security mode ('permissive', 'moderate', 'strict')
 * @param {Set} allowedVolumePaths - Set of allowed volume paths
 * @returns {boolean} - True if path is allowed
 */
function validateVolumePath(hostPath, securityMode, allowedVolumePaths) {
  if (securityMode === 'permissive') {
    return true;
  }
  
  // Check against allowed paths
  for (const allowedPath of allowedVolumePaths) {
    if (hostPath.startsWith(allowedPath)) {
      return true;
    }
  }
  
  // In moderate mode, allow current working directory
  if (securityMode === 'moderate') {
    const cwd = process.cwd();
    return hostPath.startsWith(cwd);
  }
  
  return false;
}

/**
 * Validate binary path against security policy
 * @param {string} binaryPath - Binary path to validate
 * @param {string} securityMode - Security mode ('permissive', 'moderate', 'strict')
 * @param {Set} trustedBinaries - Set of trusted binary paths
 * @param {Function} auditSecurityEvent - Function to call for security auditing
 * @returns {boolean} - True if binary path is allowed
 */
function validateBinaryPath(binaryPath, securityMode, trustedBinaries, auditSecurityEvent) {
  auditSecurityEvent('binary_validation', { path: binaryPath, mode: securityMode });
  
  if (securityMode === 'permissive') {
    return true;
  }
  
  if (securityMode === 'strict') {
    return trustedBinaries.has(binaryPath);
  }
  
  // Moderate mode: allow current directory and build outputs
  const cwd = process.cwd();
  return binaryPath.startsWith(cwd) || 
         binaryPath.includes('rexx-linux') || 
         trustedBinaries.has(binaryPath);
}

/**
 * Audit security events for compliance
 * @param {string} event - Event type
 * @param {Object} details - Event details
 * @param {string} securityMode - Current security mode
 * @param {Array} auditLog - Audit log array to append to
 * @param {Function} logFunction - Log function to call
 */
function auditSecurityEvent(event, details, securityMode, auditLog, logFunction) {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    securityMode
  };
  
  auditLog.push(auditEntry);
  
  // Keep audit log bounded
  if (auditLog.length > 1000) {
    auditLog.shift();
  }
  
  logFunction('security_audit', auditEntry);
}

/**
 * Calculate uptime from a start timestamp
 * @param {string} startedAt - ISO timestamp string of when something started
 * @returns {string} - Human-readable uptime (e.g., "5m", "2h", "30s")
 */
function calculateUptime(startedAt) {
  if (!startedAt) return '0s';
  const start = new Date(startedAt);
  const now = new Date();
  const uptimeMs = now - start;
  const uptimeSeconds = Math.floor(uptimeMs / 1000);
  
  if (uptimeSeconds < 60) return `${uptimeSeconds}s`;
  if (uptimeSeconds < 3600) return `${Math.floor(uptimeSeconds / 60)}m`;
  return `${Math.floor(uptimeSeconds / 3600)}h`;
}

/**
 * Parse key=value parameter string
 * @param {string} paramStr - String containing key=value pairs separated by whitespace
 * @returns {Object} - Object with key-value pairs
 */
function parseKeyValueString(paramStr) {
  const params = {};
  const pairs = paramStr.split(/\s+/);
  for (const pair of pairs) {
    const [key, value] = pair.split('=', 2);
    if (key && value) {
      params[key] = isNaN(value) ? value : parseInt(value);
    }
  }
  return params;
}

/**
 * Parse CHECKPOINT output lines and invoke a callback
 * Supports lines like: CHECKPOINT('NAME', 'key=value key2=123')
 * @param {string} output - Combined stdout/stderr to scan
 * @param {Function} progressCallback - Callback(checkpoint, params)
 */
function parseCheckpointOutput(output, progressCallback) {
  const text = output == null ? '' : String(output);
  const lines = text.split('\n');
  for (const line of lines) {
    const match = line.match(/CHECKPOINT\('([^']+)',\s*'([^']+)'\)/);
    if (match) {
      const [, checkpoint, params] = match;
      const parsedParams = parseKeyValueString(params);
      if (typeof progressCallback === 'function') {
        progressCallback(checkpoint, parsedParams);
      }
    }
  }
}

/**
 * Wrap RexxJS script with CHECKPOINT monitoring capabilities
 * If no progressCallback intended, returns script unchanged.
 * Mirrors handler implementations to keep behavior identical.
 * @param {string} script
 * @param {{progressCallback?: Function}} options
 * @returns {string}
 */
function wrapScriptWithCheckpoints(script, options = {}) {
  if (!options || !options.progressCallback) {
    return script;
  }
  return `
-- Enhanced RexxJS script with CHECKPOINT support
CHECKPOINT('INIT', 'stage=initialization')

${script}

CHECKPOINT('COMPLETE', 'stage=completion progress=100')
`;
}

/**
 * Parse enhanced CHECKPOINT output with support for key=value and JSON params.
 * Calls onCheckpoint({ checkpoint, params, rawLine }) for each match found.
 * @param {string} output
 * @param {(rec:{checkpoint:string, params:Object, rawLine:string})=>void} onCheckpoint
 */
function parseEnhancedCheckpointOutput(output, onCheckpoint) {
  const text = output == null ? '' : String(output);
  const lines = text.split('\n');
  for (const line of lines) {
    const m = line.match(/CHECKPOINT\('([^']+)'(?:,\s*'([^']+)')?\)/);
    if (!m) continue;
    const [, checkpoint, paramsStr] = m;
    let params = {};
    if (paramsStr) {
      try {
        params = JSON.parse(paramsStr);
      } catch {
        params = parseKeyValueString(paramsStr);
      }
    }
    if (typeof onCheckpoint === 'function') {
      onCheckpoint({ checkpoint, params, rawLine: line.trim() });
    }
  }
}

/**
 * Format a standard status message for handlers
 * @param {string} runtime
 * @param {number} active
 * @param {number} max
 * @param {string} securityMode
 * @returns {string}
 */
function formatStatus(runtime, active, max, securityMode) {
  const name = (runtime || '').toUpperCase();
  return `ADDRESS ${name}: ${active}/${max} containers active`;
}

module.exports = {
  interpolateMessage,
  logActivity,
  createLogFunction,
  parseCommandParts,
  parseCommand,
  parseMemoryLimit,
  testRuntime,
  validateCommand,
  validateVolumePath,
  validateBinaryPath,
  auditSecurityEvent,
  calculateUptime,
  parseKeyValueString,
  parseCheckpointOutput,
  wrapScriptWithCheckpoints,
  parseEnhancedCheckpointOutput,
  formatStatus
};
