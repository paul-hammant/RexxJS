/* eslint-env browser */
'use strict';

/**
 * @fileoverview Composite output handler for SAY statements - supports multiple handlers
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

/**
 * CompositeOutputHandler allows multiple output handlers to be registered and called
 * for each SAY statement. This enables logging to multiple destinations simultaneously.
 */
class CompositeOutputHandler {
  constructor() {
    this.handlers = new Map();
  }

  /**
   * Add a named output handler
   * @param {string} name - Unique name for this handler
   * @param {function} handler - Function that takes (text) => void
   */
  addHandler(name, handler) {
    if (typeof handler !== 'function') {
      throw new Error(`Output handler for '${name}' must be a function`);
    }
    this.handlers.set(name, handler);
    return this;
  }

  /**
   * Remove a named output handler
   * @param {string} name - Name of handler to remove
   */
  removeHandler(name) {
    return this.handlers.delete(name);
  }

  /**
   * Get a specific handler by name
   * @param {string} name - Name of handler
   * @returns {function|undefined} The handler function or undefined
   */
  getHandler(name) {
    return this.handlers.get(name);
  }

  /**
   * Get all handler names
   * @returns {string[]} Array of handler names
   */
  getHandlerNames() {
    return Array.from(this.handlers.keys());
  }

  /**
   * Clear all handlers
   */
  clear() {
    this.handlers.clear();
  }

  /**
   * Main output method - calls all registered handlers
   * @param {string} text - Text to output
   */
  output(text) {
    const errors = [];
    
    for (const [name, handler] of this.handlers) {
      try {
        handler(text);
      } catch (error) {
        errors.push({ handler: name, error: error.message });
      }
    }
    
    // If any handlers failed, throw a composite error
    if (errors.length > 0) {
      const errorDetails = errors.map(e => `${e.handler}: ${e.error}`).join(', ');
      throw new Error(`Output handler errors: ${errorDetails}`);
    }
  }

  /**
   * Create a pre-configured composite handler with common output destinations
   * @param {Object} config - Configuration object
   * @param {boolean} config.console - Include console.log handler (default: true)
   * @param {function} config.log - Custom log function (optional)
   * @param {function} config.rpc - RPC function for remote output (optional)
   * @param {function} config.file - File output function (optional)
   * @returns {CompositeOutputHandler}
   */
  static create(config = {}) {
    const composite = new CompositeOutputHandler();
    
    // Console handler (default)
    if (config.console !== false) {
      composite.addHandler('console', (text) => console.log(text));
    }
    
    // Custom log handler
    if (config.log && typeof config.log === 'function') {
      composite.addHandler('log', config.log);
    }
    
    // RPC handler for remote output
    if (config.rpc && typeof config.rpc === 'function') {
      composite.addHandler('rpc', config.rpc);
    }
    
    // File handler
    if (config.file && typeof config.file === 'function') {
      composite.addHandler('file', config.file);
    }
    
    return composite;
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CompositeOutputHandler;
} else if (typeof window !== 'undefined') {
  window.CompositeOutputHandler = CompositeOutputHandler;
}