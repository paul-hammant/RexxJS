/*!
 * rexxjs/system-address v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta=SYSTEM_ADDRESS_META
 */
/**
 * System ADDRESS Library - Provides OS command execution via ADDRESS interface
 * This is an ADDRESS target library, not a functions library
 * 
 * Usage:
 *   REQUIRE "rexxjs/system-address" AS SYSTEM
 *   ADDRESS SYSTEM
 *   "ls -al"
 *   "echo 'Hello World'"
 *   "pwd"
 *
 * Note: Only works in Node.js environment (command-line mode)
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

/**
 * System ADDRESS Handler Class
 * Maintains persistent options state across command invocations
 */
class SystemAddressHandler {
  constructor() {
    // Persistent options that apply to all subsequent commands
    this.persistentOptions = {
      auto_exit: true,      // Automatically add 'set -e' for multi-line scripts
      shell: '/bin/sh',     // Default shell
      timeout: 30000,       // Default timeout in ms
      combine_stderr: false // Combine stderr with stdout
    };
  }

  /**
   * Parse @options directive and update persistent options
   */
  updateOptions(optionsString) {
    const optionsPart = optionsString.replace('@options', '').trim();

    if (!optionsPart) {
      // Empty @options - do nothing
      return {
        success: true,
        operation: 'SET_OPTIONS',
        message: 'Options unchanged',
        options: { ...this.persistentOptions }
      };
    }

    // Parse space-separated key=value pairs
    const pairs = optionsPart.split(/\s+/);

    for (const pair of pairs) {
      const eqIndex = pair.indexOf('=');
      if (eqIndex === -1) continue;

      const key = pair.slice(0, eqIndex).trim();
      const value = pair.slice(eqIndex + 1).trim();

      if (key) {
        this.persistentOptions[key] = this.parseValue(value);
      }
    }

    return {
      success: true,
      operation: 'SET_OPTIONS',
      message: 'Options updated',
      options: { ...this.persistentOptions }
    };
  }

  /**
   * Parse option value (convert strings to appropriate types)
   */
  parseValue(value) {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (!isNaN(value)) return Number(value);
    return value;
  }

  /**
   * Main command handler
   */
  async handleCommand(commandOrMethod, params) {
    // Check if it's an @options directive
    if (typeof commandOrMethod === 'string' && commandOrMethod.trim().startsWith('@options')) {
      return this.updateOptions(commandOrMethod);
    }

    // Merge persistent options with any one-time params
    const options = { ...this.persistentOptions };

    // Handle command-string style (traditional Rexx ADDRESS)
    if (typeof commandOrMethod === 'string' && !params) {
      return handleSystemCommand(commandOrMethod, options)
        .then(result => formatSystemResultForREXX(result))
        .catch(error => {
          throw new Error(error.message);
        });
    }

    // Handle method-call style (modern convenience)
    let resultPromise;
    switch (commandOrMethod.toLowerCase()) {
      case 'execute':
      case 'run':
        const executeOptions = { ...options };
        // Override with params if provided
        if (params.combine_stderr !== undefined) {
          executeOptions.combineStderr = params.combine_stderr === true || params.combine_stderr === 'true';
        }
        if (params.shell) {
          executeOptions.shell = params.shell;
        }
        if (params.auto_exit !== undefined) {
          executeOptions.auto_exit = params.auto_exit === true || params.auto_exit === 'true';
        }
        resultPromise = handleSystemCommand(params.command || params.cmd, executeOptions);
        break;

      case 'exec':
        const execOptions = { ...options, ...(params.options || {}) };
        if (params.combine_stderr !== undefined) {
          execOptions.combineStderr = params.combine_stderr === true || params.combine_stderr === 'true';
        }
        if (params.shell) {
          execOptions.shell = params.shell;
        }
        if (params.auto_exit !== undefined) {
          execOptions.auto_exit = params.auto_exit === true || params.auto_exit === 'true';
        }
        resultPromise = handleSystemCommand(params.command || params.cmd, execOptions);
        break;

      case 'status':
        resultPromise = Promise.resolve({
          service: 'system',
          version: process.version,
          platform: process.platform,
          arch: process.arch,
          cwd: process.cwd(),
          options: { ...this.persistentOptions },
          methods: ['execute', 'run', 'exec', 'status'],
          timestamp: new Date().toISOString(),
          success: true
        });
        break;

      default:
        // Try to interpret as a direct system command
        resultPromise = handleSystemCommand(commandOrMethod, options);
        break;
    }

    return resultPromise.then(result => {
      return formatSystemResultForREXX(result);
    }).catch(error => {
      throw new Error(error.message);
    });
  }
}

