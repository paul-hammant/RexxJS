/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * SciPy-style Interpolation Library - Test Implementation
 * Primary detection function: SCIPY_INTERPOLATION_MAIN
 */

// Library detection function (must be first)
function SCIPY_INTERPOLATION_MAIN() {
  return {
    type: 'functions',
    name: 'SciPy Interpolation Functions',
    version: '1.0.0',
    description: 'SciPy-style interpolation and numerical functions',
    provides: {
      functions: ['SP_INTERP1D', 'SP_GRIDDATA']
    },
    dependencies: [],
    loaded: true
  };
}

// Primary interpolation function
function SP_INTERP1D(x, y, newX, method = 'linear') {
  if (!Array.isArray(x) || !Array.isArray(y) || !Array.isArray(newX)) {
    throw new Error('SP_INTERP1D: x, y, and newX must be arrays');
  }
  
  if (x.length !== y.length) {
    throw new Error('SP_INTERP1D: x and y arrays must have same length');
  }
  
  const interpolated = [];
  
  for (const targetX of newX) {
    let interpolatedY;
    
    // Find surrounding points
    let leftIndex = -1;
    for (let i = 0; i < x.length - 1; i++) {
      if (x[i] <= targetX && targetX <= x[i + 1]) {
        leftIndex = i;
        break;
      }
    }
    
    if (leftIndex === -1) {
      // Extrapolation - use nearest neighbor
      if (targetX < x[0]) {
        interpolatedY = y[0];
      } else {
        interpolatedY = y[y.length - 1];
      }
    } else {
      // Interpolation
      const x1 = x[leftIndex];
      const x2 = x[leftIndex + 1];
      const y1 = y[leftIndex];
      const y2 = y[leftIndex + 1];
      
      if (method === 'linear') {
        // Linear interpolation
        const t = (targetX - x1) / (x2 - x1);
        interpolatedY = y1 + t * (y2 - y1);
      } else {
        // Default to nearest neighbor
        interpolatedY = Math.abs(targetX - x1) < Math.abs(targetX - x2) ? y1 : y2;
      }
    }
    
    interpolated.push(interpolatedY);
  }
  
  return {
    type: 'interpolation',
    method: method,
    originalX: x,
    originalY: y,
    interpolatedX: newX,
    interpolatedY: interpolated
  };
}

function SP_GRIDDATA(points, values, gridX, gridY) {
  if (!Array.isArray(points) || !Array.isArray(values)) {
    throw new Error('SP_GRIDDATA: points and values must be arrays');
  }
  
  // Simple nearest neighbor gridding
  const grid = [];
  for (let i = 0; i < gridY.length; i++) {
    const row = [];
    for (let j = 0; j < gridX.length; j++) {
      const targetPoint = [gridX[j], gridY[i]];
      
      // Find nearest point
      let minDist = Infinity;
      let nearestValue = 0;
      
      for (let k = 0; k < points.length; k++) {
        const point = points[k];
        const dist = Math.sqrt(
          Math.pow(point[0] - targetPoint[0], 2) + 
          Math.pow(point[1] - targetPoint[1], 2)
        );
        
        if (dist < minDist) {
          minDist = dist;
          nearestValue = values[k];
        }
      }
      
      row.push(nearestValue);
    }
    grid.push(row);
  }
  
  return {
    type: 'griddata',
    gridX: gridX,
    gridY: gridY,
    values: grid
  };
}

// Export to global scope
if (typeof window !== 'undefined') {
  // Browser environment
  window.SCIPY_INTERPOLATION_MAIN = SCIPY_INTERPOLATION_MAIN;
  window.SP_INTERP1D = SP_INTERP1D;
  window.SP_GRIDDATA = SP_GRIDDATA;
  
  // Self-register with the library detection system
  if (typeof window.registerLibraryDetectionFunction === 'function') {
    window.registerLibraryDetectionFunction('scipy-interpolation', 'SCIPY_INTERPOLATION_MAIN');
  }
} else if (typeof global !== 'undefined') {
  // Node.js environment
  global.SCIPY_INTERPOLATION_MAIN = SCIPY_INTERPOLATION_MAIN;
  global.SP_INTERP1D = SP_INTERP1D;
  global.SP_GRIDDATA = SP_GRIDDATA;
  
  // Self-register with the library detection system
  if (typeof global.registerLibraryDetectionFunction === 'function') {
    global.registerLibraryDetectionFunction('scipy-interpolation', 'SCIPY_INTERPOLATION_MAIN');
  }
}

// Also export as module for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SCIPY_INTERPOLATION_MAIN,
    SP_INTERP1D,
    SP_GRIDDATA
  };
}