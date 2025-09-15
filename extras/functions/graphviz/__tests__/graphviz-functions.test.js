/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

describe('Graphviz Functions Library Tests', () => {
    let mockGraphviz;

    beforeEach(() => {
        mockGraphviz = {
            loadWASM: jest.fn().mockResolvedValue(null),
            layout: jest.fn().mockImplementation((dot, format, engine) => {
                if (dot.includes('error')) {
                    throw new Error('Invalid DOT string');
                }
                return `<svg><!-- ${engine} --></svg>`;
            })
        };

        jest.doMock('graphviz-wasm', () => mockGraphviz, { virtual: true });
    });

    afterEach(() => {
        jest.resetModules();
        delete global.GRAPHVIZ_FUNCTIONS;
        delete global.GRAPHVIZ_FUNCTIONS_META;
    });

    const loadModule = () => {
        const fs = require('fs');
        const path = require('path');
        const source = fs.readFileSync(path.join(__dirname, '../src/graphviz-functions.js'), 'utf8');
        eval(source);
    };

    test('should load without errors and define globals', () => {
        loadModule();
        expect(global.GRAPHVIZ_FUNCTIONS).toBeDefined();
        expect(global.GRAPHVIZ_FUNCTIONS_META).toBeDefined();
    });

    describe('RENDER function', () => {
        test('should call graphviz.layout and return SVG', async () => {
            loadModule();
            const dot = 'digraph { a -> b }';
            const svg = await global.GRAPHVIZ_FUNCTIONS.RENDER(dot);

            expect(mockGraphviz.loadWASM).toHaveBeenCalled();
            expect(mockGraphviz.layout).toHaveBeenCalledWith(dot, 'svg', 'dot');
            expect(svg).toBe('<svg><!-- dot --></svg>');
        });

        test('should use the specified engine from options', async () => {
            loadModule();
            const dot = 'digraph { a -> b }';
            await global.GRAPHVIZ_FUNCTIONS.RENDER(dot, { engine: 'neato' });

            expect(mockGraphviz.layout).toHaveBeenCalledWith(dot, 'svg', 'neato');
        });

        test('should throw an error for non-string input', async () => {
            loadModule();
            await expect(global.GRAPHVIZ_FUNCTIONS.RENDER(123))
                .rejects.toThrow('The first argument to GRAPHVIZ_RENDER must be a DOT string.');
        });

        test('should handle errors from graphviz.layout', async () => {
            loadModule();
            const dot = 'digraph { error }';
            await expect(global.GRAPHVIZ_FUNCTIONS.RENDER(dot))
                .rejects.toThrow('Graphviz rendering failed: Invalid DOT string');
        });

        test('should only load WASM once', async () => {
            loadModule();
            // Call render multiple times
            await global.GRAPHVIZ_FUNCTIONS.RENDER('digraph { a -> b }');
            await global.GRAPHVIZ_FUNCTIONS.RENDER('digraph { c -> d }');

            expect(mockGraphviz.loadWASM).toHaveBeenCalledTimes(1);
        });
    });
});
