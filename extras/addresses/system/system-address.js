/*!
 * rexxjs/system-address v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta {"namespace":"rexxjs","dependencies":{},"envVars":[]}
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

// Primary detection function with ADDRESS target metadata
function SYSTEM_ADDRESS_MAIN() {
  // Check Node.js availability without throwing during registration
  let nodejsAvailable = false;
  try {
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      nodejsAvailable = true;
    }
  } catch (e) {
    // Will be available as metadata for error handling
  }
  
  return {
    type: 'address-target',
    name: 'System Command Service',
    version: '1.0.0',
    description: 'OS command execution via ADDRESS interface',
    provides: {
      addressTarget: 'system',
      handlerFunction: 'ADDRESS_SYSTEM_HANDLER',
      commandSupport: true,  // Indicates support for command-string style
      methodSupport: true    // Also supports method-call style for convenience
    },
    dependencies: [],
    loaded: true,
    requirements: {
      environment: 'nodejs',
      modules: ['child_process']
    },
    nodejsAvailable: nodejsAvailable
  };
}

// ADDRESS target handler function with REXX variable management
function ADDRESS_SYSTEM_HANDLER(commandOrMethod, params) {
  // Check if we're in Node.js environment
  if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
    throw new Error('System ADDRESS library only available in Node.js environment');
  }

  try {
    const { execSync, spawn } = require('child_process');
    
    // Handle command-string style (traditional Rexx ADDRESS)
    if (typeof commandOrMethod === 'string' && !params) {
      return handleSystemCommand(commandOrMethod)
        .then(result => formatSystemResultForREXX(result))
        .catch(error => {
          const formattedError = formatSystemErrorForREXX(error);
          throw new Error(error.message); // Preserve original error throwing behavior
        });
    }
    
    // Handle method-call style (modern convenience)
    let resultPromise;
    switch (commandOrMethod.toLowerCase()) {
      case 'execute':
      case 'run':
        const executeOptions = {};
        // Handle combine_stderr parameter (string or boolean)
        const combineStderr = params.combine_stderr === true || params.combine_stderr === 'true';
        if (combineStderr) {
          executeOptions.combineStderr = true;
        }
        // Handle shell parameter
        if (params.shell) {
          executeOptions.shell = params.shell;
        }
        resultPromise = handleSystemCommand(params.command || params.cmd, executeOptions);
        break;
        
      case 'exec':
        const execOptions = params.options || {};
        // Handle combine_stderr parameter (string or boolean)
        const execCombineStderr = params.combine_stderr === true || params.combine_stderr === 'true';
        if (execCombineStderr) {
          execOptions.combineStderr = true;
        }
        // Handle shell parameter
        if (params.shell) {
          execOptions.shell = params.shell;
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
          methods: ['execute', 'run', 'exec', 'status'],
          timestamp: new Date().toISOString(),
          success: true
        });
        break;
        
      default:
        // Try to interpret as a direct system command
        resultPromise = handleSystemCommand(commandOrMethod);
        break;
    }
    
    // Enhance result with proper REXX variable fields and EXITCODE
    return resultPromise.then(result => {
      return formatSystemResultForREXX(result);
    }).catch(error => {
      // For certain errors (like command not found), we should still throw
      const formattedError = formatSystemErrorForREXX(error);
      throw new Error(error.message); // Preserve original error throwing behavior
    });
    
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
      
      // Handle shell selection
      let actualCommand = cmd;
      let shell = options.shell || '/bin/sh'; // Default to /bin/sh for POSIX compatibility
      
      // Handle REXX-style stderr combination
      const combineStderr = options.combineStderr === true;
      if (combineStderr) {
        // Use REXX-programmatic approach: modify command to combine stderr with stdout
        actualCommand = `${cmd} 2>&1`;
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
  window.SYSTEM_ADDRESS_MAIN = SYSTEM_ADDRESS_MAIN;
  window.ADDRESS_SYSTEM_HANDLER = ADDRESS_SYSTEM_HANDLER;
  window.ADDRESS_SYSTEM_METHODS = ADDRESS_SYSTEM_METHODS;
} else if (typeof global !== 'undefined') {
  // Node.js environment
  global.SYSTEM_ADDRESS_MAIN = SYSTEM_ADDRESS_MAIN;
  global.ADDRESS_SYSTEM_HANDLER = ADDRESS_SYSTEM_HANDLER;
  global.ADDRESS_SYSTEM_METHODS = ADDRESS_SYSTEM_METHODS;
}