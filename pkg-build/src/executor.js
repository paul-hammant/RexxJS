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

const { parse } = require(require('path').join(__dirname, 'parser'));
const { RexxInterpreter } = require(require('path').join(__dirname, 'interpreter'));

/**
 * Execute a Rexx script from a string
 * @param {string} scriptContent - The Rexx script content
 * @param {Object} rpcClient - The Address Sender to use for command execution
 * @returns {Promise<Interpreter>} The interpreter instance after execution
 */
async function executeScript(scriptContent, rpcClient) {
  const commands = parse(scriptContent);
  const interpreter = new RexxInterpreter(rpcClient);
  await interpreter.run(commands);
  return interpreter;
}

module.exports = {
  executeScript
};