// System ADDRESS metadata function
function SYSTEM_ADDRESS_META() {
  // Check Node.js availability - fail fast if wrong environment
  if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
    throw new Error('System ADDRESS library requires Node.js environment (not available in browser/web)');
  }

  return {
    canonical: "org.rexxjs/system-address",
    type: 'address-handler',
    name: 'System Command Service',
    version: '1.0.0',
    description: 'OS command execution via ADDRESS interface with persistent options',
    provides: {
      addressTarget: 'system',
      handlerFunction: 'ADDRESS_SYSTEM_HANDLER',
      commandSupport: true,  // Indicates support for command-string style
      methodSupport: true,   // Also supports method-call style for convenience
      optionsDirective: true // Supports @options directive for persistent configuration
    },
    dependencies: {},
    nodeonly: true,
    envVars: [],
    loaded: true,
    requirements: {
      environment: 'nodejs',
      modules: ['child_process']
    }
  };
}

// Create singleton handler instance
const systemHandlerInstance = new SystemAddressHandler();

// ADDRESS target handler function - delegates to singleton
function ADDRESS_SYSTEM_HANDLER(commandOrMethod, params) {
  // Check if we're in Node.js environment
  if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
    throw new Error('System ADDRESS library only available in Node.js environment');
  }

  try {
    return systemHandlerInstance.handleCommand(commandOrMethod, params);
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      throw new Error('System ADDRESS library requires child_process module (built into Node.js)');
    }
    throw error;
  }
}

