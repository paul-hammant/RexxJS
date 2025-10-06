/* eslint-env browser */
'use strict';

/**
 * @fileoverview Browser-compatible Rexx executor - no Node.js dependencies
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

const { parse } = require('./parser');
const { RexxInterpreter } = require('./interpreter');

/**
 * Execute a Rexx script from a string
 * @param {string} scriptContent - The Rexx script content
 * @param {Object} rpcClient - The Address Sender to use for command execution
 * @param {Array<string>} args - Optional command line arguments for PARSE ARG
 * @param {string} scriptPath - Optional path to the script file (for path resolution)
 * @param {Object} outputHandler - Optional output handler for SAY statements
 * @returns {Promise<Interpreter>} The interpreter instance after execution
 */
async function executeScript(scriptContent, rpcClient, args = [], scriptPath = null, outputHandler = null) {
  const commands = parse(scriptContent);
  const interpreter = outputHandler
    ? new RexxInterpreter(rpcClient, {}, outputHandler)
    : new RexxInterpreter(rpcClient);

  // Set up command line arguments - stored as array for ARG() and PARSE ARG
  interpreter.argv = args;

  // Pass scriptPath to run() as sourceFilename for path resolution
  await interpreter.run(commands, null, scriptPath);
  return interpreter;
}

module.exports = {
  executeScript
};