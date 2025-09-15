/**
 * Shared RPC Framework for Cross-Iframe Communication
 * Provides common postMessage handling functionality for calculator implementations
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

function createRpcHandler(config) {
    const {
        serviceName,
        methods,
        logFunction,
        serviceReadyMessage = `${serviceName} app ready for RPC calls!`
    } = config;
    
    // Service configuration with HTTP Accept-style content negotiation
    const serviceConfig = {
        name: serviceName,
        protocols: ['json-rpc'],
        formats: ['application/json', 'text/plain'],
        methods: methods
    };
    
    // Setup message listener
    window.addEventListener('message', async (event) => {
        const { data, source, origin } = event;
        
        if (data.type === 'rpc-request') {
            const { id, namespace, method, params } = data;
            
            // Log the incoming RPC request in the expected format
            logFunction(`RPC: ${namespace}.${method}(${JSON.stringify(params)})`);
            
            try {
                // Handle introspection requests
                if (method === '_introspect') {
                    const format = (params && params.format) || 'text/plain';
                    const protocol = (params && params.protocol) || 'address';
                    
                    let result;
                    if (format === 'application/json' && protocol === 'json-rpc') {
                        // Return JSON schema for JSON-RPC protocol
                        result = methods;
                    } else {
                        // Return text descriptions for other combinations
                        result = Object.entries(methods).map(([methodName, def]) => 
                            `${methodName}: ${def.description} (returns ${def.returns})`
                        ).join('\n');
                    }
                    
                    // Send response
                    source.postMessage({
                        type: 'rpc-response',
                        id,
                        result,
                        source: serviceName
                    }, origin);
                    
                    // Log the result
                    const logResult = typeof result === 'object' ? JSON.stringify(result, null, 2) : result;
                    logFunction(`→ ${logResult}`);
                    
                    return;
                }
                
                // Handle method calls through the provided methods object
                if (methods[method]) {
                    const result = await methods[method].handler(params || {});
                    
                    // Send response
                    source.postMessage({
                        type: 'rpc-response',
                        id,
                        result,
                        source: serviceName
                    }, origin);
                    
                    // Log the result
                    const logResult = typeof result === 'object' ? JSON.stringify(result, null, 2) : result;
                    logFunction(`→ ${logResult}`);
                } else {
                    throw new Error(`Unknown method: ${method}`);
                }
                
            } catch (error) {
                // Log the error
                logFunction(`✗ ${error.message}`);
                
                // Send error response
                source.postMessage({
                    type: 'rpc-response',
                    id,
                    error: error.message,
                    source: serviceName
                }, origin);
            }
        }
    });
    
    // Return service configuration for external use
    return serviceConfig;
}