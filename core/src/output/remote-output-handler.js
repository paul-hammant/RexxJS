/**
 * Remote Output Handler - Stub for future remote logging capabilities
 * Could route SAY output to WebSocket, HTTP endpoint, or other remote destinations
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
class RemoteOutputHandler {
  /**
   * @param {string|object} destination - Remote destination (URL, WebSocket, config object)
   * @param {object} [options] - Configuration options
   */
  constructor(destination, options = {}) {
    this.destination = destination;
    this.options = {
      fallbackToConsole: true,
      bufferSize: 100,
      flushInterval: 1000,
      ...options
    };
    
    this.buffer = [];
    this.connected = false;
    
    // Initialize connection (stub for now)
    this.initialize();
  }

  /**
   * Initialize remote connection
   * TODO: Implement actual remote connectivity
   */
  initialize() {
    // TODO: Implement WebSocket, HTTP, or other remote connection
    // For now, just simulate connection
    console.log(`[RemoteOutputHandler] Would connect to: ${this.destination}`);
    
    // Simulate connection status
    setTimeout(() => {
      this.connected = false; // Simulate connection failure for now
      console.log('[RemoteOutputHandler] Connection not implemented yet');
    }, 100);
  }

  /**
   * Output text to remote destination
   * @param {string} text - The text to output
   */
  output(text) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      message: text,
      level: 'info',
      source: 'SAY'
    };

    if (this.connected) {
      // TODO: Send to actual remote destination
      this.sendRemote(logEntry);
    } else {
      // Buffer for later sending or fallback to console
      this.buffer.push(logEntry);
      
      if (this.options.fallbackToConsole) {
        console.log(`[REMOTE] ${text}`);
      }
    }

    // Flush buffer if it gets too large
    if (this.buffer.length >= this.options.bufferSize) {
      this.flushBuffer();
    }
  }

  /**
   * Send log entry to remote destination
   * @param {object} logEntry - The log entry to send
   */
  sendRemote(logEntry) {
    // TODO: Implement actual remote sending
    // Examples:
    // - WebSocket: this.websocket.send(JSON.stringify(logEntry))
    // - HTTP: fetch(this.destination, { method: 'POST', body: JSON.stringify(logEntry) })
    // - Custom protocol: this.customClient.send(logEntry)
    
    console.log('[RemoteOutputHandler] Would send:', logEntry);
  }

  /**
   * Flush buffered entries
   */
  flushBuffer() {
    if (this.buffer.length === 0) return;

    if (this.connected) {
      // Send all buffered entries
      this.buffer.forEach(entry => this.sendRemote(entry));
      this.buffer = [];
    } else if (this.options.fallbackToConsole) {
      // Fallback: dump buffer to console
      console.log('[RemoteOutputHandler] Flushing buffer to console:');
      this.buffer.forEach(entry => {
        console.log(`[REMOTE BUFFER] ${entry.timestamp} - ${entry.message}`);
      });
      this.buffer = [];
    }
  }

  /**
   * Get buffered entries (for debugging)
   * @returns {object[]} Array of buffered log entries
   */
  getBuffer() {
    return [...this.buffer];
  }

  /**
   * Clear the buffer
   */
  clearBuffer() {
    this.buffer = [];
  }

  /**
   * Set connection status (for testing)
   * @param {boolean} connected - Whether to simulate being connected
   */
  setConnected(connected) {
    this.connected = connected;
    if (connected && this.buffer.length > 0) {
      this.flushBuffer();
    }
  }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RemoteOutputHandler };
} else if (typeof window !== 'undefined') {
  window.RemoteOutputHandler = RemoteOutputHandler;
}