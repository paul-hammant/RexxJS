/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Tests for R-style numeric summary functions
 * Tests mirror R-language behavior and edge cases
 */

const { rSummaryFunctions } = require('../src/r-summary-functions.js');

describe('R-Style Summary Functions', () => {

  describe('Central Tendency Functions', () => {
    describe('MEAN', () => {
      test('should calculate mean of numeric array', () => {
        expect(rSummaryFunctions.MEAN([1, 2, 3, 4, 5])).toBe(3);
        expect(rSummaryFunctions.MEAN([10, 20, 30])).toBe(20);
      });

      test('should handle single values', () => {
        expect(rSummaryFunctions.MEAN(5)).toBe(5);
        expect(rSummaryFunctions.MEAN([5])).toBe(5);
      });

      test('should handle NaN values with na_rm parameter', () => {
        expect(rSummaryFunctions.MEAN([1, 2, NaN, 4])).toBeNaN();
        expect(rSummaryFunctions.MEAN([1, 2, NaN, 4], true)).toBeCloseTo(2.333333333333333, 10);
      });

      test('should handle string numbers', () => {
        expect(rSummaryFunctions.MEAN(['1', '2', '3'])).toBe(2);
      });

      test('should handle empty arrays', () => {
        expect(rSummaryFunctions.MEAN([])).toBeNaN();
      });
    });

    describe('MEDIAN', () => {
      test('should calculate median of odd-length array', () => {
        expect(rSummaryFunctions.MEDIAN([1, 2, 3, 4, 5])).toBe(3);
        expect(rSummaryFunctions.MEDIAN([5, 1, 3, 2, 4])).toBe(3);
      });

      test('should calculate median of even-length array', () => {
        expect(rSummaryFunctions.MEDIAN([1, 2, 3, 4])).toBe(2.5);
        expect(rSummaryFunctions.MEDIAN([1, 2, 4, 5])).toBe(3);
      });

      test('should handle NaN values', () => {
        expect(rSummaryFunctions.MEDIAN([1, 2, NaN, 4])).toBeNaN();
        expect(rSummaryFunctions.MEDIAN([1, 2, NaN, 4], true)).toBe(2);
      });

      test('should handle single values', () => {
        expect(rSummaryFunctions.MEDIAN(5)).toBe(5);
      });
    });
  });

  describe('Summation and Counting Functions', () => {
    describe('SUM', () => {
      test('should calculate sum of array', () => {
        expect(rSummaryFunctions.SUM([1, 2, 3, 4, 5])).toBe(15);
        expect(rSummaryFunctions.SUM([10, 20, 30])).toBe(60);
      });

      test('should handle negative numbers', () => {
        expect(rSummaryFunctions.SUM([-1, 2, -3, 4])).toBe(2);
      });

      test('should handle NaN values', () => {
        expect(rSummaryFunctions.SUM([1, 2, NaN, 4])).toBeNaN();
        expect(rSummaryFunctions.SUM([1, 2, NaN, 4], true)).toBe(7);
      });

      test('should handle empty arrays', () => {
        expect(rSummaryFunctions.SUM([])).toBe(0);
      });

      test('should handle single values', () => {
        expect(rSummaryFunctions.SUM(5)).toBe(5);
      });
    });

    describe('LENGTH', () => {
      test('should return length of arrays', () => {
        expect(rSummaryFunctions.LENGTH([1, 2, 3, 4, 5])).toBe(5);
        expect(rSummaryFunctions.LENGTH([])).toBe(0);
        expect(rSummaryFunctions.LENGTH([1])).toBe(1);
      });

      test('should return 1 for single values', () => {
        expect(rSummaryFunctions.LENGTH(5)).toBe(1);
        expect(rSummaryFunctions.LENGTH('test')).toBe(1);
      });

      test('should handle null and undefined', () => {
        expect(rSummaryFunctions.LENGTH(null)).toBe(0);
        expect(rSummaryFunctions.LENGTH(undefined)).toBe(0);
      });
    });
  });

  describe('Range Functions', () => {
    describe('MIN', () => {
      test('should find minimum value', () => {
        expect(rSummaryFunctions.MIN([1, 2, 3, 4, 5])).toBe(1);
        expect(rSummaryFunctions.MIN([5, 1, 3, 2, 4])).toBe(1);
      });

      test('should handle negative numbers', () => {
        expect(rSummaryFunctions.MIN([-5, -1, -3, -2])).toBe(-5);
      });

      test('should handle NaN values', () => {
        expect(rSummaryFunctions.MIN([1, 2, NaN, 4])).toBeNaN();
        expect(rSummaryFunctions.MIN([1, 2, NaN, 4], true)).toBe(1);
      });

      test('should handle single values', () => {
        expect(rSummaryFunctions.MIN(5)).toBe(5);
      });
    });

    describe('MAX', () => {
      test('should find maximum value', () => {
        expect(rSummaryFunctions.MAX([1, 2, 3, 4, 5])).toBe(5);
        expect(rSummaryFunctions.MAX([5, 1, 3, 2, 4])).toBe(5);
      });

      test('should handle negative numbers', () => {
        expect(rSummaryFunctions.MAX([-5, -1, -3, -2])).toBe(-1);
      });

      test('should handle NaN values', () => {
        expect(rSummaryFunctions.MAX([1, 2, NaN, 4])).toBeNaN();
        expect(rSummaryFunctions.MAX([1, 2, NaN, 4], true)).toBe(4);
      });

      test('should handle single values', () => {
        expect(rSummaryFunctions.MAX(5)).toBe(5);
      });
    });

    describe('RANGE', () => {
      test('should return min and max values', () => {
        expect(rSummaryFunctions.RANGE([1, 2, 3, 4, 5])).toEqual([1, 5]);
        expect(rSummaryFunctions.RANGE([5, 1, 3, 2, 4])).toEqual([1, 5]);
      });

      test('should handle negative numbers', () => {
        expect(rSummaryFunctions.RANGE([-5, -1, -3, -2])).toEqual([-5, -1]);
      });

      test('should handle NaN values', () => {
        expect(rSummaryFunctions.RANGE([1, 2, NaN, 4])).toEqual([NaN, NaN]);
        expect(rSummaryFunctions.RANGE([1, 2, NaN, 4], true)).toEqual([1, 4]);
      });
    });
  });

  describe('Variance and Standard Deviation', () => {
    describe('VAR', () => {
      test('should calculate sample variance', () => {
        expect(rSummaryFunctions.VAR([1, 2, 3, 4, 5])).toBe(2.5);
        expect(rSummaryFunctions.VAR([2, 4, 6, 8])).toBe(20/3);
      });

      test('should handle arrays with length < 2', () => {
        expect(rSummaryFunctions.VAR([5])).toBeNaN();
        expect(rSummaryFunctions.VAR([])).toBeNaN();
      });

      test('should handle NaN values', () => {
        expect(rSummaryFunctions.VAR([1, 2, NaN, 4])).toBeNaN();
        expect(rSummaryFunctions.VAR([1, 2, NaN, 4], true)).toBeCloseTo(2.333333333333333, 3);
      });
    });

    describe('SD', () => {
      test('should calculate sample standard deviation', () => {
        expect(rSummaryFunctions.SD([1, 2, 3, 4, 5])).toBeCloseTo(Math.sqrt(2.5), 10);
        expect(rSummaryFunctions.SD([2, 4, 6, 8])).toBeCloseTo(Math.sqrt(20/3), 10);
      });

      test('should handle arrays with length < 2', () => {
        expect(rSummaryFunctions.SD([5])).toBeNaN();
        expect(rSummaryFunctions.SD([])).toBeNaN();
      });

      test('should handle NaN values', () => {
        expect(rSummaryFunctions.SD([1, 2, NaN, 4])).toBeNaN();
        expect(rSummaryFunctions.SD([1, 2, NaN, 4], true)).toBeCloseTo(Math.sqrt(2.333333333333333), 10);
      });
    });
  });

  describe('Quantile Functions', () => {
    describe('QUANTILE', () => {
      test('should calculate single quantiles', () => {
        const data = [1, 2, 3, 4, 5];
        expect(rSummaryFunctions.QUANTILE(data, 0.5)).toBe(3);
        expect(rSummaryFunctions.QUANTILE(data, 0.25)).toBe(2);
        expect(rSummaryFunctions.QUANTILE(data, 0.75)).toBe(4);
      });

      test('should calculate multiple quantiles', () => {
        const data = [1, 2, 3, 4, 5];
        const result = rSummaryFunctions.QUANTILE(data, [0.25, 0.5, 0.75]);
        expect(result).toEqual([2, 3, 4]);
      });

      test('should handle boundary cases', () => {
        const data = [1, 2, 3, 4, 5];
        expect(rSummaryFunctions.QUANTILE(data, 0)).toBe(1);
        expect(rSummaryFunctions.QUANTILE(data, 1)).toBe(5);
      });

      test('should handle default quantiles', () => {
        const data = [1, 2, 3, 4, 5];
        const result = rSummaryFunctions.QUANTILE(data);
        expect(result).toEqual([1, 2, 3, 4, 5]);
      });

      test('should handle invalid probabilities', () => {
        const data = [1, 2, 3, 4, 5];
        expect(rSummaryFunctions.QUANTILE(data, [-0.1, 1.1])).toEqual([NaN, NaN]);
      });

      test('should handle NaN values', () => {
        const data = [1, 2, NaN, 4, 5];
        expect(rSummaryFunctions.QUANTILE(data, 0.5)).toBeNaN();
        expect(rSummaryFunctions.QUANTILE(data, 0.5, true)).toBe(3);
      });
    });
  });

  describe('Summary Function', () => {
    describe('SUMMARY', () => {
      test('should provide complete statistical summary', () => {
        const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const result = rSummaryFunctions.SUMMARY(data);
        
        expect(result['Min']).toBe(1);
        expect(result['Max']).toBe(10);
        expect(result['Mean']).toBe(5.5);
        expect(result['Median']).toBe(5.5);
        expect(result['1st Qu']).toBe(3.25);
        expect(result['3rd Qu']).toBe(7.75);
      });

      test('should handle NaN values', () => {
        const data = [1, 2, NaN, 4, 5];
        const result = rSummaryFunctions.SUMMARY(data);
        
        expect(result['Min']).toBeNaN();
        expect(result['Max']).toBeNaN();
        expect(result['Mean']).toBeNaN();
        expect(result['Median']).toBeNaN();
        
        const resultWithNaRm = rSummaryFunctions.SUMMARY(data, true);
        expect(resultWithNaRm['Min']).toBe(1);
        expect(resultWithNaRm['Max']).toBe(5);
        expect(resultWithNaRm['Mean']).toBe(3);
      });
    });
  });

  describe('Additional Statistical Functions', () => {
    describe('IQR', () => {
      test('should calculate interquartile range', () => {
        const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        expect(rSummaryFunctions.IQR(data)).toBe(4.5); // 7.75 - 3.25
      });

      test('should handle NaN values', () => {
        const data = [1, 2, NaN, 4, 5];
        expect(rSummaryFunctions.IQR(data)).toBeNaN();
        expect(rSummaryFunctions.IQR(data, true)).toBe(2.5);
      });
    });

    describe('MAD', () => {
      test('should calculate median absolute deviation', () => {
        const data = [1, 2, 3, 4, 5];
        const result = rSummaryFunctions.MAD(data);
        expect(result).toBeCloseTo(1.4826, 4);
      });

      test('should handle custom center and constant', () => {
        const data = [1, 2, 3, 4, 5];
        const result = rSummaryFunctions.MAD(data, 3, 1);
        expect(result).toBe(1); // median of |x - 3|
      });
    });

    describe('FIVENUM', () => {
      test('should return five number summary', () => {
        const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const result = rSummaryFunctions.FIVENUM(data);
        
        expect(result[0]).toBe(1);   // min
        expect(result[1]).toBe(3.25); // Q1
        expect(result[2]).toBe(5.5);  // median
        expect(result[3]).toBe(7.75); // Q3
        expect(result[4]).toBe(10);   // max
      });
    });
  });

  describe('Cumulative Functions', () => {
    describe('CUMSUM', () => {
      test('should calculate cumulative sum', () => {
        expect(rSummaryFunctions.CUMSUM([1, 2, 3, 4, 5])).toEqual([1, 3, 6, 10, 15]);
        expect(rSummaryFunctions.CUMSUM([10, 20, 30])).toEqual([10, 30, 60]);
      });

      test('should handle negative numbers', () => {
        expect(rSummaryFunctions.CUMSUM([1, -2, 3, -4])).toEqual([1, -1, 2, -2]);
      });

      test('should handle NaN values', () => {
        expect(rSummaryFunctions.CUMSUM([1, NaN, 3])).toEqual([1, NaN, NaN]);
      });

      test('should handle single values', () => {
        expect(rSummaryFunctions.CUMSUM(5)).toEqual([5]);
      });
    });

    describe('CUMPROD', () => {
      test('should calculate cumulative product', () => {
        expect(rSummaryFunctions.CUMPROD([1, 2, 3, 4])).toEqual([1, 2, 6, 24]);
        expect(rSummaryFunctions.CUMPROD([2, 3, 4])).toEqual([2, 6, 24]);
      });

      test('should handle zeros', () => {
        expect(rSummaryFunctions.CUMPROD([1, 0, 3, 4])).toEqual([1, 0, 0, 0]);
      });

      test('should handle NaN values', () => {
        expect(rSummaryFunctions.CUMPROD([1, NaN, 3])).toEqual([1, NaN, NaN]);
      });
    });

    describe('CUMMAX', () => {
      test('should calculate cumulative maximum', () => {
        expect(rSummaryFunctions.CUMMAX([1, 3, 2, 5, 4])).toEqual([1, 3, 3, 5, 5]);
        expect(rSummaryFunctions.CUMMAX([5, 4, 3, 2, 1])).toEqual([5, 5, 5, 5, 5]);
      });

      test('should handle negative numbers', () => {
        expect(rSummaryFunctions.CUMMAX([-5, -1, -3, -2])).toEqual([-5, -1, -1, -1]);
      });
    });

    describe('CUMMIN', () => {
      test('should calculate cumulative minimum', () => {
        expect(rSummaryFunctions.CUMMIN([5, 3, 4, 1, 2])).toEqual([5, 3, 3, 1, 1]);
        expect(rSummaryFunctions.CUMMIN([1, 2, 3, 4, 5])).toEqual([1, 1, 1, 1, 1]);
      });

      test('should handle negative numbers', () => {
        expect(rSummaryFunctions.CUMMIN([-1, -5, -2, -3])).toEqual([-1, -5, -5, -5]);
      });
    });
  });

  describe('Difference Function', () => {
    describe('DIFF', () => {
      test('should calculate first differences', () => {
        expect(rSummaryFunctions.DIFF([1, 3, 6, 10])).toEqual([2, 3, 4]);
        expect(rSummaryFunctions.DIFF([10, 8, 6, 4])).toEqual([-2, -2, -2]);
      });

      test('should handle custom lag', () => {
        expect(rSummaryFunctions.DIFF([1, 2, 3, 4, 5, 6], 2)).toEqual([2, 2, 2, 2]);
      });

      test('should handle second differences', () => {
        expect(rSummaryFunctions.DIFF([1, 4, 9, 16], 1, 2)).toEqual([2, 2]);
      });

      test('should handle single values and empty arrays', () => {
        expect(rSummaryFunctions.DIFF([5])).toEqual([]);
        expect(rSummaryFunctions.DIFF([])).toEqual([]);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid inputs gracefully', () => {
      expect(rSummaryFunctions.MEAN('not-an-array')).toBeNaN();
      expect(rSummaryFunctions.SUM(null)).toBeNaN();
      expect(rSummaryFunctions.MAX(undefined)).toBeNaN();
    });

    test('should handle mixed data types', () => {
      expect(rSummaryFunctions.MEAN([1, '2', 3, 'invalid', 5], true)).toBeCloseTo(2.75, 2);
      expect(rSummaryFunctions.SUM(['1', '2', '3'])).toBe(6);
    });
  });

  describe('Parameter Handling', () => {
    test('should handle na_rm parameter correctly', () => {
      const dataWithNaN = [1, 2, NaN, 4, 5];
      
      // Without na_rm (default false)
      expect(rSummaryFunctions.MEAN(dataWithNaN)).toBeNaN();
      expect(rSummaryFunctions.SUM(dataWithNaN)).toBeNaN();
      expect(rSummaryFunctions.MIN(dataWithNaN)).toBeNaN();
      expect(rSummaryFunctions.MAX(dataWithNaN)).toBeNaN();
      
      // With na_rm = true
      expect(rSummaryFunctions.MEAN(dataWithNaN, true)).toBe(3);
      expect(rSummaryFunctions.SUM(dataWithNaN, true)).toBe(12);
      expect(rSummaryFunctions.MIN(dataWithNaN, true)).toBe(1);
      expect(rSummaryFunctions.MAX(dataWithNaN, true)).toBe(5);
    });

    test('should handle string boolean parameters', () => {
      const dataWithNaN = [1, 2, NaN, 4, 5];
      expect(rSummaryFunctions.MEAN(dataWithNaN, 'true')).toBe(3);
      expect(rSummaryFunctions.MEAN(dataWithNaN, false)).toBeNaN();
    });
  });
});