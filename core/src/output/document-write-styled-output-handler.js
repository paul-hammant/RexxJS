/**
 * Document Write Styled Output Handler - Old school direct page output for RexxJS with styling
 * Uses document.write() style direct HTML injection for SAY output with prettification
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */
class DocumentWriteStyledOutputHandler {
  /**
   * @param {boolean} [includeTimestamp=false] - Whether to include timestamps
   * @param {string} [cssClass='rexx-output'] - CSS class for output elements
   * @param {string|null} [containerId='rexx-output-container'] - ID of container element for output, or null for document.write mode
   */
  constructor(includeTimestamp = false, cssClass = 'rexx-output', containerId = 'rexx-output-container') {
    this.includeTimestamp = includeTimestamp;
    this.cssClass = cssClass;
    this.containerId = containerId;
    this.outputCount = 0;
    this.documentWriteWarningShown = false; // Track if we've shown the warning
  }

  /**
   * Output text directly to the page using document.write style
   * @param {string} text - The text to output
   */
  output(text) {
    // Create output element and append to document body
    this.writeToPage(text);
  }

  /**
   * Write text directly to the page by creating and appending elements
   * @param {string} text - The text to write
   */
  writeToPage(text) {
    this.outputCount++;
    
    // Create a div element for this output
    const outputDiv = document.createElement('div');
    outputDiv.className = this.cssClass;
    outputDiv.id = `rexx-output-${this.outputCount}`;
    
    // Format the text content
    let content = text;
    if (this.includeTimestamp) {
      const timestamp = new Date().toLocaleTimeString();
      content = `[${timestamp}] ${text}`;
    }
    
    outputDiv.textContent = content;
    
    // Add some basic styling
    outputDiv.style.cssText = `
      background: #f8f9fa;
      border-left: 4px solid #28a745;
      padding: 8px 12px;
      margin: 4px 0;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      white-space: pre-wrap;
      border-radius: 3px;
    `;
    
    // Use document.write if containerId is null, otherwise try to append to container
    if (this.containerId === null) {
      // Show warning only once
      if (!this.documentWriteWarningShown) {
        console.log("Some SAY output was placed in the page using document.write() but there is no guarantee that is visible, and if you can't see it check with page inspector and likely scroll toward the bottom");
        this.documentWriteWarningShown = true;
      }
      
      // Old-school document.write when no container available
      const content = this.includeTimestamp ? 
        `[${new Date().toLocaleTimeString()}] ${text}` : text;
      document.write(`<div style="background: #f8f9fa; border-left: 4px solid #28a745; padding: 8px 12px; margin: 4px 0; font-family: 'Courier New', monospace; font-size: 14px; white-space: pre-wrap; border-radius: 3px;">${content}</div>`);
      return;
    }
    
    // Try to append to the specified container
    const container = document.getElementById(this.containerId);
    if (!container) {
      throw new Error(`Container element with ID '${this.containerId}' not found`);
    }
    container.appendChild(outputDiv);
    
    // Auto-scroll to show the new output
    outputDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Clear all output from the page
   */
  clear() {
    if (this.containerId === null) {
      throw new Error('Cannot clear output in document.write mode');
    }
    const container = document.getElementById(this.containerId);
    if (!container) {
      throw new Error(`Container element with ID '${this.containerId}' not found`);
    }
    const outputs = container.querySelectorAll(`.${this.cssClass}`);
    outputs.forEach(element => element.remove());
    this.outputCount = 0;
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.DocumentWriteStyledOutputHandler = DocumentWriteStyledOutputHandler;
}

// Also support Node.js for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DocumentWriteStyledOutputHandler };
}