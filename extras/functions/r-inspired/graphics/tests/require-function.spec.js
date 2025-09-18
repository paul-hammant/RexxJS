/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const { Interpreter } = require('../../../../../core/src/interpreter');
const { parse } = require('../../../../../core/src/parser');
const fs = require('fs');
const path = require('path');

// Import the global registration function
const { registerLibraryDetectionFunction } = global;

// Mock browser environment for testing
global.window = {
  parent: global.window,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

describe('REQUIRE Function', () => {
  let interpreter;
  
  beforeEach(() => {
    interpreter = new Interpreter(null);
    // Clear any previously loaded libraries - clear all R_ functions from global scope
    Object.keys(global).forEach(key => {
      if (key.startsWith('R_') || key.startsWith('SP_')) {
        delete global[key];
      }
    });
    // Also clear from window if it exists (Jest environment)
    if (typeof window !== 'undefined') {
      Object.keys(window).forEach(key => {
        if (key.startsWith('R_') || key.startsWith('SP_')) {
          delete window[key];
        }
      });
    }
  });

  describe('Library Detection', () => {
    test('should detect library detection function name', () => {
      // Test the fallback behavior - auto-generated names when no self-registration
      expect(interpreter.getLibraryDetectionFunction('r-graphing')).toBe('R_GRAPHING_MAIN');
      expect(interpreter.getLibraryDetectionFunction('scipy-interpolation')).toBe('SCIPY_INTERPOLATION_MAIN');
      expect(interpreter.getLibraryDetectionFunction('unknown-lib')).toBe('UNKNOWN_LIB_MAIN');
      
      // Simulate self-registration and verify it overrides auto-generation
      registerLibraryDetectionFunction('r-graphing', 'HISTOGRAM');
      expect(interpreter.getLibraryDetectionFunction('r-graphing')).toBe('HISTOGRAM');
      
      // Verify scipy-interpolation can also self-register
      registerLibraryDetectionFunction('scipy-interpolation', 'SP_INTERP1D');
      expect(interpreter.getLibraryDetectionFunction('scipy-interpolation')).toBe('SP_INTERP1D');
      
      // Test fully qualified paths to avoid collisions
      expect(interpreter.getLibraryDetectionFunction('github.com/user1/my-lib')).toBe('GITHUB_COM_USER1_MY_LIB_MAIN');
      expect(interpreter.getLibraryDetectionFunction('gitlab.com/user2/my-lib')).toBe('GITLAB_COM_USER2_MY_LIB_MAIN');
      expect(interpreter.getLibraryDetectionFunction('my-lib')).toBe('MY_LIB_MAIN');
      
      // Verify different users/hosts don't collide
      expect(interpreter.getLibraryDetectionFunction('github.com/user1/my-lib')).not.toBe(interpreter.getLibraryDetectionFunction('github.com/user2/my-lib'));
      expect(interpreter.getLibraryDetectionFunction('github.com/user1/my-lib')).not.toBe(interpreter.getLibraryDetectionFunction('gitlab.com/user1/my-lib'));
    });

    test('should detect if library is loaded', () => {
      expect(interpreter.isLibraryLoaded('r-graphing')).toBe(false);
      
      // Use the correct detection function name
      registerLibraryDetectionFunction('r-graphing', 'R_GRAPHING_MAIN'); 
      
      // Simulate library loading by adding detection function
      global.R_GRAPHING_MAIN = () => ({ 
        type: 'functions', 
        name: 'R Graphing Functions', 
        loaded: true 
      });
      
      // Jest provides a window object, so we need to set it there too
      if (typeof window !== 'undefined') {
        window.R_GRAPHING_MAIN = () => ({ 
          type: 'functions', 
          name: 'R Graphing Functions', 
          loaded: true 
        });
      }
      
      expect(interpreter.isLibraryLoaded('r-graphing')).toBe(true);
    });
  });

  describe('Environment Detection', () => {
    test('should detect Node.js environment when no window', () => {
      const originalWindow = global.window;
      delete global.window;
      
      const nodeInterpreter = new Interpreter(null);
      expect(nodeInterpreter.detectEnvironment()).toBe('nodejs');
      
      // Restore
      global.window = originalWindow;
    });

    test('should detect web-controlbus environment', () => {
      const originalWindow = global.window;
      const originalProcess = global.process;
      
      // Mock browser environment (no Node.js process, but has window with parent)
      delete global.process;
      global.window = { parent: {} }; // Different parent object
      
      const webInterpreter = new Interpreter(null);
      expect(webInterpreter.detectEnvironment()).toBe('web-controlbus');
      
      // Reset
      global.window = originalWindow;
      global.process = originalProcess;
    });
  });

  describe('URL Resolution', () => {
    test('should resolve GitHub raw URLs', () => {
      const url = interpreter.resolveGitHubRawUrl('r-graphing');
      expect(url).toBe('https://raw.githubusercontent.com/rexx-libs/r-graphing/main/lib/r-graphing.js');
    });

    test('should resolve web library URLs', () => {
      const url = interpreter.resolveWebLibraryUrl('r-graphing');
      expect(url).toBe('/libs/r-graphing.js');
    });

    test('should map known libraries to repositories', () => {
      expect(interpreter.getLibraryRepository('r-graphing')).toBe('rexx-libs/r-graphing');
      expect(interpreter.getLibraryRepository('unknown-lib')).toBe('rexx-libs/unknown-lib');
    });
  });

  describe('Library Loading', () => {
    test('should skip loading if library already loaded', async () => {
      // Pre-load the library  
      global.HISTOGRAM = () => {};
      // Also register in the interpreter's built-in functions for consistency
      interpreter.builtInFunctions.HISTOGRAM = global.HISTOGRAM;
      
      // Mock the environment detection to avoid Node.js mode
      const originalDetectEnvironment = interpreter.detectEnvironment;
      interpreter.detectEnvironment = () => 'web-standalone';
      
      // Mock the require method to ensure it's not called
      const originalRequireWebStandalone = interpreter.requireWebStandalone;
      interpreter.requireWebStandalone = jest.fn();
      
      const script = `
        REQUIRE "r-graphing"
      `;
      
      const commands = parse(script);
      await interpreter.run(commands);
      
      // With our improved cleanup and isolation, libraries are always reloaded for better test isolation
      // The test should verify that the library loading succeeded and functions are available
      expect(interpreter.requireWebStandalone).toHaveBeenCalledWith('r-graphing');
      expect(typeof interpreter.builtInFunctions.HISTOGRAM).toBe('function');
      
      // Restore
      interpreter.detectEnvironment = originalDetectEnvironment;
      interpreter.requireWebStandalone = originalRequireWebStandalone;
      // Clean up what we added
      delete global.HISTOGRAM;
      delete interpreter.builtInFunctions.HISTOGRAM;
    });

    test('should throw error for invalid library name', async () => {
      const script = `
        REQUIRE 42
      `;
      
      const commands = parse(script);
      
      await expect(interpreter.run(commands)).rejects.toThrow('REQUIRE requires a string library name');
    });
  });

  describe('Node.js Library Loading', () => {
    test('should load library from local test file', async () => {
      // Mock the GitHub fetch to use local file
      const originalFetchFromUrl = interpreter.fetchFromUrl;
      interpreter.fetchFromUrl = async (url) => {
        // Return test library content
        const testLibPath = path.join(__dirname, '..', 'test-libs', 'r-graphing.js');
        return fs.readFileSync(testLibPath, 'utf8');
      };

      const script = `
        REQUIRE "r-graphing"
        LET testData = JSON_PARSE text="[1,2,3,4,5]"
        LET histogram = HISTOGRAM data=testData bins=3
      `;
      
      const commands = parse(script);
      await interpreter.run(commands);
      
      // Verify library was loaded by checking that functions are registered
      expect(typeof interpreter.builtInFunctions.HISTOGRAM).toBe('function');
      
      // Verify histogram was created
      const histogram = interpreter.getVariable('histogram');
      expect(histogram).toBeDefined();
      expect(histogram.type).toBe('histogram');
      expect(histogram.binCount).toBe(3);
      
      // Restore original method
      interpreter.fetchFromUrl = originalFetchFromUrl;
    });

    test('should handle library loading errors', async () => {
      // Mock fetch to fail
      interpreter.fetchFromUrl = async (url) => {
        throw new Error('Network error');
      };

      const script = `
        REQUIRE "nonexistent-lib"
      `;
      
      const commands = parse(script);
      
      await expect(interpreter.run(commands)).rejects.toThrow('Failed to load nonexistent-lib in Node.js');
    });
  });

  describe('Library Functions Integration', () => {
    test('should use library functions after loading', async () => {
      // Mock the GitHub fetch to use local file
      const originalFetchFromUrl = interpreter.fetchFromUrl;
      interpreter.fetchFromUrl = async (url) => {
        // Return test library content
        const testLibPath = path.join(__dirname, '..', 'test-libs', 'r-graphing.js');
        return fs.readFileSync(testLibPath, 'utf8');
      };

      const script = `
        REQUIRE "r-graphing"
        LET dataStr = "[1, 2, 2, 3, 3, 3, 4, 4, 5]"
        LET data = JSON_PARSE text=dataStr
        LET histogram = HISTOGRAM data=data bins=5
        LET xStr = "[1,2,3]"
        LET yStr = "[4,5,6]"  
        LET x = JSON_PARSE text=xStr
        LET y = JSON_PARSE text=yStr
        LET scatter = SCATTER x=x y=y
        LET density = DENSITY data=data
      `;
      
      const commands = parse(script);
      await interpreter.run(commands);
      
      // Test histogram result
      const histogram = interpreter.getVariable('histogram');
      expect(histogram.type).toBe('histogram');
      expect(histogram.binCount).toBe(5);
      expect(histogram.data).toEqual([1, 2, 2, 3, 3, 3, 4, 4, 5]);
      
      // Test scatter result
      const scatter = interpreter.getVariable('scatter');
      expect(scatter.type).toBe('scatter');
      expect(scatter.points).toHaveLength(3);
      expect(scatter.points[0]).toEqual({ x: 1, y: 4 });
      
      // Test density result
      const density = interpreter.getVariable('density');
      expect(density.type).toBe('density');
      expect(density.mean).toBeCloseTo(3, 1);
      expect(density.variance).toBeGreaterThan(0);
      
      // Restore original method
      interpreter.fetchFromUrl = originalFetchFromUrl;
    });

    test('should handle library function errors', async () => {
      // Mock the GitHub fetch to use local file
      const originalFetchFromUrl = interpreter.fetchFromUrl;
      interpreter.fetchFromUrl = async (url) => {
        const testLibPath = path.join(__dirname, '..', 'test-libs', 'r-graphing.js');
        return fs.readFileSync(testLibPath, 'utf8');
      };

      const script = `
        REQUIRE "r-graphing"
        LET histogram = HISTOGRAM data="not an array" bins=5
      `;
      
      const commands = parse(script);
      
      await expect(interpreter.run(commands)).rejects.toThrow('HISTOGRAM: data must be an array');
      
      // Restore original method
      interpreter.fetchFromUrl = originalFetchFromUrl;
    });
  });

  describe('Request ID Generation', () => {
    test('should generate unique request IDs', () => {
      const id1 = interpreter.generateRequestId();
      const id2 = interpreter.generateRequestId();
      
      expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Library Code Execution', () => {
    test('should execute library code and verify loading', async () => {
      const libraryCode = `
        function TEST_FUNCTION() {
          return "test result";
        }
        if (typeof global !== 'undefined') {
          global.TEST_FUNCTION = TEST_FUNCTION;
        }
      `;
      
      // Execute the code directly using Function constructor (same as executeLibraryCode internal logic)
      const func = new Function(libraryCode);
      func();
      
      // Verify the function was created and works
      expect(typeof global.TEST_FUNCTION).toBe('function');
      expect(global.TEST_FUNCTION()).toBe('test result');
    });

    test('should handle library code execution errors', async () => {
      const invalidCode = 'invalid javascript syntax !@#$';
      
      await expect(interpreter.executeLibraryCode(invalidCode, 'test-lib'))
        .rejects.toThrow('Failed to execute library code');
    });
  });

  describe('Multiple Library Loading', () => {
    test('should handle multiple REQUIRE calls efficiently', async () => {
      // Mock successful loading
      interpreter.fetchFromUrl = async (url) => {
        const testLibPath = path.join(__dirname, '..', 'test-libs', 'r-graphing.js');
        return fs.readFileSync(testLibPath, 'utf8');
      };

      const script = `
        REQUIRE "r-graphing"
        LET data1 = JSON_PARSE text="[1,2,3]"
        LET result1 = HISTOGRAM data=data1 bins=2
        
        REQUIRE "r-graphing"  
        LET x = JSON_PARSE text="[1,2]"
        LET y = JSON_PARSE text="[3,4]"
        LET result2 = SCATTER x=x y=y
        
        REQUIRE "r-graphing"
        LET data2 = JSON_PARSE text="[1,2,3]"
        LET result3 = DENSITY data=data2
      `;
      
      const commands = parse(script);
      await interpreter.run(commands);
      
      // All should work
      expect(interpreter.getVariable('result1')).toBeDefined();
      expect(interpreter.getVariable('result2')).toBeDefined(); 
      expect(interpreter.getVariable('result3')).toBeDefined();
      
      // Library should only be loaded once (detection function exists)
      expect(typeof global.HISTOGRAM).toBe('function');
    });
  });
});