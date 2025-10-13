/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

describe('MATLAB-inspired Functions Library Tests', () => {

    afterEach(() => {
        jest.resetModules();
        delete global.MATLAB_FUNCTIONS;
        delete global.MATLAB_FUNCTIONS_META;
    });

    const loadModule = () => {
        const fs = require('fs');
        const path = require('path');
        const source = fs.readFileSync(path.join(__dirname, '../src/matlab-functions.js'), 'utf8');
        eval(source);
    };

    test('should load without errors and define globals', () => {
        loadModule();
        expect(global.MATLAB_FUNCTIONS).toBeDefined();
        expect(global.MATLAB_FUNCTIONS_META).toBeDefined();
    });

    describe('PLOT function', () => {
        test('should return a valid SVG string for a valid data array', () => {
            loadModule();
            const data = '[1, 5, 3, 8, 2]';
            const result = global.MATLAB_FUNCTIONS['PLOT'](data);
            expect(result).toContain('<svg');
            expect(result).toContain('<polyline');
        });

        test('should throw an error for invalid JSON data', () => {
            loadModule();
            const data = '[1, 5, 3, 8,';
            expect(() => global.MATLAB_FUNCTIONS['PLOT'](data)).toThrow('Invalid data format. Please provide a valid JSON array string.');
        });

        test('should throw an error for non-array data', () => {
            loadModule();
            const data = '{"a": 1}';
            expect(() => global.MATLAB_FUNCTIONS['PLOT'](data)).toThrow('Data must be an array of numbers.');
        });

        test('should throw an error for an array with non-numeric values', () => {
            loadModule();
            const data = '[1, "a", 3]';
            expect(() => global.MATLAB_FUNCTIONS['PLOT'](data)).toThrow('Data must be an array of numbers.');
        });
    });
});
