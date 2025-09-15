/**
 * DOM Test Harness - Common functionality for browser-based test harnesses
 * Provides logging, script execution, and DOM interaction utilities
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
class DOMTestHarness {
    constructor(logElementId = 'log', resultsElementId = 'results') {
        this.logElementId = logElementId;
        this.resultsElementId = resultsElementId;
        this.interpreter = null;
    }

    /**
     * Initialize the harness with an interpreter instance
     * @param {Object} interpreter - The Rexx interpreter instance
     */
    initialize(interpreter) {
        this.interpreter = interpreter;
        this.logMessage('DOM Test Harness initialized');
    }

    /**
     * Log a message to the harness log area
     * @param {string} message - The message to log
     */
    logMessage(message) {
        const log = document.getElementById(this.logElementId);
        if (log) {
            const timestamp = new Date().toLocaleTimeString();
            log.textContent += `[${timestamp}] ${message}\n`;
            log.scrollTop = log.scrollHeight;
        } else {
            console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
        }
    }

    /**
     * Log a DOM action/event
     * @param {string} message - The action message
     */
    logAction(message) {
        this.logMessage(`DOM Event: ${message}`);
        const results = document.getElementById(this.resultsElementId);
        if (results) {
            results.innerHTML += `<div class="success-message">${message}</div>`;
        }
    }

    /**
     * Clear the log and results areas
     */
    clearLog() {
        const log = document.getElementById(this.logElementId);
        const results = document.getElementById(this.resultsElementId);
        if (log) log.textContent = '';
        if (results) results.innerHTML = '';
    }

    /**
     * Execute a Rexx script
     * @param {string} scriptText - The script to execute
     */
    async executeScript(scriptText) {
        if (!this.interpreter) {
            this.logMessage('ERROR: Interpreter not initialized');
            return;
        }

        if (!scriptText.trim()) {
            this.logMessage('ERROR: No script to execute');
            return;
        }

        try {
            this.logMessage('Parsing script...');
            const commands = parse(scriptText);
            
            this.logMessage('Executing script...');
            const result = await this.interpreter.run(commands);
            
            this.logMessage('Script completed successfully');
            if (result !== null && result !== undefined) {
                this.logMessage('Result: ' + JSON.stringify(result));
            }
        } catch (error) {
            this.logMessage('ERROR: ' + error.message);
            console.error('Script execution error:', error);
        }
    }

    /**
     * Load a predefined script example
     * @param {string} scriptTextAreaId - ID of the script textarea element
     * @param {string} script - The script content to load
     * @param {string} exampleName - Name of the example for logging
     */
    loadExample(scriptTextAreaId, script, exampleName) {
        const scriptArea = document.getElementById(scriptTextAreaId);
        if (scriptArea) {
            scriptArea.value = script;
            this.logMessage(`Loaded ${exampleName} example`);
        }
    }

    /**
     * Common form manipulation utilities
     */
    formUtils = {
        /**
         * Submit a form and log the data
         * @param {Object} fieldSelectors - Object mapping field names to selectors
         */
        submitForm: (fieldSelectors) => {
            const formData = {};
            for (const [fieldName, selector] of Object.entries(fieldSelectors)) {
                const element = document.querySelector(selector);
                if (element) {
                    if (element.type === 'checkbox') {
                        formData[fieldName] = element.checked;
                    } else {
                        formData[fieldName] = element.value;
                    }
                }
            }
            
            const dataString = Object.entries(formData)
                .map(([key, value]) => `${key}=${value}`)
                .join(', ');
            
            this.logAction(`Form submitted: ${dataString}`);
            
            const results = document.getElementById(this.resultsElementId);
            if (results) {
                results.innerHTML += `<div>Form Data: ${dataString}</div>`;
            }
            
            return formData;
        }.bind(this),

        /**
         * Clear form fields
         * @param {Array} selectors - Array of field selectors to clear
         */
        clearForm: (selectors) => {
            selectors.forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = false;
                    } else {
                        element.value = '';
                    }
                }
            });
            this.logAction('Form cleared');
        }.bind(this)
    };

    /**
     * Common element visibility utilities
     */
    elementUtils = {
        /**
         * Show a hidden element
         * @param {string} selector - CSS selector for the element
         */
        showElement: (selector) => {
            const element = document.querySelector(selector);
            if (element) {
                element.classList.remove('hidden');
                element.classList.add('visible');
                this.logAction(`Element ${selector} is now visible`);
            }
        }.bind(this),

        /**
         * Add a new todo item (common pattern in test harnesses)
         * @param {string} containerSelector - Selector for the todo container
         * @param {string} itemTemplate - HTML template for new items
         */
        addTodoItem: (containerSelector, itemTemplate) => {
            const container = document.querySelector(containerSelector);
            if (container) {
                const newId = 'todo' + Date.now();
                const newItem = document.createElement('div');
                newItem.className = 'todo-item';
                newItem.innerHTML = itemTemplate.replace('{{id}}', newId);
                
                // Insert before the last child (usually the "Add" button)
                container.insertBefore(newItem, container.lastElementChild);
                this.logAction('Added new todo item');
            }
        }.bind(this)
    };
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DOMTestHarness };
} else if (typeof window !== 'undefined') {
    window.DOMTestHarness = DOMTestHarness;
}