/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Tests for R-style set operation functions
 * Tests mirror R-language behavior and edge cases
 */

const { rSetFunctions } = require('./r-set-functions');

describe('R-Style Set Operation Functions', () => {

  describe('Basic Set Operations', () => {
    describe('UNIQUE', () => {
      test('should remove duplicates from array', () => {
        expect(rSetFunctions.UNIQUE([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
        expect(rSetFunctions.UNIQUE(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
      });

      test('should handle mixed data types', () => {
        expect(rSetFunctions.UNIQUE([1, '1', 2, '2'])).toEqual([1, 2]);
        expect(rSetFunctions.UNIQUE([true, 'true', false, 'false'])).toEqual([true, false]);
      });

      test('should handle single values', () => {
        expect(rSetFunctions.UNIQUE(5)).toEqual([5]);
        expect(rSetFunctions.UNIQUE('test')).toEqual(['test']);
      });

      test('should handle empty arrays', () => {
        expect(rSetFunctions.UNIQUE([])).toEqual([]);
      });

      test('should preserve order of first occurrence', () => {
        expect(rSetFunctions.UNIQUE([3, 1, 2, 1, 3, 2])).toEqual([3, 1, 2]);
      });
    });

    describe('UNION', () => {
      test('should return union of two sets', () => {
        expect(rSetFunctions.UNION([1, 2, 3], [3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
        expect(rSetFunctions.UNION(['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c']);
      });

      test('should handle single values', () => {
        expect(rSetFunctions.UNION(1, [2, 3])).toEqual([1, 2, 3]);
        expect(rSetFunctions.UNION([1, 2], 3)).toEqual([1, 2, 3]);
        expect(rSetFunctions.UNION(1, 2)).toEqual([1, 2]);
      });

      test('should remove duplicates within each set', () => {
        expect(rSetFunctions.UNION([1, 1, 2], [2, 3, 3])).toEqual([1, 2, 3]);
      });

      test('should handle empty sets', () => {
        expect(rSetFunctions.UNION([], [1, 2, 3])).toEqual([1, 2, 3]);
        expect(rSetFunctions.UNION([1, 2, 3], [])).toEqual([1, 2, 3]);
        expect(rSetFunctions.UNION([], [])).toEqual([]);
      });

      test('should preserve order from first set, then second', () => {
        expect(rSetFunctions.UNION([3, 1, 2], [4, 2, 5])).toEqual([3, 1, 2, 4, 5]);
      });
    });

    describe('INTERSECT', () => {
      test('should return intersection of two sets', () => {
        expect(rSetFunctions.INTERSECT([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
        expect(rSetFunctions.INTERSECT(['a', 'b', 'c'], ['b', 'c', 'd'])).toEqual(['b', 'c']);
      });

      test('should handle single values', () => {
        expect(rSetFunctions.INTERSECT(2, [1, 2, 3])).toEqual([2]);
        expect(rSetFunctions.INTERSECT([1, 2, 3], 2)).toEqual([2]);
        expect(rSetFunctions.INTERSECT(1, 1)).toEqual([1]);
      });

      test('should return empty array for no intersection', () => {
        expect(rSetFunctions.INTERSECT([1, 2, 3], [4, 5, 6])).toEqual([]);
      });

      test('should handle duplicates', () => {
        expect(rSetFunctions.INTERSECT([1, 1, 2, 3], [1, 2, 2, 4])).toEqual([1, 2]);
      });

      test('should preserve order from first set', () => {
        expect(rSetFunctions.INTERSECT([3, 1, 2], [1, 2, 3])).toEqual([3, 1, 2]);
      });
    });

    describe('SETDIFF', () => {
      test('should return set difference', () => {
        expect(rSetFunctions.SETDIFF([1, 2, 3], [2, 3, 4])).toEqual([1]);
        expect(rSetFunctions.SETDIFF(['a', 'b', 'c'], ['b', 'd'])).toEqual(['a', 'c']);
      });

      test('should handle single values', () => {
        expect(rSetFunctions.SETDIFF([1, 2, 3], 2)).toEqual([1, 3]);
        expect(rSetFunctions.SETDIFF(2, [1, 2, 3])).toEqual([]);
      });

      test('should return full set when no overlap', () => {
        expect(rSetFunctions.SETDIFF([1, 2, 3], [4, 5, 6])).toEqual([1, 2, 3]);
      });

      test('should return empty array when first is subset of second', () => {
        expect(rSetFunctions.SETDIFF([1, 2], [1, 2, 3, 4])).toEqual([]);
      });

      test('should handle duplicates', () => {
        expect(rSetFunctions.SETDIFF([1, 1, 2, 3], [1, 4])).toEqual([2, 3]);
      });
    });
  });

  describe('Membership Testing', () => {
    describe('IS_ELEMENT', () => {
      test('should test membership for arrays', () => {
        expect(rSetFunctions.IS_ELEMENT([1, 2, 3], [2, 4, 6])).toEqual([false, true, false]);
        expect(rSetFunctions.IS_ELEMENT(['a', 'b'], ['a', 'c', 'd'])).toEqual([true, false]);
      });

      test('should handle single values', () => {
        expect(rSetFunctions.IS_ELEMENT(2, [1, 2, 3])).toEqual([true]);
        expect(rSetFunctions.IS_ELEMENT(5, [1, 2, 3])).toEqual([false]);
      });

      test('should handle empty table', () => {
        expect(rSetFunctions.IS_ELEMENT([1, 2, 3], [])).toEqual([false, false, false]);
      });

      test('should handle mixed types', () => {
        expect(rSetFunctions.IS_ELEMENT([1, '1'], [1, 2, 3])).toEqual([true, true]);
      });
    });

    describe('IN (alias for IS_ELEMENT)', () => {
      test('should work identically to IS_ELEMENT', () => {
        const x = [1, 2, 3, 4];
        const table = [2, 4, 6];
        expect(rSetFunctions.IN(x, table)).toEqual(rSetFunctions.IS_ELEMENT(x, table));
      });
    });
  });

  describe('Duplicate Detection', () => {
    describe('DUPLICATED', () => {
      test('should identify duplicates from beginning', () => {
        expect(rSetFunctions.DUPLICATED([1, 2, 2, 3, 1])).toEqual([false, false, true, false, true]);
        expect(rSetFunctions.DUPLICATED(['a', 'b', 'a', 'c'])).toEqual([false, false, true, false]);
      });

      test('should handle fromLast parameter', () => {
        expect(rSetFunctions.DUPLICATED([1, 2, 2, 3, 1], true)).toEqual([true, true, false, false, false]);
      });

      test('should handle no duplicates', () => {
        expect(rSetFunctions.DUPLICATED([1, 2, 3, 4])).toEqual([false, false, false, false]);
      });

      test('should handle single values', () => {
        expect(rSetFunctions.DUPLICATED([5])).toEqual([false]);
        expect(rSetFunctions.DUPLICATED(5)).toEqual([false]);
      });

      test('should handle all duplicates', () => {
        expect(rSetFunctions.DUPLICATED([1, 1, 1, 1])).toEqual([false, true, true, true]);
      });
    });

    describe('ANY_DUPLICATED', () => {
      test('should return true if duplicates exist', () => {
        expect(rSetFunctions.ANY_DUPLICATED([1, 2, 2, 3])).toBe(true);
        expect(rSetFunctions.ANY_DUPLICATED(['a', 'b', 'a'])).toBe(true);
      });

      test('should return false if no duplicates', () => {
        expect(rSetFunctions.ANY_DUPLICATED([1, 2, 3, 4])).toBe(false);
        expect(rSetFunctions.ANY_DUPLICATED(['a', 'b', 'c'])).toBe(false);
      });

      test('should handle single values', () => {
        expect(rSetFunctions.ANY_DUPLICATED([5])).toBe(false);
        expect(rSetFunctions.ANY_DUPLICATED(5)).toBe(false);
      });

      test('should handle empty arrays', () => {
        expect(rSetFunctions.ANY_DUPLICATED([])).toBe(false);
      });
    });
  });

  describe('Advanced Set Operations', () => {
    describe('SETEQUAL', () => {
      test('should return true for equal sets', () => {
        expect(rSetFunctions.SETEQUAL([1, 2, 3], [3, 2, 1])).toBe(true);
        expect(rSetFunctions.SETEQUAL(['a', 'b'], ['b', 'a'])).toBe(true);
      });

      test('should return false for different sets', () => {
        expect(rSetFunctions.SETEQUAL([1, 2, 3], [1, 2, 4])).toBe(false);
        expect(rSetFunctions.SETEQUAL([1, 2], [1, 2, 3])).toBe(false);
      });

      test('should ignore duplicates', () => {
        expect(rSetFunctions.SETEQUAL([1, 1, 2], [2, 1, 1])).toBe(true);
      });

      test('should handle empty sets', () => {
        expect(rSetFunctions.SETEQUAL([], [])).toBe(true);
        expect(rSetFunctions.SETEQUAL([], [1])).toBe(false);
      });
    });

    describe('IS_SUBSET', () => {
      test('should return true for subsets', () => {
        expect(rSetFunctions.IS_SUBSET([1, 2], [1, 2, 3, 4])).toBe(true);
        expect(rSetFunctions.IS_SUBSET(['a'], ['a', 'b', 'c'])).toBe(true);
      });

      test('should return false for non-subsets', () => {
        expect(rSetFunctions.IS_SUBSET([1, 5], [1, 2, 3, 4])).toBe(false);
      });

      test('should return true for equal sets', () => {
        expect(rSetFunctions.IS_SUBSET([1, 2, 3], [1, 2, 3])).toBe(true);
      });

      test('should handle empty set as subset', () => {
        expect(rSetFunctions.IS_SUBSET([], [1, 2, 3])).toBe(true);
        expect(rSetFunctions.IS_SUBSET([], [])).toBe(true);
      });
    });

    describe('IS_SUPERSET', () => {
      test('should return true for supersets', () => {
        expect(rSetFunctions.IS_SUPERSET([1, 2, 3, 4], [1, 2])).toBe(true);
        expect(rSetFunctions.IS_SUPERSET(['a', 'b', 'c'], ['a'])).toBe(true);
      });

      test('should return false for non-supersets', () => {
        expect(rSetFunctions.IS_SUPERSET([1, 2, 3], [1, 5])).toBe(false);
      });
    });

    describe('SYMDIFF (Symmetric Difference)', () => {
      test('should return symmetric difference', () => {
        expect(rSetFunctions.SYMDIFF([1, 2, 3], [3, 4, 5])).toEqual([1, 2, 4, 5]);
        expect(rSetFunctions.SYMDIFF(['a', 'b', 'c'], ['c', 'd', 'e'])).toEqual(['a', 'b', 'd', 'e']);
      });

      test('should return union when no intersection', () => {
        expect(rSetFunctions.SYMDIFF([1, 2], [3, 4])).toEqual([1, 2, 3, 4]);
      });

      test('should return empty array for equal sets', () => {
        expect(rSetFunctions.SYMDIFF([1, 2, 3], [1, 2, 3])).toEqual([]);
      });
    });
  });

  describe('Multiple Set Operations', () => {
    describe('UNION_ALL', () => {
      test('should compute union of multiple sets', () => {
        expect(rSetFunctions.UNION_ALL([1, 2], [2, 3], [3, 4])).toEqual([1, 2, 3, 4]);
        expect(rSetFunctions.UNION_ALL(['a'], ['b'], ['c'])).toEqual(['a', 'b', 'c']);
      });

      test('should handle single set', () => {
        expect(rSetFunctions.UNION_ALL([1, 2, 2, 3])).toEqual([1, 2, 3]);
      });

      test('should handle empty input', () => {
        expect(rSetFunctions.UNION_ALL()).toEqual([]);
      });
    });

    describe('INTERSECT_ALL', () => {
      test('should compute intersection of multiple sets', () => {
        expect(rSetFunctions.INTERSECT_ALL([1, 2, 3], [2, 3, 4], [3, 4, 5])).toEqual([3]);
        expect(rSetFunctions.INTERSECT_ALL(['a', 'b', 'c'], ['b', 'c', 'd'], ['c', 'd', 'e'])).toEqual(['c']);
      });

      test('should return empty array for no common elements', () => {
        expect(rSetFunctions.INTERSECT_ALL([1, 2], [3, 4], [5, 6])).toEqual([]);
      });

      test('should handle single set', () => {
        expect(rSetFunctions.INTERSECT_ALL([1, 2, 2, 3])).toEqual([1, 2, 3]);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('LENGTH_UNIQUE', () => {
      test('should return count of unique elements', () => {
        expect(rSetFunctions.LENGTH_UNIQUE([1, 2, 2, 3, 3, 3])).toBe(3);
        expect(rSetFunctions.LENGTH_UNIQUE(['a', 'b', 'a'])).toBe(2);
      });

      test('should handle empty arrays', () => {
        expect(rSetFunctions.LENGTH_UNIQUE([])).toBe(0);
      });
    });

    describe('IS_EMPTY_SET', () => {
      test('should return true for empty sets', () => {
        expect(rSetFunctions.IS_EMPTY_SET([])).toBe(true);
      });

      test('should return false for non-empty sets', () => {
        expect(rSetFunctions.IS_EMPTY_SET([1, 2, 3])).toBe(false);
        expect(rSetFunctions.IS_EMPTY_SET([0])).toBe(false);
      });
    });

    describe('CARDINALITY', () => {
      test('should return cardinality of set', () => {
        expect(rSetFunctions.CARDINALITY([1, 2, 2, 3])).toBe(3);
        expect(rSetFunctions.CARDINALITY([])).toBe(0);
        expect(rSetFunctions.CARDINALITY([1])).toBe(1);
      });
    });
  });

  describe('Frequency Operations', () => {
    describe('TABLE', () => {
      test('should count occurrences of each element', () => {
        expect(rSetFunctions.TABLE([1, 2, 2, 3, 3, 3])).toEqual({
          '1': 1,
          '2': 2,
          '3': 3
        });
        expect(rSetFunctions.TABLE(['a', 'b', 'a', 'c', 'a'])).toEqual({
          'a': 3,
          'b': 1,
          'c': 1
        });
      });

      test('should handle single values', () => {
        expect(rSetFunctions.TABLE([5])).toEqual({ '5': 1 });
        expect(rSetFunctions.TABLE(5)).toEqual({ '5': 1 });
      });

      test('should handle empty arrays', () => {
        expect(rSetFunctions.TABLE([])).toEqual({});
      });
    });

    describe('TABULATE', () => {
      test('should count with specified levels', () => {
        const result = rSetFunctions.TABULATE([1, 2, 2, 3], [1, 2, 3, 4]);
        expect(result).toEqual({
          '1': 1,
          '2': 2,
          '3': 1,
          '4': 0
        });
      });

      test('should use natural levels when none specified', () => {
        const result = rSetFunctions.TABULATE([1, 2, 2, 3]);
        expect(result).toEqual({
          '1': 1,
          '2': 2,
          '3': 1
        });
      });
    });
  });

  describe('Advanced Operations', () => {
    describe('POWESET', () => {
      test('should generate power set for small sets', () => {
        const result = rSetFunctions.POWESET([1, 2]);
        expect(result).toEqual([
          [],
          [1],
          [2],
          [1, 2]
        ]);
      });

      test('should generate power set for single element', () => {
        const result = rSetFunctions.POWESET([1]);
        expect(result).toEqual([
          [],
          [1]
        ]);
      });

      test('should handle empty set', () => {
        const result = rSetFunctions.POWESET([]);
        expect(result).toEqual([[]]);
      });

      test('should limit large sets', () => {
        const largeSet = Array.from({length: 15}, (_, i) => i);
        expect(() => rSetFunctions.POWESET(largeSet)).toThrow();
      });
    });

    describe('CARTESIAN_PRODUCT', () => {
      test('should compute cartesian product', () => {
        const result = rSetFunctions.CARTESIAN_PRODUCT([1, 2], ['a', 'b']);
        expect(result).toEqual([
          [1, 'a'], [1, 'b'],
          [2, 'a'], [2, 'b']
        ]);
      });

      test('should handle single values', () => {
        const result = rSetFunctions.CARTESIAN_PRODUCT(1, ['a', 'b']);
        expect(result).toEqual([[1, 'a'], [1, 'b']]);
      });

      test('should handle empty sets', () => {
        expect(rSetFunctions.CARTESIAN_PRODUCT([], [1, 2])).toEqual([]);
        expect(rSetFunctions.CARTESIAN_PRODUCT([1, 2], [])).toEqual([]);
      });
    });

    describe('EXPAND_GRID', () => {
      test('should expand grid for multiple vectors', () => {
        const result = rSetFunctions.EXPAND_GRID([1, 2], ['a', 'b'], [true, false]);
        expect(result).toEqual([
          [1, 'a', true], [1, 'a', false],
          [1, 'b', true], [1, 'b', false],
          [2, 'a', true], [2, 'a', false],
          [2, 'b', true], [2, 'b', false]
        ]);
      });

      test('should handle single vector', () => {
        const result = rSetFunctions.EXPAND_GRID([1, 2, 3]);
        expect(result).toEqual([[1], [2], [3]]);
      });

      test('should handle empty input', () => {
        expect(rSetFunctions.EXPAND_GRID()).toEqual([]);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid inputs gracefully', () => {
      expect(rSetFunctions.UNIQUE(null)).toEqual([]);
      expect(rSetFunctions.UNION(undefined, null)).toEqual([]);
      expect(rSetFunctions.INTERSECT('not-array', 123)).toEqual([]);
    });

    test('should handle mixed data types consistently', () => {
      expect(rSetFunctions.UNION([1, '2', true], [false, 3, '1'])).toEqual([1, '2', true, false, 3]);
      expect(rSetFunctions.INTERSECT([1, '1', 2], ['1', 2, 3])).toEqual([1, 2]);
    });
  });

  describe('Edge Cases', () => {
    test('should handle null and undefined values', () => {
      expect(rSetFunctions.UNIQUE([1, null, undefined, null])).toEqual([1]);
      expect(rSetFunctions.UNION([null], [undefined])).toEqual([]);
    });

    test('should handle boolean values', () => {
      expect(rSetFunctions.UNIQUE([true, false, true, false])).toEqual([true, false]);
      expect(rSetFunctions.INTERSECT([true, false], [false, 'false'])).toEqual([false]);
    });

    test('should handle numeric strings vs numbers', () => {
      expect(rSetFunctions.UNIQUE([1, '1', 2, '2'])).toEqual([1, 2]);
      expect(rSetFunctions.SETEQUAL([1, 2], ['1', '2'])).toBe(true);
    });
  });
});