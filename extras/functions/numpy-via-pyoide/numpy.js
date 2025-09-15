'use strict';

/*
 Real NumPy via PyOdide Integration
 Uses the existing PyOdide ADDRESS infrastructure to provide full NumPy compatibility
 Leverages extras/addresses/pyodide/ without duplicating infrastructure
*/

// Import the existing PyOdide ADDRESS handler
let pyodideHandler = null;
let pyodideInitialized = false;
let numpyLoaded = false;

// Initialize PyOdide using existing ADDRESS infrastructure
async function initializePyodide() {
  if (pyodideInitialized) return;
  
  try {
    // Load the existing PyOdide ADDRESS handler (web/Node compatible)
    let pyodideAddress;
    
    if (typeof require !== 'undefined') {
      // Node.js environment
      pyodideAddress = require('../../addresses/pyodide/src/pyodide-address');
      pyodideHandler = pyodideAddress.ADDRESS_PYODIDE_HANDLER;
    } else if (typeof window !== 'undefined' && window.ADDRESS_PYODIDE_HANDLER) {
      // Browser environment - handler should be globally available
      pyodideHandler = window.ADDRESS_PYODIDE_HANDLER;
    } else if (typeof global !== 'undefined' && global.ADDRESS_PYODIDE_HANDLER) {
      // Other environments
      pyodideHandler = global.ADDRESS_PYODIDE_HANDLER;
    } else {
      throw new Error('PyOdide ADDRESS handler not available. Make sure pyodide-address.js is loaded.');
    }
    
    // Check PyOdide status
    const status = await pyodideHandler('status', {});
    if (!status.success) {
      throw new Error('PyOdide not available: ' + status.error);
    }
    
    pyodideInitialized = true;
    console.log('✅ PyOdide initialized via existing ADDRESS infrastructure');
    
    // Load NumPy
    await loadNumPy();
    
  } catch (error) {
    throw new Error(`Failed to initialize PyOdide: ${error.message}. Make sure PyOdide is available in your environment.`);
  }
}

// Load NumPy package
async function loadNumPy() {
  if (numpyLoaded) return;
  
  try {
    console.log('📦 Loading NumPy package...');
    await pyodideHandler('run', { code: 'import numpy as np' });
    numpyLoaded = true;
    console.log('✅ NumPy loaded successfully');
  } catch (error) {
    throw new Error(`Failed to load NumPy: ${error.message}`);
  }
}

// Utility function to run Python code with error handling
async function runPython(code) {
  await initializePyodide();
  
  const result = await pyodideHandler('run', { code });
  if (!result.success) {
    throw new Error(`Python execution failed: ${result.error}`);
  }
  return result.result;
}

// Utility function to convert JS array to Python and back
async function callNumPyFunction(functionCall, ...jsArrays) {
  await initializePyodide();
  
  // Set arrays in Python context
  for (let i = 0; i < jsArrays.length; i++) {
    await pyodideHandler('set_context', { 
      key: `js_array_${i}`, 
      value: jsArrays[i] 
    });
  }
  
  // Build Python code
  const arrayRefs = jsArrays.map((_, i) => `np.array(js_array_${i})`).join(', ');
  const pythonCode = jsArrays.length > 0 ? 
    `${functionCall}(${arrayRefs})` : 
    `${functionCall}()`;
  
  const result = await runPython(`
import numpy as np
result = ${pythonCode}
# Convert to Python list if it's a numpy array
if hasattr(result, 'tolist'):
    result.tolist()
else:
    result
  `);
  
  return result;
}

// --- Array Creation Functions ---
async function zeros(shape) {
  if (typeof shape === 'number') shape = [shape];
  return await runPython(`np.zeros(${JSON.stringify(shape)}).tolist()`);
}

async function ones(shape) {
  if (typeof shape === 'number') shape = [shape];
  return await runPython(`np.ones(${JSON.stringify(shape)}).tolist()`);
}

async function full(shape, fillValue) {
  if (typeof shape === 'number') shape = [shape];
  return await runPython(`np.full(${JSON.stringify(shape)}, ${fillValue}).tolist()`);
}

async function eye(n, m = null, k = 0) {
  const mParam = m !== null ? `, M=${m}` : '';
  const kParam = k !== 0 ? `, k=${k}` : '';
  return await runPython(`np.eye(${n}${mParam}${kParam}).tolist()`);
}

async function identity(n) {
  return await runPython(`np.identity(${n}).tolist()`);
}

async function arange(start, stop = null, step = 1) {
  if (stop === null) {
    stop = start;
    start = 0;
  }
  return await runPython(`np.arange(${start}, ${stop}, ${step}).tolist()`);
}

