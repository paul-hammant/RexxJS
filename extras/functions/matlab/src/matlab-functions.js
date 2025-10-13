/*!
 * matlab-functions v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta=MATLAB_FUNCTIONS_META
 */
/**
 * MATLAB-inspired Functions Library - Provides plotting capabilities
 *
 * Usage:
 *   REQUIRE "matlab-functions"
 *   LET data = '[1, 2, 3, 4, 5]'
 *   LET svg = PLOT(data)
 */

const MATLAB_FUNCTIONS = {
    'MATLAB_FUNCTIONS_MAIN': () => MATLAB_FUNCTIONS_META(),

    'PLOT': (data, options) => {
        let parsedData;
        try {
            if (typeof data === 'string') {
                parsedData = JSON.parse(data);
            } else if (Array.isArray(data)) {
                parsedData = data;
            } else {
                throw new Error('Data must be a JSON string or an array.');
            }
        } catch (e) {
            throw new Error('Invalid data format. Please provide a valid JSON array string.');
        }

        if (!Array.isArray(parsedData) || parsedData.some(isNaN)) {
            throw new Error('Data must be an array of numbers.');
        }

        const width = 200;
        const height = 100;
        const padding = 20;

        const maxX = parsedData.length - 1;
        const maxVal = Math.max(...parsedData);
        const minVal = Math.min(...parsedData);

        const scaleX = (width - 2 * padding) / (maxX || 1);
        const scaleY = (height - 2 * padding) / ((maxVal - minVal) || 1);

        const points = parsedData.map((d, i) => {
            const x = i * scaleX + padding;
            const y = height - padding - ((d - minVal) * scaleY);
            return `${x},${y}`;
        }).join(' ');

        const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white" />
  <polyline points="${points}" fill="none" stroke="blue" stroke-width="2" />
</svg>
`;
        return svg;
    }
};

// Consolidated metadata provider function
function MATLAB_FUNCTIONS_META() {
    return {
        canonical: "org.rexxjs/matlab-functions",
        type: "functions-library",
        dependencies: {},
        name: 'MATLAB-inspired Functions',
        version: '1.0.0',
        description: 'Provides functions for plotting data.',
        functions: {
            'PLOT': {
                description: "Renders a plot of the given data.",
                params: ["data", {name: "options", optional: true, schema: {}}],
                returns: "The rendered plot as an SVG string."
            }
        },
        detectionFunction: 'MATLAB_FUNCTIONS_MAIN'
    };
}

// Export for both Node.js and browser in consistent format
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MATLAB_FUNCTIONS;
    if (typeof global !== 'undefined') {
        global.MATLAB_FUNCTIONS = MATLAB_FUNCTIONS;
        global.MATLAB_FUNCTIONS_META = MATLAB_FUNCTIONS_META;
    }
} else if (typeof window !== 'undefined') {
    window.MATLAB_FUNCTIONS = MATLAB_FUNCTIONS;
    window.MATLAB_FUNCTIONS_META = MATLAB_FUNCTIONS_META;
}
