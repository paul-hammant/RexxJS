/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const { Interpreter } = require('../../../../../core/src/interpreter');
const { parse } = require('../../../../../core/src/parser');
const fs = require('fs');
const path = require('path');

describe('REQUIRE Integration Tests', () => {
  let interpreter;
  
  beforeEach(() => {
    interpreter = new Interpreter(null);
    
    // Clear any previously loaded libraries
    if (global.R_GRAPHING_MAIN) delete global.R_GRAPHING_MAIN;
    if (global.HISTOGRAM) delete global.HISTOGRAM;
    if (global.SCATTER) delete global.SCATTER;
    if (global.DENSITY) delete global.DENSITY;
    if (global.SCIPY_INTERPOLATION_MAIN) delete global.SCIPY_INTERPOLATION_MAIN;
    if (global.SP_INTERP1D) delete global.SP_INTERP1D;
    if (global.SP_GRIDDATA) delete global.SP_GRIDDATA;
  });

  test('should load and use r-graphing library functions', async () => {
    // Mock fetchFromUrl to return our test library
    interpreter.fetchFromUrl = async (url) => {
      const testLibPath = path.join(__dirname, '..', 'test-libs', 'r-graphing.js');
      return fs.readFileSync(testLibPath, 'utf8');
    };

    const script = `
      REQUIRE "r-graphing"
      
      -- Test histogram function with JSON array
      LET dataStr = "[1, 2, 2, 3, 3, 3, 4, 4, 5]"
      LET data = JSON_PARSE text=dataStr
      LET histogram = HISTOGRAM data=data bins=3
      
      -- Test scatter function
      LET scatterXStr = "[1, 2, 3, 4]"
      LET scatterYStr = "[2, 4, 6, 8]"
      LET scatterX = JSON_PARSE text=scatterXStr
      LET scatterY = JSON_PARSE text=scatterYStr
      LET scatter = SCATTER x=scatterX y=scatterY
      
      -- Test density function
      LET density = DENSITY data=data
    `;
    
    const commands = parse(script);
    await interpreter.run(commands);
    
    // Verify library functions are available
    expect(typeof global.HISTOGRAM).toBe('function');
    expect(typeof global.SCATTER).toBe('function');
    expect(typeof global.DENSITY).toBe('function');
    
    // Verify results
    const histogram = interpreter.getVariable('histogram');
    expect(histogram.type).toBe('histogram');
    expect(histogram.binCount).toBe(3);
    
    const scatter = interpreter.getVariable('scatter');
    expect(scatter.type).toBe('scatter');
    expect(scatter.points).toHaveLength(4);
    
    const density = interpreter.getVariable('density');
    expect(density.type).toBe('density');
    expect(typeof density.mean).toBe('number');
  });

  test('should handle multiple library loading', async () => {
    // Mock fetchFromUrl to return appropriate libraries
    interpreter.fetchFromUrl = async (url) => {
      if (url.includes('r-graphing')) {
        const testLibPath = path.join(__dirname, '..', 'test-libs', 'r-graphing.js');
        return fs.readFileSync(testLibPath, 'utf8');
      } else if (url.includes('scipy-interpolation')) {
        const testLibPath = path.join(__dirname, '..', 'test-libs', 'scipy-interpolation.js');
        return fs.readFileSync(testLibPath, 'utf8');
      }
      throw new Error('Unknown library');
    };

    const script = `
      REQUIRE "r-graphing"
      REQUIRE "scipy-interpolation"
      
      -- Test both libraries work
      LET histData = JSON_PARSE text="[1,2,3]"
      LET histogram = HISTOGRAM data=histData bins=2
      
      LET xData = JSON_PARSE text="[1,2,3]"
      LET yData = JSON_PARSE text="[10,20,30]"
      LET newXData = JSON_PARSE text="[1.5,2.5]"
      LET interp = SP_INTERP1D x=xData y=yData newX=newXData
    `;
    
    const commands = parse(script);
    await interpreter.run(commands);
    
    // Both libraries should be loaded
    expect(typeof global.HISTOGRAM).toBe('function');
    expect(typeof global.SP_INTERP1D).toBe('function');
    
    const histogram = interpreter.getVariable('histogram');
    expect(histogram.type).toBe('histogram');
    
    const interp = interpreter.getVariable('interp');
    expect(interp.type).toBe('interpolation');
  });

  test('should skip loading if library already present', async () => {
    // Pre-load library with detection function
    global.R_GRAPHING_MAIN = () => ({ 
      type: 'functions', 
      name: 'Mock R Graphing', 
      version: '1.0.0', 
      loaded: true 
    });
    global.HISTOGRAM = () => ({ type: 'mock-histogram' });
    
    // Manually register the pre-loaded functions
    interpreter.builtInFunctions.R_GRAPHING_MAIN = global.R_GRAPHING_MAIN;
    interpreter.builtInFunctions.HISTOGRAM = global.HISTOGRAM;
    
    // Mock fetchFromUrl - should not be called
    interpreter.fetchFromUrl = jest.fn();

    const script = `
      REQUIRE "r-graphing"
      LET testData = JSON_PARSE text="[1,2,3]"
      LET result = HISTOGRAM data=testData bins=2
    `;
    
    const commands = parse(script);
    await interpreter.run(commands);
    
    // fetchFromUrl should not have been called
    expect(interpreter.fetchFromUrl).not.toHaveBeenCalled();
    
    // Should use pre-loaded function
    const result = interpreter.getVariable('result');
    expect(result.type).toBe('mock-histogram');
  });

  test('should handle library loading errors gracefully', async () => {
    // Mock fetchFromUrl to fail
    interpreter.fetchFromUrl = async (url) => {
      throw new Error('Network error');
    };

    const script = `
      REQUIRE "failing-library"
    `;
    
    const commands = parse(script);
    
    await expect(interpreter.run(commands)).rejects.toThrow('Failed to load failing-library');
  });

  test('should work with library function errors', async () => {
    // Load library that has functions with validation
    interpreter.fetchFromUrl = async (url) => {
      const testLibPath = path.join(__dirname, '..', 'test-libs', 'r-graphing.js');
      return fs.readFileSync(testLibPath, 'utf8');
    };

    const script = `
      REQUIRE "r-graphing"
      LET badResult = HISTOGRAM data="not an array" bins=2
    `;
    
    const commands = parse(script);
    
    // Should propagate the library function's error
    await expect(interpreter.run(commands)).rejects.toThrow('HISTOGRAM: data must be an array');
  });
});