async function linspace(start, stop, num = 50, endpoint = true) {
  return await runPython(`np.linspace(${start}, ${stop}, ${num}, endpoint=${endpoint}).tolist()`);
}

async function logspace(start, stop, num = 50, endpoint = true, base = 10.0) {
  return await runPython(`np.logspace(${start}, ${stop}, ${num}, endpoint=${endpoint}, base=${base}).tolist()`);
}

// --- Mathematical Functions ---
async function sin(x) {
  return await callNumPyFunction('np.sin', x);
}

async function cos(x) {
  return await callNumPyFunction('np.cos', x);
}

async function tan(x) {
  return await callNumPyFunction('np.tan', x);
}

async function arcsin(x) {
  return await callNumPyFunction('np.arcsin', x);
}

async function arccos(x) {
  return await callNumPyFunction('np.arccos', x);
}

async function arctan(x) {
  return await callNumPyFunction('np.arctan', x);
}

async function sinh(x) {
  return await callNumPyFunction('np.sinh', x);
}

async function cosh(x) {
  return await callNumPyFunction('np.cosh', x);
}

async function tanh(x) {
  return await callNumPyFunction('np.tanh', x);
}

async function exp(x) {
  return await callNumPyFunction('np.exp', x);
}

async function log(x) {
  return await callNumPyFunction('np.log', x);
}

async function log10(x) {
  return await callNumPyFunction('np.log10', x);
}

async function log2(x) {
  return await callNumPyFunction('np.log2', x);
}

async function sqrt(x) {
  return await callNumPyFunction('np.sqrt', x);
}

async function square(x) {
  return await callNumPyFunction('np.square', x);
}

async function abs(x) {
  return await callNumPyFunction('np.abs', x);
}

async function sign(x) {
  return await callNumPyFunction('np.sign', x);
}

// --- Statistics Functions ---
async function mean(a, axis = null) {
  const axisParam = axis !== null ? `, axis=${axis}` : '';
  await pyodideHandler('set_context', { key: 'input_array', value: a });
  return await runPython(`np.mean(np.array(input_array)${axisParam}).tolist() if hasattr(np.mean(np.array(input_array)${axisParam}), 'tolist') else np.mean(np.array(input_array)${axisParam})`);
}

async function median(a, axis = null) {
  const axisParam = axis !== null ? `, axis=${axis}` : '';
  await pyodideHandler('set_context', { key: 'input_array', value: a });
  return await runPython(`np.median(np.array(input_array)${axisParam}).tolist() if hasattr(np.median(np.array(input_array)${axisParam}), 'tolist') else np.median(np.array(input_array)${axisParam})`);
}

async function std(a, axis = null, ddof = 0) {
  const axisParam = axis !== null ? `, axis=${axis}` : '';
  await pyodideHandler('set_context', { key: 'input_array', value: a });
  return await runPython(`np.std(np.array(input_array)${axisParam}, ddof=${ddof}).tolist() if hasattr(np.std(np.array(input_array)${axisParam}, ddof=${ddof}), 'tolist') else np.std(np.array(input_array)${axisParam}, ddof=${ddof})`);
}

async function var_(a, axis = null, ddof = 0) {
  const axisParam = axis !== null ? `, axis=${axis}` : '';
  await pyodideHandler('set_context', { key: 'input_array', value: a });
  return await runPython(`np.var(np.array(input_array)${axisParam}, ddof=${ddof}).tolist() if hasattr(np.var(np.array(input_array)${axisParam}, ddof=${ddof}), 'tolist') else np.var(np.array(input_array)${axisParam}, ddof=${ddof})`);
}

async function sum(a, axis = null) {
  const axisParam = axis !== null ? `, axis=${axis}` : '';
  await pyodideHandler('set_context', { key: 'input_array', value: a });
  return await runPython(`np.sum(np.array(input_array)${axisParam}).tolist() if hasattr(np.sum(np.array(input_array)${axisParam}), 'tolist') else np.sum(np.array(input_array)${axisParam})`);
}

async function prod(a, axis = null) {
  const axisParam = axis !== null ? `, axis=${axis}` : '';
  await pyodideHandler('set_context', { key: 'input_array', value: a });
  return await runPython(`np.prod(np.array(input_array)${axisParam}).tolist() if hasattr(np.prod(np.array(input_array)${axisParam}), 'tolist') else np.prod(np.array(input_array)${axisParam})`);
}

async function amin(a, axis = null) {
  const axisParam = axis !== null ? `, axis=${axis}` : '';
  await pyodideHandler('set_context', { key: 'input_array', value: a });
  return await runPython(`np.amin(np.array(input_array)${axisParam}).tolist() if hasattr(np.amin(np.array(input_array)${axisParam}), 'tolist') else np.amin(np.array(input_array)${axisParam})`);
}

