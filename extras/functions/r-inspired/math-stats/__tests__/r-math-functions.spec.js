/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Tests for R Mathematical & Statistical Computing Functions
 */

const { rMathFunctions } = require('../r-math-functions.js');

describe('R Mathematical & Statistical Computing Functions', () => {
  describe('ABS', () => {
    test('should return absolute values', () => {
      expect(rMathFunctions.ABS(5)).toBe(5);
      expect(rMathFunctions.ABS(-5)).toBe(5);
      expect(rMathFunctions.ABS(0)).toBe(0);
      expect(rMathFunctions.ABS(-3.14)).toBeCloseTo(3.14);
    });

    test('should handle arrays', () => {
      expect(rMathFunctions.ABS([-5, 0, 5])).toEqual([5, 0, 5]);
    });

    test('should handle invalid inputs', () => {
      expect(rMathFunctions.ABS(null)).toBe(null);
      expect(rMathFunctions.ABS('abc')).toBeNaN();
    });
  });

  describe('SQRT', () => {
    test('should calculate square roots', () => {
      expect(rMathFunctions.SQRT(4)).toBe(2);
      expect(rMathFunctions.SQRT(9)).toBe(3);
      expect(rMathFunctions.SQRT(2)).toBeCloseTo(1.414, 3);
    });

    test('should handle arrays', () => {
      const result = rMathFunctions.SQRT([4, 9, 16]);
      expect(result).toEqual([2, 3, 4]);
    });

    test('should handle negative numbers', () => {
      expect(rMathFunctions.SQRT(-4)).toBeNaN();
    });

    test('should handle edge cases', () => {
      expect(rMathFunctions.SQRT(0)).toBe(0);
      expect(rMathFunctions.SQRT(1)).toBe(1);
      expect(rMathFunctions.SQRT(null)).toBe(null);
    });
  });

  describe('EXP', () => {
    test('should calculate exponentials', () => {
      expect(rMathFunctions.EXP(0)).toBe(1);
      expect(rMathFunctions.EXP(1)).toBeCloseTo(Math.E, 5);
      expect(rMathFunctions.EXP(2)).toBeCloseTo(Math.E * Math.E, 5);
    });

    test('should handle arrays', () => {
      const result = rMathFunctions.EXP([0, 1]);
      expect(result[0]).toBe(1);
      expect(result[1]).toBeCloseTo(Math.E, 5);
    });
  });

  describe('LOG', () => {
    test('should calculate natural logarithms by default', () => {
      expect(rMathFunctions.LOG(1)).toBe(0);
      expect(rMathFunctions.LOG(Math.E)).toBeCloseTo(1, 5);
      expect(rMathFunctions.LOG(Math.E * Math.E)).toBeCloseTo(2, 5);
    });

    test('should handle custom bases', () => {
      expect(rMathFunctions.LOG(8, 2)).toBeCloseTo(3, 5);
      expect(rMathFunctions.LOG(100, 10)).toBeCloseTo(2, 5);
      expect(rMathFunctions.LOG(1000, 10)).toBeCloseTo(3, 5);
    });

    test('should handle invalid inputs', () => {
      expect(rMathFunctions.LOG(0)).toBeNaN();
      expect(rMathFunctions.LOG(-1)).toBeNaN();
      expect(rMathFunctions.LOG(5, 1)).toBeNaN();
      expect(rMathFunctions.LOG(5, 0)).toBeNaN();
    });

    test('should handle arrays', () => {
      const result = rMathFunctions.LOG([1, Math.E]);
      expect(result[0]).toBe(0);
      expect(result[1]).toBeCloseTo(1, 5);
    });
  });

  describe('LOG10 and LOG2', () => {
    test('LOG10 should calculate base-10 logarithms', () => {
      expect(rMathFunctions.LOG10(1)).toBe(0);
      expect(rMathFunctions.LOG10(10)).toBeCloseTo(1, 5);
      expect(rMathFunctions.LOG10(100)).toBeCloseTo(2, 5);
    });

    test('LOG2 should calculate base-2 logarithms', () => {
      expect(rMathFunctions.LOG2(1)).toBe(0);
      expect(rMathFunctions.LOG2(2)).toBeCloseTo(1, 5);
      expect(rMathFunctions.LOG2(8)).toBeCloseTo(3, 5);
    });
  });

  describe('POW', () => {
    test('should calculate powers', () => {
      expect(rMathFunctions.POW(2, 3)).toBe(8);
      expect(rMathFunctions.POW(5, 2)).toBe(25);
      expect(rMathFunctions.POW(2, 0)).toBe(1);
      expect(rMathFunctions.POW(0, 0)).toBe(1);
    });

    test('should handle arrays', () => {
      expect(rMathFunctions.POW([2, 3], [2, 2])).toEqual([4, 9]);
      expect(rMathFunctions.POW([2, 4], 2)).toEqual([4, 16]);
      expect(rMathFunctions.POW(2, [1, 2, 3])).toEqual([2, 4, 8]);
    });

    test('should handle negative exponents', () => {
      expect(rMathFunctions.POW(2, -1)).toBe(0.5);
      expect(rMathFunctions.POW(4, -0.5)).toBe(0.5);
    });
  });

  describe('Trigonometric Functions', () => {
    test('SIN should calculate sine values', () => {
      expect(rMathFunctions.SIN(0)).toBe(0);
      expect(rMathFunctions.SIN(Math.PI / 2)).toBeCloseTo(1, 5);
      expect(rMathFunctions.SIN(Math.PI)).toBeCloseTo(0, 5);
    });

    test('COS should calculate cosine values', () => {
      expect(rMathFunctions.COS(0)).toBe(1);
      expect(rMathFunctions.COS(Math.PI / 2)).toBeCloseTo(0, 5);
      expect(rMathFunctions.COS(Math.PI)).toBeCloseTo(-1, 5);
    });

    test('TAN should calculate tangent values', () => {
      expect(rMathFunctions.TAN(0)).toBe(0);
      expect(rMathFunctions.TAN(Math.PI / 4)).toBeCloseTo(1, 5);
      expect(rMathFunctions.TAN(Math.PI)).toBeCloseTo(0, 5);
    });

    test('should handle arrays for trigonometric functions', () => {
      const angles = [0, Math.PI / 2];
      expect(rMathFunctions.SIN(angles)[0]).toBe(0);
      expect(rMathFunctions.SIN(angles)[1]).toBeCloseTo(1, 5);
    });
  });

  describe('Inverse Trigonometric Functions', () => {
    test('ASIN should calculate arcsine', () => {
      expect(rMathFunctions.ASIN(0)).toBe(0);
      expect(rMathFunctions.ASIN(1)).toBeCloseTo(Math.PI / 2, 5);
      expect(rMathFunctions.ASIN(-1)).toBeCloseTo(-Math.PI / 2, 5);
    });

    test('ACOS should calculate arccosine', () => {
      expect(rMathFunctions.ACOS(1)).toBe(0);
      expect(rMathFunctions.ACOS(0)).toBeCloseTo(Math.PI / 2, 5);
      expect(rMathFunctions.ACOS(-1)).toBeCloseTo(Math.PI, 5);
    });

    test('ATAN should calculate arctangent', () => {
      expect(rMathFunctions.ATAN(0)).toBe(0);
      expect(rMathFunctions.ATAN(1)).toBeCloseTo(Math.PI / 4, 5);
    });

    test('should handle out-of-range inputs for ASIN/ACOS', () => {
      expect(rMathFunctions.ASIN(2)).toBeNaN();
      expect(rMathFunctions.ASIN(-2)).toBeNaN();
      expect(rMathFunctions.ACOS(2)).toBeNaN();
      expect(rMathFunctions.ACOS(-2)).toBeNaN();
    });
  });

  describe('ATAN2', () => {
    test('should calculate two-argument arctangent', () => {
      expect(rMathFunctions.ATAN2(1, 1)).toBeCloseTo(Math.PI / 4, 5);
      expect(rMathFunctions.ATAN2(1, 0)).toBeCloseTo(Math.PI / 2, 5);
      expect(rMathFunctions.ATAN2(0, 1)).toBe(0);
      expect(rMathFunctions.ATAN2(-1, -1)).toBeCloseTo(-3 * Math.PI / 4, 5);
    });

    test('should handle arrays', () => {
      const result = rMathFunctions.ATAN2([1, 0], [1, 1]);
      expect(result[0]).toBeCloseTo(Math.PI / 4, 5);
      expect(result[1]).toBe(0);
    });
  });

  describe('Hyperbolic Functions', () => {
    test('SINH should calculate hyperbolic sine', () => {
      expect(rMathFunctions.SINH(0)).toBe(0);
      expect(rMathFunctions.SINH(1)).toBeCloseTo((Math.E - 1/Math.E) / 2, 5);
    });

    test('COSH should calculate hyperbolic cosine', () => {
      expect(rMathFunctions.COSH(0)).toBe(1);
      expect(rMathFunctions.COSH(1)).toBeCloseTo((Math.E + 1/Math.E) / 2, 5);
    });

    test('TANH should calculate hyperbolic tangent', () => {
      expect(rMathFunctions.TANH(0)).toBe(0);
      expect(rMathFunctions.TANH(Infinity)).toBe(1);
      expect(rMathFunctions.TANH(-Infinity)).toBe(-1);
    });
  });

  describe('Rounding Functions', () => {
    test('CEILING should round up', () => {
      expect(rMathFunctions.CEILING(3.2)).toBe(4);
      expect(rMathFunctions.CEILING(3.8)).toBe(4);
      expect(rMathFunctions.CEILING(-3.2)).toBe(-3);
      expect(rMathFunctions.CEILING(3)).toBe(3);
    });

    test('FLOOR should round down', () => {
      expect(rMathFunctions.FLOOR(3.2)).toBe(3);
      expect(rMathFunctions.FLOOR(3.8)).toBe(3);
      expect(rMathFunctions.FLOOR(-3.2)).toBe(-4);
      expect(rMathFunctions.FLOOR(3)).toBe(3);
    });

    test('ROUND should round to nearest', () => {
      expect(rMathFunctions.ROUND(3.2)).toBe(3);
      expect(rMathFunctions.ROUND(3.8)).toBe(4);
      expect(rMathFunctions.ROUND(3.5)).toBe(4);
      expect(rMathFunctions.ROUND(-3.5)).toBe(-4);
    });

    test('ROUND should handle digits parameter', () => {
      expect(rMathFunctions.ROUND(3.14159, 2)).toBe(3.14);
      expect(rMathFunctions.ROUND(3.14159, 4)).toBe(3.1416);
      expect(rMathFunctions.ROUND(1234.5, -1)).toBe(1230);
      expect(rMathFunctions.ROUND(1234.5, -2)).toBe(1200);
    });

    test('TRUNC should truncate towards zero', () => {
      expect(rMathFunctions.TRUNC(3.8)).toBe(3);
      expect(rMathFunctions.TRUNC(-3.8)).toBe(-3);
      expect(rMathFunctions.TRUNC(0)).toBe(0);
    });
  });

  describe('SIGNIF', () => {
    test('should round to significant digits', () => {
      expect(rMathFunctions.SIGNIF(123.456, 4)).toBeCloseTo(123.5, 1);
      expect(rMathFunctions.SIGNIF(0.0012345, 3)).toBeCloseTo(0.00123, 5);
      expect(rMathFunctions.SIGNIF(12345, 3)).toBe(12300);
    });

    test('should handle default digits', () => {
      expect(rMathFunctions.SIGNIF(123.456789)).toBeCloseTo(123.457, 3);
    });

    test('should handle zero', () => {
      expect(rMathFunctions.SIGNIF(0)).toBe(0);
    });
  });

  describe('Vector Operations', () => {
    test('CUMSUM should calculate cumulative sums', () => {
      expect(rMathFunctions.CUMSUM([1, 2, 3, 4])).toEqual([1, 3, 6, 10]);
      expect(rMathFunctions.CUMSUM([5])).toEqual([5]);
      expect(rMathFunctions.CUMSUM([])).toEqual([]);
    });

    test('CUMPROD should calculate cumulative products', () => {
      expect(rMathFunctions.CUMPROD([1, 2, 3, 4])).toEqual([1, 2, 6, 24]);
      expect(rMathFunctions.CUMPROD([2, 2, 2])).toEqual([2, 4, 8]);
    });

    test('CUMMAX should calculate cumulative maximums', () => {
      expect(rMathFunctions.CUMMAX([1, 3, 2, 5, 4])).toEqual([1, 3, 3, 5, 5]);
      expect(rMathFunctions.CUMMAX([5, 4, 3, 2, 1])).toEqual([5, 5, 5, 5, 5]);
    });

    test('CUMMIN should calculate cumulative minimums', () => {
      expect(rMathFunctions.CUMMIN([5, 3, 4, 1, 2])).toEqual([5, 3, 3, 1, 1]);
      expect(rMathFunctions.CUMMIN([1, 2, 3, 4, 5])).toEqual([1, 1, 1, 1, 1]);
    });

    test('DIFF should calculate differences', () => {
      expect(rMathFunctions.DIFF([1, 3, 6, 10])).toEqual([2, 3, 4]);
      expect(rMathFunctions.DIFF([10, 8, 6, 4])).toEqual([-2, -2, -2]);
    });

    test('DIFF should handle lag parameter', () => {
      expect(rMathFunctions.DIFF([1, 2, 3, 4, 5], 2)).toEqual([2, 2, 2]);
    });
  });

  describe('Mathematical Constants', () => {
    test('PI should return pi', () => {
      expect(rMathFunctions.PI()).toBe(Math.PI);
    });

    test('E should return e', () => {
      expect(rMathFunctions.E()).toBe(Math.E);
    });
  });

  describe('PSUM and PROD', () => {
    test('PSUM should calculate parallel sums', () => {
      expect(rMathFunctions.PSUM([1, 2, 3, 4])).toBe(10);
      expect(rMathFunctions.PSUM([1, NaN, 3], true)).toBe(4);
      expect(rMathFunctions.PSUM([1, NaN, 3], false)).toBeNaN();
    });

    test('PROD should calculate products', () => {
      expect(rMathFunctions.PROD([2, 3, 4])).toBe(24);
      expect(rMathFunctions.PROD([1, 0, 5])).toBe(0);
      expect(rMathFunctions.PROD([2, NaN, 3], true)).toBe(6);
      expect(rMathFunctions.PROD([2, NaN, 3], false)).toBeNaN();
    });
  });

  describe('Range and Extremes', () => {
    test('PMIN should find parallel minimums', () => {
      expect(rMathFunctions.PMIN(1, 2, 3)).toBe(1);
      expect(rMathFunctions.PMIN([1, 5], [3, 2])).toBe(1);
      expect(rMathFunctions.PMIN(-5, 0, 10)).toBe(-5);
    });

    test('PMAX should find parallel maximums', () => {
      expect(rMathFunctions.PMAX(1, 2, 3)).toBe(3);
      expect(rMathFunctions.PMAX([1, 5], [3, 2])).toBe(5);
      expect(rMathFunctions.PMAX(-5, 0, 10)).toBe(10);
    });

    test('RANGE should return min and max', () => {
      expect(rMathFunctions.RANGE([1, 5, 2, 8, 3])).toEqual([1, 8]);
      expect(rMathFunctions.RANGE([0])).toEqual([0, 0]);
      expect(rMathFunctions.RANGE([5, NaN, 2], true)).toEqual([2, 5]);
    });
  });

  describe('Special Mathematical Functions', () => {
    test('GAMMA should calculate gamma function', () => {
      expect(rMathFunctions.GAMMA(1)).toBeCloseTo(1, 5);
      expect(rMathFunctions.GAMMA(2)).toBeCloseTo(1, 5);
      expect(rMathFunctions.GAMMA(3)).toBeCloseTo(2, 5);
      expect(rMathFunctions.GAMMA(4)).toBeCloseTo(6, 5);
      expect(rMathFunctions.GAMMA(0.5)).toBeCloseTo(Math.sqrt(Math.PI), 3);
    });

    test('LGAMMA should calculate log gamma', () => {
      expect(rMathFunctions.LGAMMA(1)).toBeCloseTo(0, 5);
      expect(rMathFunctions.LGAMMA(2)).toBeCloseTo(0, 5);
      expect(rMathFunctions.LGAMMA(3)).toBeCloseTo(Math.log(2), 5);
    });

    test('FACTORIAL should calculate factorials', () => {
      expect(rMathFunctions.FACTORIAL(0)).toBe(1);
      expect(rMathFunctions.FACTORIAL(1)).toBe(1);
      expect(rMathFunctions.FACTORIAL(2)).toBeCloseTo(2, 5);
      expect(rMathFunctions.FACTORIAL(3)).toBeCloseTo(6, 5);
      expect(rMathFunctions.FACTORIAL(4)).toBeCloseTo(24, 5);
      expect(rMathFunctions.FACTORIAL(5)).toBeCloseTo(120, 5);
    });

    test('FACTORIAL should handle invalid inputs', () => {
      expect(rMathFunctions.FACTORIAL(-1)).toBeNaN();
      expect(rMathFunctions.FACTORIAL(1.5)).toBeNaN();
    });

    test('CHOOSE should calculate binomial coefficients', () => {
      expect(rMathFunctions.CHOOSE(5, 2)).toBeCloseTo(10, 5);
      expect(rMathFunctions.CHOOSE(10, 3)).toBeCloseTo(120, 5);
      expect(rMathFunctions.CHOOSE(4, 0)).toBe(1);
      expect(rMathFunctions.CHOOSE(4, 4)).toBe(1);
    });

    test('CHOOSE should handle arrays', () => {
      expect(rMathFunctions.CHOOSE([5, 4], [2, 2])).toEqual([10, 6]);
    });
  });

  describe('Complex Number Functions', () => {
    test('COMPLEX should create complex numbers', () => {
      const c = rMathFunctions.COMPLEX(3, 4);
      expect(c.real).toBe(3);
      expect(c.imaginary).toBe(4);
      expect(c.type).toBe('complex');
    });

    test('COMPLEX should handle default imaginary part', () => {
      const c = rMathFunctions.COMPLEX(5);
      expect(c.real).toBe(5);
      expect(c.imaginary).toBe(0);
    });

    test('RE should extract real part', () => {
      const c = rMathFunctions.COMPLEX(3, 4);
      expect(rMathFunctions.RE(c)).toBe(3);
      expect(rMathFunctions.RE(5)).toBe(5);
      expect(rMathFunctions.RE([c, 7])).toEqual([3, 7]);
    });

    test('IM should extract imaginary part', () => {
      const c = rMathFunctions.COMPLEX(3, 4);
      expect(rMathFunctions.IM(c)).toBe(4);
      expect(rMathFunctions.IM(5)).toBe(0);
      expect(rMathFunctions.IM([c, 7])).toEqual([4, 0]);
    });
  });

  describe('MOD', () => {
    test('should calculate modulo', () => {
      expect(rMathFunctions.MOD(7, 3)).toBe(1);
      expect(rMathFunctions.MOD(10, 4)).toBe(2);
      expect(rMathFunctions.MOD(8, 2)).toBe(0);
    });

    test('should handle negative numbers like R', () => {
      expect(rMathFunctions.MOD(-7, 3)).toBe(2); // R behavior: (-7 %% 3) = 2
      expect(rMathFunctions.MOD(7, -3)).toBe(-2); // R behavior: (7 %% -3) = -2
    });

    test('should handle arrays', () => {
      expect(rMathFunctions.MOD([7, 8, 9], [3, 3, 3])).toEqual([1, 2, 0]);
      expect(rMathFunctions.MOD([10, 11], 3)).toEqual([1, 2]);
    });

    test('should handle division by zero', () => {
      expect(rMathFunctions.MOD(5, 0)).toBeNaN();
    });
  });

  describe('SIGN', () => {
    test('should return sign of numbers', () => {
      expect(rMathFunctions.SIGN(5)).toBe(1);
      expect(rMathFunctions.SIGN(-3)).toBe(-1);
      expect(rMathFunctions.SIGN(0)).toBe(0);
      expect(rMathFunctions.SIGN(-0)).toBe(0);
    });

    test('should handle arrays', () => {
      expect(rMathFunctions.SIGN([-5, 0, 5, -1.5, 2.7])).toEqual([-1, 0, 1, -1, 1]);
    });

    test('should handle edge cases', () => {
      expect(rMathFunctions.SIGN(null)).toBe(null);
      expect(rMathFunctions.SIGN('abc')).toBeNaN();
    });
  });

  describe('Error Handling', () => {
    test('should handle null inputs consistently', () => {
      expect(rMathFunctions.ABS(null)).toBe(null);
      expect(rMathFunctions.SQRT(null)).toBe(null);
      expect(rMathFunctions.SIN(null)).toBe(null);
      expect(rMathFunctions.GAMMA(null)).toBe(null);
    });

    test('should handle undefined inputs consistently', () => {
      expect(rMathFunctions.ABS(undefined)).toBe(null);
      expect(rMathFunctions.LOG(undefined)).toBe(null);
      expect(rMathFunctions.POW(undefined, 2)).toBe(null);
    });

    test('should handle string inputs that are not numbers', () => {
      expect(rMathFunctions.ABS('hello')).toBeNaN();
      expect(rMathFunctions.SQRT('world')).toBeNaN();
      expect(rMathFunctions.SIN('test')).toBeNaN();
    });

    test('should handle empty arrays', () => {
      expect(rMathFunctions.CUMSUM([])).toEqual([]);
      expect(rMathFunctions.CUMPROD([])).toEqual([]);
      expect(rMathFunctions.DIFF([])).toEqual([]);
    });
  });

  describe('Array Broadcasting', () => {
    test('should handle vector recycling like R', () => {
      expect(rMathFunctions.POW([2, 3, 4], [2, 3])).toEqual([4, 27, 16]); // [2^2, 3^3, 4^2]
      expect(rMathFunctions.MOD([7, 8, 9, 10], [3, 4])).toEqual([1, 0, 0, 2]); // [7%3, 8%4, 9%3, 10%4]
    });
  });

  describe('Mathematical Edge Cases', () => {
    test('should handle infinity correctly', () => {
      expect(rMathFunctions.ABS(Infinity)).toBe(Infinity);
      expect(rMathFunctions.ABS(-Infinity)).toBe(Infinity);
      expect(rMathFunctions.SIGN(Infinity)).toBe(1);
      expect(rMathFunctions.SIGN(-Infinity)).toBe(-1);
    });

    test('should handle very large numbers', () => {
      const large = 1e100;
      expect(rMathFunctions.ABS(-large)).toBe(large);
      expect(rMathFunctions.SIGN(large)).toBe(1);
    });

    test('should handle very small numbers', () => {
      const small = 1e-100;
      expect(rMathFunctions.ABS(small)).toBe(small);
      expect(rMathFunctions.SIGN(small)).toBe(1);
      expect(rMathFunctions.SIGN(-small)).toBe(-1);
    });
  });

  describe('R Compatibility', () => {
    test('mathematical operations should match R behavior', () => {
      // Test some R-specific behaviors
      expect(rMathFunctions.MOD(-1, 5)).toBe(4); // R: (-1 %% 5) = 4
      expect(rMathFunctions.SIGNIF(123.456, 4)).toBeCloseTo(123.5, 1);
      expect(rMathFunctions.GAMMA(0.5)).toBeCloseTo(Math.sqrt(Math.PI), 3);
    });

    test('should handle NaN propagation like R', () => {
      expect(rMathFunctions.PSUM([1, NaN, 3], false)).toBeNaN();
      expect(rMathFunctions.PROD([2, NaN, 4], false)).toBeNaN();
      expect(rMathFunctions.PSUM([1, NaN, 3], true)).toBe(4);
    });
  });
});