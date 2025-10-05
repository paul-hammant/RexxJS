/**
 * Test Output Handler - Captures SAY output for Jest test assertions
 * Eliminates the need for console.log mocking in tests
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
class TestOutputHandler {
  constructor() {
    this.outputs = [];
    this.debugMode = false;
  }

  /**
   * Output text and capture for testing
   * @param {string} text - The text to output
   */
  output(text) {
    // Capture for test assertions
    this.outputs.push(text);

    // Also log to console if debug mode is enabled (for test debugging)
    if (this.debugMode) {
      console.log(`[TEST OUTPUT] ${text}`);
    }
  }

  /**
   * Write text without newline (alias for output)
   * @param {string} text - The text to write
   */
  write(text) {
    this.output(text);
  }

  /**
   * Write text with newline (alias for output)
   * @param {string} text - The text to write
   */
  writeLine(text) {
    this.output(text);
  }

  /**
   * Write error text
   * @param {string} text - The error text to write
   */
  writeError(text) {
    this.output(text); // Capture errors same as regular output for testing
  }

  /**
   * Get all captured output as an array
   * @returns {string[]} Array of all SAY statements
   */
  getOutput() {
    return [...this.outputs]; // Return copy to prevent mutation
  }

  /**
   * Get all captured output as a single string
   * @returns {string} All output joined with newlines
   */
  getOutputText() {
    return this.outputs.join('\n');
  }

  /**
   * Clear all captured output
   */
  clearOutput() {
    this.outputs = [];
  }

  /**
   * Check if a specific text was output
   * @param {string} text - The text to search for
   * @returns {boolean} True if text was output
   */
  hasOutput(text) {
    return this.outputs.includes(text);
  }

  /**
   * Check if any output contains the given text
   * @param {string} text - The text to search for
   * @returns {boolean} True if any output contains the text
   */
  hasOutputContaining(text) {
    return this.outputs.some(output => output.includes(text));
  }

  /**
   * Get the number of SAY statements executed
   * @returns {number} Number of outputs
   */
  getOutputCount() {
    return this.outputs.length;
  }

  /**
   * Enable debug mode (outputs will also go to console)
   * @param {boolean} enabled - Whether to enable debug mode
   */
  setDebugMode(enabled = true) {
    this.debugMode = enabled;
  }

  /**
   * Get the last output
   * @returns {string|undefined} The last output, or undefined if no output
   */
  getLastOutput() {
    return this.outputs[this.outputs.length - 1];
  }

  /**
   * Get output by index
   * @param {number} index - The index of the output to get
   * @returns {string|undefined} The output at index, or undefined if out of bounds
   */
  getOutputAt(index) {
    return this.outputs[index];
  }
}

// Export for Node.js (Jest tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TestOutputHandler };
}

// Also support browser for completeness
if (typeof window !== 'undefined') {
  window.TestOutputHandler = TestOutputHandler;
}