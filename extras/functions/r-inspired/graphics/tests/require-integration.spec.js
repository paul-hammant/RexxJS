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
    // Mock the library loading to use the test file
    const testLibPath = path.join(__dirname, '..', 'test-libs', 'r-graphing.js');
    const testLibContent = fs.readFileSync(testLibPath, 'utf8');
    
    // Override requireNodeJSModule to use our test library
    interpreter.requireNodeJSModule = async (libraryName) => {
      if (libraryName === 'r-graphing') {
        // Execute the test library code
        eval(testLibContent);
        
        // Also add to interpreter's builtInFunctions
        if (global.HISTOGRAM) interpreter.builtInFunctions.HISTOGRAM = global.HISTOGRAM;
        if (global.SCATTER) interpreter.builtInFunctions.SCATTER = global.SCATTER;
        if (global.DENSITY) interpreter.builtInFunctions.DENSITY = global.DENSITY;
        if (global.R_GRAPHING_MAIN) interpreter.builtInFunctions.R_GRAPHING_MAIN = global.R_GRAPHING_MAIN;
        if (global.SP_INTERP1D) interpreter.builtInFunctions.SP_INTERP1D = global.SP_INTERP1D;
        if (global.SP_GRIDDATA) interpreter.builtInFunctions.SP_GRIDDATA = global.SP_GRIDDATA;
        if (global.SCIPY_INTERPOLATION_MAIN) interpreter.builtInFunctions.SCIPY_INTERPOLATION_MAIN = global.SCIPY_INTERPOLATION_MAIN;
        
        return { loaded: true };
      }
      throw new Error(`Test library not found: ${libraryName}`);
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
    // Mock requireNodeJSModule to handle both test libraries
    interpreter.requireNodeJSModule = async (libraryName) => {
      const vm = require('vm');
      const context = {
        global: global,
        require: require,
        module: { exports: {} },
        exports: {}
      };
      vm.createContext(context);
      
      if (libraryName === 'r-graphing') {
        const testLibPath = path.join(__dirname, '..', 'test-libs', 'r-graphing.js');
        const testLibContent = fs.readFileSync(testLibPath, 'utf8');
        vm.runInContext(testLibContent, context);
        return context.module.exports || context.exports;
      } else if (libraryName === 'scipy-interpolation') {
        const testLibPath = path.join(__dirname, '..', 'test-libs', 'scipy-interpolation.js');
        const testLibContent = fs.readFileSync(testLibPath, 'utf8');
        vm.runInContext(testLibContent, context);
        return context.module.exports || context.exports;
      }
      throw new Error(`Test library not found: ${libraryName}`);
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
    
    // Mock requireNodeJSModule - should not be called since library is pre-loaded
    interpreter.requireNodeJSModule = jest.fn();

    const script = `
      REQUIRE "r-graphing"
      LET testData = JSON_PARSE text="[1,2,3]"
      LET result = HISTOGRAM data=testData bins=2
    `;
    
    const commands = parse(script);
    await interpreter.run(commands);
    
    // requireNodeJSModule should not have been called
    expect(interpreter.requireNodeJSModule).not.toHaveBeenCalled();
    
    // Should use pre-loaded function
    const result = interpreter.getVariable('result');
    expect(result.type).toBe('mock-histogram');
  });

  test('should handle library loading errors gracefully', async () => {
    // Mock requireNodeJSModule to fail
    interpreter.requireNodeJSModule = async (libraryName) => {
      throw new Error(`Cannot find module '${libraryName}'`);
    };

    const script = `
      REQUIRE "failing-library"
    `;
    
    const commands = parse(script);
    
    await expect(interpreter.run(commands)).rejects.toThrow('Cannot find module \'failing-library\'');
  });

  test('should work with library function errors', async () => {
    // Mock requireNodeJSModule to load the test library
    interpreter.requireNodeJSModule = async (libraryName) => {
      if (libraryName === 'r-graphing') {
        const vm = require('vm');
        const context = {
          global: global,
          require: require,
          module: { exports: {} },
          exports: {}
        };
        vm.createContext(context);
        const testLibPath = path.join(__dirname, '..', 'test-libs', 'r-graphing.js');
        const testLibContent = fs.readFileSync(testLibPath, 'utf8');
        vm.runInContext(testLibContent, context);
        return context.module.exports || context.exports;
      }
      throw new Error(`Test library not found: ${libraryName}`);
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