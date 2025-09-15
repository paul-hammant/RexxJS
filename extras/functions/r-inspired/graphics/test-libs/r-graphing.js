/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * R-style Graphing Library - Test Implementation
 * Primary detection function: R_GRAPHING_MAIN
 */

// Library detection function (must be first)
function R_GRAPHING_MAIN() {
  return {
    type: 'functions',
    name: 'R Graphing Functions',
    version: '1.0.0',
    description: 'R-style graphing and statistical visualization functions',
    provides: {
      functions: ['HISTOGRAM', 'SCATTER', 'DENSITY']
    },
    dependencies: [],
    loaded: true
  };
}

// Primary histogram function
function HISTOGRAM(data, bins = 10) {
  if (!Array.isArray(data)) {
    throw new Error('HISTOGRAM: data must be an array');
  }
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / bins;
  
  const histogram = {};
  for (let i = 0; i < bins; i++) {
    const binStart = min + i * binWidth;
    const binEnd = min + (i + 1) * binWidth;
    histogram[`bin_${i}`] = {
      start: binStart,
      end: binEnd,
      count: 0
    };
  }
  
  // Count data points in each bin
  for (const value of data) {
    const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
    histogram[`bin_${binIndex}`].count++;
  }
  
  return {
    type: 'histogram',
    bins: histogram,
    data: data,
    binCount: bins
  };
}

function SCATTER(x, y, options = {}) {
  if (!Array.isArray(x) || !Array.isArray(y)) {
    throw new Error('SCATTER: x and y must be arrays');
  }
  
  if (x.length !== y.length) {
    throw new Error('SCATTER: x and y arrays must have same length');
  }
  
  const points = x.map((xVal, i) => ({ x: xVal, y: y[i] }));
  
  return {
    type: 'scatter',
    points: points,
    options: options
  };
}

function DENSITY(data, bandwidth = 'auto') {
  if (!Array.isArray(data)) {
    throw new Error('DENSITY: data must be an array');
  }
  
  // Simple density estimation
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    type: 'density',
    mean: mean,
    variance: variance,
    stdDev: stdDev,
    bandwidth: bandwidth === 'auto' ? stdDev * 1.06 * Math.pow(data.length, -0.2) : bandwidth
  };
}

// Export to global scope
if (typeof window !== 'undefined') {
  // Browser environment
  window.R_GRAPHING_MAIN = R_GRAPHING_MAIN;
  window.HISTOGRAM = HISTOGRAM;
  window.SCATTER = SCATTER;
  window.DENSITY = DENSITY;
  
  // Self-register with the library detection system
  if (typeof window.registerLibraryDetectionFunction === 'function') {
    window.registerLibraryDetectionFunction('r-graphing', 'R_GRAPHING_MAIN');
  }
} else if (typeof global !== 'undefined') {
  // Node.js environment
  global.R_GRAPHING_MAIN = R_GRAPHING_MAIN;
  global.HISTOGRAM = HISTOGRAM;
  global.SCATTER = SCATTER;
  global.DENSITY = DENSITY;
  
  // Self-register with the library detection system
  if (typeof global.registerLibraryDetectionFunction === 'function') {
    global.registerLibraryDetectionFunction('r-graphing', 'R_GRAPHING_MAIN');
  }
}

// Also export as module for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    R_GRAPHING_MAIN,
    HISTOGRAM,
    SCATTER,
    DENSITY
  };
}