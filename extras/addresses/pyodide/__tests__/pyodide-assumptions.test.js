/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const pyodide = require('pyodide');

describe('Pyodide Assumptions Test', () => {
    jest.setTimeout(60000);
    let pyodideInstance;

    beforeAll(async () => {
        pyodideInstance = await pyodide.loadPyodide();
    });

    test('should be able to get a variable from python scope', async () => {
        await pyodideInstance.loadPackage('numpy');
        await pyodideInstance.runPythonAsync('foo = 2**8');
        const foo = pyodideInstance.globals.get('foo');
        expect(foo).toBe(256);
    });
});