async function amax(a, axis = null) {
  const axisParam = axis !== null ? `, axis=${axis}` : '';
  await pyodideHandler('set_context', { key: 'input_array', value: a });
  return await runPython(`np.amax(np.array(input_array)${axisParam}).tolist() if hasattr(np.amax(np.array(input_array)${axisParam}), 'tolist') else np.amax(np.array(input_array)${axisParam})`);
}

// --- Linear Algebra Functions ---
async function dot(a, b) {
  return await callNumPyFunction('np.dot', a, b);
}

async function matmul(a, b) {
  return await callNumPyFunction('np.matmul', a, b);
}

async function det(a) {
  return await callNumPyFunction('np.linalg.det', a);
}

async function inv(a) {
  return await callNumPyFunction('np.linalg.inv', a);
}

async function pinv(a, rcond = 1e-15) {
  await pyodideHandler('set_context', { key: 'matrix', value: a });
  return await runPython(`np.linalg.pinv(np.array(matrix), rcond=${rcond}).tolist()`);
}

async function solve(a, b) {
  return await callNumPyFunction('np.linalg.solve', a, b);
}

async function lstsq(a, b, rcond = null) {
  const rcondParam = rcond !== null ? `, rcond=${rcond}` : '';
  await pyodideHandler('set_context', { key: 'matrix_a', value: a });
  await pyodideHandler('set_context', { key: 'matrix_b', value: b });
  
  // Return only the solution (first element of NumPy's lstsq result)
  return await runPython(`np.linalg.lstsq(np.array(matrix_a), np.array(matrix_b)${rcondParam})[0].tolist()`);
}

// --- Eigenvalue Functions (Full NumPy Compatibility) ---
async function eig(a) {
  await pyodideHandler('set_context', { key: 'matrix', value: a });
  const result = await runPython(`
import numpy as np
eigenvals, eigenvecs = np.linalg.eig(np.array(matrix))
{
    'eigenvalues': eigenvals.tolist(),
    'eigenvectors': eigenvecs.tolist()
}
  `);
  return result;
}

async function eigh(a) {
  await pyodideHandler('set_context', { key: 'matrix', value: a });
  const result = await runPython(`
import numpy as np
eigenvals, eigenvecs = np.linalg.eigh(np.array(matrix))
{
    'eigenvalues': eigenvals.tolist(),
    'eigenvectors': eigenvecs.tolist()
}
  `);
  return result;
}

async function eigvals(a) {
  return await callNumPyFunction('np.linalg.eigvals', a);
}

async function slogdet(a) {
  await pyodideHandler('set_context', { key: 'matrix', value: a });
  const result = await runPython(`
import numpy as np
sign, logdet = np.linalg.slogdet(np.array(matrix))
{
    'sign': float(sign),
    'logdet': float(logdet)
}
  `);
  return result;
}

// --- Random Functions ---
async function seed(s) {
  return await runPython(`np.random.seed(${s})`);
}

async function rand(...shape) {
  if (shape.length === 0) {
    return await runPython(`np.random.rand()`);
  }
  return await runPython(`np.random.rand(${shape.join(', ')}).tolist()`);
}

async function randn(...shape) {
  if (shape.length === 0) {
    return await runPython(`np.random.randn()`);
  }
  return await runPython(`np.random.randn(${shape.join(', ')}).tolist()`);
}

async function randint(low, high = null, size = null) {
  const highParam = high !== null ? `, ${high}` : '';
  const sizeParam = size !== null ? `, size=${JSON.stringify(size)}` : '';
  return await runPython(`np.random.randint(${low}${highParam}${sizeParam}).tolist() if hasattr(np.random.randint(${low}${highParam}${sizeParam}), 'tolist') else np.random.randint(${low}${highParam}${sizeParam})`);
}

async function choice(a, size = null, replace = true, p = null) {
  await pyodideHandler('set_context', { key: 'array_a', value: a });
  const sizeParam = size !== null ? `, size=${JSON.stringify(size)}` : '';
  const replaceParam = `, replace=${replace}`;
  const pParam = p !== null ? `, p=${JSON.stringify(p)}` : '';
  return await runPython(`np.random.choice(np.array(array_a)${sizeParam}${replaceParam}${pParam}).tolist() if hasattr(np.random.choice(np.array(array_a)${sizeParam}${replaceParam}${pParam}), 'tolist') else np.random.choice(np.array(array_a)${sizeParam}${replaceParam}${pParam})`);
}

