/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Tests for R-style data manipulation and reshaping functions
 * Tests mirror R-language behavior and edge cases
 */

const { rDataFunctions } = require('../r-data-functions.js');

describe('R-Style Data Manipulation Functions', () => {

  describe('Sequence Generation', () => {
    describe('SEQ', () => {
      test('should generate simple sequences', () => {
        expect(rDataFunctions.SEQ(1, 5)).toEqual([1, 2, 3, 4, 5]);
        expect(rDataFunctions.SEQ(0, 10, 2)).toEqual([0, 2, 4, 6, 8, 10]);
      });

      test('should handle decreasing sequences', () => {
        expect(rDataFunctions.SEQ(5, 1, -1)).toEqual([5, 4, 3, 2, 1]);
        expect(rDataFunctions.SEQ(10, 0, -2)).toEqual([10, 8, 6, 4, 2, 0]);
      });

      test('should handle length_out parameter', () => {
        expect(rDataFunctions.SEQ(0, 1, null, 5)).toEqual([0, 0.25, 0.5, 0.75, 1]);
        expect(rDataFunctions.SEQ(1, 3, null, 3)).toEqual([1, 2, 3]);
      });

      test('should handle edge cases', () => {
        expect(rDataFunctions.SEQ(1, 1)).toEqual([1]);
        expect(rDataFunctions.SEQ(0, 0, 1, 1)).toEqual([0]);
        expect(rDataFunctions.SEQ(0, 0, 1, 0)).toEqual([]);
      });

      test('should handle invalid inputs', () => {
        expect(rDataFunctions.SEQ(1, 5, 0)).toEqual([]); // step=0 returns empty
        expect(rDataFunctions.SEQ('a', 'b')).toEqual([]);
      });
    });

    describe('SEQ_LEN', () => {
      test('should generate sequences of specified length', () => {
        expect(rDataFunctions.SEQ_LEN(5)).toEqual([1, 2, 3, 4, 5]);
        expect(rDataFunctions.SEQ_LEN(1)).toEqual([1]);
      });

      test('should handle edge cases', () => {
        expect(rDataFunctions.SEQ_LEN(0)).toEqual([]);
        expect(rDataFunctions.SEQ_LEN(-1)).toEqual([]);
      });
    });

    describe('SEQ_ALONG', () => {
      test('should generate sequences matching input length', () => {
        expect(rDataFunctions.SEQ_ALONG([10, 20, 30])).toEqual([1, 2, 3]);
        expect(rDataFunctions.SEQ_ALONG(['a', 'b', 'c', 'd'])).toEqual([1, 2, 3, 4]);
      });

      test('should handle single values', () => {
        expect(rDataFunctions.SEQ_ALONG(5)).toEqual([1]);
        expect(rDataFunctions.SEQ_ALONG('test')).toEqual([1]);
      });

      test('should handle empty arrays', () => {
        expect(rDataFunctions.SEQ_ALONG([])).toEqual([]);
      });
    });

    describe('REP', () => {
      test('should replicate values', () => {
        expect(rDataFunctions.REP(1, 3)).toEqual([1, 1, 1]);
        expect(rDataFunctions.REP([1, 2], 2)).toEqual([1, 2, 1, 2]);
      });

      test('should handle each parameter', () => {
        expect(rDataFunctions.REP([1, 2], 1, null, 2)).toEqual([1, 1, 2, 2]);
        expect(rDataFunctions.REP([1, 2, 3], 1, null, 2)).toEqual([1, 1, 2, 2, 3, 3]);
      });

      test('should handle length_out parameter', () => {
        expect(rDataFunctions.REP([1, 2], 1, 5)).toEqual([1, 2, 1, 2, 1]);
        expect(rDataFunctions.REP([1, 2, 3], 1, 7)).toEqual([1, 2, 3, 1, 2, 3, 1]);
      });

      test('should handle combined parameters', () => {
        expect(rDataFunctions.REP([1, 2], 2, null, 2)).toEqual([1, 1, 2, 2, 1, 1, 2, 2]);
      });

      test('should handle edge cases', () => {
        expect(rDataFunctions.REP(1, 0)).toEqual([]);
        expect(rDataFunctions.REP([], 3)).toEqual([]);
      });
    });
  });

  describe('Index and Logical Operations', () => {
    describe('WHICH', () => {
      test('should find TRUE indices', () => {
        expect(rDataFunctions.WHICH([true, false, true, false])).toEqual([1, 3]);
        expect(rDataFunctions.WHICH([1, 0, 1, 0])).toEqual([1, 3]);
        expect(rDataFunctions.WHICH(['true', 'false', 'TRUE'])).toEqual([1, 3]);
      });

      test('should handle no matches', () => {
        expect(rDataFunctions.WHICH([false, false, false])).toEqual([]);
        expect(rDataFunctions.WHICH([0, 0, 0])).toEqual([]);
      });

      test('should handle single values', () => {
        expect(rDataFunctions.WHICH(true)).toEqual([1]);
        expect(rDataFunctions.WHICH(false)).toEqual([]);
      });

      test('should handle mixed types', () => {
        expect(rDataFunctions.WHICH([1, 'false', true, 0, '1'])).toEqual([1, 3, 5]);
      });
    });

    describe('WHICH_MAX', () => {
      test('should find index of maximum value', () => {
        expect(rDataFunctions.WHICH_MAX([1, 5, 3, 5, 2])).toBe(2);
        expect(rDataFunctions.WHICH_MAX([10, 20, 15])).toBe(2);
      });

      test('should handle negative numbers', () => {
        expect(rDataFunctions.WHICH_MAX([-3, -1, -5, -2])).toBe(2);
      });

      test('should handle single values', () => {
        expect(rDataFunctions.WHICH_MAX([42])).toBe(1);
        expect(rDataFunctions.WHICH_MAX(42)).toBe(1);
      });

      test('should handle invalid inputs', () => {
        expect(rDataFunctions.WHICH_MAX(['a', 'b', 'c'])).toBeNaN();
        expect(rDataFunctions.WHICH_MAX([])).toBeNaN();
      });
    });

    describe('WHICH_MIN', () => {
      test('should find index of minimum value', () => {
        expect(rDataFunctions.WHICH_MIN([5, 1, 3, 1, 2])).toBe(2);
        expect(rDataFunctions.WHICH_MIN([10, 20, 5])).toBe(3);
      });

      test('should handle negative numbers', () => {
        expect(rDataFunctions.WHICH_MIN([-3, -1, -5, -2])).toBe(3);
      });

      test('should handle single values', () => {
        expect(rDataFunctions.WHICH_MIN([42])).toBe(1);
      });
    });
  });

  describe('Sorting and Ordering', () => {
    describe('ORDER', () => {
      test('should return ordering indices', () => {
        expect(rDataFunctions.ORDER([3, 1, 4, 1, 5])).toEqual([2, 4, 1, 3, 5]);
        expect(rDataFunctions.ORDER([30, 10, 20])).toEqual([2, 3, 1]);
      });

      test('should handle decreasing order', () => {
        expect(rDataFunctions.ORDER([1, 3, 2], true)).toEqual([2, 3, 1]);
      });

      test('should handle strings', () => {
        expect(rDataFunctions.ORDER(['c', 'a', 'b'])).toEqual([2, 3, 1]);
      });

      test('should handle mixed types', () => {
        expect(rDataFunctions.ORDER([3, 'a', 1, 'b'])).toEqual([3, 1, 2, 4]);
      });

      test('should handle single values', () => {
        expect(rDataFunctions.ORDER([5])).toEqual([1]);
      });
    });

    describe('SORT', () => {
      test('should sort numeric arrays', () => {
        expect(rDataFunctions.SORT([3, 1, 4, 1, 5])).toEqual([1, 1, 3, 4, 5]);
        expect(rDataFunctions.SORT([3, 1, 4], true)).toEqual([4, 3, 1]);
      });

      test('should sort string arrays', () => {
        expect(rDataFunctions.SORT(['c', 'a', 'b'])).toEqual(['a', 'b', 'c']);
        expect(rDataFunctions.SORT(['c', 'a', 'b'], true)).toEqual(['c', 'b', 'a']);
      });

      test('should handle NA values', () => {
        expect(rDataFunctions.SORT([1, null, 3, undefined])).toEqual([1, 3, null, undefined]);
        expect(rDataFunctions.SORT([1, null, 3], false, false)).toEqual([null, 1, 3]);
      });

      test('should handle mixed types', () => {
        expect(rDataFunctions.SORT([3, 'a', 1, 'b'])).toEqual([1, 3, 'a', 'b']);
      });
    });

    describe('RANK', () => {
      test('should compute ranks', () => {
        expect(rDataFunctions.RANK([1, 3, 2, 1])).toEqual([1.5, 4, 3, 1.5]);
        expect(rDataFunctions.RANK([10, 20, 30])).toEqual([1, 2, 3]);
      });

      test('should handle ties methods', () => {
        expect(rDataFunctions.RANK([1, 2, 2, 3], 'min')).toEqual([1, 2, 2, 4]);
        expect(rDataFunctions.RANK([1, 2, 2, 3], 'max')).toEqual([1, 3, 3, 4]);
      });

      test('should handle NaN values', () => {
        expect(rDataFunctions.RANK([1, NaN, 3])).toEqual([1, NaN, 2]);
      });

      test('should handle single values', () => {
        expect(rDataFunctions.RANK([5])).toEqual([1]);
      });
    });
  });

  describe('Data Binning and Categorization', () => {
    describe('CUT', () => {
      test('should bin continuous data', () => {
        expect(rDataFunctions.CUT([1, 2, 3, 4, 5], [0, 2, 4, 6])).toEqual([
          '(0,2]', '(0,2]', '(2,4]', '(2,4]', '(4,6]'
        ]);
      });

      test('should handle custom labels', () => {
        const result = rDataFunctions.CUT([1, 3, 5], [0, 2, 4, 6], ['low', 'mid', 'high']);
        expect(result).toEqual(['low', 'mid', 'high']);
      });

      test('should handle right parameter', () => {
        expect(rDataFunctions.CUT([2], [0, 2, 4], null, true)).toEqual(['(0,2]']);
        expect(rDataFunctions.CUT([2], [0, 2, 4], null, false)).toEqual(['[2,4)']);
      });

      test('should handle include_lowest parameter', () => {
        expect(rDataFunctions.CUT([0], [0, 2, 4], null, true, true)).toEqual(['(0,2]']);
      });

      test('should handle values outside range', () => {
        expect(rDataFunctions.CUT([-1, 7], [0, 2, 4, 6])).toEqual([null, null]);
      });

      test('should handle invalid inputs', () => {
        expect(rDataFunctions.CUT([1, 2, 3], [2])).toEqual([]);
        expect(rDataFunctions.CUT(['a', 'b'], [0, 2, 4])).toEqual([null, null]);
      });
    });

    describe('FINDINTERVAL', () => {
      test('should find intervals', () => {
        expect(rDataFunctions.FINDINTERVAL([1, 2, 3], [1, 2, 3])).toEqual([1, 2, 3]);
        expect(rDataFunctions.FINDINTERVAL([0.5, 1.5, 2.5], [1, 2])).toEqual([0, 1, 2]);
      });

      test('should handle left_open parameter', () => {
        expect(rDataFunctions.FINDINTERVAL([1], [1], false, true)).toEqual([0]);
        expect(rDataFunctions.FINDINTERVAL([1], [1], false, false)).toEqual([1]);
      });

      test('should handle edge cases', () => {
        expect(rDataFunctions.FINDINTERVAL([], [1, 2, 3])).toEqual([]);
        expect(rDataFunctions.FINDINTERVAL([1, 2], [])).toEqual([0, 0]);
      });
    });
  });

  describe('Advanced Matching and Lookup', () => {
    describe('MATCH', () => {
      test('should find exact matches', () => {
        expect(rDataFunctions.MATCH(['a', 'b', 'c'], ['x', 'b', 'z', 'a'])).toEqual([4, 2, null]);
        expect(rDataFunctions.MATCH([1, 2, 3], [3, 1, 2])).toEqual([2, 3, 1]);
      });

      test('should handle custom nomatch', () => {
        expect(rDataFunctions.MATCH(['a', 'x'], ['b', 'c'], -1)).toEqual([-1, -1]);
      });

      test('should handle single values', () => {
        expect(rDataFunctions.MATCH('b', ['a', 'b', 'c'])).toEqual([2]);
        expect(rDataFunctions.MATCH(['a'], 'a')).toEqual([1]);
      });

      test('should handle no matches', () => {
        expect(rDataFunctions.MATCH(['x', 'y'], ['a', 'b'])).toEqual([null, null]);
      });
    });

    describe('PMATCH', () => {
      test('should find partial matches', () => {
        expect(rDataFunctions.PMATCH(['a', 'ab'], ['apple', 'about', 'banana'])).toEqual([1, 2]);
      });

      test('should prioritize exact matches', () => {
        expect(rDataFunctions.PMATCH(['a'], ['apple', 'a', 'about'])).toEqual([2]);
      });

      test('should handle ambiguous matches', () => {
        expect(rDataFunctions.PMATCH(['a'], ['apple', 'about'], null, false)).toEqual([null]);
        expect(rDataFunctions.PMATCH(['a'], ['apple', 'about'], null, true)).toEqual([1]);
      });

      test('should handle no matches', () => {
        expect(rDataFunctions.PMATCH(['x'], ['apple', 'about'])).toEqual([null]);
      });
    });
  });

  describe('Parallel Operations', () => {
    describe('PMAX', () => {
      test('should compute parallel maximum', () => {
        expect(rDataFunctions.PMAX([1, 2, 3], [3, 1, 2])).toEqual([3, 2, 3]);
        expect(rDataFunctions.PMAX([1, 5], [2, 3, 4])).toEqual([2, 5, 4]);
      });

      test('should handle single values', () => {
        expect(rDataFunctions.PMAX(5, [1, 2, 3])).toEqual([5, 5, 5]);
      });

      test('should handle different lengths', () => {
        expect(rDataFunctions.PMAX([1, 2], [10, 20, 30])).toEqual([10, 20, 30]);
      });

      test('should handle empty inputs', () => {
        expect(rDataFunctions.PMAX()).toEqual([]);
      });
    });

    describe('PMIN', () => {
      test('should compute parallel minimum', () => {
        expect(rDataFunctions.PMIN([1, 2, 3], [3, 1, 2])).toEqual([1, 1, 2]);
        expect(rDataFunctions.PMIN([5, 1], [2, 3, 4])).toEqual([2, 1, 4]);
      });

      test('should handle single values', () => {
        expect(rDataFunctions.PMIN(5, [1, 2, 3])).toEqual([1, 2, 3]);
      });

      test('should handle different lengths', () => {
        expect(rDataFunctions.PMIN([10, 20], [1, 2, 3])).toEqual([1, 2, 3]);
      });
    });
  });

  describe('Vector Operations', () => {
    describe('REV', () => {
      test('should reverse vectors', () => {
        expect(rDataFunctions.REV([1, 2, 3, 4, 5])).toEqual([5, 4, 3, 2, 1]);
        expect(rDataFunctions.REV(['a', 'b', 'c'])).toEqual(['c', 'b', 'a']);
      });

      test('should handle single values', () => {
        expect(rDataFunctions.REV([1])).toEqual([1]);
        expect(rDataFunctions.REV(5)).toEqual([5]);
      });

      test('should handle empty arrays', () => {
        expect(rDataFunctions.REV([])).toEqual([]);
      });
    });

    describe('HEAD', () => {
      test('should return first n elements', () => {
        expect(rDataFunctions.HEAD([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
        expect(rDataFunctions.HEAD([1, 2, 3, 4, 5], 3)).toEqual([1, 2, 3]);
      });

      test('should handle arrays shorter than n', () => {
        expect(rDataFunctions.HEAD([1, 2], 5)).toEqual([1, 2]);
      });

      test('should handle n = 0', () => {
        expect(rDataFunctions.HEAD([1, 2, 3], 0)).toEqual([]);
      });
    });

    describe('TAIL', () => {
      test('should return last n elements', () => {
        expect(rDataFunctions.TAIL([1, 2, 3, 4, 5], 3)).toEqual([3, 4, 5]);
        expect(rDataFunctions.TAIL([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
      });

      test('should handle arrays shorter than n', () => {
        expect(rDataFunctions.TAIL([1, 2], 5)).toEqual([1, 2]);
      });

      test('should handle n = 0', () => {
        expect(rDataFunctions.TAIL([1, 2, 3], 0)).toEqual([]);
      });
    });
  });

  describe('Logical Operations', () => {
    describe('ANY', () => {
      test('should return true if any element is truthy', () => {
        expect(rDataFunctions.ANY([false, true, false])).toBe(true);
        expect(rDataFunctions.ANY([0, 1, 0])).toBe(true);
        expect(rDataFunctions.ANY(['false', 'true'])).toBe(true);
      });

      test('should return false if no elements are truthy', () => {
        expect(rDataFunctions.ANY([false, false, false])).toBe(false);
        expect(rDataFunctions.ANY([0, 0, 0])).toBe(false);
      });

      test('should handle NA values', () => {
        expect(rDataFunctions.ANY([false, null, false])).toBe(null);
        expect(rDataFunctions.ANY([false, null, false], true)).toBe(false);
        expect(rDataFunctions.ANY([true, null, false], true)).toBe(true);
      });

      test('should handle single values', () => {
        expect(rDataFunctions.ANY(true)).toBe(true);
        expect(rDataFunctions.ANY(false)).toBe(false);
      });
    });

    describe('ALL', () => {
      test('should return true if all elements are truthy', () => {
        expect(rDataFunctions.ALL([true, true, true])).toBe(true);
        expect(rDataFunctions.ALL([1, 1, 1])).toBe(true);
      });

      test('should return false if any element is falsy', () => {
        expect(rDataFunctions.ALL([true, false, true])).toBe(false);
        expect(rDataFunctions.ALL([1, 0, 1])).toBe(false);
      });

      test('should handle NA values', () => {
        expect(rDataFunctions.ALL([true, null, true])).toBe(null);
        expect(rDataFunctions.ALL([true, null, true], true)).toBe(true);
        expect(rDataFunctions.ALL([false, null, true], true)).toBe(false);
      });
    });

    describe('IFELSE', () => {
      test('should perform vectorized conditional selection', () => {
        expect(rDataFunctions.IFELSE([true, false, true], ['A', 'A', 'A'], ['B', 'B', 'B']))
          .toEqual(['A', 'B', 'A']);
      });

      test('should handle scalar conditions', () => {
        expect(rDataFunctions.IFELSE(true, 'YES', 'NO')).toBe('YES');
        expect(rDataFunctions.IFELSE(false, 'YES', 'NO')).toBe('NO');
      });

      test('should recycle shorter vectors', () => {
        expect(rDataFunctions.IFELSE([true, false, true], 'A', 'B')).toEqual(['A', 'B', 'A']);
        expect(rDataFunctions.IFELSE(true, ['X', 'Y'], 'Z')).toEqual(['X', 'Y']);
      });

      test('should handle mixed length inputs', () => {
        expect(rDataFunctions.IFELSE([true, false], [1, 2, 3], [4, 5]))
          .toEqual([1, 5, 3]); // maxLength=3, so 3 elements
      });
    });
  });

  describe('Type Checking Functions', () => {
    describe('IS_NA', () => {
      test('should identify NA values', () => {
        expect(rDataFunctions.IS_NA([1, null, 3, undefined])).toEqual([false, true, false, true]);
        expect(rDataFunctions.IS_NA([NaN, 'NA', 'na'])).toEqual([true, true, true]);
      });

      test('should handle single values', () => {
        expect(rDataFunctions.IS_NA(null)).toEqual([true]);
        expect(rDataFunctions.IS_NA(1)).toEqual([false]);
      });

      test('should handle empty arrays', () => {
        expect(rDataFunctions.IS_NA([])).toEqual([]);
      });
    });

    describe('IS_NULL', () => {
      test('should identify null values', () => {
        expect(rDataFunctions.IS_NULL(null)).toBe(true);
        expect(rDataFunctions.IS_NULL(undefined)).toBe(true);
        expect(rDataFunctions.IS_NULL(0)).toBe(false);
        expect(rDataFunctions.IS_NULL('')).toBe(false);
      });
    });

    describe('IS_FINITE', () => {
      test('should identify finite values', () => {
        expect(rDataFunctions.IS_FINITE([1, Infinity, -Infinity, NaN]))
          .toEqual([true, false, false, false]);
        expect(rDataFunctions.IS_FINITE(['1', '2.5', 'abc']))
          .toEqual([true, true, false]);
      });

      test('should handle single values', () => {
        expect(rDataFunctions.IS_FINITE(42)).toEqual([true]);
        expect(rDataFunctions.IS_FINITE(Infinity)).toEqual([false]);
      });
    });

    describe('IS_INFINITE', () => {
      test('should identify infinite values', () => {
        expect(rDataFunctions.IS_INFINITE([1, Infinity, -Infinity, NaN]))
          .toEqual([false, true, true, false]);
      });

      test('should handle single values', () => {
        expect(rDataFunctions.IS_INFINITE(Infinity)).toEqual([true]);
        expect(rDataFunctions.IS_INFINITE(42)).toEqual([false]);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid inputs gracefully', () => {
      expect(rDataFunctions.SEQ('abc', 'def')).toEqual([]);
      expect(rDataFunctions.REP(null, 3)).toEqual([]);
      expect(rDataFunctions.WHICH(null)).toEqual([]);
    });

    test('should handle empty inputs', () => {
      expect(rDataFunctions.ORDER([])).toEqual([]);
      expect(rDataFunctions.SORT([])).toEqual([]);
      expect(rDataFunctions.RANK([])).toEqual([]);
    });

    test('should handle mixed data types consistently', () => {
      expect(rDataFunctions.SORT([1, 'a', 2, 'b'])).toEqual([1, 2, 'a', 'b']);
      expect(rDataFunctions.PMAX([1, 'a'], [2, 3])).toEqual([2, 3]); // 'a' ignored
    });
  });

  describe('Edge Cases', () => {
    test('should handle very large arrays efficiently', () => {
      const largeArray = Array.from({length: 1000}, (_, i) => i);
      expect(rDataFunctions.REV(largeArray).length).toBe(1000);
      expect(rDataFunctions.REV(largeArray)[0]).toBe(999);
    });

    test('should handle boundary values', () => {
      expect(rDataFunctions.SEQ(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)).toEqual([Number.MAX_SAFE_INTEGER]);
      expect(rDataFunctions.PMAX([Number.MIN_SAFE_INTEGER], [Number.MAX_SAFE_INTEGER])).toEqual([Number.MAX_SAFE_INTEGER]);
    });

    test('should handle special numeric values', () => {
      expect(rDataFunctions.SORT([Infinity, -Infinity, NaN, 0])).toEqual([-Infinity, 0, Infinity, 'NaN']);
      expect(rDataFunctions.IS_FINITE([0, -0, Infinity, -Infinity])).toEqual([true, true, false, false]);
    });
  });
});