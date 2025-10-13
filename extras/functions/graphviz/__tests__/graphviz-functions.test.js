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

    test('should only load WASM once across different function calls', async () => {
            loadModule();
        await global.GRAPHVIZ_FUNCTIONS.DOT('digraph { a -> b }');
        await global.GRAPHVIZ_FUNCTIONS.NEATO('digraph { c -> d }');
        await global.GRAPHVIZ_FUNCTIONS.FDP('digraph { e -> f }');

        expect(mockGraphviz.loadWASM).toHaveBeenCalledTimes(1);
        });

    describe.each([
        ['DOT', 'dot'],
        ['NEATO', 'neato'],
        ['FDP', 'fdp']
    ])('%s function', (funcName, engine) => {
        test(`should call graphviz.layout with the correct engine ('${engine}') and default format ('svg')`, async () => {
            loadModule();
            const dot = 'digraph { a -> b }';
            const result = await global.GRAPHVIZ_FUNCTIONS[funcName](dot);

            expect(mockGraphviz.loadWASM).toHaveBeenCalled();
            expect(mockGraphviz.layout).toHaveBeenCalledWith(dot, 'svg', engine);
            expect(result).toBe(`<svg><!-- ${engine} --></svg>`);
        });

        test('should use the specified format from options', async () => {
            loadModule();
            const dot = 'digraph { a -> b }';
            mockGraphviz.layout.mockImplementation((dot, format, engine) => `<${format}>${engine}</${format}>`);
            const result = await global.GRAPHVIZ_FUNCTIONS[funcName](dot, { format: 'png' });

            expect(mockGraphviz.layout).toHaveBeenCalledWith(dot, 'png', engine);
            expect(result).toBe(`<png>${engine}</png>`);
        });

        test('should throw an error for non-string input', async () => {
            loadModule();
            await expect(global.GRAPHVIZ_FUNCTIONS[funcName](123))
                .rejects.toThrow('The first argument must be a DOT string.');
        });

        test('should handle errors from graphviz.layout', async () => {
            loadModule();
            const dot = 'digraph { error }';
            await expect(global.GRAPHVIZ_FUNCTIONS[funcName](dot))
                .rejects.toThrow('Graphviz rendering failed: Invalid DOT string');
        });
        });
});
