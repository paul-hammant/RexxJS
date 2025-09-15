/**
 * R-style matrix and linear algebra functions for REXX interpreter
 * Mirrors R-language matrix operations, linear algebra, and array manipulations
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const rMatrixFunctions = {
  // Matrix Creation Functions
  'MATRIX': (data, nrow = null, ncol = null, byrow = false) => {
    try {
      const values = Array.isArray(data) ? data : [data];
      if (values.length === 0) return [];
      
      // Determine dimensions
      let rows, cols;
      if (nrow !== null && ncol !== null) {
        rows = Math.max(1, parseInt(nrow) || 1);
        cols = Math.max(1, parseInt(ncol) || 1);
      } else if (nrow !== null) {
        rows = Math.max(1, parseInt(nrow) || 1);
        cols = Math.ceil(values.length / rows);
      } else if (ncol !== null) {
        cols = Math.max(1, parseInt(ncol) || 1);
        rows = Math.ceil(values.length / cols);
      } else {
        cols = values.length;
        rows = 1;
      }
      
      const totalCells = rows * cols;
      const extendedData = [];
      
      // Extend data by recycling
      for (let i = 0; i < totalCells; i++) {
        extendedData.push(values[i % values.length]);
      }
      
      // Fill matrix
      const matrix = [];
      if (byrow) {
        // Fill by rows
        for (let i = 0; i < rows; i++) {
          const row = [];
          for (let j = 0; j < cols; j++) {
            row.push(extendedData[i * cols + j]);
          }
          matrix.push(row);
        }
      } else {
        // Fill by columns (default)
        for (let i = 0; i < rows; i++) {
          const row = [];
          for (let j = 0; j < cols; j++) {
            row.push(extendedData[j * rows + i]);
          }
          matrix.push(row);
        }
      }
      
      return matrix;
    } catch (e) {
      return [];
    }
  },

  'ARRAY': (data, dim) => {
    try {
      if (!Array.isArray(dim)) return [];
      const values = Array.isArray(data) ? data : [data];
      const dimensions = dim.map(d => Math.max(1, parseInt(d) || 1));
      
      if (dimensions.length === 0) return values;
      if (dimensions.length === 1) return values.slice(0, dimensions[0]);
      if (dimensions.length === 2) {
        return rMatrixFunctions.MATRIX(values, dimensions[0], dimensions[1]);
      }
      
      // For higher dimensions, create nested arrays
      const totalSize = dimensions.reduce((a, b) => a * b, 1);
      const extendedData = [];
      for (let i = 0; i < totalSize; i++) {
        extendedData.push(values[i % values.length]);
      }
      
      return extendedData; // Simplified for now
    } catch (e) {
      return [];
    }
  },

  'DIAG': (x = 1, nrow = null, ncol = null) => {
    try {
      if (typeof x === 'number' && nrow === null && ncol === null) {
        // Create identity matrix
        const n = Math.max(1, parseInt(x) || 1);
        const matrix = [];
        for (let i = 0; i < n; i++) {
          const row = [];
          for (let j = 0; j < n; j++) {
            row.push(i === j ? 1 : 0);
          }
          matrix.push(row);
        }
        return matrix;
      }
      
      if (Array.isArray(x)) {
        // Extract diagonal from matrix
        if (Array.isArray(x[0])) {
          const diagonal = [];
          const minDim = Math.min(x.length, x[0].length);
          for (let i = 0; i < minDim; i++) {
            diagonal.push(x[i][i]);
          }
          return diagonal;
        }
        
        // Create diagonal matrix from vector
        const n = x.length;
        const matrix = [];
        for (let i = 0; i < n; i++) {
          const row = [];
          for (let j = 0; j < n; j++) {
            row.push(i === j ? x[i] : 0);
          }
          matrix.push(row);
        }
        return matrix;
      }
      
      // Create nrow x ncol matrix with x on diagonal
      const rows = parseInt(nrow) || 1;
      const cols = parseInt(ncol) || rows;
      const matrix = [];
      for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
          row.push(i === j ? x : 0);
        }
        matrix.push(row);
      }
      return matrix;
    } catch (e) {
      return [];
    }
  },

  // Matrix Dimensions
  'DIM': (x) => {
    try {
      if (!Array.isArray(x)) return null;
      if (x.length === 0) return [0, 0];
      if (!Array.isArray(x[0])) return [x.length];
      return [x.length, x[0].length];
    } catch (e) {
      return null;
    }
  },

  'NROW': (x) => {
    try {
      if (!Array.isArray(x)) return 1;
      return x.length;
    } catch (e) {
      return 0;
    }
  },

  'NCOL': (x) => {
    try {
      if (!Array.isArray(x)) return 1;
      if (x.length === 0) return 0;
      if (!Array.isArray(x[0])) return 1;
      return x[0].length;
    } catch (e) {
      return 0;
    }
  },

  // Matrix Operations
  'T': (x) => {
    try {
      if (!Array.isArray(x)) return x;
      if (x.length === 0) return [];
      if (!Array.isArray(x[0])) {
        // Vector - convert to column matrix
        return x.map(val => [val]);
      }
      
      const rows = x.length;
      const cols = x[0].length;
      const transposed = [];
      
      for (let j = 0; j < cols; j++) {
        const row = [];
        for (let i = 0; i < rows; i++) {
          row.push(x[i][j]);
        }
        transposed.push(row);
      }
      
      return transposed;
    } catch (e) {
      return [];
    }
  },

  'TRANSPOSE': (x) => {
    return rMatrixFunctions.T(x);
  },

  // Matrix Arithmetic
  'MATMULT': (a, b) => {
    try {
      if (!Array.isArray(a) || !Array.isArray(b)) return [];
      
      // Ensure matrices
      const matA = Array.isArray(a[0]) ? a : [a];
      const matB = Array.isArray(b[0]) ? b : rMatrixFunctions.T([b]);
      
      const aRows = matA.length;
      const aCols = matA[0].length;
      const bRows = matB.length;
      const bCols = matB[0].length;
      
      if (aCols !== bRows) {
        throw new Error('Non-conformable matrices');
      }
      
      const result = [];
      for (let i = 0; i < aRows; i++) {
        const row = [];
        for (let j = 0; j < bCols; j++) {
          let sum = 0;
          for (let k = 0; k < aCols; k++) {
            const aVal = parseFloat(matA[i][k]) || 0;
            const bVal = parseFloat(matB[k][j]) || 0;
            sum += aVal * bVal;
          }
          row.push(sum);
        }
        result.push(row);
      }
      
      return result;
    } catch (e) {
      return [];
    }
  },

  'CROSSPROD': (x, y = null) => {
    try {
      if (y === null) {
        // t(x) %*% x
        const tX = rMatrixFunctions.T(x);
        return rMatrixFunctions.MATMULT(tX, x);
      }
      // t(x) %*% y
      const tX = rMatrixFunctions.T(x);
      return rMatrixFunctions.MATMULT(tX, y);
    } catch (e) {
      return [];
    }
  },

  'TCROSSPROD': (x, y = null) => {
    try {
      if (y === null) {
        // x %*% t(x)
        const tX = rMatrixFunctions.T(x);
        return rMatrixFunctions.MATMULT(x, tX);
      }
      // x %*% t(y)
      const tY = rMatrixFunctions.T(y);
      return rMatrixFunctions.MATMULT(x, tY);
    } catch (e) {
      return [];
    }
  },

  // Matrix Properties
  'DETERMINANT': (x) => {
    try {
      if (!Array.isArray(x) || !Array.isArray(x[0])) return 0;
      const n = x.length;
      if (n !== x[0].length) return 0; // Not square
      
      // Convert to numbers
      const matrix = x.map(row => row.map(val => parseFloat(val) || 0));
      
      // Simple cases
      if (n === 1) return matrix[0][0];
      if (n === 2) {
        return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
      }
      
      // Laplace expansion for larger matrices
      let det = 0;
      for (let j = 0; j < n; j++) {
        const minor = [];
        for (let i = 1; i < n; i++) {
          const row = [];
          for (let k = 0; k < n; k++) {
            if (k !== j) row.push(matrix[i][k]);
          }
          if (row.length > 0) minor.push(row);
        }
        const cofactor = Math.pow(-1, j) * matrix[0][j] * rMatrixFunctions.DETERMINANT(minor);
        det += cofactor;
      }
      
      return det;
    } catch (e) {
      return 0;
    }
  },

  'DET': (x) => {
    return rMatrixFunctions.DETERMINANT(x);
  },

  'TRACE': (x) => {
    try {
      if (!Array.isArray(x) || !Array.isArray(x[0])) return 0;
      const n = Math.min(x.length, x[0].length);
      let trace = 0;
      for (let i = 0; i < n; i++) {
        trace += parseFloat(x[i][i]) || 0;
      }
      return trace;
    } catch (e) {
      return 0;
    }
  },

  // Matrix Decomposition (simplified)
  'EIGEN': (x) => {
    try {
      if (!Array.isArray(x) || !Array.isArray(x[0])) return { values: [], vectors: [] };
      const n = x.length;
      if (n !== x[0].length) return { values: [], vectors: [] };
      
      // Simplified: return diagonal elements as eigenvalues for diagonal matrices
      const isDiagonal = x.every((row, i) => 
        row.every((val, j) => i === j || Math.abs(parseFloat(val) || 0) < 1e-10)
      );
      
      if (isDiagonal) {
        const values = x.map((row, i) => parseFloat(row[i]) || 0);
        const vectors = rMatrixFunctions.DIAG(n);
        return { values, vectors };
      }
      
      // For general matrices, return approximation
      const trace = rMatrixFunctions.TRACE(x);
      const det = rMatrixFunctions.DETERMINANT(x);
      
      if (n === 2) {
        const discriminant = trace * trace - 4 * det;
        if (discriminant >= 0) {
          const sqrt_disc = Math.sqrt(discriminant);
          const val1 = (trace + sqrt_disc) / 2;
          const val2 = (trace - sqrt_disc) / 2;
          return { 
            values: [val1, val2], 
            vectors: [[1, 0], [0, 1]] // Simplified
          };
        }
      }
      
      return { values: [trace], vectors: [[1]] };
    } catch (e) {
      return { values: [], vectors: [] };
    }
  },

  // Row/Column Operations
  'ROWSUMS': (x) => {
    try {
      if (!Array.isArray(x)) return [parseFloat(x) || 0];
      if (!Array.isArray(x[0])) return x.map(val => parseFloat(val) || 0);
      
      return x.map(row => {
        return row.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
      });
    } catch (e) {
      return [];
    }
  },

  'COLSUMS': (x) => {
    try {
      if (!Array.isArray(x)) return [parseFloat(x) || 0];
      if (!Array.isArray(x[0])) return [x.reduce((sum, val) => sum + (parseFloat(val) || 0), 0)];
      
      const cols = x[0].length;
      const sums = [];
      for (let j = 0; j < cols; j++) {
        let sum = 0;
        for (let i = 0; i < x.length; i++) {
          sum += parseFloat(x[i][j]) || 0;
        }
        sums.push(sum);
      }
      return sums;
    } catch (e) {
      return [];
    }
  },

  'ROWMEANS': (x) => {
    try {
      const sums = rMatrixFunctions.ROWSUMS(x);
      if (!Array.isArray(x) || !Array.isArray(x[0])) return sums;
      const ncols = x[0].length;
      return sums.map(sum => ncols > 0 ? sum / ncols : 0);
    } catch (e) {
      return [];
    }
  },

  'COLMEANS': (x) => {
    try {
      const sums = rMatrixFunctions.COLSUMS(x);
      if (!Array.isArray(x)) return sums;
      const nrows = x.length;
      return sums.map(sum => nrows > 0 ? sum / nrows : 0);
    } catch (e) {
      return [];
    }
  },

  // Matrix Binding
  'RBIND': (...matrices) => {
    try {
      if (matrices.length === 0) return [];
      
      const result = [];
      for (let matrix of matrices) {
        if (!Array.isArray(matrix)) {
          result.push([matrix]);
        } else if (!Array.isArray(matrix[0])) {
          result.push(matrix);
        } else {
          for (let row of matrix) {
            result.push([...row]);
          }
        }
      }
      return result;
    } catch (e) {
      return [];
    }
  },

  'CBIND': (...matrices) => {
    try {
      if (matrices.length === 0) return [];
      
      // Convert all inputs to matrix format
      const mats = matrices.map(matrix => {
        if (!Array.isArray(matrix)) {
          return [[matrix]];
        } else if (!Array.isArray(matrix[0])) {
          return matrix.map(val => [val]);
        } else {
          return matrix;
        }
      });
      
      const maxRows = Math.max(...mats.map(m => m.length));
      const result = [];
      
      for (let i = 0; i < maxRows; i++) {
        const row = [];
        for (let mat of mats) {
          const matRow = mat[i % mat.length] || [];
          for (let val of matRow) {
            row.push(val);
          }
        }
        result.push(row);
      }
      
      return result;
    } catch (e) {
      return [];
    }
  },

  // Vector Operations
  'OUTER': (x, y, fun = '*') => {
    try {
      const xVals = Array.isArray(x) ? x : [x];
      const yVals = Array.isArray(y) ? y : [y];
      
      const result = [];
      for (let i = 0; i < xVals.length; i++) {
        const row = [];
        for (let j = 0; j < yVals.length; j++) {
          const xVal = parseFloat(xVals[i]) || 0;
          const yVal = parseFloat(yVals[j]) || 0;
          
          let value;
          switch (String(fun)) {
            case '*':
              value = xVal * yVal;
              break;
            case '+':
              value = xVal + yVal;
              break;
            case '-':
              value = xVal - yVal;
              break;
            case '/':
              value = yVal !== 0 ? xVal / yVal : Infinity;
              break;
            case '^':
            case '**':
              value = Math.pow(xVal, yVal);
              break;
            default:
              value = xVal * yVal;
          }
          row.push(value);
        }
        result.push(row);
      }
      
      return result;
    } catch (e) {
      return [];
    }
  },

  'KRONECKER': (a, b) => {
    try {
      if (!Array.isArray(a) || !Array.isArray(b)) return [];
      
      const matA = Array.isArray(a[0]) ? a : [a]; // Convert vector to row matrix  
      const matB = Array.isArray(b[0]) ? b : [b]; // Convert vector to row matrix
      
      const aRows = matA.length;
      const aCols = matA[0].length;
      const bRows = matB.length;
      const bCols = matB[0].length;
      
      const result = [];
      
      for (let i = 0; i < aRows; i++) {
        for (let k = 0; k < bRows; k++) {
          const row = [];
          for (let j = 0; j < aCols; j++) {
            for (let l = 0; l < bCols; l++) {
              const aVal = parseFloat(matA[i][j]) || 0;
              const bVal = parseFloat(matB[k][l]) || 0;
              row.push(aVal * bVal);
            }
          }
          result.push(row);
        }
      }
      
      return result;
    } catch (e) {
      return [];
    }
  },

  // Matrix Utilities
  'IS_MATRIX': (x) => {
    try {
      return Array.isArray(x) && x.length > 0 && Array.isArray(x[0]);
    } catch (e) {
      return false;
    }
  },

  'AS_MATRIX': (x) => {
    try {
      if (!Array.isArray(x)) return [[x]];
      if (Array.isArray(x[0])) return x; // Already a matrix
      return x.map(val => [val]); // Convert vector to column matrix
    } catch (e) {
      return [];
    }
  },

  'FLATTEN': (x) => {
    try {
      if (!Array.isArray(x)) return [x];
      if (!Array.isArray(x[0])) return x;
      
      const result = [];
      for (let row of x) {
        for (let val of row) {
          result.push(val);
        }
      }
      return result;
    } catch (e) {
      return [];
    }
  },

  'RESHAPE': (x, dims) => {
    try {
      const values = rMatrixFunctions.FLATTEN(x);
      const dimensions = Array.isArray(dims) ? dims : [dims];
      
      if (dimensions.length === 1) {
        return values.slice(0, dimensions[0]);
      }
      if (dimensions.length === 2) {
        return rMatrixFunctions.MATRIX(values, dimensions[0], dimensions[1]);
      }
      
      return values;
    } catch (e) {
      return [];
    }
  },

  // Special Matrices
  'ZEROS': (nrow, ncol = null) => {
    try {
      const rows = Math.max(1, parseInt(nrow) || 1);
      const cols = ncol !== null ? Math.max(1, parseInt(ncol) || 1) : rows;
      
      const matrix = [];
      for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
          row.push(0);
        }
        matrix.push(row);
      }
      return matrix;
    } catch (e) {
      return [];
    }
  },

  'ONES': (nrow, ncol = null) => {
    try {
      const rows = Math.max(1, parseInt(nrow) || 1);
      const cols = ncol !== null ? Math.max(1, parseInt(ncol) || 1) : rows;
      
      const matrix = [];
      for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
          row.push(1);
        }
        matrix.push(row);
      }
      return matrix;
    } catch (e) {
      return [];
    }
  },

  'EYE': (n) => {
    return rMatrixFunctions.DIAG(n);
  }
};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { rMatrixFunctions };
} else if (typeof window !== 'undefined') {
  window.rMatrixFunctions = rMatrixFunctions;
}