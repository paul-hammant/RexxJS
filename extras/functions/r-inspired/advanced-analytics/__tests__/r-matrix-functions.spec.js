/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const { rMatrixFunctions } = require('./r-matrix-functions');

describe('R Matrix & Linear Algebra Functions', () => {
  // Matrix Creation Functions
  describe('MATRIX', () => {
    test('should create matrix from data', () => {
      const result = rMatrixFunctions.MATRIX([1, 2, 3, 4], 2, 2);
      expect(result).toEqual([[1, 3], [2, 4]]); // Column-wise by default
    });

    test('should create matrix by rows', () => {
      const result = rMatrixFunctions.MATRIX([1, 2, 3, 4], 2, 2, true);
      expect(result).toEqual([[1, 2], [3, 4]]);
    });

    test('should handle single dimension', () => {
      const result1 = rMatrixFunctions.MATRIX([1, 2, 3, 4], 2);
      expect(result1).toEqual([[1, 3], [2, 4]]);
      
      const result2 = rMatrixFunctions.MATRIX([1, 2, 3, 4], null, 2);
      expect(result2).toEqual([[1, 3], [2, 4]]);
    });

    test('should recycle data', () => {
      const result = rMatrixFunctions.MATRIX([1, 2], 3, 2);
      expect(result).toEqual([[1, 2], [2, 1], [1, 2]]);
    });

    test('should handle single value', () => {
      const result = rMatrixFunctions.MATRIX(5, 2, 2);
      expect(result).toEqual([[5, 5], [5, 5]]);
    });

    test('should handle default dimensions', () => {
      const result = rMatrixFunctions.MATRIX([1, 2, 3]);
      expect(result).toEqual([[1, 2, 3]]);
    });
  });

  describe('ARRAY', () => {
    test('should create array with specified dimensions', () => {
      const result = rMatrixFunctions.ARRAY([1, 2, 3, 4], [2, 2]);
      expect(result).toEqual([[1, 3], [2, 4]]);
    });

    test('should handle single dimension', () => {
      const result = rMatrixFunctions.ARRAY([1, 2, 3, 4, 5], [3]);
      expect(result).toEqual([1, 2, 3]);
    });

    test('should handle empty dimensions', () => {
      const result = rMatrixFunctions.ARRAY([1, 2, 3], []);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('DIAG', () => {
    test('should create identity matrix from number', () => {
      const result = rMatrixFunctions.DIAG(3);
      expect(result).toEqual([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
      ]);
    });

    test('should create diagonal matrix from vector', () => {
      const result = rMatrixFunctions.DIAG([1, 2, 3]);
      expect(result).toEqual([
        [1, 0, 0],
        [0, 2, 0],
        [0, 0, 3]
      ]);
    });

    test('should extract diagonal from matrix', () => {
      const matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
      const result = rMatrixFunctions.DIAG(matrix);
      expect(result).toEqual([1, 5, 9]);
    });

    test('should create rectangular diagonal matrix', () => {
      const result = rMatrixFunctions.DIAG(5, 2, 3);
      expect(result).toEqual([
        [5, 0, 0],
        [0, 5, 0]
      ]);
    });

    test('should handle non-square matrix extraction', () => {
      const matrix = [[1, 2, 3, 4], [5, 6, 7, 8]];
      const result = rMatrixFunctions.DIAG(matrix);
      expect(result).toEqual([1, 6]);
    });
  });

  // Matrix Dimensions
  describe('DIM', () => {
    test('should return matrix dimensions', () => {
      const matrix = [[1, 2, 3], [4, 5, 6]];
      expect(rMatrixFunctions.DIM(matrix)).toEqual([2, 3]);
    });

    test('should return vector dimensions', () => {
      expect(rMatrixFunctions.DIM([1, 2, 3])).toEqual([3]);
    });

    test('should return null for scalar', () => {
      expect(rMatrixFunctions.DIM(5)).toBe(null);
    });

    test('should handle empty array', () => {
      expect(rMatrixFunctions.DIM([])).toEqual([0, 0]);
    });
  });

  describe('NROW and NCOL', () => {
    test('should return number of rows', () => {
      const matrix = [[1, 2], [3, 4], [5, 6]];
      expect(rMatrixFunctions.NROW(matrix)).toBe(3);
      expect(rMatrixFunctions.NROW([1, 2, 3])).toBe(3);
      expect(rMatrixFunctions.NROW(5)).toBe(1);
    });

    test('should return number of columns', () => {
      const matrix = [[1, 2, 3], [4, 5, 6]];
      expect(rMatrixFunctions.NCOL(matrix)).toBe(3);
      expect(rMatrixFunctions.NCOL([1, 2, 3])).toBe(1);
      expect(rMatrixFunctions.NCOL(5)).toBe(1);
    });

    test('should handle empty arrays', () => {
      expect(rMatrixFunctions.NROW([])).toBe(0);
      expect(rMatrixFunctions.NCOL([])).toBe(0);
    });
  });

  // Matrix Operations
  describe('T (TRANSPOSE)', () => {
    test('should transpose matrix', () => {
      const matrix = [[1, 2, 3], [4, 5, 6]];
      const result = rMatrixFunctions.T(matrix);
      expect(result).toEqual([[1, 4], [2, 5], [3, 6]]);
    });

    test('should transpose vector to column matrix', () => {
      const result = rMatrixFunctions.T([1, 2, 3]);
      expect(result).toEqual([[1], [2], [3]]);
    });

    test('should handle single value', () => {
      expect(rMatrixFunctions.T(5)).toBe(5);
    });

    test('should handle empty matrix', () => {
      expect(rMatrixFunctions.T([])).toEqual([]);
    });

    test('should handle square matrix', () => {
      const matrix = [[1, 2], [3, 4]];
      const result = rMatrixFunctions.T(matrix);
      expect(result).toEqual([[1, 3], [2, 4]]);
    });

    test('TRANSPOSE should work the same as T', () => {
      const matrix = [[1, 2], [3, 4]];
      expect(rMatrixFunctions.TRANSPOSE(matrix)).toEqual(rMatrixFunctions.T(matrix));
    });
  });

  describe('MATMULT', () => {
    test('should multiply compatible matrices', () => {
      const a = [[1, 2], [3, 4]];
      const b = [[5, 6], [7, 8]];
      const result = rMatrixFunctions.MATMULT(a, b);
      expect(result).toEqual([[19, 22], [43, 50]]);
    });

    test('should handle matrix-vector multiplication', () => {
      const a = [[1, 2], [3, 4]];
      const b = [5, 6];
      const result = rMatrixFunctions.MATMULT(a, b);
      expect(result).toEqual([[17], [39]]);
    });

    test('should handle vector-matrix multiplication', () => {
      const a = [1, 2];
      const b = [[3, 4], [5, 6]];
      const result = rMatrixFunctions.MATMULT(a, b);
      expect(result).toEqual([[13, 16]]);
    });

    test('should handle identity matrix', () => {
      const a = [[1, 2], [3, 4]];
      const identity = rMatrixFunctions.DIAG(2);
      const result = rMatrixFunctions.MATMULT(a, identity);
      expect(result).toEqual(a);
    });

    test('should return empty for incompatible matrices', () => {
      const a = [[1, 2, 3]];
      const b = [[1, 2], [3, 4]];
      const result = rMatrixFunctions.MATMULT(a, b);
      expect(result).toEqual([]);
    });
  });

  describe('CROSSPROD', () => {
    test('should compute t(x) %*% x', () => {
      const x = [[1, 2], [3, 4], [5, 6]];
      const result = rMatrixFunctions.CROSSPROD(x);
      const expected = rMatrixFunctions.MATMULT(rMatrixFunctions.T(x), x);
      expect(result).toEqual(expected);
      expect(result).toEqual([[35, 44], [44, 56]]);
    });

    test('should compute t(x) %*% y', () => {
      const x = [[1, 2], [3, 4]];
      const y = [[5, 6], [7, 8]];
      const result = rMatrixFunctions.CROSSPROD(x, y);
      const expected = rMatrixFunctions.MATMULT(rMatrixFunctions.T(x), y);
      expect(result).toEqual(expected);
    });
  });

  describe('TCROSSPROD', () => {
    test('should compute x %*% t(x)', () => {
      const x = [[1, 2, 3], [4, 5, 6]];
      const result = rMatrixFunctions.TCROSSPROD(x);
      const expected = rMatrixFunctions.MATMULT(x, rMatrixFunctions.T(x));
      expect(result).toEqual(expected);
      expect(result).toEqual([[14, 32], [32, 77]]);
    });

    test('should compute x %*% t(y)', () => {
      const x = [[1, 2], [3, 4]];
      const y = [[5, 6], [7, 8]];
      const result = rMatrixFunctions.TCROSSPROD(x, y);
      const expected = rMatrixFunctions.MATMULT(x, rMatrixFunctions.T(y));
      expect(result).toEqual(expected);
    });
  });

  // Matrix Properties
  describe('DETERMINANT', () => {
    test('should compute determinant of 2x2 matrix', () => {
      const matrix = [[1, 2], [3, 4]];
      const result = rMatrixFunctions.DETERMINANT(matrix);
      expect(result).toBe(-2); // 1*4 - 2*3 = -2
    });

    test('should compute determinant of 3x3 matrix', () => {
      const matrix = [[1, 0, 2], [3, 1, 0], [1, 2, 1]];
      const result = rMatrixFunctions.DETERMINANT(matrix);
      expect(result).toBe(11); // 1*(1*1 - 0*2) - 0 + 2*(3*2 - 1*1) = 1 + 10 = 11
    });

    test('should handle 1x1 matrix', () => {
      const matrix = [[5]];
      expect(rMatrixFunctions.DETERMINANT(matrix)).toBe(5);
    });

    test('should handle identity matrix', () => {
      const identity = rMatrixFunctions.DIAG(3);
      expect(rMatrixFunctions.DETERMINANT(identity)).toBe(1);
    });

    test('should return 0 for non-square matrix', () => {
      const matrix = [[1, 2, 3], [4, 5, 6]];
      expect(rMatrixFunctions.DETERMINANT(matrix)).toBe(0);
    });

    test('DET should work the same as DETERMINANT', () => {
      const matrix = [[1, 2], [3, 4]];
      expect(rMatrixFunctions.DET(matrix)).toBe(rMatrixFunctions.DETERMINANT(matrix));
    });
  });

  describe('TRACE', () => {
    test('should compute trace of square matrix', () => {
      const matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
      const result = rMatrixFunctions.TRACE(matrix);
      expect(result).toBe(15); // 1 + 5 + 9
    });

    test('should handle rectangular matrix', () => {
      const matrix = [[1, 2, 3], [4, 5, 6]];
      const result = rMatrixFunctions.TRACE(matrix);
      expect(result).toBe(6); // 1 + 5
    });

    test('should handle 1x1 matrix', () => {
      const matrix = [[7]];
      expect(rMatrixFunctions.TRACE(matrix)).toBe(7);
    });

    test('should handle identity matrix', () => {
      const identity = rMatrixFunctions.DIAG(4);
      expect(rMatrixFunctions.TRACE(identity)).toBe(4);
    });
  });

  describe('EIGEN', () => {
    test('should compute eigenvalues for diagonal matrix', () => {
      const diag = rMatrixFunctions.DIAG([2, 3, 1]);
      const result = rMatrixFunctions.EIGEN(diag);
      expect(result.values).toEqual([2, 3, 1]);
      expect(result.vectors).toEqual(rMatrixFunctions.DIAG(3));
    });

    test('should handle 2x2 matrix', () => {
      const matrix = [[3, 1], [0, 2]]; // Upper triangular
      const result = rMatrixFunctions.EIGEN(matrix);
      expect(result.values).toHaveLength(2);
      expect(result.values.every(val => typeof val === 'number')).toBe(true);
    });

    test('should handle 1x1 matrix', () => {
      const matrix = [[5]];
      const result = rMatrixFunctions.EIGEN(matrix);
      expect(result.values).toEqual([5]);
    });

    test('should handle identity matrix', () => {
      const identity = rMatrixFunctions.DIAG(2);
      const result = rMatrixFunctions.EIGEN(identity);
      expect(result.values).toEqual([1, 1]);
    });
  });

  // Row/Column Operations
  describe('ROWSUMS', () => {
    test('should compute row sums', () => {
      const matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
      const result = rMatrixFunctions.ROWSUMS(matrix);
      expect(result).toEqual([6, 15, 24]);
    });

    test('should handle vector', () => {
      const result = rMatrixFunctions.ROWSUMS([1, 2, 3]);
      expect(result).toEqual([1, 2, 3]);
    });

    test('should handle single value', () => {
      expect(rMatrixFunctions.ROWSUMS(5)).toEqual([5]);
    });

    test('should handle matrix with one row', () => {
      const matrix = [[1, 2, 3, 4]];
      expect(rMatrixFunctions.ROWSUMS(matrix)).toEqual([10]);
    });
  });

  describe('COLSUMS', () => {
    test('should compute column sums', () => {
      const matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
      const result = rMatrixFunctions.COLSUMS(matrix);
      expect(result).toEqual([12, 15, 18]);
    });

    test('should handle vector', () => {
      const result = rMatrixFunctions.COLSUMS([1, 2, 3]);
      expect(result).toEqual([6]);
    });

    test('should handle single value', () => {
      expect(rMatrixFunctions.COLSUMS(5)).toEqual([5]);
    });

    test('should handle matrix with one column', () => {
      const matrix = [[1], [2], [3]];
      expect(rMatrixFunctions.COLSUMS(matrix)).toEqual([6]);
    });
  });

  describe('ROWMEANS and COLMEANS', () => {
    test('should compute row means', () => {
      const matrix = [[2, 4, 6], [1, 3, 5]];
      const result = rMatrixFunctions.ROWMEANS(matrix);
      expect(result).toEqual([4, 3]);
    });

    test('should compute column means', () => {
      const matrix = [[1, 2], [3, 4], [5, 6]];
      const result = rMatrixFunctions.COLMEANS(matrix);
      expect(result).toEqual([3, 4]);
    });

    test('should handle single row/column', () => {
      expect(rMatrixFunctions.ROWMEANS([[2, 4, 6]])).toEqual([4]);
      expect(rMatrixFunctions.COLMEANS([[2], [4], [6]])).toEqual([4]);
    });
  });

  // Matrix Binding
  describe('RBIND', () => {
    test('should bind matrices by rows', () => {
      const a = [[1, 2], [3, 4]];
      const b = [[5, 6]];
      const result = rMatrixFunctions.RBIND(a, b);
      expect(result).toEqual([[1, 2], [3, 4], [5, 6]]);
    });

    test('should handle vectors', () => {
      const result = rMatrixFunctions.RBIND([1, 2, 3], [4, 5, 6]);
      expect(result).toEqual([[1, 2, 3], [4, 5, 6]]);
    });

    test('should handle scalars', () => {
      const result = rMatrixFunctions.RBIND(1, 2, 3);
      expect(result).toEqual([[1], [2], [3]]);
    });

    test('should handle mixed types', () => {
      const result = rMatrixFunctions.RBIND([[1, 2]], [3, 4], 5);
      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });
  });

  describe('CBIND', () => {
    test('should bind matrices by columns', () => {
      const a = [[1], [2], [3]];
      const b = [[4], [5], [6]];
      const result = rMatrixFunctions.CBIND(a, b);
      expect(result).toEqual([[1, 4], [2, 5], [3, 6]]);
    });

    test('should handle vectors', () => {
      const result = rMatrixFunctions.CBIND([1, 2, 3], [4, 5, 6]);
      expect(result).toEqual([[1, 4], [2, 5], [3, 6]]);
    });

    test('should handle scalars', () => {
      const result = rMatrixFunctions.CBIND(1, 2, 3);
      expect(result).toEqual([[1, 2, 3]]);
    });

    test('should handle different lengths with recycling', () => {
      const result = rMatrixFunctions.CBIND([1, 2], [3, 4, 5, 6]);
      expect(result).toEqual([[1, 3], [2, 4], [1, 5], [2, 6]]);
    });
  });

  // Vector Operations
  describe('OUTER', () => {
    test('should compute outer product', () => {
      const result = rMatrixFunctions.OUTER([1, 2], [3, 4]);
      expect(result).toEqual([[3, 4], [6, 8]]);
    });

    test('should handle different operations', () => {
      const add = rMatrixFunctions.OUTER([1, 2], [3, 4], '+');
      expect(add).toEqual([[4, 5], [5, 6]]);
      
      const sub = rMatrixFunctions.OUTER([5, 6], [1, 2], '-');
      expect(sub).toEqual([[4, 3], [5, 4]]);
      
      const div = rMatrixFunctions.OUTER([6, 8], [2, 3], '/');
      expect(div).toEqual([[3, 2], [4, 8/3]]);
    });

    test('should handle power operation', () => {
      const result = rMatrixFunctions.OUTER([2, 3], [2, 3], '^');
      expect(result).toEqual([[4, 8], [9, 27]]);
    });

    test('should handle single values', () => {
      const result = rMatrixFunctions.OUTER(2, [3, 4]);
      expect(result).toEqual([[6, 8]]);
    });
  });

  describe('KRONECKER', () => {
    test('should compute Kronecker product', () => {
      const a = [[1, 2], [3, 4]];
      const b = [[5, 6], [7, 8]];
      const result = rMatrixFunctions.KRONECKER(a, b);
      expect(result).toEqual([
        [5, 6, 10, 12],
        [7, 8, 14, 16],
        [15, 18, 20, 24],
        [21, 24, 28, 32]
      ]);
    });

    test('should handle vectors', () => {
      const result = rMatrixFunctions.KRONECKER([1, 2], [3, 4]);
      expect(result).toEqual([[3, 4, 6, 8]]); // Row vectors: [1,2] ⊗ [3,4] = [1*3, 1*4, 2*3, 2*4]
    });

    test('should handle different sizes', () => {
      const a = [[1, 2]];
      const b = [[3], [4]];
      const result = rMatrixFunctions.KRONECKER(a, b);
      expect(result).toEqual([[3, 6], [4, 8]]);
    });
  });

  // Matrix Utilities
  describe('IS_MATRIX', () => {
    test('should identify matrices', () => {
      expect(rMatrixFunctions.IS_MATRIX([[1, 2], [3, 4]])).toBe(true);
      expect(rMatrixFunctions.IS_MATRIX([1, 2, 3])).toBe(false);
      expect(rMatrixFunctions.IS_MATRIX(5)).toBe(false);
      expect(rMatrixFunctions.IS_MATRIX([])).toBe(false);
    });
  });

  describe('AS_MATRIX', () => {
    test('should convert vector to column matrix', () => {
      const result = rMatrixFunctions.AS_MATRIX([1, 2, 3]);
      expect(result).toEqual([[1], [2], [3]]);
    });

    test('should convert scalar to 1x1 matrix', () => {
      const result = rMatrixFunctions.AS_MATRIX(5);
      expect(result).toEqual([[5]]);
    });

    test('should leave matrices unchanged', () => {
      const matrix = [[1, 2], [3, 4]];
      expect(rMatrixFunctions.AS_MATRIX(matrix)).toEqual(matrix);
    });
  });

  describe('FLATTEN', () => {
    test('should flatten matrix to vector', () => {
      const matrix = [[1, 2], [3, 4]];
      const result = rMatrixFunctions.FLATTEN(matrix);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    test('should leave vectors unchanged', () => {
      const vector = [1, 2, 3];
      expect(rMatrixFunctions.FLATTEN(vector)).toEqual(vector);
    });

    test('should handle single value', () => {
      expect(rMatrixFunctions.FLATTEN(5)).toEqual([5]);
    });
  });

  describe('RESHAPE', () => {
    test('should reshape vector to matrix', () => {
      const result = rMatrixFunctions.RESHAPE([1, 2, 3, 4], [2, 2]);
      expect(result).toEqual([[1, 3], [2, 4]]);
    });

    test('should handle single dimension', () => {
      const result = rMatrixFunctions.RESHAPE([1, 2, 3, 4, 5], 3);
      expect(result).toEqual([1, 2, 3]);
    });

    test('should flatten and reshape', () => {
      const matrix = [[1, 2], [3, 4]];
      const result = rMatrixFunctions.RESHAPE(matrix, [1, 4]);
      expect(result).toEqual([[1, 2, 3, 4]]);
    });
  });

  // Special Matrices
  describe('ZEROS', () => {
    test('should create zero matrix', () => {
      const result = rMatrixFunctions.ZEROS(2, 3);
      expect(result).toEqual([[0, 0, 0], [0, 0, 0]]);
    });

    test('should create square zero matrix', () => {
      const result = rMatrixFunctions.ZEROS(3);
      expect(result).toEqual([[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
    });
  });

  describe('ONES', () => {
    test('should create ones matrix', () => {
      const result = rMatrixFunctions.ONES(2, 3);
      expect(result).toEqual([[1, 1, 1], [1, 1, 1]]);
    });

    test('should create square ones matrix', () => {
      const result = rMatrixFunctions.ONES(2);
      expect(result).toEqual([[1, 1], [1, 1]]);
    });
  });

  describe('EYE', () => {
    test('should create identity matrix', () => {
      const result = rMatrixFunctions.EYE(3);
      expect(result).toEqual([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
      ]);
    });

    test('should be same as DIAG', () => {
      expect(rMatrixFunctions.EYE(4)).toEqual(rMatrixFunctions.DIAG(4));
    });
  });

  // R Compatibility Tests
  describe('R Compatibility', () => {
    test('matrix creation should match R behavior', () => {
      // R: matrix(1:4, nrow=2, ncol=2) -> column-wise filling
      const result = rMatrixFunctions.MATRIX([1, 2, 3, 4], 2, 2);
      expect(result).toEqual([[1, 3], [2, 4]]);
      
      // R: matrix(1:4, nrow=2, ncol=2, byrow=TRUE) -> row-wise filling  
      const byRow = rMatrixFunctions.MATRIX([1, 2, 3, 4], 2, 2, true);
      expect(byRow).toEqual([[1, 2], [3, 4]]);
    });

    test('transpose should match R t()', () => {
      const matrix = [[1, 2, 3], [4, 5, 6]];
      const result = rMatrixFunctions.T(matrix);
      expect(result).toEqual([[1, 4], [2, 5], [3, 6]]);
    });

    test('diag should match R diag()', () => {
      // R: diag(3) -> 3x3 identity
      expect(rMatrixFunctions.DIAG(3)).toEqual(rMatrixFunctions.EYE(3));
      
      // R: diag(c(1,2,3)) -> diagonal matrix
      expect(rMatrixFunctions.DIAG([1, 2, 3])).toEqual([
        [1, 0, 0], [0, 2, 0], [0, 0, 3]
      ]);
    });

    test('row/column operations should match R', () => {
      const matrix = [[1, 2], [3, 4]];
      expect(rMatrixFunctions.ROWSUMS(matrix)).toEqual([3, 7]);
      expect(rMatrixFunctions.COLSUMS(matrix)).toEqual([4, 6]);
      expect(rMatrixFunctions.ROWMEANS(matrix)).toEqual([1.5, 3.5]);
      expect(rMatrixFunctions.COLMEANS(matrix)).toEqual([2, 3]);
    });

    test('matrix multiplication should match R %*%', () => {
      const a = [[1, 2], [3, 4]];
      const b = [[5, 6], [7, 8]];
      const result = rMatrixFunctions.MATMULT(a, b);
      expect(result).toEqual([[19, 22], [43, 50]]);
    });
  });

  // Edge Cases and Error Handling
  describe('Error Handling', () => {
    test('should handle empty inputs', () => {
      expect(rMatrixFunctions.MATRIX([])).toEqual([]);
      expect(rMatrixFunctions.DIM([])).toEqual([0, 0]);
      expect(rMatrixFunctions.T([])).toEqual([]);
      expect(rMatrixFunctions.DETERMINANT([])).toBe(0);
    });

    test('should handle invalid dimensions', () => {
      expect(rMatrixFunctions.MATRIX([1, 2], 0, 2)).toEqual([[1, 2]]);
      expect(rMatrixFunctions.MATRIX([1, 2], -1, 2)).toEqual([[1, 2]]);
      expect(rMatrixFunctions.ZEROS(0)).toEqual([[0]]);
    });

    test('should handle non-numeric values gracefully', () => {
      const result = rMatrixFunctions.ROWSUMS([['a', 2], [3, 'b']]);
      expect(result).toEqual([2, 3]);
      
      const det = rMatrixFunctions.DETERMINANT([['x', 2], [3, 4]]);
      expect(det).toBe(-6); // 0*4 - 2*3 = -6
    });

    test('should handle single element operations', () => {
      expect(rMatrixFunctions.T([[5]])).toEqual([[5]]);
      expect(rMatrixFunctions.DETERMINANT([[7]])).toBe(7);
      expect(rMatrixFunctions.TRACE([[9]])).toBe(9);
    });

    test('should handle matrix multiplication edge cases', () => {
      // Incompatible dimensions
      expect(rMatrixFunctions.MATMULT([[1, 2]], [[1], [2], [3]])).toEqual([]);
      
      // Empty matrices
      expect(rMatrixFunctions.MATMULT([], [[1]])).toEqual([]);
    });
  });
});