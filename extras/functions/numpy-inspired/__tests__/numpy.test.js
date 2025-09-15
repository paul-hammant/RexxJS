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
});