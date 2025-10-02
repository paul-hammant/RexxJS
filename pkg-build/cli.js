#!/usr/bin/env node
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
const { executeScript } = require('../core/src/executor');
const { ADDRESS_EXPECTATIONS_HANDLER } = require('../core/src/expectations-address.js');

// Pre-load Node.js modules for pkg environment
require('./nodejs-modules.js');

const { NodeOutputHandler } = require('../core/src/output/node-output-handler.js');

// Auto-discover and register bundled libraries
function autoRegisterBundledLibraries() {
  const handlers = {};
  
  // system-address is not bundled here; container/remote bundles handle registration
  
  // Try to load bundled container orchestration handlers (with shared-utils centralized)
  {
    const bundledContainers = path.join(__dirname, '../extras/addresses/provisioning-and-orchestration/bundled-container-handlers.bundle.js');
    if (!fs.existsSync(bundledContainers)) {
      throw new Error(`Required bundle missing: ${bundledContainers}. Build extras first (npm run build:extras or ./build-all.sh).`);
    }
    const code = fs.readFileSync(bundledContainers, 'utf8');
    eval(code);
  }

  // Try to load bundled remote handlers
  {
    const bundledRemote = path.join(__dirname, '../extras/addresses/provisioning-and-orchestration/bundled-remote-handlers.bundle.js');
    if (!fs.existsSync(bundledRemote)) {
      throw new Error(`Required bundle missing: ${bundledRemote}. Build extras first (npm run build:extras or ./build-all.sh).`);
    }
    const code = fs.readFileSync(bundledRemote, 'utf8');
    eval(code);
  }

  // No fallbacks: require bundles to be present; otherwise continue without handlers
  
  return handlers;
}

// Address sender for CLI execution
class CLIAddressSender {
  constructor(outputHandler) {
    this.outputHandler = outputHandler;
    this.addressHandlers = autoRegisterBundledLibraries();
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

    // Handle system commands
    if (address.toLowerCase() === 'system' && this.addressHandlers.system) {
      try {
        // ADDRESS_SYSTEM_HANDLER returns a Promise for command strings
        const result = await this.addressHandlers.system(command, params);
        
        // Extract the output from the result for display
        if (result && result.output) {
          this.outputHandler.writeLine(result.output);
        }
        
        return { status: 'success', result: result };
      } catch (error) {
        throw new Error(`System command failed: ${error.message}`);
      }
    }

    // Handle container orchestration commands (podman, docker, nspawn)
    const containerAddress = address.toLowerCase();
    if (this.addressHandlers[containerAddress]) {
      try {
        const result = await this.addressHandlers[containerAddress](command, params);
        return { status: 'success', result: result };
      } catch (error) {
        throw new Error(`${address.toUpperCase()} command failed: ${error.message}`);
      }
    }

    // Special case: ignore common 'default' ADDRESS calls from script parsing
    if (address === 'default') {
      return { status: 'ignored', result: 'Default ADDRESS call ignored' };
    }
    
    // In CLI mode, other missing ADDRESS handlers should be an error
    const error = new Error(`ADDRESS handler '${address}' not found. No external services available in CLI mode.`);
    error.address = address;
    error.command = command;
    error.params = params;
    throw error;
  }
}

// Detect execution context for adaptive help
function getExecutableName() {
  const execPath = process.argv[0];
  const scriptPath = process.argv[1];
  
  // Check if running as pkg binary - pkg sets process.pkg property
  if (typeof process.pkg !== 'undefined') {
    // Extract binary name from execPath
    return path.basename(execPath);
  }
  
  // Check if running as pkg binary by path patterns
  if (execPath.includes('rexx') && !scriptPath.includes('cli.js')) {
    return path.basename(execPath);
  }
  
  // Running from source
  return 'node cli.js';
}

function getVersion() {
  try {
    // Try to read package.json from various locations
    const locations = [
      path.join(__dirname, 'package.json'),        // pkg-build/package.json
      path.join(__dirname, '../package.json'),     // RexxJS/package.json
      path.join(__dirname, '../core/package.json') // core/package.json
    ];
    
    for (const loc of locations) {
      if (fs.existsSync(loc)) {
        const pkg = JSON.parse(fs.readFileSync(loc, 'utf8'));
        return pkg.version || '1.0.0';
      }
    }
  } catch (error) {
    // Fallback version
  }
  return '1.0.0';
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
  const execName = getExecutableName();
  
  const useStdin = args.includes('--use-stdin');
  
  // Handle version flag
  if (args.includes('--version') || args.includes('-v')) {
    console.log(`RexxJS v${getVersion()}`);
    process.exit(0);
  }
  
  if (args.length === 0 && !useStdin) {
    console.error(`Usage: ${execName} <script.rexx> [options]`);
    console.error(`       ${execName} --use-stdin [options]`);
    console.error('');
    console.error('Options:');
    console.error('  --help, -h       Show this help message');
    console.error('  --version, -v    Show version information');
    console.error('  --verbose        Show verbose output');
    console.error('  --use-stdin      Read REXX script from stdin instead of file');
    console.error('');
    console.error('Examples:');
    console.error(`  ${execName} tests/scripts/simple-command.rexx`);
    console.error(`  ${execName} my-script.rexx --verbose`);
    console.error(`  echo "SAY 'Hello World'" | ${execName} --use-stdin`);
    console.error(`  cat script.rexx | ${execName} --use-stdin --verbose`);
    process.exit(1);
  }
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`RexxJS v${getVersion()} - REXX Script Runner`);
    console.log('');
    console.log('This tool runs REXX scripts locally using the RexxJS interpreter.');
    console.log('Note: External services (DOM, file system, etc.) are mocked for local execution.');
    console.log('');
    console.log(`Usage: ${execName} <script.rexx> [options]`);
    console.log(`       ${execName} --use-stdin [options]`);
    console.log('');
    console.log('Options:');
    console.log('  --help, -h       Show this help message');
    console.log('  --version, -v    Show version information');
    console.log('  --verbose        Show verbose output');
    console.log('  --use-stdin      Read REXX script from stdin instead of file');
    console.log('');
    console.log('Examples:');
    console.log(`  ${execName} tests/scripts/simple-command.rexx`);
    console.log(`  ${execName} my-script.rexx --verbose`);
    console.log(`  echo "SAY 'Hello World'" | ${execName} --use-stdin`);
    console.log(`  cat script.rexx | ${execName} --use-stdin --verbose`);
    console.log(`  ssh user@host "cat remote-script.rexx" | ${execName} --use-stdin`);
    return;
  }
  
  const scriptPath = useStdin ? '<stdin>' : args[0];
  const verbose = args.includes('--verbose');
  
  // Collect KEY=VALUE pairs after the script path (or from all args if using stdin)
  const cliVars = new Map();
  const startIndex = useStdin ? 0 : 1;
  for (let i = startIndex; i < args.length; i++) {
    const a = args[i];
    if (a === '--verbose' || a === '--use-stdin') continue;
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
    addressSender.variables = cliVars;
    
    // Positional args for PARSE ARG: everything after script path (or from all args if using stdin) that is not KEY=VALUE or flags
    const positional = [];
    const startIndex = useStdin ? 0 : 1;
    for (let i = startIndex; i < args.length; i++) {
      const a = args[i];
      if (a === '--verbose' || a === '--use-stdin') continue;
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