// Handle direct system command strings
function handleSystemCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    const cmd = command.trim();

    // Handle empty commands
    if (!cmd) {
      resolve({
        operation: 'NOOP',
        success: true,
        message: 'Empty command - no operation performed',
        stdout: '',
        stderr: '',
        exitCode: 0,
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      const { execSync } = require('child_process');

      // Detect multi-line scripts
      const isMultiLine = cmd.includes('\n');

      // Handle shell selection
      let actualCommand = cmd;
      let shell = options.shell || '/bin/sh'; // Default to /bin/sh for POSIX compatibility

      // Auto-add 'set -e' for multi-line scripts (unless disabled)
      const autoExit = options.auto_exit !== false; // Default true
      if (isMultiLine && autoExit) {
        // Prepend 'set -e' to exit on first error
        actualCommand = 'set -e\n' + actualCommand;
      }

      // Handle REXX-style stderr combination
      const combineStderr = options.combineStderr === true;
      if (combineStderr) {
        // Use REXX-programmatic approach: modify command to combine stderr with stdout
        actualCommand = `${actualCommand} 2>&1`;
      }
      
      // Validate shell path (basic security check)
      const validShells = ['/bin/sh', '/bin/bash', '/usr/bin/bash', 'bash', '/bin/zsh', '/usr/bin/zsh', 'zsh', '/bin/dash', '/usr/bin/dash'];
      if (!validShells.includes(shell) && !shell.includes('/')) {
        // Fallback to default shell for security
        shell = '/bin/sh';
      }
      
      // Extract REXX-specific options from execSync options
      const { combineStderr: _, shell: __, ...cleanOptions } = options;
      
      // Default options for execSync - use shell option directly
      const execOptions = {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024, // 1MB buffer
        timeout: 30000, // 30 second timeout
        shell: shell, // Use the specified shell
        ...cleanOptions
      };
      
      let stdout = '';
      let stderr = '';
      let exitCode = 0;
      
      try {
        stdout = execSync(actualCommand, execOptions);
        // Remove trailing newline if present
        if (stdout.endsWith('\n')) {
          stdout = stdout.slice(0, -1);
        }
      } catch (error) {
        exitCode = error.status || 1;
        
        if (combineStderr) {
          // When stderr is combined, both stdout and stderr are in the stdout stream
          stdout = error.stdout ? error.stdout.toString() : '';
          stderr = ''; // stderr was combined into stdout
        } else {
          stderr = error.stderr ? error.stderr.toString() : error.message;
          stdout = error.stdout ? error.stdout.toString() : '';
        }
        
        // For non-zero exit codes, we still resolve (not reject) to allow proper REXX handling
        resolve({
          operation: 'EXECUTE',
          command: cmd, // Keep original command in result
          actualCommand: actualCommand, // Show what was actually executed
          shell: shell, // Include shell information
          success: false,
          exitCode: exitCode,
          stdout: stdout,
          stderr: stderr,
          combineStderr: combineStderr,
          message: `Command exited with code ${exitCode}`,
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      resolve({
        operation: 'EXECUTE',
        command: cmd, // Keep original command in result
        actualCommand: actualCommand, // Show what was actually executed
        shell: shell, // Include shell information
        success: true,
        exitCode: exitCode,
        stdout: stdout,
        stderr: stderr,
        combineStderr: combineStderr,
        message: 'Command executed successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      reject(new Error(`System command execution failed: ${error.message}`));
    }
  });
}

// ADDRESS target methods metadata
const ADDRESS_SYSTEM_METHODS = {
  execute: {
    description: "Execute a system command",
    params: ["command", "combine_stderr", "shell"],
    returns: "object with execution details"
  },
  run: {
    description: "Run a system command (alias for execute)",
    params: ["command", "combine_stderr", "shell"],
    returns: "object with execution details"
  },
  exec: {
    description: "Execute a system command with options",
    params: ["command", "options", "combine_stderr", "shell"],
    returns: "object with execution details"
  },
  status: {
    description: "Get system service status",
    params: [],
    returns: "object with service information"
  }
};

// Format system result for proper REXX variable handling
function formatSystemResultForREXX(result) {
  // Set up result object with standard REXX fields
  // RESULT = stdout, RC = exit code, ERRORTEXT = stderr (only when present)
  const rexxResult = {
    ...result, // Preserve original result structure (including operation, success, etc.)
    output: result.stdout || result.message || '', // RESULT variable content
    errorCode: result.exitCode || 0, // RC variable content
  };
  
  // Only set errorMessage if there's actually an error message
  if (result.stderr && result.stderr.length > 0) {
    rexxResult.errorMessage = result.stderr;
  }
  
  return rexxResult;
}

// Format system error for proper REXX variable handling
function formatSystemErrorForREXX(error) {
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
  // Browser environment (though this won't work due to Node.js dependency)
  window.SYSTEM_ADDRESS_META = SYSTEM_ADDRESS_META;
  window.ADDRESS_SYSTEM_HANDLER = ADDRESS_SYSTEM_HANDLER;
  window.ADDRESS_SYSTEM_METHODS = ADDRESS_SYSTEM_METHODS;
} else if (typeof global !== 'undefined') {
  // Node.js environment
  global.SYSTEM_ADDRESS_META = SYSTEM_ADDRESS_META;
  global.ADDRESS_SYSTEM_HANDLER = ADDRESS_SYSTEM_HANDLER;
  global.ADDRESS_SYSTEM_METHODS = ADDRESS_SYSTEM_METHODS;
}