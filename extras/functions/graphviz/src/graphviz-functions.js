/*!
 * graphviz-functions v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta {"dependencies":{"graphviz-wasm":"^1.2.1"}}
 */
/**
 * Graphviz Functions Library - Provides Graphviz rendering capabilities
 *
 * Usage:
 *   REQUIRE "graphviz-functions"
 *   LET dot = 'digraph { a -> b }'
 *   LET svg = GVZ_DOT(dot)
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

    console.log("Loading graphviz-wasm...");
    wasmLoadingPromise = graphviz.loadWASM();

    await wasmLoadingPromise;

    console.log("graphviz-wasm loaded successfully.");
    wasmLoaded = true;
    wasmLoadingPromise = null;
}

/**
 * Internal rendering function that interfaces with graphviz-wasm.
 * @param {string} dot - The DOT string to render.
 * @param {string} engine - The layout engine (e.g., 'dot', 'neato').
 * @param {string} format - The output format (e.g., 'svg', 'png').
 * @returns {Promise<string>} A promise that resolves to the rendered output.
 */
async function renderGraphviz(dot, engine, format) {
    if (typeof dot !== 'string') {
        throw new Error(`The first argument must be a DOT string.`);
    }

    await loadWASM();

    try {
        const result = graphviz.layout(dot, format, engine);
        return result;
    } catch (error) {
        console.error(`Error rendering Graphviz DOT string with ${engine}:`, error);
        throw new Error(`Graphviz rendering failed: ${error.message}`);
    }
}

const GRAPHVIZ_FUNCTIONS = {
    'GRAPHVIZ_FUNCTIONS_MAIN': () => ({
        type: 'library_info',
        name: 'Graphviz Functions',
        version: '1.0.0',
        loaded: true
    }),

    'DOT': (dot, options) => renderGraphviz(dot, 'dot', options?.format || 'svg'),
    'NEATO': (dot, options) => renderGraphviz(dot, 'neato', options?.format || 'svg'),
    'FDP': (dot, options) => renderGraphviz(dot, 'fdp', options?.format || 'svg')
};

// Metadata for the function library
const GRAPHVIZ_FUNCTIONS_META = {
    type: 'functions-library',
    name: 'Graphviz Functions',
    version: '1.0.0',
    description: 'Provides functions for rendering Graphviz DOT strings.',
    functions: {
        'DOT': {
            description: "Renders a DOT string using the 'dot' engine.",
            params: ["dot_string", {name: "options", optional: true, schema: {format: "output format (e.g., 'svg', 'png')"}}],
            returns: "The rendered output as a string."
        },
        'NEATO': {
            description: "Renders a DOT string using the 'neato' engine.",
            params: ["dot_string", {name: "options", optional: true, schema: {format: "output format (e.g., 'svg', 'png')"}}],
            returns: "The rendered output as a string."
        },
        'FDP': {
            description: "Renders a DOT string using the 'fdp' engine.",
            params: ["dot_string", {name: "options", optional: true, schema: {format: "output format (e.g., 'svg', 'png')"}}],
            returns: "The rendered output as a string."
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
