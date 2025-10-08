/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const { rLogicalFunctions } = require('./r-logical-functions');

describe('R Logical & Conditional Functions', () => {
  // Logical Operations
  describe('ALL', () => {
    test('should return true when all values are truthy', () => {
      expect(rLogicalFunctions.ALL(true, 1, 'yes', 'true')).toBe(true);
      expect(rLogicalFunctions.ALL([true, 1, 2, 'hello'])).toBe(true);
    });

    test('should return false when any value is falsy', () => {
      expect(rLogicalFunctions.ALL(true, false, 1)).toBe(false);
      expect(rLogicalFunctions.ALL([true, 0, 1])).toBe(false);
      expect(rLogicalFunctions.ALL([1, '', 2])).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(rLogicalFunctions.ALL()).toBe(true); // Empty case
      expect(rLogicalFunctions.ALL(null, undefined)).toBe(false);
      expect(rLogicalFunctions.ALL([NaN, 1])).toBe(false);
    });

    test('should handle string truthiness', () => {
      expect(rLogicalFunctions.ALL('false')).toBe(false);
      expect(rLogicalFunctions.ALL('0')).toBe(false);
      expect(rLogicalFunctions.ALL('')).toBe(false);
      expect(rLogicalFunctions.ALL('true', 'yes')).toBe(true);
    });
  });

  describe('ANY', () => {
    test('should return true when any value is truthy', () => {
      expect(rLogicalFunctions.ANY(false, false, true)).toBe(true);
      expect(rLogicalFunctions.ANY([0, 0, 1])).toBe(true);
      expect(rLogicalFunctions.ANY([false, '', 'hello'])).toBe(true);
    });

    test('should return false when all values are falsy', () => {
      expect(rLogicalFunctions.ANY(false, 0, '')).toBe(false);
      expect(rLogicalFunctions.ANY([false, 0, '0', 'false'])).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(rLogicalFunctions.ANY()).toBe(false); // Empty case
      expect(rLogicalFunctions.ANY(null, undefined, NaN)).toBe(false);
    });
  });

  describe('WHICH', () => {
    test('should return indices of truthy values', () => {
      expect(rLogicalFunctions.WHICH([true, false, true, false])).toEqual([0, 2]);
      expect(rLogicalFunctions.WHICH([1, 0, 2, 0])).toEqual([0, 2]);
      expect(rLogicalFunctions.WHICH(['a', '', 'b'])).toEqual([0, 2]);
    });

    test('should handle single values', () => {
      expect(rLogicalFunctions.WHICH(true)).toEqual([0]);
      expect(rLogicalFunctions.WHICH(false)).toEqual([]);
      expect(rLogicalFunctions.WHICH(1)).toEqual([0]);
      expect(rLogicalFunctions.WHICH(0)).toEqual([]);
    });

    test('should handle all falsy values', () => {
      expect(rLogicalFunctions.WHICH([false, 0, '', null])).toEqual([]);
    });
  });

  describe('WHICH_MAX', () => {
    test('should return indices of maximum values', () => {
      expect(rLogicalFunctions.WHICH_MAX([1, 3, 2, 3, 1])).toEqual([1, 3]);
      expect(rLogicalFunctions.WHICH_MAX([5, 1, 2])).toEqual([0]);
    });

    test('should handle single values', () => {
      expect(rLogicalFunctions.WHICH_MAX(5)).toBe(0);
      expect(rLogicalFunctions.WHICH_MAX('abc')).toBe(-1); // Non-numeric
    });

    test('should handle non-numeric values', () => {
      expect(rLogicalFunctions.WHICH_MAX(['a', 'b', 'c'])).toEqual([]);
      expect(rLogicalFunctions.WHICH_MAX([1, 'x', 3, 'y', 3])).toEqual([2, 4]);
    });

    test('should handle empty arrays', () => {
      expect(rLogicalFunctions.WHICH_MAX([])).toEqual([]);
    });
  });

  describe('WHICH_MIN', () => {
    test('should return indices of minimum values', () => {
      expect(rLogicalFunctions.WHICH_MIN([3, 1, 2, 1, 3])).toEqual([1, 3]);
      expect(rLogicalFunctions.WHICH_MIN([5, 1, 2])).toEqual([1]);
    });

    test('should handle single values', () => {
      expect(rLogicalFunctions.WHICH_MIN(5)).toBe(0);
      expect(rLogicalFunctions.WHICH_MIN('abc')).toBe(-1);
    });

    test('should handle negative numbers', () => {
      expect(rLogicalFunctions.WHICH_MIN([-1, 0, -1, 2])).toEqual([0, 2]);
    });
  });

  // Conditional Functions
  describe('IFELSE', () => {
    test('should handle basic conditional logic', () => {
      expect(rLogicalFunctions.IFELSE(true, 'yes', 'no')).toBe('yes');
      expect(rLogicalFunctions.IFELSE(false, 'yes', 'no')).toBe('no');
      expect(rLogicalFunctions.IFELSE(1, 'yes', 'no')).toBe('yes');
      expect(rLogicalFunctions.IFELSE(0, 'yes', 'no')).toBe('no');
    });

    test('should handle vectorized operations', () => {
      expect(rLogicalFunctions.IFELSE([true, false, true], ['A', 'B', 'C'], ['X', 'Y', 'Z']))
        .toEqual(['A', 'Y', 'C']);
      expect(rLogicalFunctions.IFELSE([1, 0, 2], 'yes', 'no'))
        .toEqual(['yes', 'no', 'yes']);
    });

    test('should handle recycling of shorter vectors', () => {
      expect(rLogicalFunctions.IFELSE([true, false], 'A', ['X', 'Y']))
        .toEqual(['A', 'Y']);
      expect(rLogicalFunctions.IFELSE([true, false, true], 'yes', 'no'))
        .toEqual(['yes', 'no', 'yes']);
    });

    test('should handle string conditions', () => {
      expect(rLogicalFunctions.IFELSE('true', 'yes', 'no')).toBe('yes');
      expect(rLogicalFunctions.IFELSE('false', 'yes', 'no')).toBe('no');
      expect(rLogicalFunctions.IFELSE('0', 'yes', 'no')).toBe('no');
    });
  });

  describe('SWITCH', () => {
    test('should handle basic switch logic', () => {
      expect(rLogicalFunctions.SWITCH('a', 'a', 'first', 'b', 'second', 'default')).toBe('first');
      expect(rLogicalFunctions.SWITCH('b', 'a', 'first', 'b', 'second', 'default')).toBe('second');
      expect(rLogicalFunctions.SWITCH('c', 'a', 'first', 'b', 'second', 'default')).toBe('default');
    });

    test('should handle numeric cases', () => {
      expect(rLogicalFunctions.SWITCH(1, '1', 'one', '2', 'two')).toBe('one');
      expect(rLogicalFunctions.SWITCH(2, '1', 'one', '2', 'two')).toBe('two');
    });

    test('should return null when no match and no default', () => {
      expect(rLogicalFunctions.SWITCH('x', 'a', 'first', 'b', 'second')).toBe(null);
    });
  });

  // Missing Value Functions
  describe('IS_NA', () => {
    test('should identify NA values', () => {
      expect(rLogicalFunctions.IS_NA(null)).toBe(true);
      expect(rLogicalFunctions.IS_NA(undefined)).toBe(true);
      expect(rLogicalFunctions.IS_NA(NaN)).toBe(true);
      expect(rLogicalFunctions.IS_NA('NA')).toBe(true);
      expect(rLogicalFunctions.IS_NA('na')).toBe(true);
    });

    test('should identify non-NA values', () => {
      expect(rLogicalFunctions.IS_NA(0)).toBe(false);
      expect(rLogicalFunctions.IS_NA('')).toBe(false);
      expect(rLogicalFunctions.IS_NA(false)).toBe(false);
      expect(rLogicalFunctions.IS_NA('hello')).toBe(false);
    });

    test('should handle arrays', () => {
      expect(rLogicalFunctions.IS_NA([1, null, NaN, 'NA', 'hello']))
        .toEqual([false, true, true, true, false]);
    });
  });

  describe('IS_NULL', () => {
    test('should identify null values', () => {
      expect(rLogicalFunctions.IS_NULL(null)).toBe(true);
      expect(rLogicalFunctions.IS_NULL(undefined)).toBe(false);
      expect(rLogicalFunctions.IS_NULL(0)).toBe(false);
      expect(rLogicalFunctions.IS_NULL('')).toBe(false);
    });

    test('should handle arrays', () => {
      expect(rLogicalFunctions.IS_NULL([null, undefined, 0, '']))
        .toEqual([true, false, false, false]);
    });
  });

  describe('IS_FINITE', () => {
    test('should identify finite numbers', () => {
      expect(rLogicalFunctions.IS_FINITE(1)).toBe(true);
      expect(rLogicalFunctions.IS_FINITE(0)).toBe(true);
      expect(rLogicalFunctions.IS_FINITE(-5.5)).toBe(true);
      expect(rLogicalFunctions.IS_FINITE('10')).toBe(true);
    });

    test('should identify infinite values', () => {
      expect(rLogicalFunctions.IS_FINITE(Infinity)).toBe(false);
      expect(rLogicalFunctions.IS_FINITE(-Infinity)).toBe(false);
      expect(rLogicalFunctions.IS_FINITE(NaN)).toBe(false);
      expect(rLogicalFunctions.IS_FINITE('hello')).toBe(false);
    });

    test('should handle arrays', () => {
      expect(rLogicalFunctions.IS_FINITE([1, Infinity, NaN, -5]))
        .toEqual([true, false, false, true]);
    });
  });

  describe('IS_INFINITE', () => {
    test('should identify infinite values', () => {
      expect(rLogicalFunctions.IS_INFINITE(Infinity)).toBe(true);
      expect(rLogicalFunctions.IS_INFINITE(-Infinity)).toBe(true);
      expect(rLogicalFunctions.IS_INFINITE(1)).toBe(false);
      expect(rLogicalFunctions.IS_INFINITE(NaN)).toBe(false);
    });
  });

  describe('IS_NAN', () => {
    test('should identify NaN values', () => {
      expect(rLogicalFunctions.IS_NAN(NaN)).toBe(true);
      expect(rLogicalFunctions.IS_NAN('hello')).toBe(true);
      expect(rLogicalFunctions.IS_NAN(1)).toBe(false);
      expect(rLogicalFunctions.IS_NAN('10')).toBe(false);
    });

    test('should handle arrays', () => {
      expect(rLogicalFunctions.IS_NAN([1, NaN, '5', 'hello']))
        .toEqual([false, true, false, true]);
    });
  });

  describe('NA_OMIT', () => {
    test('should remove NA values from arrays', () => {
      expect(rLogicalFunctions.NA_OMIT([1, null, 3, NaN, 5, 'NA']))
        .toEqual([1, 3, 5]);
      expect(rLogicalFunctions.NA_OMIT(['a', null, 'b', undefined, 'c']))
        .toEqual(['a', 'b', 'c']);
    });

    test('should handle single values', () => {
      expect(rLogicalFunctions.NA_OMIT(5)).toBe(5);
      expect(rLogicalFunctions.NA_OMIT(null)).toBe(null);
      expect(rLogicalFunctions.NA_OMIT(NaN)).toBe(null);
    });

    test('should handle empty results', () => {
      expect(rLogicalFunctions.NA_OMIT([null, NaN, 'NA'])).toEqual([]);
    });
  });

  describe('COMPLETE_CASES', () => {
    test('should identify complete cases across multiple vectors', () => {
      expect(rLogicalFunctions.COMPLETE_CASES([1, 2, null], ['a', 'b', 'c'], [10, null, 30]))
        .toEqual([true, false, false]);
      expect(rLogicalFunctions.COMPLETE_CASES([1, 2, 3], ['a', 'b', 'c']))
        .toEqual([true, true, true]);
    });

    test('should handle different vector lengths', () => {
      expect(rLogicalFunctions.COMPLETE_CASES([1, 2], ['a', 'b', 'c']))
        .toEqual([true, true, true]); // Recycling
    });

    test('should handle single vectors', () => {
      expect(rLogicalFunctions.COMPLETE_CASES([1, null, 3]))
        .toEqual([true, false, true]);
    });
  });

  // Comparison Functions
  describe('PMAX', () => {
    test('should return pairwise maximum', () => {
      expect(rLogicalFunctions.PMAX([1, 5, 2], [3, 2, 4]))
        .toEqual([3, 5, 4]);
      expect(rLogicalFunctions.PMAX(1, 3)).toBe(3);
    });

    test('should handle multiple vectors', () => {
      expect(rLogicalFunctions.PMAX([1, 2], [3, 1], [2, 4]))
        .toEqual([3, 4]);
    });

    test('should handle non-numeric values', () => {
      expect(rLogicalFunctions.PMAX([1, 'a', 3], [2, 4, 'b']))
        .toEqual([2, 4, 3]);
    });

    test('should handle different lengths with recycling', () => {
      expect(rLogicalFunctions.PMAX([1, 2], [3, 4, 5]))
        .toEqual([3, 4, 5]);
    });
  });

  describe('PMIN', () => {
    test('should return pairwise minimum', () => {
      expect(rLogicalFunctions.PMIN([1, 5, 2], [3, 2, 4]))
        .toEqual([1, 2, 2]);
      expect(rLogicalFunctions.PMIN(1, 3)).toBe(1);
    });

    test('should handle multiple vectors', () => {
      expect(rLogicalFunctions.PMIN([5, 2], [3, 1], [2, 4]))
        .toEqual([2, 1]);
    });
  });

  // Logical Operators
  describe('XOR', () => {
    test('should return exclusive OR', () => {
      expect(rLogicalFunctions.XOR(true, false)).toBe(true);
      expect(rLogicalFunctions.XOR(true, true)).toBe(false);
      expect(rLogicalFunctions.XOR(false, false)).toBe(false);
      expect(rLogicalFunctions.XOR(false, true)).toBe(true);
    });

    test('should handle arrays', () => {
      expect(rLogicalFunctions.XOR([true, false, true], [false, false, true]))
        .toEqual([true, false, false]);
    });

    test('should handle numeric values', () => {
      expect(rLogicalFunctions.XOR(1, 0)).toBe(true);
      expect(rLogicalFunctions.XOR(1, 2)).toBe(false);
    });
  });

  describe('AND', () => {
    test('should return logical AND', () => {
      expect(rLogicalFunctions.AND(true, true)).toBe(true);
      expect(rLogicalFunctions.AND(true, false)).toBe(false);
      expect(rLogicalFunctions.AND(false, false)).toBe(false);
    });

    test('should handle arrays', () => {
      expect(rLogicalFunctions.AND([true, false, true], [true, true, false]))
        .toEqual([true, false, false]);
    });

    test('should handle mixed types', () => {
      expect(rLogicalFunctions.AND(1, 'true')).toBe(true);
      expect(rLogicalFunctions.AND(0, 'false')).toBe(false);
    });
  });

  describe('OR', () => {
    test('should return logical OR', () => {
      expect(rLogicalFunctions.OR(true, false)).toBe(true);
      expect(rLogicalFunctions.OR(false, false)).toBe(false);
      expect(rLogicalFunctions.OR(true, true)).toBe(true);
    });

    test('should handle arrays', () => {
      expect(rLogicalFunctions.OR([true, false, false], [false, true, false]))
        .toEqual([true, true, false]);
    });
  });

  describe('NOT', () => {
    test('should return logical NOT', () => {
      expect(rLogicalFunctions.NOT(true)).toBe(false);
      expect(rLogicalFunctions.NOT(false)).toBe(true);
      expect(rLogicalFunctions.NOT(1)).toBe(false);
      expect(rLogicalFunctions.NOT(0)).toBe(true);
    });

    test('should handle arrays', () => {
      expect(rLogicalFunctions.NOT([true, false, 1, 0]))
        .toEqual([false, true, false, true]);
    });

    test('should handle string values', () => {
      expect(rLogicalFunctions.NOT('true')).toBe(false);
      expect(rLogicalFunctions.NOT('false')).toBe(true);
      expect(rLogicalFunctions.NOT('')).toBe(true);
    });
  });

  // Type Checking Functions
  describe('IS_LOGICAL', () => {
    test('should identify boolean values', () => {
      expect(rLogicalFunctions.IS_LOGICAL(true)).toBe(true);
      expect(rLogicalFunctions.IS_LOGICAL(false)).toBe(true);
      expect(rLogicalFunctions.IS_LOGICAL(1)).toBe(false);
      expect(rLogicalFunctions.IS_LOGICAL('true')).toBe(false);
    });

    test('should handle arrays', () => {
      expect(rLogicalFunctions.IS_LOGICAL([true, 1, 'hello', false]))
        .toEqual([true, false, false, true]);
    });
  });

  describe('IS_NUMERIC', () => {
    test('should identify numeric values', () => {
      expect(rLogicalFunctions.IS_NUMERIC(1)).toBe(true);
      expect(rLogicalFunctions.IS_NUMERIC(-5.5)).toBe(true);
      expect(rLogicalFunctions.IS_NUMERIC('10')).toBe(true);
      expect(rLogicalFunctions.IS_NUMERIC('hello')).toBe(false);
      expect(rLogicalFunctions.IS_NUMERIC(NaN)).toBe(false);
      expect(rLogicalFunctions.IS_NUMERIC(Infinity)).toBe(false);
    });

    test('should handle arrays', () => {
      expect(rLogicalFunctions.IS_NUMERIC([1, 'hello', '5', NaN]))
        .toEqual([true, false, true, false]);
    });
  });

  describe('IS_CHARACTER', () => {
    test('should identify string values', () => {
      expect(rLogicalFunctions.IS_CHARACTER('hello')).toBe(true);
      expect(rLogicalFunctions.IS_CHARACTER('')).toBe(true);
      expect(rLogicalFunctions.IS_CHARACTER(1)).toBe(false);
      expect(rLogicalFunctions.IS_CHARACTER(true)).toBe(false);
    });

    test('should handle arrays', () => {
      expect(rLogicalFunctions.IS_CHARACTER(['hello', 1, true, '']))
        .toEqual([true, false, false, true]);
    });
  });

  describe('IS_INTEGER', () => {
    test('should identify integer values', () => {
      expect(rLogicalFunctions.IS_INTEGER(1)).toBe(true);
      expect(rLogicalFunctions.IS_INTEGER(0)).toBe(true);
      expect(rLogicalFunctions.IS_INTEGER(-5)).toBe(true);
      expect(rLogicalFunctions.IS_INTEGER(1.5)).toBe(false);
      expect(rLogicalFunctions.IS_INTEGER('5')).toBe(true);
      expect(rLogicalFunctions.IS_INTEGER('5.5')).toBe(false);
    });

    test('should handle arrays', () => {
      expect(rLogicalFunctions.IS_INTEGER([1, 1.5, '2', 'hello']))
        .toEqual([true, false, true, false]);
    });
  });

  // Duplicate Detection
  describe('DUPLICATED', () => {
    test('should identify duplicate values', () => {
      expect(rLogicalFunctions.DUPLICATED([1, 2, 1, 3, 2]))
        .toEqual([false, false, true, false, true]);
      expect(rLogicalFunctions.DUPLICATED(['a', 'b', 'a', 'c']))
        .toEqual([false, false, true, false]);
    });

    test('should handle single values', () => {
      expect(rLogicalFunctions.DUPLICATED(5)).toBe(false);
    });

    test('should handle no duplicates', () => {
      expect(rLogicalFunctions.DUPLICATED([1, 2, 3, 4]))
        .toEqual([false, false, false, false]);
    });

    test('should handle complex values', () => {
      expect(rLogicalFunctions.DUPLICATED([{a: 1}, {b: 2}, {a: 1}]))
        .toEqual([false, false, true]);
    });
  });

  describe('ANYDUPLICATES', () => {
    test('should detect if any duplicates exist', () => {
      expect(rLogicalFunctions.ANYDUPLICATES([1, 2, 1, 3])).toBe(true);
      expect(rLogicalFunctions.ANYDUPLICATES([1, 2, 3, 4])).toBe(false);
      expect(rLogicalFunctions.ANYDUPLICATES(['a', 'b', 'a'])).toBe(true);
    });

    test('should handle single values', () => {
      expect(rLogicalFunctions.ANYDUPLICATES(5)).toBe(false);
    });

    test('should handle empty arrays', () => {
      expect(rLogicalFunctions.ANYDUPLICATES([])).toBe(false);
    });
  });

  describe('STOPIFNOT', () => {
    test('should return true when all conditions are met', () => {
      expect(rLogicalFunctions.STOPIFNOT(true, 1, 'yes')).toBe(true);
      expect(rLogicalFunctions.STOPIFNOT([true, true, true])).toBe(true);
    });

    test('should return false when conditions fail', () => {
      expect(rLogicalFunctions.STOPIFNOT(true, false, 1)).toBe(false);
      expect(rLogicalFunctions.STOPIFNOT([true, false, true])).toBe(false);
    });

    test('should handle multiple condition arrays', () => {
      expect(rLogicalFunctions.STOPIFNOT([true, true], [1, 2, 3], 'yes')).toBe(true);
      expect(rLogicalFunctions.STOPIFNOT([true, false], [1, 2])).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(rLogicalFunctions.STOPIFNOT()).toBe(true); // No conditions
      expect(rLogicalFunctions.STOPIFNOT(null)).toBe(false);
      expect(rLogicalFunctions.STOPIFNOT(0)).toBe(false);
    });
  });

  // R Compatibility Tests
  describe('R Compatibility', () => {
    test('ALL should behave like R all()', () => {
      // R: all(c(TRUE, TRUE, TRUE)) -> TRUE
      expect(rLogicalFunctions.ALL([true, true, true])).toBe(true);
      // R: all(c(TRUE, FALSE, TRUE)) -> FALSE  
      expect(rLogicalFunctions.ALL([true, false, true])).toBe(false);
    });

    test('WHICH should behave like R which()', () => {
      // R: which(c(TRUE, FALSE, TRUE, FALSE)) -> c(1, 3) (1-indexed)
      // We use 0-indexed: c(0, 2)
      expect(rLogicalFunctions.WHICH([true, false, true, false])).toEqual([0, 2]);
    });

    test('IFELSE should behave like R ifelse()', () => {
      // R: ifelse(c(TRUE, FALSE), c("yes", "maybe"), c("no", "definitely"))
      expect(rLogicalFunctions.IFELSE([true, false], ['yes', 'maybe'], ['no', 'definitely']))
        .toEqual(['yes', 'definitely']);
    });

    test('IS_NA should behave like R is.na()', () => {
      // R: is.na(c(1, NA, 3)) -> c(FALSE, TRUE, FALSE)
      expect(rLogicalFunctions.IS_NA([1, null, 3])).toEqual([false, true, false]);
    });

    test('DUPLICATED should behave like R duplicated()', () => {
      // R: duplicated(c(1, 2, 1, 3)) -> c(FALSE, FALSE, TRUE, FALSE)
      expect(rLogicalFunctions.DUPLICATED([1, 2, 1, 3])).toEqual([false, false, true, false]);
    });
  });

  // Error Handling
  describe('Error Handling', () => {
    test('should handle null/undefined inputs gracefully', () => {
      expect(rLogicalFunctions.ALL(null)).toBe(false);
      expect(rLogicalFunctions.ANY(undefined)).toBe(false);
      expect(rLogicalFunctions.WHICH(null)).toEqual([]);
    });

    test('should handle empty arrays', () => {
      expect(rLogicalFunctions.ALL([])).toBe(true);
      expect(rLogicalFunctions.ANY([])).toBe(false);
      expect(rLogicalFunctions.WHICH([])).toEqual([]);
      expect(rLogicalFunctions.PMAX([])).toEqual([]);
    });

    test('should handle mixed type arrays', () => {
      expect(rLogicalFunctions.ANY([0, false, '', 'hello'])).toBe(true);
      expect(rLogicalFunctions.ALL([1, true, 'yes', 2.5])).toBe(true);
    });
  });
});