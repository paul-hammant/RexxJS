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
const { executeScript } = require(__dirname + '/src/executor');
const { ADDRESS_EXPECTATIONS_HANDLER } = require(__dirname + '/src/expectations-address.js');

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

// Auto-discover and register bundled libraries
function autoRegisterBundledLibraries() {
  // Try to load and register system-address
  try {
    // Load system-address.js from bundled location
    const systemAddressPath = path.join(__dirname, 'system-address.js');
    if (fs.existsSync(systemAddressPath)) {
      const systemAddressCode = fs.readFileSync(systemAddressPath, 'utf8');
      
      // Execute the code to make functions available
      eval(systemAddressCode);
      
      // Call the main detection function to get metadata
      if (typeof SYSTEM_ADDRESS_MAIN === 'function') {
        const metadata = SYSTEM_ADDRESS_MAIN();
        console.log(`✓ Registered ADDRESS target: ${metadata.provides.addressTarget}`);
        
        // Make the handler globally available
        global.ADDRESS_SYSTEM_HANDLER = ADDRESS_SYSTEM_HANDLER;
        return { system: ADDRESS_SYSTEM_HANDLER };
      }
    }
  } catch (error) {
    console.warn('Warning: Could not auto-register system-address:', error.message);
  }
  
  return {};
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

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node cli.js <script.rexx> [options]');
    console.error('');
    console.error('Options:');
    console.error('  --help, -h    Show this help message');
    console.error('  --verbose, -v Show verbose output');
    console.error('');
    console.error('Examples:');
    console.error('  node cli.js tests/scripts/simple-command.rexx');
    console.error('  node cli.js my-script.rexx --verbose');
    process.exit(1);
  }
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('RexxJS REXX Script Runner - Node.js CLI');
    console.log('');
    console.log('This tool runs REXX scripts locally using the RexxJS interpreter.');
    console.log('Note: External services (DOM, file system, etc.) are mocked for local execution.');
    console.log('');
    console.log('Usage: node cli.js <script.rexx> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h    Show this help message');
    console.log('  --verbose, -v Show verbose output');
    console.log('');
    console.log('Examples:');
    console.log('  node cli.js tests/scripts/simple-command.rexx');
    console.log('  node cli.js my-script.rexx --verbose');
    return;
  }
  
  const scriptPath = args[0];
  const verbose = args.includes('--verbose') || args.includes('-v');
  
  if (!fs.existsSync(scriptPath)) {
    console.error(`Error: Script file not found: ${scriptPath}`);
    process.exit(1);
  }
  
  try {
    if (verbose) {
      console.log(`Reading REXX script: ${scriptPath}`);
    }
    
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    
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
    
    const interpreter = await executeScript(scriptContent, addressSender);
    
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