const {
  zeros,
  ones,
  full,
  eye,
  identity,
  arange,
  linspace,
  shape,
  ravel,
  flatten,
  reshape,
  transpose,
  concatenate,
} = require('../numpy');

describe('numpy-inspired creation & manipulation utilities from consolidated module (pure JS)', () => {
  test('zeros 1-D and ND', () => {
    expect(zeros(3)).toEqual([0, 0, 0]);
    expect(zeros([2, 2])).toEqual([[0, 0], [0, 0]]);
    expect(zeros([2, 1, 3])).toEqual([[[0, 0, 0]], [[0, 0, 0]]]);
  });

  test('ones and full', () => {
    expect(ones(4)).toEqual([1, 1, 1, 1]);
    expect(ones([2, 2])).toEqual([[1, 1], [1, 1]]);
    expect(full([2, 3], 7)).toEqual([[7, 7, 7], [7, 7, 7]]);
  });

  test('eye and identity', () => {
    expect(eye(3)).toEqual([
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);
    expect(identity(2)).toEqual([
      [1, 0],
      [0, 1],
    ]);
  });

  test('arange positive step and negative step', () => {
    expect(arange(5)).toEqual([0, 1, 2, 3, 4]);
    expect(arange(1, 5, 2)).toEqual([1, 3]);
    expect(arange(5, 0, -1)).toEqual([5, 4, 3, 2, 1]);
  });

  test('linspace endpoint true/false', () => {
    expect(linspace(0, 1, 5)).toEqual([0, 0.25, 0.5, 0.75, 1]);
    expect(linspace(0, 1, 5, false)).toEqual([0, 0.2, 0.4, 0.6, 0.8]);
    expect(linspace(0, 1, 1)).toEqual([0]);
  });

  test('shape, ravel, reshape', () => {
    const a = [[1,2,3],[4,5,6]];
    expect(shape(a)).toEqual([2,3]);
    expect(ravel(a)).toEqual([1,2,3,4,5,6]);
    expect(flatten(a)).toEqual([1,2,3,4,5,6]);
    expect(reshape(a, [3,2])).toEqual([[1,2],[3,4],[5,6]]);
  });

  test('transpose 2D and axes permutation', () => {
    const a = [[1,2,3],[4,5,6]];
    expect(transpose(a)).toEqual([[1,4],[2,5],[3,6]]); // default reverse axes
    const b = [[[1,2],[3,4]],[[5,6],[7,8]]]; // shape [2,2,2]
    expect(shape(b)).toEqual([2,2,2]);
    // permute axes [1,0,2]
    expect(transpose(b, [1,0,2])).toEqual([[[1,2],[5,6]],[[3,4],[7,8]]]);
  });

  test('concatenate along axis 0 and axis 1', () => {
    const a = [[1,2],[3,4]];
    const b = [[5,6]];
    // axis 0
    expect(concatenate([a, b], 0)).toEqual([[1,2],[3,4],[5,6]]);
    // axis 1 (zip concatenation)
    const x = [[1],[2]];
    const y = [[3],[4]];
    expect(concatenate([x,y], 1)).toEqual([[1,3],[2,4]]);
  });
});