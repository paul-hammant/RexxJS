/**
 * SHOW Graphics Command Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { RexxInterpreter } = require('../src/interpreter');

describe('SHOW Graphics Command', () => {
  let interpreter;
  let output;

  beforeEach(() => {
    output = [];
    interpreter = new RexxInterpreter(null, {
      output: (text) => output.push(text)
    });
  });

  test('should display histogram object', () => {
    const histData = {
      type: 'hist',
      data: [1, 2, 3, 4, 5],
      bins: [
        { start: 1, end: 2, count: 1, density: 0.2 },
        { start: 2, end: 3, count: 1, density: 0.2 },
        { start: 3, end: 4, count: 1, density: 0.2 },
        { start: 4, end: 5, count: 1, density: 0.2 },
        { start: 5, end: 6, count: 1, density: 0.2 }
      ],
      counts: [1, 1, 1, 1, 1],
      density: [0.2, 0.2, 0.2, 0.2, 0.2],
      options: { main: 'Test Histogram' },
      timestamp: new Date().toISOString()
    };

    const result = interpreter.builtInFunctions.SHOW(histData);
    expect(result).toBe('Displayed hist plot');
  });

  test('should display scatter plot object', () => {
    const scatterData = {
      type: 'scatter',
      x: [1, 2, 3, 4, 5],
      y: [2, 4, 1, 5, 3],
      options: { main: 'Test Scatter' },
      timestamp: new Date().toISOString()
    };

    const result = interpreter.builtInFunctions.SHOW(scatterData);
    expect(result).toBe('Displayed scatter plot');
  });

  test('should display boxplot object', () => {
    const boxplotData = {
      type: 'boxplot',
      data: [1, 2, 3, 4, 5],
      stats: {
        min: 1,
        q1: 2,
        median: 3,
        q3: 4,
        max: 5,
        outliers: []
      },
      options: { main: 'Test Boxplot' },
      timestamp: new Date().toISOString()
    };

    const result = interpreter.builtInFunctions.SHOW(boxplotData);
    expect(result).toBe('Displayed boxplot plot');
  });

  test('should handle graphics object with error', () => {
    const errorData = {
      type: 'hist',
      error: 'No numeric data provided'
    };

    const result = interpreter.builtInFunctions.SHOW(errorData);
    expect(result).toBe('Graphics error: No numeric data provided');
  });

  test('should reject non-graphics objects', () => {
    const result1 = interpreter.builtInFunctions.SHOW("not a graphics object");
    expect(result1).toBe('SHOW: Not a graphics object (type: string)');

    const result2 = interpreter.builtInFunctions.SHOW({ type: 'invalid' });
    expect(result2).toBe('SHOW: Not a graphics object (type: object)');

    const result3 = interpreter.builtInFunctions.SHOW(42);
    expect(result3).toBe('SHOW: Not a graphics object (type: number)');

    const result4 = interpreter.builtInFunctions.SHOW(null);
    expect(result4).toBe('SHOW: Not a graphics object (type: object)');
  });

  test('should handle all supported graphics types', () => {
    const supportedTypes = ['hist', 'scatter', 'boxplot', 'barplot', 'pie', 'qqplot', 'density', 'heatmap', 'contour', 'pairs'];
    
    supportedTypes.forEach(type => {
      const graphicsData = {
        type: type,
        data: [1, 2, 3],
        options: { main: `Test ${type}` },
        timestamp: new Date().toISOString()
      };

      const result = interpreter.builtInFunctions.SHOW(graphicsData);
      expect(result).toBe(`Displayed ${type} plot`);
    });
  });

  test('should work with SHOW statement in REXX code', async () => {
    // Mock a graphics object in a variable
    interpreter.variables.set('testPlot', {
      type: 'hist',
      data: [1, 2, 3, 4, 5],
      bins: [],
      counts: [1, 1, 1, 1, 1],
      options: { main: 'Test' },
      timestamp: new Date().toISOString()
    });

    const rexxCode = `
      LET result = SHOW(testPlot)
      SAY result
    `;

    const { parse } = require('../src/parser');
    const commands = parse(rexxCode);
    await interpreter.run(commands);

    expect(output).toContain('Displayed hist plot');
  });

  test('should work with variable containing graphics data', async () => {
    // Manually create and set the graphics object (avoiding JSON parsing issues in Node.js)
    const plotData = {
      type: "scatter",
      x: [1, 2, 3],
      y: [3, 1, 2],
      options: { main: "Test Scatter" },
      timestamp: "2025-01-01T00:00:00.000Z"
    };
    
    interpreter.variables.set('plotData', plotData);

    const rexxCode = `
      LET result = SHOW(plotData)
      SAY result
    `;

    const { parse } = require('../src/parser');
    const commands = parse(rexxCode);
    await interpreter.run(commands);

    expect(output).toContain('Displayed scatter plot');
  });
});