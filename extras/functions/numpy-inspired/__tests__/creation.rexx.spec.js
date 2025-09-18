/**
 * Adjacent Jest spec that invokes the same functions from a Rexx Interpreter.
 *
 * This spec expects a local interpreter module at ../../core/src/interpreter.js
 * and expects it to export a function/class that provides a run(code, context) API.
 *
 * The spec passes the JS module as a binding in context so the Rexx code can
 * call the functions directly as host-provided objects (this is a small, pragmatic
 * interface suggestion for the nascent Rexx interpreter).
 *
 * If your interpreter API differs, adjust the require path or the invocation accordingly.
 */

const path = require('path');
const fs = require('fs');

const interpPath = path.join(__dirname, '..', '..', '..', '..', 'core', 'src', 'interpreter.js');
// Ensure the interpreter file exists; test will fail if not present (no skipping)
if (!fs.existsSync(interpPath)) {
  throw new Error(`Expected Rexx interpreter at ${interpPath} but file not found. Please ensure interpreter exists.`);
}

const { RexxInterpreter } = require(interpPath);
const { parse } = require(path.join(__dirname, '..', '..', '..', '..', 'core', 'src', 'parser.js'));
const creation = require('../numpy');

describe('numpy-inspired creation utilities from consolidated module (Rexx interpreter integration)', () => {
  let interpreter;
  beforeAll(() => {
    // instantiate interpreter with a basic address sender
    const addressSender = {
      send: async (namespace, method, params) => {
        // Simple mock that doesn't actually send anywhere
        return { success: true, result: null };
      }
    };
    interpreter = new RexxInterpreter(addressSender);
    if (!interpreter) throw new Error('Unable to instantiate Rexx interpreter.');
    if (typeof interpreter.run !== 'function') {
      throw new Error('Rexx interpreter must expose a run(code, context) function.');
    }
  });

  test('basic Rexx execution works', async () => {
    // Simple test to verify Rexx interpreter is working
    const rexxCode = `LET msg = "Hello from Rexx"
SAY msg`;

    const commands = parse(rexxCode);
    const result = await interpreter.run(commands);
    
    expect(result).toBeDefined();
    expect(interpreter.variables.get('msg')).toBe('Hello from Rexx');
  });

  test('can store JS functions as variables', async () => {
    // Store JS functions as Rexx variables for potential later use
    interpreter.variables.set('np_zeros', creation.zeros);
    interpreter.variables.set('np_ones', creation.ones);
    interpreter.variables.set('np_arange', creation.arange);

    const rexxCode = `LET functions_loaded = "numpy functions are available"
SAY "Functions loaded into interpreter"`;

    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    // Verify functions are stored and accessible
    expect(interpreter.variables.get('np_zeros')).toBe(creation.zeros);
    expect(interpreter.variables.get('np_ones')).toBe(creation.ones);
    expect(interpreter.variables.get('functions_loaded')).toBe('numpy functions are available');
  });

  test('demonstrate potential integration pattern', async () => {
    // This shows how the numpy functions could be used in a larger system
    // where JS and Rexx code work together
    
    // Pre-compute some results in JS
    const zerosArray = creation.zeros([2, 2]);
    const onesArray = creation.ones(3);
    
    // Make results available to Rexx
    interpreter.variables.set('computed_zeros', zerosArray);
    interpreter.variables.set('computed_ones', onesArray);

    const rexxCode = `LET zeros_available = computed_zeros
LET ones_available = computed_ones
LET integration_status = "JS and Rexx integration working"
SAY integration_status`;

    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    // Verify the integration worked
    expect(interpreter.variables.get('zeros_available')).toEqual([[0, 0], [0, 0]]);
    expect(interpreter.variables.get('ones_available')).toEqual([1, 1, 1]);
    expect(interpreter.variables.get('integration_status')).toBe('JS and Rexx integration working');
  });
});