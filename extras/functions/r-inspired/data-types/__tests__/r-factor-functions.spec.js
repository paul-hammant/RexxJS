/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const { rFactorFunctions } = require('../src/r-factor-functions.js');

describe('R Factor & Categorical Data Functions', () => {
  // Factor Creation and Management
  describe('FACTOR', () => {
    test('should create factor from vector', () => {
      const result = rFactorFunctions.FACTOR(['a', 'b', 'a', 'c', 'b']);
      expect(result.levels).toEqual(['a', 'b', 'c']);
      expect(result.labels).toEqual(['a', 'b', 'c']);
      expect(result.values).toEqual([0, 1, 0, 2, 1]);
      expect(result.ordered).toBe(false);
      expect(result.length).toBe(5);
    });

    test('should create factor with specified levels', () => {
      const result = rFactorFunctions.FACTOR(['a', 'b', 'a'], ['c', 'b', 'a']);
      expect(result.levels).toEqual(['c', 'b', 'a']);
      expect(result.values).toEqual([2, 1, 2]);
    });

    test('should create factor with custom labels', () => {
      const result = rFactorFunctions.FACTOR([1, 2, 1], [1, 2], ['low', 'high']);
      expect(result.levels).toEqual([1, 2]);
      expect(result.labels).toEqual(['low', 'high']);
      expect(result.values).toEqual([0, 1, 0]);
    });

    test('should handle single value', () => {
      const result = rFactorFunctions.FACTOR('test');
      expect(result.levels).toEqual(['test']);
      expect(result.values).toEqual([0]);
    });

    test('should handle values not in levels', () => {
      const result = rFactorFunctions.FACTOR(['a', 'x', 'b'], ['a', 'b']);
      expect(result.values).toEqual([0, null, 1]);
    });
  });

  describe('AS_FACTOR and ORDERED', () => {
    test('AS_FACTOR should create unordered factor', () => {
      const result = rFactorFunctions.AS_FACTOR([1, 2, 1]);
      expect(result.ordered).toBe(false);
      expect(rFactorFunctions.IS_FACTOR(result)).toBe(true);
    });

    test('ORDERED should create ordered factor', () => {
      const result = rFactorFunctions.ORDERED(['low', 'high', 'medium'], ['low', 'medium', 'high']);
      expect(result.ordered).toBe(true);
      expect(rFactorFunctions.IS_ORDERED(result)).toBe(true);
    });
  });

  // Factor Properties
  describe('LEVELS and NLEVELS', () => {
    test('should extract levels from factor', () => {
      const factor = rFactorFunctions.FACTOR(['a', 'b', 'c', 'a']);
      expect(rFactorFunctions.LEVELS(factor)).toEqual(['a', 'b', 'c']);
      expect(rFactorFunctions.NLEVELS(factor)).toBe(3);
    });

    test('should handle non-factor input', () => {
      expect(rFactorFunctions.LEVELS(['x', 'y', 'x'])).toEqual(['x', 'y']);
      expect(rFactorFunctions.NLEVELS(['x', 'y', 'x'])).toBe(2);
      expect(rFactorFunctions.LEVELS('single')).toEqual(['single']);
      expect(rFactorFunctions.NLEVELS('single')).toBe(1);
    });
  });

  describe('IS_FACTOR and IS_ORDERED', () => {
    test('should identify factors', () => {
      const factor = rFactorFunctions.FACTOR(['a', 'b']);
      const orderedFactor = rFactorFunctions.ORDERED(['a', 'b']);
      
      expect(rFactorFunctions.IS_FACTOR(factor)).toBe(true);
      expect(rFactorFunctions.IS_FACTOR(orderedFactor)).toBe(true);
      expect(rFactorFunctions.IS_FACTOR(['a', 'b'])).toBe(false);
      expect(rFactorFunctions.IS_FACTOR('test')).toBe(false);
      
      expect(rFactorFunctions.IS_ORDERED(factor)).toBe(false);
      expect(rFactorFunctions.IS_ORDERED(orderedFactor)).toBe(true);
    });
  });

  // Factor Manipulation
  describe('DROPLEVELS', () => {
    test('should drop unused levels', () => {
      const factor = rFactorFunctions.FACTOR(['a', 'a', 'b'], ['a', 'b', 'c']);
      const result = rFactorFunctions.DROPLEVELS(factor);
      expect(result.levels).toEqual(['a', 'b']);
      expect(result.values).toEqual([0, 0, 1]);
    });

    test('should exclude specified levels', () => {
      const factor = rFactorFunctions.FACTOR(['a', 'b', 'c', 'a']);
      const result = rFactorFunctions.DROPLEVELS(factor, ['b']);
      expect(result.levels).toEqual(['a', 'c']);
      expect(result.values).toEqual([0, null, 1, 0]);
    });

    test('should handle non-factor input', () => {
      const result = rFactorFunctions.DROPLEVELS(['a', 'b']);
      expect(result).toEqual(['a', 'b']);
    });
  });

  describe('RELEVEL', () => {
    test('should move reference level to front', () => {
      const factor = rFactorFunctions.FACTOR(['a', 'b', 'c']);
      const result = rFactorFunctions.RELEVEL(factor, 'b');
      expect(result.levels).toEqual(['b', 'a', 'c']);
      expect(result.values).toEqual([1, 0, 2]);
    });

    test('should handle non-existent reference level', () => {
      const factor = rFactorFunctions.FACTOR(['a', 'b']);
      const result = rFactorFunctions.RELEVEL(factor, 'x');
      expect(result.levels).toEqual(['a', 'b']); // Unchanged
    });
  });

  // Conversion Functions
  describe('AS_NUMERIC_FACTOR', () => {
    test('should convert factor to numeric indices', () => {
      const factor = rFactorFunctions.FACTOR(['b', 'a', 'c']);
      const result = rFactorFunctions.AS_NUMERIC_FACTOR(factor);
      expect(result).toEqual([2, 1, 3]); // 1-indexed like R
    });

    test('should handle non-factor input', () => {
      const result = rFactorFunctions.AS_NUMERIC_FACTOR([1.5, '2.5', 'x']);
      expect(result).toEqual([1.5, 2.5]); // Only valid numbers
    });

    test('should handle missing values', () => {
      const factor = rFactorFunctions.FACTOR(['a', 'x', 'b'], ['a', 'b']);
      const result = rFactorFunctions.AS_NUMERIC_FACTOR(factor);
      expect(result).toEqual([1, NaN, 2]);
    });
  });

  describe('AS_CHARACTEFACTOR', () => {
    test('should convert factor to character labels', () => {
      const factor = rFactorFunctions.FACTOR([1, 2, 1], [1, 2], ['low', 'high']);
      const result = rFactorFunctions.AS_CHARACTEFACTOR(factor);
      expect(result).toEqual(['low', 'high', 'low']);
    });

    test('should handle non-factor input', () => {
      const result = rFactorFunctions.AS_CHARACTEFACTOR([1, 2, 3]);
      expect(result).toEqual(['1', '2', '3']);
    });

    test('should handle missing values', () => {
      const factor = rFactorFunctions.FACTOR(['a', 'x'], ['a']);
      const result = rFactorFunctions.AS_CHARACTEFACTOR(factor);
      expect(result).toEqual(['a', 'NA']);
    });
  });

  // Tabulation Functions
  describe('TABLE', () => {
    test('should create frequency table for single variable', () => {
      const result = rFactorFunctions.TABLE(['a', 'b', 'a', 'c', 'b', 'a']);
      expect(result).toEqual({ a: 3, b: 2, c: 1 });
    });

    test('should handle single value', () => {
      const result = rFactorFunctions.TABLE('test');
      expect(result).toEqual({ test: 1 });
    });

    test('should create cross-tabulation for multiple variables', () => {
      const result = rFactorFunctions.TABLE(['a', 'a', 'b'], [1, 2, 1]);
      expect(result).toEqual({ 'a,1': 1, 'a,2': 1, 'b,1': 1 });
    });

    test('should handle empty input', () => {
      const result = rFactorFunctions.TABLE([]);
      expect(result).toEqual({});
    });

    test('should handle numeric values', () => {
      const result = rFactorFunctions.TABLE([1, 2, 1, 3, 2, 1]);
      expect(result).toEqual({ '1': 3, '2': 2, '3': 1 });
    });
  });

  describe('XTABS', () => {
    test('should create cross-tabulation from formula', () => {
      const data = ['a', 'b', 'a', 'c'];
      const result = rFactorFunctions.XTABS(null, data);
      expect(result).toEqual({ a: 2, b: 1, c: 1 });
    });

    test('should handle object data', () => {
      const data = { var1: ['a', 'b'], var2: ['x', 'y'] };
      const result = rFactorFunctions.XTABS(null, data);
      expect(result).toEqual({ a: 1, b: 1, x: 1, y: 1 });
    });

    test('should handle null data', () => {
      const result = rFactorFunctions.XTABS('~ var1', null);
      expect(result).toEqual({});
    });
  });

  // Grouping Functions
  describe('SPLIT', () => {
    test('should split vector by factor', () => {
      const x = [1, 2, 3, 4, 5, 6];
      const f = rFactorFunctions.FACTOR(['a', 'b', 'a', 'b', 'a', 'b']);
      const result = rFactorFunctions.SPLIT(x, f);
      expect(result).toEqual({ a: [1, 3, 5], b: [2, 4, 6] });
    });

    test('should handle non-factor grouping variable', () => {
      const x = [10, 20, 30, 40];
      const f = ['x', 'y', 'x', 'y'];
      const result = rFactorFunctions.SPLIT(x, f);
      expect(result).toEqual({ x: [10, 30], y: [20, 40] });
    });

    test('should handle single values', () => {
      const result = rFactorFunctions.SPLIT(42, 'group');
      expect(result).toEqual({ group: [42] });
    });

    test('should handle mismatched lengths', () => {
      const x = [1, 2, 3, 4, 5];
      const f = ['a', 'b'];
      const result = rFactorFunctions.SPLIT(x, f);
      expect(Object.keys(result)).toEqual(['a', 'b']);
    });
  });

  describe('UNSPLIT', () => {
    test('should unsplit grouped data', () => {
      const groups = { a: [1, 3, 5], b: [2, 4, 6] };
      const result = rFactorFunctions.UNSPLIT(groups);
      expect(result).toEqual([1, 3, 5, 2, 4, 6]); // Sorted by group names
    });

    test('should handle empty groups', () => {
      const result = rFactorFunctions.UNSPLIT({});
      expect(result).toEqual([]);
    });

    test('should handle non-array values', () => {
      const groups = { a: [1, 2], b: 'not array' };
      const result = rFactorFunctions.UNSPLIT(groups);
      expect(result).toEqual([1, 2]);
    });
  });

  describe('TAPPLY', () => {
    test('should apply function to groups', () => {
      const x = [1, 2, 3, 4, 5, 6];
      const index = ['a', 'b', 'a', 'b', 'a', 'b'];
      const result = rFactorFunctions.TAPPLY(x, index, 'MEAN');
      expect(result).toEqual({ a: 3, b: 4 }); // (1+3+5)/3 = 3, (2+4+6)/3 = 4
    });

    test('should handle different functions', () => {
      const x = [1, 5, 2, 8, 3, 9];
      const index = ['a', 'a', 'b', 'b', 'c', 'c'];
      
      expect(rFactorFunctions.TAPPLY(x, index, 'SUM')).toEqual({ a: 6, b: 10, c: 12 });
      expect(rFactorFunctions.TAPPLY(x, index, 'MIN')).toEqual({ a: 1, b: 2, c: 3 });
      expect(rFactorFunctions.TAPPLY(x, index, 'MAX')).toEqual({ a: 5, b: 8, c: 9 });
      expect(rFactorFunctions.TAPPLY(x, index, 'LENGTH')).toEqual({ a: 2, b: 2, c: 2 });
    });

    test('should handle variance and standard deviation', () => {
      const x = [1, 3, 2, 4]; // Two groups: [1,3] and [2,4]
      const index = ['a', 'a', 'b', 'b'];
      
      const varResult = rFactorFunctions.TAPPLY(x, index, 'VAR');
      expect(varResult.a).toBeCloseTo(2); // var([1,3]) = 2
      expect(varResult.b).toBeCloseTo(2); // var([2,4]) = 2
      
      const sdResult = rFactorFunctions.TAPPLY(x, index, 'SD');
      expect(sdResult.a).toBeCloseTo(Math.sqrt(2));
      expect(sdResult.b).toBeCloseTo(Math.sqrt(2));
    });

    test('should handle single value groups', () => {
      const x = [1, 2, 3];
      const index = ['a', 'b', 'c'];
      const result = rFactorFunctions.TAPPLY(x, index, 'VAR');
      expect(Object.values(result).every(v => isNaN(v))).toBe(true);
    });

    test('should use default function', () => {
      const x = [2, 4, 6, 8];
      const index = ['a', 'a', 'b', 'b'];
      const result = rFactorFunctions.TAPPLY(x, index); // Default: MEAN
      expect(result).toEqual({ a: 3, b: 7 });
    });
  });

  describe('AGGREGATE', () => {
    test('should be equivalent to TAPPLY', () => {
      const x = [10, 20, 30, 40];
      const by = ['x', 'y', 'x', 'y'];
      const tapplyResult = rFactorFunctions.TAPPLY(x, by, 'SUM');
      const aggregateResult = rFactorFunctions.AGGREGATE(x, by, 'SUM');
      expect(aggregateResult).toEqual(tapplyResult);
    });
  });

  // Categorical Data Analysis
  describe('CHISQ_TEST', () => {
    test('should perform chi-square goodness of fit test', () => {
      const observed = [10, 12, 8, 15];
      const expected = [11.25, 11.25, 11.25, 11.25];
      const result = rFactorFunctions.CHISQ_TEST(observed, expected);
      
      expect(result.statistic).toBeGreaterThan(0);
      expect(result.df).toBe(3);
      expect(typeof result.pvalue).toBe('number');
      expect(result.method).toBe('Chi-squared test');
    });

    test('should handle uniform expected frequencies', () => {
      const observed = [5, 10, 15, 20];
      const result = rFactorFunctions.CHISQ_TEST(observed);
      
      expect(result.statistic).toBeGreaterThan(0);
      expect(result.df).toBe(3);
    });

    test('should handle object input', () => {
      const observed = { a: 10, b: 15, c: 5 };
      const result = rFactorFunctions.CHISQ_TEST(observed);
      
      expect(result.statistic).toBeGreaterThan(0);
      expect(result.df).toBe(2);
    });

    test('should handle edge cases', () => {
      const result = rFactorFunctions.CHISQ_TEST([]);
      expect(isNaN(result.statistic)).toBe(true);
    });
  });

  // Interaction and Combination
  describe('INTERACTION', () => {
    test('should create interaction between factors', () => {
      const f1 = rFactorFunctions.FACTOR(['a', 'a', 'b', 'b']);
      const f2 = rFactorFunctions.FACTOR([1, 2, 1, 2]);
      const result = rFactorFunctions.INTERACTION(f1, f2);
      
      const labels = rFactorFunctions.AS_CHARACTEFACTOR(result);
      expect(labels).toEqual(['a.1', 'a.2', 'b.1', 'b.2']);
    });

    test('should handle non-factor inputs', () => {
      const result = rFactorFunctions.INTERACTION(['x', 'y'], [1, 2]);
      const labels = rFactorFunctions.AS_CHARACTEFACTOR(result);
      expect(labels).toEqual(['x.1', 'y.2']);
    });

    test('should handle single factor', () => {
      const result = rFactorFunctions.INTERACTION(['a', 'b']);
      expect(rFactorFunctions.IS_FACTOR(result)).toBe(true);
    });

    test('should handle empty input', () => {
      const result = rFactorFunctions.INTERACTION();
      expect(result.levels).toEqual([]);
    });
  });

  describe('EXPAND_GRID', () => {
    test('should create all combinations of vectors', () => {
      const result = rFactorFunctions.EXPAND_GRID(['a', 'b'], [1, 2]);
      expect(result.Var1).toEqual(['a', 'a', 'b', 'b']);
      expect(result.Var2).toEqual([1, 2, 1, 2]);
    });

    test('should handle three vectors', () => {
      const result = rFactorFunctions.EXPAND_GRID(['x', 'y'], [1, 2], ['A']);
      expect(result.Var1.length).toBe(4);
      expect(result.Var2.length).toBe(4);
      expect(result.Var3).toEqual(['A', 'A', 'A', 'A']);
    });

    test('should handle single vector', () => {
      const result = rFactorFunctions.EXPAND_GRID([1, 2, 3]);
      expect(result.Var1).toEqual([1, 2, 3]);
    });

    test('should handle empty input', () => {
      const result = rFactorFunctions.EXPAND_GRID();
      expect(result).toEqual({});
    });

    test('should handle single values', () => {
      const result = rFactorFunctions.EXPAND_GRID('a', 'b');
      expect(result.Var1).toEqual(['a']); // Single value creates single combination
      expect(result.Var2).toEqual(['b']);
    });
  });

  // Utility Functions
  describe('CUT', () => {
    test('should cut continuous variable into intervals', () => {
      const result = rFactorFunctions.CUT([1, 5, 3, 8, 2], [0, 3, 6, 10]);
      const labels = rFactorFunctions.AS_CHARACTEFACTOR(result);
      expect(labels.filter(l => l !== 'NA')).toHaveLength(5);
      expect(rFactorFunctions.IS_ORDERED(result)).toBe(true);
    });

    test('should handle include_lowest option', () => {
      const result = rFactorFunctions.CUT([1, 2, 3], [1, 2, 3], null, true);
      const labels = rFactorFunctions.AS_CHARACTEFACTOR(result);
      expect(labels[0]).toMatch(/^\[1/); // Should include 1 with include_lowest
    });

    test('should handle custom labels', () => {
      const result = rFactorFunctions.CUT([1, 5, 8], [0, 5, 10], ['low', 'high']);
      const labels = rFactorFunctions.AS_CHARACTEFACTOR(result);
      expect(labels).toEqual(['low', 'low', 'high']); // 5 is in (0,5] by right-closed convention
    });

    test('should handle single value', () => {
      const result = rFactorFunctions.CUT(5, [0, 10]);
      expect(rFactorFunctions.IS_FACTOR(result)).toBe(true);
    });

    test('should handle values outside breaks', () => {
      const result = rFactorFunctions.CUT([1, 5, 15], [2, 10]);
      const labels = rFactorFunctions.AS_CHARACTEFACTOR(result);
      expect(labels).toEqual(['NA', '(2,10]', 'NA']);
    });
  });

  // Comparison and Ordering
  describe('MATCH', () => {
    test('should find matching positions', () => {
      const result = rFactorFunctions.MATCH(['b', 'a', 'c'], ['a', 'b', 'c']);
      expect(result).toEqual([2, 1, 3]); // 1-indexed like R
    });

    test('should handle no matches', () => {
      const result = rFactorFunctions.MATCH(['x', 'y'], ['a', 'b'], 0);
      expect(result).toEqual([0, 0]);
    });

    test('should use default nomatch', () => {
      const result = rFactorFunctions.MATCH(['x'], ['a']);
      expect(result).toEqual([null]);
    });

    test('should handle single values', () => {
      const result = rFactorFunctions.MATCH('b', ['a', 'b', 'c']);
      expect(result).toEqual([2]);
    });
  });

  describe('PMATCH', () => {
    test('should perform partial matching', () => {
      const result = rFactorFunctions.PMATCH(['ap', 'ban'], ['apple', 'banana', 'cherry']);
      expect(result).toEqual([1, 2]);
    });

    test('should handle no partial matches', () => {
      const result = rFactorFunctions.PMATCH(['xy'], ['apple', 'banana'], 0);
      expect(result).toEqual([0]);
    });

    test('should match first occurrence', () => {
      const result = rFactorFunctions.PMATCH(['a'], ['apple', 'apricot', 'banana']);
      expect(result).toEqual([1]); // First match
    });

    test('should handle exact matches', () => {
      const result = rFactorFunctions.PMATCH(['apple'], ['apple', 'apricot']);
      expect(result).toEqual([1]);
    });
  });

  // R Compatibility Tests
  describe('R Compatibility', () => {
    test('factor creation should match R behavior', () => {
      // R: factor(c("a", "b", "a")) with levels in alphabetical order
      const result = rFactorFunctions.FACTOR(['a', 'b', 'a']);
      expect(result.levels).toEqual(['a', 'b']);
      expect(result.values).toEqual([0, 1, 0]);
    });

    test('levels() should match R behavior', () => {
      const factor = rFactorFunctions.FACTOR(['c', 'a', 'b']);
      expect(rFactorFunctions.LEVELS(factor)).toEqual(['a', 'b', 'c']); // Sorted
    });

    test('table() should match R behavior', () => {
      const result = rFactorFunctions.TABLE(['a', 'b', 'a', 'c', 'b', 'a']);
      expect(result).toEqual({ a: 3, b: 2, c: 1 });
    });

    test('tapply() should match R behavior', () => {
      // R: tapply(c(1,2,3,4), c("a","a","b","b"), mean)
      const result = rFactorFunctions.TAPPLY([1, 2, 3, 4], ['a', 'a', 'b', 'b'], 'MEAN');
      expect(result).toEqual({ a: 1.5, b: 3.5 });
    });

    test('split() should match R behavior', () => {
      // R: split(c(1,2,3,4), c("x","y","x","y"))
      const result = rFactorFunctions.SPLIT([1, 2, 3, 4], ['x', 'y', 'x', 'y']);
      expect(result).toEqual({ x: [1, 3], y: [2, 4] });
    });

    test('match() should use 1-based indexing like R', () => {
      // R: match(c("b","a"), c("a","b","c")) -> c(2, 1)
      const result = rFactorFunctions.MATCH(['b', 'a'], ['a', 'b', 'c']);
      expect(result).toEqual([2, 1]);
    });
  });

  // Edge Cases and Error Handling
  describe('Error Handling', () => {
    test('should handle null/undefined inputs', () => {
      expect(rFactorFunctions.FACTOR(null).levels).toEqual([]);
      expect(rFactorFunctions.LEVELS(null)).toEqual([]);
      expect(rFactorFunctions.TABLE(null)).toEqual({});
    });

    test('should handle empty arrays', () => {
      const factor = rFactorFunctions.FACTOR([]);
      expect(factor.levels).toEqual([]);
      expect(factor.values).toEqual([]);
      expect(factor.length).toBe(0);
    });

    test('should handle mixed type inputs', () => {
      const result = rFactorFunctions.FACTOR([1, 'a', true, 1]);
      expect(result.levels.length).toBeGreaterThan(0);
      expect(result.values.length).toBe(4);
    });

    test('should handle invalid factor operations gracefully', () => {
      expect(rFactorFunctions.DROPLEVELS('not a factor')).toBe('not a factor');
      expect(rFactorFunctions.RELEVEL('not a factor', 'x')).toBe('not a factor');
    });

    test('should handle division by zero in statistics', () => {
      const result = rFactorFunctions.TAPPLY([], [], 'MEAN');
      expect(Object.keys(result)).toHaveLength(0);
    });
  });
});