/**
 * Statistics Functions Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { statisticsFunctions } = require('../src/statistics-functions');

describe('Statistics Functions', () => {
  describe('AVERAGE', () => {
    it('should calculate the average of a list of numbers', () => {
      expect(statisticsFunctions.AVERAGE(1, 2, 3, 4, 5)).toBe(3);
    });

    it('should handle a single value', () => {
      expect(statisticsFunctions.AVERAGE(10)).toBe(10);
    });

    it('should handle an empty list', () => {
      expect(statisticsFunctions.AVERAGE()).toBe(0);
    });

    it('should handle non-numeric values', () => {
      expect(statisticsFunctions.AVERAGE(1, 'a', 2, 'b', 3)).toBe(2);
    });

    it('should handle nested arrays', () => {
      expect(statisticsFunctions.AVERAGE([1, 2], [3, 4])).toBe(2.5);
    });
  });

  describe('MEDIAN', () => {
    it('should calculate the median of an odd-sized list', () => {
      expect(statisticsFunctions.MEDIAN(1, 2, 5, 4, 3)).toBe(3);
    });

    it('should calculate the median of an even-sized list', () => {
      expect(statisticsFunctions.MEDIAN(1, 2, 6, 4, 3, 5)).toBe(3.5);
    });

    it('should handle a single value', () => {
      expect(statisticsFunctions.MEDIAN(10)).toBe(10);
    });

    it('should handle an empty list', () => {
      expect(statisticsFunctions.MEDIAN()).toBe(0);
    });

    it('should handle non-numeric values', () => {
      expect(statisticsFunctions.MEDIAN(1, 'a', 2, 'b', 5, 4, 3)).toBe(3);
    });
  });

  describe('MODE', () => {
    it('should find the mode of a list of numbers', () => {
      expect(statisticsFunctions.MODE(1, 2, 2, 3, 4, 4, 4, 5)).toBe(4);
    });

    it('should handle a single value', () => {
      expect(statisticsFunctions.MODE(10)).toBe(10);
    });

    it('should handle an empty list', () => {
      expect(statisticsFunctions.MODE()).toBe(0);
    });

    it('should handle non-numeric values', () => {
      expect(statisticsFunctions.MODE(1, 'a', 2, 'b', 2, 3)).toBe(2);
    });
  });

  describe('STDEV', () => {
    it('should calculate the standard deviation of a list of numbers', () => {
      expect(statisticsFunctions.STDEV(1, 2, 3, 4, 5)).toBeCloseTo(1.5811, 4);
    });

    it('should return 0 for a list with less than 2 values', () => {
      expect(statisticsFunctions.STDEV(10)).toBe(0);
    });

    it('should handle an empty list', () => {
      expect(statisticsFunctions.STDEV()).toBe(0);
    });

    it('should handle non-numeric values', () => {
      expect(statisticsFunctions.STDEV(1, 'a', 2, 'b', 3, 4, 5)).toBeCloseTo(1.5811, 4);
    });
  });

  describe('VAR', () => {
    it('should calculate the variance of a list of numbers', () => {
      expect(statisticsFunctions.VAR(1, 2, 3, 4, 5)).toBe(2.5);
    });

    it('should return 0 for a list with less than 2 values', () => {
      expect(statisticsFunctions.VAR(10)).toBe(0);
    });

    it('should handle an empty list', () => {
      expect(statisticsFunctions.VAR()).toBe(0);
    });

    it('should handle non-numeric values', () => {
      expect(statisticsFunctions.VAR(1, 'a', 2, 'b', 3, 4, 5)).toBe(2.5);
    });
  });

  describe('PERCENTILE', () => {
    it('should calculate the percentile of a list of numbers', () => {
      expect(statisticsFunctions.PERCENTILE([1, 2, 3, 4, 5], 0.5)).toBe(3);
    });

    it('should interpolate between values', () => {
      expect(statisticsFunctions.PERCENTILE([1, 2, 3, 4], 0.5)).toBe(2.5);
    });

    it('should handle a single value in the array', () => {
        expect(statisticsFunctions.PERCENTILE([10], 0.5)).toBe(10);
    });

    it('should handle an empty list', () => {
      expect(statisticsFunctions.PERCENTILE([], 0.5)).toBe(0);
    });

    it('should handle non-numeric values', () => {
      expect(statisticsFunctions.PERCENTILE([1, 'a', 2, 'b', 3, 4, 5], 0.5)).toBe(3);
    });

    it('should handle invalid percentile', () => {
        expect(statisticsFunctions.PERCENTILE([1, 2, 3, 4, 5], 1.5)).toBe(0);
        expect(statisticsFunctions.PERCENTILE([1, 2, 3, 4, 5], -0.5)).toBe(0);
    });
  });
});