async function normal(loc = 0, scale = 1, size = null) {
  const sizeParam = size !== null ? `, size=${JSON.stringify(size)}` : '';
  return await runPython(`np.random.normal(${loc}, ${scale}${sizeParam}).tolist() if hasattr(np.random.normal(${loc}, ${scale}${sizeParam}), 'tolist') else np.random.normal(${loc}, ${scale}${sizeParam})`);
}

async function uniform(low = 0, high = 1, size = null) {
  const sizeParam = size !== null ? `, size=${JSON.stringify(size)}` : '';
  return await runPython(`np.random.uniform(${low}, ${high}${sizeParam}).tolist() if hasattr(np.random.uniform(${low}, ${high}${sizeParam}), 'tolist') else np.random.uniform(${low}, ${high}${sizeParam})`);
}

// --- Array Manipulation Functions ---
async function reshape(a, newshape) {
  await pyodideHandler('set_context', { key: 'input_array', value: a });
  return await runPython(`np.reshape(np.array(input_array), ${JSON.stringify(newshape)}).tolist()`);
}

async function transpose(a, axes = null) {
  const axesParam = axes !== null ? `, axes=${JSON.stringify(axes)}` : '';
  await pyodideHandler('set_context', { key: 'input_array', value: a });
  return await runPython(`np.transpose(np.array(input_array)${axesParam}).tolist()`);
}

async function ravel(a) {
  return await callNumPyFunction('np.ravel', a);
}

async function flatten(a) {
  await pyodideHandler('set_context', { key: 'input_array', value: a });
  return await runPython(`np.array(input_array).flatten().tolist()`);
}

async function concatenate(arrays, axis = 0) {
  await pyodideHandler('set_context', { key: 'array_list', value: arrays });
  return await runPython(`np.concatenate([np.array(arr) for arr in array_list], axis=${axis}).tolist()`);
}

async function stack(arrays, axis = 0) {
  await pyodideHandler('set_context', { key: 'array_list', value: arrays });
  return await runPython(`np.stack([np.array(arr) for arr in array_list], axis=${axis}).tolist()`);
}

async function vstack(arrays) {
  await pyodideHandler('set_context', { key: 'array_list', value: arrays });
  return await runPython(`np.vstack([np.array(arr) for arr in array_list]).tolist()`);
}

async function hstack(arrays) {
  await pyodideHandler('set_context', { key: 'array_list', value: arrays });
  return await runPython(`np.hstack([np.array(arr) for arr in array_list]).tolist()`);
}

// --- Utility Functions ---
async function array(input) {
  await pyodideHandler('set_context', { key: 'input_data', value: input });
  return await runPython(`np.array(input_data).tolist()`);
}

async function asarray(input) {
  return await array(input);
}

async function shape(a) {
  await pyodideHandler('set_context', { key: 'input_array', value: a });
  return await runPython(`list(np.array(input_array).shape)`);
}

// Export all functions using project standard pattern
const numpyFunctions = {
  // Array creation
  zeros, ones, full, eye, identity, arange, linspace, logspace, array, asarray,
  
  // Mathematical functions
  sin, cos, tan, arcsin, arccos, arctan, sinh, cosh, tanh,
  exp, log, log10, log2, sqrt, square, abs, sign,
  
  // Statistics
  mean, median, std, var: var_, sum, prod, amin, amax,
  
  // Linear algebra
  dot, matmul, det, inv, pinv, solve, lstsq, eig, eigh, eigvals, slogdet,
  
  // Random
  seed, rand, randn, randint, choice, normal, uniform,
  
  // Array manipulation
  reshape, transpose, ravel, flatten, concatenate, stack, vstack, hstack, shape,
  
  // Initialization utilities
  initializePyodide, loadNumPy
};

// Add REXX integration support for string parameters
const originalFunctions = { ...numpyFunctions };

// Wrap functions to handle REXX string parameters
Object.keys(originalFunctions).forEach(funcName => {
  const originalFunc = originalFunctions[funcName];
  
  // Skip utility functions
  if (['initializePyodide', 'loadNumPy'].includes(funcName)) {
    return;
  }
  
  numpyFunctions[funcName] = async function(...args) {
    // Parse string parameters for REXX compatibility
    const parsedArgs = args.map(arg => {
      if (typeof arg === 'string') {
        try {
          return JSON.parse(arg);
        } catch (e) {
          return arg; // Keep as string if not valid JSON
        }
      }
      return arg;
    });
    
    return await originalFunc.apply(this, parsedArgs);
  };
});

// Project standard export pattern
if (typeof module !== 'undefined' && module.exports) {
  module.exports = numpyFunctions;
} else if (typeof window !== 'undefined') {
  Object.assign(window, numpyFunctions);
  window.numpy = numpyFunctions;
}