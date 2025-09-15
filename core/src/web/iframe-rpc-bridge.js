/**
 * Iframe RPC Bridge - Enables cross-frame PostMessage RPC communication
 * Used for test harnesses that need to communicate between parent and child frames
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
class IframeRPCBridge {
    constructor(options = {}) {
        this.targetOrigin = options.targetOrigin || '*';
        this.messageHandlers = new Map();
        this.pendingRequests = new Map();
        this.requestId = 0;
        
        // Bind message listener
        window.addEventListener('message', this.handleMessage.bind(this));
    }

    /**
     * Handle incoming PostMessage events
     * @param {MessageEvent} event - The message event
     */
    handleMessage(event) {
        if (!event.data || typeof event.data !== 'object') {
            return;
        }

        const { type, requestId, method, params, result, error } = event.data;

        if (type === 'rpc-request') {
            this.handleRPCRequest(event, requestId, method, params);
        } else if (type === 'rpc-response') {
            this.handleRPCResponse(requestId, result, error);
        }
    }

    /**
     * Handle incoming RPC requests
     * @param {MessageEvent} event - The message event
     * @param {string} requestId - The request ID
     * @param {string} method - The method name
     * @param {Object} params - The method parameters
     */
    async handleRPCRequest(event, requestId, method, params) {
        try {
            const handler = this.messageHandlers.get(method);
            if (!handler) {
                throw new Error(`Unknown method: ${method}`);
            }

            const result = await handler(params, event);
            
            // Send response back to sender
            event.source.postMessage({
                type: 'rpc-response',
                requestId,
                result
            }, event.origin);
        } catch (error) {
            // Send error response
            event.source.postMessage({
                type: 'rpc-response',
                requestId,
                error: error.message
            }, event.origin);
        }
    }

    /**
     * Handle incoming RPC responses
     * @param {string} requestId - The request ID
     * @param {*} result - The result value
     * @param {string} error - The error message if any
     */
    handleRPCResponse(requestId, result, error) {
        const pending = this.pendingRequests.get(requestId);
        if (pending) {
            this.pendingRequests.delete(requestId);
            
            if (error) {
                pending.reject(new Error(error));
            } else {
                pending.resolve(result);
            }
        }
    }

    /**
     * Register a method handler for incoming RPC calls
     * @param {string} method - The method name
     * @param {Function} handler - The handler function
     */
    registerMethod(method, handler) {
        this.messageHandlers.set(method, handler);
    }

    /**
     * Send an RPC call to a target frame
     * @param {Window} targetFrame - The target window/frame
     * @param {string} method - The method name
     * @param {Object} params - The method parameters
     * @returns {Promise} Promise that resolves with the result
     */
    async sendRPC(targetFrame, method, params = {}) {
        return new Promise((resolve, reject) => {
            const requestId = `rpc-${++this.requestId}-${Date.now()}`;
            
            // Store pending request
            this.pendingRequests.set(requestId, { resolve, reject });
            
            // Send the message
            targetFrame.postMessage({
                type: 'rpc-request',
                requestId,
                method,
                params
            }, this.targetOrigin);
            
            // Set timeout for cleanup
            setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error(`RPC timeout: ${method}`));
                }
            }, 10000); // 10 second timeout
        });
    }

    /**
     * Create an Address Sender that routes calls through this bridge
     * @param {Window} targetFrame - The target window/frame to send calls to
     * @returns {Object} Address Sender object
     */
    createRPCClient(targetFrame) {
        return {
            send: async (namespace, method, params) => {
                return this.sendRPC(targetFrame, `${namespace}.${method}`, params);
            }
        };
    }

    /**
     * Setup common DOM automation methods for iframe communication
     * Useful for test harnesses that control DOM in other frames
     */
    setupDOMAutomationHandlers() {
        // Click handler
        this.registerMethod('dom.click', async (params) => {
            const element = document.querySelector(params.selector);
            if (!element) {
                throw new Error(`Element not found: ${params.selector}`);
            }
            element.click();
            return { success: true };
        });

        // Type handler
        this.registerMethod('dom.type', async (params) => {
            const element = document.querySelector(params.selector);
            if (!element) {
                throw new Error(`Element not found: ${params.selector}`);
            }
            element.value = params.text || '';
            
            // Trigger input events
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            
            return { success: true };
        });

        // Query handler
        this.registerMethod('dom.query', async (params) => {
            const { selector, operation, attribute, className } = params;
            const elements = document.querySelectorAll(selector);
            
            switch (operation) {
                case 'count':
                    return elements.length;
                    
                case 'text':
                    const element = elements[0];
                    return element ? element.textContent : '';
                    
                case 'value':
                    const input = elements[0];
                    return input ? input.value : '';
                    
                case 'visible':
                    const visible = elements[0];
                    return visible ? !visible.classList.contains('hidden') : false;
                    
                case 'attribute':
                    const attr = elements[0];
                    return attr ? attr.getAttribute(attribute) : null;
                    
                case 'has_class':
                    const classed = elements[0];
                    return classed ? classed.classList.contains(className) : false;
                    
                default:
                    throw new Error(`Unknown query operation: ${operation}`);
            }
        });

        // Add class handler
        this.registerMethod('dom.add_class', async (params) => {
            const element = document.querySelector(params.selector);
            if (!element) {
                throw new Error(`Element not found: ${params.selector}`);
            }
            element.classList.add(params.className);
            return { success: true };
        });

        // Remove class handler
        this.registerMethod('dom.remove_class', async (params) => {
            const element = document.querySelector(params.selector);
            if (!element) {
                throw new Error(`Element not found: ${params.selector}`);
            }
            element.classList.remove(params.className);
            return { success: true };
        });
    }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { IframeRPCBridge };
} else if (typeof window !== 'undefined') {
    window.IframeRPCBridge = IframeRPCBridge;
}