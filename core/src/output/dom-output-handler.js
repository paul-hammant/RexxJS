/**
 * DOM Output Handler - For browser test harnesses that display output on the page
 * Replaces the SAY method overrides currently embedded in HTML files
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
class DOMOutputHandler {
  /**
   * @param {string} outputElementId - ID of element to display SAY output
   * @param {string} [eventLogElementId] - Optional ID of element for event logging
   */
  constructor(outputElementId, eventLogElementId = null) {
    this.outputElementId = outputElementId;
    this.eventLogElementId = eventLogElementId;
  }

  /**
   * Output text to DOM elements and console
   * @param {string} text - The text to output
   */
  output(text) {
    // Always also log to console (so it appears in dev tools)
    console.log(text);
    
    // Add to page output (addOutput will handle SAY formatting and timestamping)
    this.addOutput(text);
    
    // Log event if event logging is configured
    if (this.eventLogElementId) {
      this.logEvent(`SAY: ${text}`);
    }
  }

  /**
   * Add output text to the designated output element
   * @param {string} text - The text to add
   */
  addOutput(text) {
    // Format as SAY message with timestamp for test harness compatibility
    const formattedMessage = `SAY: ${text}`;
    const timestamp = new Date().toLocaleTimeString();
    const timestampedMessage = `[${timestamp}] ${formattedMessage}`;
    
    const outputElement = document.getElementById(this.outputElementId);
    if (outputElement) {
      if (outputElement.value !== undefined) {
        // Textarea or input element
        outputElement.value += timestampedMessage + '\n';
      } else {
        // Div or other element
        outputElement.textContent += timestampedMessage + '\n';
      }
      
      // Auto-scroll to bottom
      if (outputElement.scrollTop !== undefined) {
        outputElement.scrollTop = outputElement.scrollHeight;
      }
    }
  }

  /**
   * Log an event to the event log element
   * @param {string} message - The event message to log
   */
  logEvent(message) {
    if (!this.eventLogElementId) return;
    
    const eventElement = document.getElementById(this.eventLogElementId);
    if (eventElement) {
      const timestamp = new Date().toLocaleTimeString();
      const logMessage = `[${timestamp}] ${message}\n`;
      
      if (eventElement.value !== undefined) {
        eventElement.value += logMessage;
      } else {
        eventElement.textContent += logMessage;
      }
      
      // Auto-scroll to bottom
      if (eventElement.scrollTop !== undefined) {
        eventElement.scrollTop = eventElement.scrollHeight;
      }
    }
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.DOMOutputHandler = DOMOutputHandler;
}

// Also support Node.js for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DOMOutputHandler };
}