/*!
 * graphviz-functions v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta {"canonical":"org.rexxjs/graphviz-functions","type":"functions-library","dependencies":{"graphviz-wasm":"^3.0.2"}}
 */
/**
 * Graphviz Functions Library - Provides Graphviz rendering capabilities
 *
 * Usage:
 *   REQUIRE "graphviz-functions"
 *   LET dot = 'digraph { a -> b }'
 *   LET svg = GRAPHVIZ_RENDER(dot)
 */

let graphviz = null;
try {
    if (typeof require !== 'undefined') {
        graphviz = require('graphviz-wasm');
    } else if (typeof window !== 'undefined' && window.graphviz) {
        graphviz = window.graphviz;
    }
} catch (e) {
    // graphviz-wasm is expected to be loaded externally
}

let wasmLoadingPromise = null;
let wasmLoaded = false;

async function loadWASM() {
    if (wasmLoaded) {
        return;
    }

    if (wasmLoadingPromise) {
        return wasmLoadingPromise;
    }

    if (!graphviz) {
        throw new Error('graphviz-wasm is not loaded. Make sure to include it in your environment.');
    }


    wasmLoadingPromise = graphviz.loadWASM();

    await wasmLoadingPromise;

    
    wasmLoaded = true;
    wasmLoadingPromise = null;
}

const GRAPHVIZ_FUNCTIONS = {
    // Detection function for REQUIRE system
    'GRAPHVIZ_FUNCTIONS_MAIN': () => ({
        type: 'library_info',
        name: 'Graphviz Functions',
        version: '1.0.0',
        loaded: true
    }),
    
    /**
     * Renders a DOT string into an SVG using Graphviz.
     * @param {string} dot - The DOT string to render.
     * @param {object} [options] - Optional parameters.
     * @param {string} [options.engine='dot'] - The layout engine to use (e.g., 'dot', 'neato', 'fdp').
     * @returns {Promise<string>} A promise that resolves to the SVG string.
     */
    'RENDER': async (dot, options) => {
        if (typeof dot !== 'string') {
            throw new Error('The first argument to GRAPHVIZ_RENDER must be a DOT string.');
        }

        await loadWASM();

        const engine = options?.engine || 'dot';

        try {
            const svg = graphviz.layout(dot, 'svg', engine);
            return svg;
        } catch (error) {
            console.error("Error rendering Graphviz DOT string:", error);
            throw new Error(`Graphviz rendering failed: ${error.message}`);
        }
    }
};

// Metadata for the function library
const GRAPHVIZ_FUNCTIONS_META = {
    type: 'functions-library',
    name: 'Graphviz Functions',
    version: '1.0.0',
    description: 'Provides functions for rendering Graphviz DOT strings.',
    functions: {
        'GRAPHVIZ_RENDER': {
            description: "Renders a DOT string into an SVG.",
            params: ["dot_string", {name: "options", optional: true}],
            returns: "The rendered SVG as a string."
        }
    }
};

// Export for both Node.js and browser in consistent format
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GRAPHVIZ_FUNCTIONS;
    if (typeof global !== 'undefined') {
        global.GRAPHVIZ_FUNCTIONS = GRAPHVIZ_FUNCTIONS;
        global.GRAPHVIZ_FUNCTIONS_META = GRAPHVIZ_FUNCTIONS_META;
    }
} else if (typeof window !== 'undefined') {
    window.GRAPHVIZ_FUNCTIONS = GRAPHVIZ_FUNCTIONS;
    window.GRAPHVIZ_FUNCTIONS_META = GRAPHVIZ_FUNCTIONS_META;
}
