'use strict';

/*
 Optimized NumPy via PyOdide for REXX Integration
 Single initialization, fast subsequent calls
 Direct Python function mapping for maximum performance
*/

// Global PyOdide session state
let globalPyodideHandler = null;
let sessionInitialized = false;
let functionsRegistered = false;

// One-time session initialization
async function initializeGlobalSession() {
  if (sessionInitialized) return;
  
  console.log('🚀 Initializing global PyOdide session...');
  const startTime = Date.now();
  
  try {
    // Load existing PyOdide ADDRESS handler
    const pyodideAddress = require('../../addresses/pyodide/src/pyodide-address');
    globalPyodideHandler = pyodideAddress.ADDRESS_PYODIDE_HANDLER;
    
    // Initialize PyOdide and NumPy
    await globalPyodideHandler('run', { code: 'import numpy as np' });
    
    // Pre-register optimized Python functions for common operations
    await registerOptimizedFunctions();
    
    sessionInitialized = true;
    const initTime = Date.now() - startTime;
    console.log(`✅ Global session initialized in ${initTime}ms`);
    
  } catch (error) {
    throw new Error(`Failed to initialize global session: ${error.message}`);
  }
}

// Register optimized Python functions once
async function registerOptimizedFunctions() {
  if (functionsRegistered) return;
  
  console.log('📝 Registering optimized Python functions...');
  
  // Register fast Python helper functions
  await globalPyodideHandler('run', { code: `
import numpy as np
import json

# Fast JSON-based function interface
def fast_eigvals(matrix_json):
    matrix = np.array(json.loads(matrix_json))
    return np.linalg.eigvals(matrix).tolist()

def fast_eig(matrix_json):
    matrix = np.array(json.loads(matrix_json))
    eigenvals, eigenvecs = np.linalg.eig(matrix)
    return {
        'eigenvalues': eigenvals.tolist(),
        'eigenvectors': eigenvecs.tolist()
    }

def fast_det(matrix_json):
    matrix = np.array(json.loads(matrix_json))
    return float(np.linalg.det(matrix))

def fast_inv(matrix_json):
    matrix = np.array(json.loads(matrix_json))
    return np.linalg.inv(matrix).tolist()

def fast_dot(a_json, b_json):
    a = np.array(json.loads(a_json))
    b = np.array(json.loads(b_json))
    return np.dot(a, b).tolist()

def fast_matmul(a_json, b_json):
    a = np.array(json.loads(a_json))
    b = np.array(json.loads(b_json))
    return np.matmul(a, b).tolist()

def fast_solve(a_json, b_json):
    a = np.array(json.loads(a_json))
    b = np.array(json.loads(b_json))
    return np.linalg.solve(a, b).tolist()

def fast_zeros(shape_json):
    shape = json.loads(shape_json)
    return np.zeros(shape).tolist()

def fast_ones(shape_json):
    shape = json.loads(shape_json)
    return np.ones(shape).tolist()

def fast_eye(n):
    return np.eye(n).tolist()

def fast_mean(array_json):
    array = np.array(json.loads(array_json))
    return float(np.mean(array))

def fast_std(array_json):
    array = np.array(json.loads(array_json))
    return float(np.std(array))

# Batch operations for efficiency
def fast_batch_stats(array_json):
    array = np.array(json.loads(array_json))
    return {
        'mean': float(np.mean(array)),
        'std': float(np.std(array)),
        'min': float(np.min(array)),
        'max': float(np.max(array))
    }

print("✅ Fast NumPy functions registered")
  `});
  
  functionsRegistered = true;
}

// Fast function call wrapper
async function fastCall(functionName, ...args) {
  await initializeGlobalSession();
  
  const pythonCall = `${functionName}(${args.map(arg => JSON.stringify(arg)).join(', ')})`;
  const result = await globalPyodideHandler('run', { code: pythonCall });
  
  if (!result.success) {
    throw new Error(`Fast call failed: ${result.error}`);
  }
  
  return result.result;
}

// Optimized NumPy functions for REXX
async function eigvals(matrix) {
  const matrixJson = typeof matrix === 'string' ? matrix : JSON.stringify(matrix);
  return await fastCall('fast_eigvals', matrixJson);
}

async function eig(matrix) {
  const matrixJson = typeof matrix === 'string' ? matrix : JSON.stringify(matrix);
  return await fastCall('fast_eig', matrixJson);
}

async function det(matrix) {
  const matrixJson = typeof matrix === 'string' ? matrix : JSON.stringify(matrix);
  return await fastCall('fast_det', matrixJson);
}

async function inv(matrix) {
  const matrixJson = typeof matrix === 'string' ? matrix : JSON.stringify(matrix);
  return await fastCall('fast_inv', matrixJson);
}

async function dot(a, b) {
  const aJson = typeof a === 'string' ? a : JSON.stringify(a);
  const bJson = typeof b === 'string' ? b : JSON.stringify(b);
  return await fastCall('fast_dot', aJson, bJson);
}

async function matmul(a, b) {
  const aJson = typeof a === 'string' ? a : JSON.stringify(a);
  const bJson = typeof b === 'string' ? b : JSON.stringify(b);
  return await fastCall('fast_matmul', aJson, bJson);
}

async function solve(a, b) {
  const aJson = typeof a === 'string' ? a : JSON.stringify(a);
  const bJson = typeof b === 'string' ? b : JSON.stringify(b);
  return await fastCall('fast_solve', aJson, bJson);
}

async function zeros(shape) {
  const shapeJson = typeof shape === 'string' ? shape : JSON.stringify(shape);
  return await fastCall('fast_zeros', shapeJson);
}

async function ones(shape) {
  const shapeJson = typeof shape === 'string' ? shape : JSON.stringify(shape);
  return await fastCall('fast_ones', shapeJson);
}

async function eye(n) {
  return await fastCall('fast_eye', n);
}

async function mean(array) {
  const arrayJson = typeof array === 'string' ? array : JSON.stringify(array);
  return await fastCall('fast_mean', arrayJson);
}

async function std(array) {
  const arrayJson = typeof array === 'string' ? array : JSON.stringify(array);
  return await fastCall('fast_std', arrayJson);
}

// Batch statistics for efficiency
async function batchStats(array) {
  const arrayJson = typeof array === 'string' ? array : JSON.stringify(array);
  return await fastCall('fast_batch_stats', arrayJson);
}

// Performance monitoring
function getSessionStats() {
  return {
    initialized: sessionInitialized,
    functionsRegistered: functionsRegistered,
    pyodideReady: !!globalPyodideHandler
  };
}

// Export optimized functions
const optimizedNumPy = {
  // Core functions
  eigvals, eig, det, inv, dot, matmul, solve,
  zeros, ones, eye, mean, std,
  
  // Batch operations
  batchStats,
  
  // Session management
  initializeGlobalSession,
  getSessionStats
};

// Project standard export pattern
if (typeof module !== 'undefined' && module.exports) {
  module.exports = optimizedNumPy;
} else if (typeof window !== 'undefined') {
  Object.assign(window, optimizedNumPy);
  window.numpyOptimized = optimizedNumPy;
}