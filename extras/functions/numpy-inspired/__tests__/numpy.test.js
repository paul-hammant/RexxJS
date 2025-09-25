const np = require('../numpy');

describe('numpy-inspired consolidated module (JS tests)', () => {
  test('creation helpers: zeros, ones, full, eye', () => {
    expect(np.zeros(3)).toEqual([0,0,0]);
    expect(np.ones([2,2])).toEqual([[1,1],[1,1]]);
    expect(np.full([2,1,2], 7)).toEqual([[[7,7]], [[7,7]]]);
    expect(np.eye(3)).toEqual([[1,0,0],[0,1,0],[0,0,1]]);
  });

  test('array/asarray deep copy behavior', () => {
    const a = [1, [2,3]];
    const b = np.array(a);
    expect(b).toEqual(a);
    b[1][0] = 99;
    expect(a[1][0]).toBe(2); // ensure deep copy
  });

  test('arange and linspace', () => {
    expect(np.arange(5)).toEqual([0,1,2,3,4]);
    expect(np.arange(1,5)).toEqual([1,2,3,4]);
    expect(np.arange(5,1,-2)).toEqual([5,3]);
    expect(np.linspace(0, 1, 5)).toEqual([0,0.25,0.5,0.75,1]);
  });

  test('reshape, ravel, flatten, transpose (2D)', () => {
    const r = np.reshape([1,2,3,4], [2,2]);
    expect(r).toEqual([[1,2],[3,4]]);
    expect(np.ravel([[1,2],[3,4]])).toEqual([1,2,3,4]);
    const a = [[1,2,3],[4,5,6]];
    expect(np.transpose(a)).toEqual([[1,4],[2,5],[3,6]]);
  });

  test('concatenate and stacking', () => {
    expect(np.concatenate([[1,2],[3]])).toEqual([1,2,3]);
    const a = [[1,2],[3,4]];
    const b = [[5,6],[7,8]];
    expect(np.concatenate([a,b])).toEqual([[1,2],[3,4],[5,6],[7,8]]);
    expect(np.concatenate([a,b], 1)).toEqual([[1,2,5,6],[3,4,7,8]]);
    expect(np.vstack([ [1,2], [3,4] ])).toEqual([[1,2],[3,4]]);
    expect(np.hstack([[1,2],[3,4]])).toEqual([1,2,3,4]);
  });

  test('stats: sum/mean/median/percentile/std', () => {
    expect(np.mean([1,2,3])).toBeCloseTo(2);
    expect(np.amin([5,1,3])).toBe(1);
    expect(np.amax([5,1,3])).toBe(5);
    expect(np.median([1,3,2,4])).toBe(2.5);
    expect(np.percentile([0,1,2,3,4], 50)).toBe(2);
    const s = np.std([1,2,3]);
    expect(s).toBeCloseTo(Math.sqrt(2/3), 6);
  });

  test('random: seed reproducibility and normal size', () => {
    np.seed(12345);
    const a = np.rand(5);
    np.seed(12345);
    const b = np.rand(5);
    expect(a).toEqual(b);
    np.seed(7);
    const x = np.normal(0, 1, 3);
    expect(x.length).toBe(3);
  });

  test('linalg: dot, outer, matmul', () => {
    expect(np.dot([1,2,3],[4,5,6])).toBe(32);
    expect(np.outer([1,2],[3,4])).toEqual([[3,4],[6,8]]);
    const A = [[1,2,3],[4,5,6]];
    const B = [[7,8],[9,10],[11,12]];
    expect(np.matmul(A,B)).toEqual([[58,64],[139,154]]);
  });

  describe('New numpy functions', () => {
    test('unique: should return unique values from array', () => {
      expect(np.unique([1, 2, 2, 3, 3, 3, 4])).toEqual([1, 2, 3, 4]);
      expect(np.unique(['b', 'a', 'c', 'a', 'b'])).toEqual(['a', 'b', 'c']);
      expect(np.unique([])).toEqual([]);
    });

    test('unique: should return unique values with counts', () => {
      const result = np.unique([1, 2, 2, 3, 3, 3], true);
      expect(result.values).toEqual([1, 2, 3]);
      expect(result.counts).toEqual([1, 2, 3]);
    });

    test('sort: should sort 1D arrays', () => {
      expect(np.sort([3, 1, 4, 1, 5])).toEqual([1, 1, 3, 4, 5]);
      expect(np.sort([5, 4, 3, 2, 1])).toEqual([1, 2, 3, 4, 5]);
      expect(np.sort([])).toEqual([]);
    });

    test('sort: should sort 2D arrays along axis', () => {
      const matrix = [[3, 1], [1, 4], [4, 2]];
      expect(np.sort(matrix, 1)).toEqual([[1, 3], [1, 4], [2, 4]]);
      expect(np.sort(matrix, 0)).toEqual([[1, 1], [3, 2], [4, 4]]);
    });

    test('argsort: should return sort indices for 1D arrays', () => {
      expect(np.argsort([3, 1, 4, 1, 5])).toEqual([1, 3, 0, 2, 4]);
      expect(np.argsort([10, 20, 5])).toEqual([2, 0, 1]);
    });

    test('argsort: should return sort indices for 2D arrays', () => {
      const matrix = [[3, 1], [2, 4]];
      expect(np.argsort(matrix, 1)).toEqual([[1, 0], [0, 1]]);
    });

    test('where: should return indices where condition is true', () => {
      expect(np.where([true, false, true, false, true])).toEqual([0, 2, 4]);
      expect(np.where([false, false, false])).toEqual([]);
      expect(np.where([true, true, true])).toEqual([0, 1, 2]);
    });

    test('where: should select values based on condition', () => {
      const condition = [true, false, true, false];
      const x = [10, 20, 30, 40];
      const y = [100, 200, 300, 400];
      expect(np.where(condition, x, y)).toEqual([10, 200, 30, 400]);
    });

    test('clip: should clip values to specified range', () => {
      expect(np.clip([1, 5, 10, 15, 20], 5, 15)).toEqual([5, 5, 10, 15, 15]);
      expect(np.clip([1, 10, 20], 5, null)).toEqual([5, 10, 20]);
      expect(np.clip([1, 10, 20], null, 15)).toEqual([1, 10, 15]);
    });

    test('clip: should clip 2D arrays', () => {
      const matrix = [[1, 10], [5, 20]];
      expect(np.clip(matrix, 3, 12)).toEqual([[3, 10], [5, 12]]);
    });

    test('convolve: should perform full convolution', () => {
      const result = np.convolve([1, 2, 3], [0, 1, 0.5], 'full');
      expect(result).toEqual([0, 1, 2.5, 4, 1.5]);
    });

    test('convolve: should perform same convolution', () => {
      const result = np.convolve([1, 2, 3, 4], [1, 1], 'same');
      expect(result.length).toBe(4);
      expect(result).toEqual([1, 3, 5, 7]);
    });

    test('convolve: should perform valid convolution', () => {
      const result = np.convolve([1, 2, 3, 4, 5], [1, 1, 1], 'valid');
      expect(result.length).toBe(3);
      expect(result).toEqual([6, 9, 12]);
    });

    test('error handling: clip with no bounds', () => {
      expect(() => np.clip([1, 2, 3], null, null)).toThrow();
    });

    test('error handling: where with invalid parameters', () => {
      expect(() => np.where([true, false], [1, 2])).toThrow();
    });

    test('error handling: convolve with invalid mode', () => {
      expect(() => np.convolve([1, 2], [1], 'invalid')).toThrow();
    });

    test('integration: unique with other functions', () => {
      const data = [1, 1, 2, 2, 2, 3, 3, 3, 3];
      const unique_result = np.unique(data, true);
      expect(np.sum(unique_result.counts)).toBe(data.length);
      expect(np.sort(unique_result.values)).toEqual([1, 2, 3]);
    });

    test('integration: clip with statistical functions', () => {
      const data = [1, 5, 10, 15, 20, 25];
      const clipped = np.clip(data, 5, 20);
      expect(np.amin(clipped)).toBe(5);
      expect(np.amax(clipped)).toBe(20);
      expect(np.mean(clipped)).toBeCloseTo((5 + 5 + 10 + 15 + 20 + 20) / 6);
    });
  });
});