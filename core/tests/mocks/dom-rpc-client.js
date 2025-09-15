/**
 * Browser DOM Address Sender - Routes DOM operations to local DOM manager
 * Used in test harnesses and browser-only applications
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */
class BrowserDOMRpcClient {
    constructor() {
        // Initialize DOM manager in browser context
        if (typeof DOMElementManager !== 'undefined') {
            this.domManager = new DOMElementManager();
        } else {
            throw new Error('DOMElementManager not available');
        }
    }

    async send(namespace, method, params) {
        // Handle DOM operations locally
        if (method.startsWith('DOM_')) {
            return await this.handleDOMOperation(method, params);
        }
        
        // For non-DOM operations, use kitchen service or throw error
        if (namespace === 'kitchen') {
            // Simple mock kitchen operations
            return { success: true, message: `Mock ${method} executed` };
        }
        
        throw new Error(`RPC method ${namespace}.${method} not available in DOM-only mode`);
    }
    
    async handleDOMOperation(method, params) {
        switch (method) {
            case 'DOM_GET':
                return this.domManager.getElement(params.selector);
                
            case 'DOM_GET_ALL':
                const refs = this.domManager.getAllElements(params.selector);
                const result = {};
                refs.forEach((ref, index) => {
                    result[index + 1] = ref;
                });
                result.length = refs.length;
                return result;
                
            case 'DOM_ELEMENT_QUERY':
                return this.domManager.queryElement(params.element, params.selector);
                
            case 'DOM_ELEMENT_CLICK':
                return await this.domManager.clickElement(params.element);
                
            case 'DOM_ELEMENT_TYPE':
                await this.domManager.typeInElement(params.element, params.text || '');
                return true;
                
            case 'DOM_ELEMENT_CLEAR':
                return await this.domManager.clearElement(params.element);
                
            case 'DOM_ELEMENT_TEXT':
                return await this.domManager.getElementText(params.element);
                
            case 'DOM_ELEMENT_STALE':
                return this.domManager.isStale(params.element);
                
            case 'DOM_ELEMENT_REFRESH':
                return this.domManager.refreshElement(params.element);
                
            case 'DOM_ELEMENT_CLICK_SAFE':
                return await this.domManager.clickElementSafe(params.element);
                
            case 'DOM_RETRY_CONFIG':
                const config = {};
                if (params.leaf_retries !== undefined) config.leafRetries = params.leaf_retries;
                if (params.block_timeout !== undefined) config.blockTimeout = params.block_timeout;
                if (params.retry_delay !== undefined) config.retryDelay = params.retry_delay;
                if (params.debug !== undefined) config.debug = params.debug;
                this.domManager.setRetryConfig(config);
                return true;
                
            case 'DOM_GET_RETRY_STATS':
                return this.domManager.getRetryStats();
                
            case 'DOM_RETRY_ANALYTICS':
                this.domManager.setRetryConfig({ debug: params.enabled });
                return true;
                
            default:
                throw new Error(`Unknown DOM method: ${method}`);
        }
    }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BrowserDOMRpcClient };
} else if (typeof window !== 'undefined') {
    window.BrowserDOMRpcClient = BrowserDOMRpcClient;
}