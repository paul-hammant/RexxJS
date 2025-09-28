#!/usr/bin/env node
/**
 * RexxJS Bundled CLI
 * Generated bundle containing RexxJS interpreter and dependencies
 * Generated: 2025-09-24T06:34:54.539Z
 */

'use strict';

/**
 * @fileoverview Node.js CLI wrapper for running REXX scripts
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const fs = require('fs');
const path = require('path');
const { executeScript } = require('./executor');
const { ADDRESS_EXPECTATIONS_HANDLER } = require('./expectations-address.js');

// Simple console output handler for Node.js
class NodeOutputHandler {
  write(content) {
    process.stdout.write(content);
  }
  
  writeLine(content) {
    console.log(content);
  }
  
  writeError(content) {
    console.error(content);
  }
}

// Address sender for CLI execution
class CLIAddressSender {
  constructor(outputHandler) {
    this.outputHandler = outputHandler;
    // Register first-class ADDRESS handlers available in CLI mode
    try {
      const { ADDRESS_SSH_HANDLER } = require('../../extras/addresses/provisioning-and-orchestration/address-ssh');
      this.ADDRESS_SSH_HANDLER = ADDRESS_SSH_HANDLER;
    } catch {}
    try {
      const { ADDRESS_REMOTE_DOCKER_HANDLER } = require('../../extras/addresses/provisioning-and-orchestration/address-remote-docker');
      this.ADDRESS_REMOTE_DOCKER_HANDLER = ADDRESS_REMOTE_DOCKER_HANDLER;
    } catch {}
  }
  
  async send(address, command, params = {}) {
    // Handle expectation commands
    if (address.toUpperCase() === 'EXPECTATIONS') {
      const result = await ADDRESS_EXPECTATIONS_HANDLER(command, params);
      if (!result.success) {
        // Throw an error to be caught by the main try...catch block
        throw new Error(result.error);
      }
      return result;
    }

    // Special case: ignore common 'default' ADDRESS calls from script parsing
    if (address === 'default') {
      return { status: 'ignored', result: 'Default ADDRESS call ignored' };
    }
    
    // First-class handlers enabled for CLI mode
    const upper = String(address || '').toUpperCase();
    if (upper === 'SSH' && this.ADDRESS_SSH_HANDLER) {
      const vars = this.variables instanceof Map ? this.variables : new Map();
      return this.ADDRESS_SSH_HANDLER(command, params, { variables: vars });
    }
    if (upper === 'REMOTE_DOCKER' && this.ADDRESS_REMOTE_DOCKER_HANDLER) {
      // Inject SSH handler for proxy composition if available
      global.ADDRESS_SSH_HANDLER_FOR_TEST = this.ADDRESS_SSH_HANDLER;
      const vars = this.variables instanceof Map ? this.variables : new Map();
      return this.ADDRESS_REMOTE_DOCKER_HANDLER(command, params, { variables: vars });
    }

    // In CLI mode, other missing ADDRESS handlers should be an error
    const error = new Error(`ADDRESS handler '${address}' not found. No external services available in CLI mode.`);
    error.address = address;
    error.command = command;
    error.params = params;
    throw error;
  }
}

// Function to read script content from stdin
function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('readable', () => {
      const chunk = process.stdin.read();
      if (chunk !== null) {
        data += chunk;
      }
    });
    
    process.stdin.on('end', () => {
      resolve(data);
    });
    
    process.stdin.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  const useStdin = args.includes('--use-stdin');
  
  if (args.length === 0 && !useStdin) {
    console.error('Usage: node cli.js <script.rexx> [options]');
    console.error('       node cli.js --use-stdin [options]');
    console.error('');
    console.error('Options:');
    console.error('  --help, -h     Show this help message');
    console.error('  --verbose, -v  Show verbose output');
    console.error('  --use-stdin    Read REXX script from stdin instead of file');
    console.error('');
    console.error('Examples:');
    console.error('  node cli.js tests/scripts/simple-command.rexx');
    console.error('  node cli.js my-script.rexx --verbose');
    console.error('  echo "SAY \'Hello World\'" | node cli.js --use-stdin');
    console.error('  cat script.rexx | node cli.js --use-stdin --verbose');
    process.exit(1);
  }
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('RexxJS REXX Script Runner - Node.js CLI');
    console.log('');
    console.log('This tool runs REXX scripts locally using the RexxJS interpreter.');
    console.log('Note: External services (DOM, file system, etc.) are mocked for local execution.');
    console.log('');
    console.log('Usage: node cli.js <script.rexx> [options]');
    console.log('       node cli.js --use-stdin [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h     Show this help message');
    console.log('  --verbose, -v  Show verbose output');
    console.log('  --use-stdin    Read REXX script from stdin instead of file');
    console.log('');
    console.log('Examples:');
    console.log('  node cli.js tests/scripts/simple-command.rexx');
    console.log('  node cli.js my-script.rexx --verbose');
    console.log('  echo "SAY \'Hello World\'" | node cli.js --use-stdin');
    console.log('  cat script.rexx | node cli.js --use-stdin --verbose');
    console.log('  ssh user@host "cat remote-script.rexx" | node cli.js --use-stdin');
    return;
  }
  
  const scriptPath = useStdin ? '<stdin>' : args[0];
  const verbose = args.includes('--verbose') || args.includes('-v');
  
  // Collect KEY=VALUE pairs after the script path (or from all args if using stdin)
  const cliVars = new Map();
  const startIndex = useStdin ? 0 : 1;
  for (let i = startIndex; i < args.length; i++) {
    const a = args[i];
    if (a === '--verbose' || a === '-v' || a === '--use-stdin') continue;
    const eq = a.indexOf('=');
    if (eq > 0) {
      const key = a.slice(0, eq);
      const value = a.slice(eq + 1);
      cliVars.set(key, value);
    }
  }
  
  if (!useStdin && !fs.existsSync(scriptPath)) {
    console.error(`Error: Script file not found: ${scriptPath}`);
    process.exit(1);
  }
  
  try {
    if (verbose) {
      console.log(`Reading REXX script: ${scriptPath}`);
    }
    
    let scriptContent;
    if (useStdin) {
      // Read from stdin
      scriptContent = await readStdin();
    } else {
      // Read from file
      scriptContent = fs.readFileSync(scriptPath, 'utf8');
    }
    
    if (verbose) {
      console.log('Script content:');
      console.log('----------------------------------------');
      console.log(scriptContent);
      console.log('----------------------------------------');
      console.log('Executing...');
      console.log('');
    }
    
    const outputHandler = new NodeOutputHandler();
    const addressSender = new CLIAddressSender(outputHandler);
    // Attach variables for ADDRESS handlers to interpolate {KEY}
    addressSender.variables = cliVars;
    
    // Positional args for PARSE ARG: everything after script path (or from all args if using stdin) that is not KEY=VALUE or flags
    const positional = [];
    const startIndex = useStdin ? 0 : 1;
    for (let i = startIndex; i < args.length; i++) {
      const a = args[i];
      if (a === '--verbose' || a === '-v' || a === '--use-stdin') continue;
      if (a.includes('=')) continue; // skip KEY=VALUE pairs
      positional.push(a);
    }

    const interpreter = await executeScript(scriptContent, addressSender, positional);
    
    if (verbose) {
      console.log('');
      console.log('Execution completed successfully!');
      console.log('Final variables:', interpreter.variables);
    }
    
  } catch (error) {
    console.error('Error executing script:', error.message);
    if (verbose) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Handle uncaught exceptions gracefully
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = { main };
