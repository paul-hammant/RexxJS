/**
 * Jest tests for probability distribution functions
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { probabilityFunctions } = require('../src/probability-functions');

describe('Probability Distribution Functions', () => {
  
  describe('Normal Distribution Functions', () => {
    describe('DNORM (Normal Density)', () => {
      test('should calculate standard normal density correctly', () => {
        const result = probabilityFunctions.DNORM(0, 0, 1);
        expect(result).toBeCloseTo(0.3989423, 6); // 1/sqrt(2*pi)
      });
      
      test('should handle custom mean and standard deviation', () => {
        const result = probabilityFunctions.DNORM(5, 5, 2);
        expect(result).toBeCloseTo(0.1994711, 6);
      });
      
      test('should return log density when requested', () => {
        const result = probabilityFunctions.DNORM(0, 0, 1, true);
        const expected = -0.5 * Math.log(2 * Math.PI);
        expect(result).toBeCloseTo(expected, 6);
      });
      
      test('should handle invalid standard deviation', () => {
        const result = probabilityFunctions.DNORM(0, 0, -1);
        expect(result).toBeNaN();
      });
      
      test('should handle string inputs', () => {
        const result = probabilityFunctions.DNORM('0', '0', '1');
        expect(result).toBeCloseTo(0.3989423, 6);
      });
    });
    
    describe('PNORM (Normal CDF)', () => {
      test('should return 0.5 for standard normal at mean', () => {
        const result = probabilityFunctions.PNORM(0, 0, 1);
        expect(result).toBeCloseTo(0.5, 6);
      });
      
      test('should handle one standard deviation above mean', () => {
        const result = probabilityFunctions.PNORM(1, 0, 1);
        expect(result).toBeCloseTo(0.8413447, 5);
      });
      
      test('should handle upper tail', () => {
        const result = probabilityFunctions.PNORM(1, 0, 1, false);
        expect(result).toBeCloseTo(0.1586553, 5);
      });
      
      test('should handle custom parameters', () => {
        const result = probabilityFunctions.PNORM(7, 5, 2);
        expect(result).toBeCloseTo(0.8413447, 5);
      });
    });
    
    describe('QNORM (Normal Quantiles)', () => {
      test('should return mean for probability 0.5', () => {
        const result = probabilityFunctions.QNORM(0.5, 0, 1);
        expect(result).toBeCloseTo(0, 6);
      });
      
      test('should return approximately 1.96 for 97.5%', () => {
        const result = probabilityFunctions.QNORM(0.975, 0, 1);
        expect(result).toBeCloseTo(1.96, 2);
      });
      
      test('should handle custom parameters', () => {
        const result = probabilityFunctions.QNORM(0.5, 10, 2);
        expect(result).toBeCloseTo(10, 6);
      });
      
      test('should handle upper tail', () => {
        const result = probabilityFunctions.QNORM(0.025, 0, 1, false);
        expect(result).toBeCloseTo(1.96, 2);
      });
      
      test('should handle boundary cases', () => {
        expect(probabilityFunctions.QNORM(0, 0, 1)).toBe(-Infinity);
        expect(probabilityFunctions.QNORM(1, 0, 1)).toBe(Infinity);
      });
      
      test('should handle invalid probabilities', () => {
        expect(probabilityFunctions.QNORM(-0.1)).toBeNaN();
        expect(probabilityFunctions.QNORM(1.1)).toBeNaN();
      });
    });
    
    describe('RNORM (Random Normal)', () => {
      test('should generate single random normal value', () => {
        const result = probabilityFunctions.RNORM(1, 0, 1);
        expect(typeof result).toBe('number');
        expect(result).not.toBeNaN();
      });
      
      test('should generate multiple random values', () => {
        const result = probabilityFunctions.RNORM(5, 0, 1);
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(5);
        result.forEach(val => expect(typeof val).toBe('number'));
      });
      
      test('should respect mean parameter approximately', () => {
        const result = probabilityFunctions.RNORM(1000, 10, 1);
        const mean = result.reduce((a, b) => a + b, 0) / result.length;
        expect(mean).toBeCloseTo(10, 0); // Within 1 unit
      });
      
      test('should handle invalid standard deviation', () => {
        const result = probabilityFunctions.RNORM(1, 0, -1);
        expect(result).toBeNaN();
      });
    });
  });
  
  describe('Uniform Distribution Functions', () => {
    describe('DUNIF (Uniform Density)', () => {
      test('should return correct density within range', () => {
        const result = probabilityFunctions.DUNIF(0.5, 0, 1);
        expect(result).toBe(1);
      });
      
      test('should return 0 outside range', () => {
        expect(probabilityFunctions.DUNIF(-1, 0, 1)).toBe(0);
        expect(probabilityFunctions.DUNIF(2, 0, 1)).toBe(0);
      });
      
      test('should handle custom range', () => {
        const result = probabilityFunctions.DUNIF(5, 0, 10);
        expect(result).toBe(0.1);
      });
      
      test('should return log density when requested', () => {
        const result = probabilityFunctions.DUNIF(0.5, 0, 2, true);
        expect(result).toBe(Math.log(0.5));
      });
    });
    
    describe('PUNIF (Uniform CDF)', () => {
      test('should return 0.5 at midpoint', () => {
        const result = probabilityFunctions.PUNIF(0.5, 0, 1);
        expect(result).toBe(0.5);
      });
      
      test('should return 0 below minimum', () => {
        const result = probabilityFunctions.PUNIF(-1, 0, 1);
        expect(result).toBe(0);
      });
      
      test('should return 1 above maximum', () => {
        const result = probabilityFunctions.PUNIF(2, 0, 1);
        expect(result).toBe(1);
      });
    });
    
    describe('QUNIF (Uniform Quantiles)', () => {
      test('should return midpoint for probability 0.5', () => {
        const result = probabilityFunctions.QUNIF(0.5, 0, 10);
        expect(result).toBe(5);
      });
      
      test('should return minimum for probability 0', () => {
        const result = probabilityFunctions.QUNIF(0, 5, 10);
        expect(result).toBe(5);
      });
      
      test('should return maximum for probability 1', () => {
        const result = probabilityFunctions.QUNIF(1, 5, 10);
        expect(result).toBe(10);
      });
    });
    
    describe('RUNIF (Random Uniform)', () => {
      test('should generate values within range', () => {
        const results = probabilityFunctions.RUNIF(100, 0, 1);
        results.forEach(val => {
          expect(val).toBeGreaterThanOrEqual(0);
          expect(val).toBeLessThanOrEqual(1);
        });
      });
      
      test('should generate single value when n=1', () => {
        const result = probabilityFunctions.RUNIF(1, 0, 10);
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(10);
      });
    });
  });
  
  describe('Exponential Distribution Functions', () => {
    describe('DEXP (Exponential Density)', () => {
      test('should calculate correct density at x=0', () => {
        const result = probabilityFunctions.DEXP(0, 1);
        expect(result).toBe(1);
      });
      
      test('should calculate correct density at x=1', () => {
        const result = probabilityFunctions.DEXP(1, 1);
        expect(result).toBeCloseTo(Math.exp(-1), 6);
      });
      
      test('should return 0 for negative values', () => {
        const result = probabilityFunctions.DEXP(-1, 1);
        expect(result).toBe(0);
      });
      
      test('should handle custom rate parameter', () => {
        const result = probabilityFunctions.DEXP(0, 2);
        expect(result).toBe(2);
      });
    });
    
    describe('PEXP (Exponential CDF)', () => {
      test('should return approximately 0.632 at mean', () => {
        const result = probabilityFunctions.PEXP(1, 1);
        expect(result).toBeCloseTo(1 - Math.exp(-1), 6);
      });
      
      test('should return 0 for negative values', () => {
        const result = probabilityFunctions.PEXP(-1, 1);
        expect(result).toBe(0);
      });
    });
    
    describe('QEXP (Exponential Quantiles)', () => {
      test('should return ln(2) for probability 0.5', () => {
        const result = probabilityFunctions.QEXP(0.5, 1);
        expect(result).toBeCloseTo(Math.log(2), 6);
      });
      
      test('should return 0 for probability 0', () => {
        const result = probabilityFunctions.QEXP(0, 1);
        expect(result).toBe(0);
      });
      
      test('should return Infinity for probability 1', () => {
        const result = probabilityFunctions.QEXP(1, 1);
        expect(result).toBe(Infinity);
      });
    });
    
    describe('REXP (Random Exponential)', () => {
      test('should generate positive values', () => {
        const results = probabilityFunctions.REXP(100, 1);
        results.forEach(val => expect(val).toBeGreaterThanOrEqual(0));
      });
      
      test('should have approximately correct mean', () => {
        const results = probabilityFunctions.REXP(1000, 2);
        const mean = results.reduce((a, b) => a + b, 0) / results.length;
        expect(mean).toBeCloseTo(0.5, 0); // Mean = 1/rate = 1/2
      });
    });
  });
  
  describe('Chi-square Distribution Functions', () => {
    describe('DCHISQ (Chi-square Density)', () => {
      test('should handle df=1', () => {
        const result = probabilityFunctions.DCHISQ(1, 1);
        expect(result).toBeGreaterThan(0);
        expect(Number.isFinite(result)).toBe(true);
      });
      
      test('should return 0 for negative values', () => {
        const result = probabilityFunctions.DCHISQ(-1, 1);
        expect(result).toBe(0);
      });
      
      test('should handle log density', () => {
        const result = probabilityFunctions.DCHISQ(1, 1, true);
        expect(Number.isFinite(result)).toBe(true);
        expect(result).toBeLessThan(0); // Log of density < 1
      });
    });
    
    describe('RCHISQ (Random Chi-square)', () => {
      test('should generate positive values', () => {
        const results = probabilityFunctions.RCHISQ(100, 1);
        results.forEach(val => expect(val).toBeGreaterThanOrEqual(0));
      });
      
      test('should have approximately correct mean', () => {
        const df = 3;
        const results = probabilityFunctions.RCHISQ(1000, df);
        const mean = results.reduce((a, b) => a + b, 0) / results.length;
        expect(mean).toBeCloseTo(df, 0); // Mean = df
      });
    });
  });
  
  describe('Binomial Distribution Functions', () => {
    describe('DBINOM (Binomial Density)', () => {
      test('should calculate correct probability for fair coin', () => {
        const result = probabilityFunctions.DBINOM(5, 10, 0.5);
        expect(result).toBeCloseTo(0.2460937, 5);
      });
      
      test('should return 0 for impossible outcomes', () => {
        expect(probabilityFunctions.DBINOM(11, 10, 0.5)).toBe(0);
        expect(probabilityFunctions.DBINOM(-1, 10, 0.5)).toBe(0);
      });
      
      test('should handle edge cases', () => {
        expect(probabilityFunctions.DBINOM(0, 5, 0)).toBe(1);
        expect(probabilityFunctions.DBINOM(5, 5, 1)).toBe(1);
      });
    });
    
    describe('RBINOM (Random Binomial)', () => {
      test('should generate values within valid range', () => {
        const results = probabilityFunctions.RBINOM(100, 10, 0.5);
        results.forEach(val => {
          expect(val).toBeGreaterThanOrEqual(0);
          expect(val).toBeLessThanOrEqual(10);
          expect(Number.isInteger(val)).toBe(true);
        });
      });
      
      test('should have approximately correct mean', () => {
        const n = 20, p = 0.3;
        const results = probabilityFunctions.RBINOM(1000, n, p);
        const mean = results.reduce((a, b) => a + b, 0) / results.length;
        expect(mean).toBeCloseTo(n * p, 0); // Mean = n*p
      });
    });
  });
  
  describe('Poisson Distribution Functions', () => {
    describe('DPOIS (Poisson Density)', () => {
      test('should calculate correct probability', () => {
        const result = probabilityFunctions.DPOIS(2, 3);
        const expected = Math.pow(3, 2) * Math.exp(-3) / (2 * 1); // 3^2 * e^-3 / 2!
        expect(result).toBeCloseTo(expected, 6);
      });
      
      test('should return 0 for negative values', () => {
        const result = probabilityFunctions.DPOIS(-1, 3);
        expect(result).toBe(0);
      });
      
      test('should handle zero events', () => {
        const result = probabilityFunctions.DPOIS(0, 2);
        expect(result).toBeCloseTo(Math.exp(-2), 6);
      });
    });
    
    describe('RPOIS (Random Poisson)', () => {
      test('should generate non-negative integers', () => {
        const results = probabilityFunctions.RPOIS(100, 3);
        results.forEach(val => {
          expect(val).toBeGreaterThanOrEqual(0);
          expect(Number.isInteger(val)).toBe(true);
        });
      });
      
      test('should have approximately correct mean', () => {
        const lambda = 5;
        const results = probabilityFunctions.RPOIS(1000, lambda);
        const mean = results.reduce((a, b) => a + b, 0) / results.length;
        expect(mean).toBeCloseTo(lambda, 0); // Mean = lambda
      });
    });
  });
  
  describe('Error Handling', () => {
    test('should handle invalid inputs gracefully', () => {
      expect(probabilityFunctions.DNORM('invalid', 0, 1)).toBeNaN();
      expect(probabilityFunctions.PNORM('invalid', 0, 1)).toBeNaN();
      expect(probabilityFunctions.QNORM('invalid', 0, 1)).toBeNaN();
    });
    
    test('should handle negative standard deviations', () => {
      expect(probabilityFunctions.DNORM(0, 0, -1)).toBeNaN();
      expect(probabilityFunctions.PNORM(0, 0, -1)).toBeNaN();
      expect(probabilityFunctions.QNORM(0.5, 0, -1)).toBeNaN();
    });
    
    test('should handle invalid probability ranges', () => {
      expect(probabilityFunctions.QNORM(-0.5)).toBeNaN();
      expect(probabilityFunctions.QNORM(1.5)).toBeNaN();
      expect(probabilityFunctions.QUNIF(-0.1, 0, 1)).toBeNaN();
      expect(probabilityFunctions.QUNIF(1.1, 0, 1)).toBeNaN();
    });
  });
  
  describe('Consistency Tests', () => {
    test('PNORM and QNORM should be inverse functions', () => {
      const x = 1.5;
      const p = probabilityFunctions.PNORM(x, 0, 1);
      const backToX = probabilityFunctions.QNORM(p, 0, 1);
      expect(backToX).toBeCloseTo(x, 2);
    });
    
    test('PUNIF and QUNIF should be inverse functions', () => {
      const x = 3.7;
      const p = probabilityFunctions.PUNIF(x, 0, 5);
      const backToX = probabilityFunctions.QUNIF(p, 0, 5);
      expect(backToX).toBeCloseTo(x, 6);
    });
    
    test('PEXP and QEXP should be inverse functions', () => {
      const x = 2.5;
      const p = probabilityFunctions.PEXP(x, 1);
      const backToX = probabilityFunctions.QEXP(p, 1);
      expect(backToX).toBeCloseTo(x, 5);
    });
  });
  
  describe('Statistical Properties', () => {
    test('Standard normal should have correct properties', () => {
      // Test that P(-1.96 < Z < 1.96) ≈ 0.95
      const lower = probabilityFunctions.PNORM(-1.96, 0, 1);
      const upper = probabilityFunctions.PNORM(1.96, 0, 1);
      const prob = upper - lower;
      expect(prob).toBeCloseTo(0.95, 2);
    });
    
    test('Uniform distribution should have uniform density', () => {
      const density1 = probabilityFunctions.DUNIF(0.1, 0, 1);
      const density2 = probabilityFunctions.DUNIF(0.5, 0, 1);
      const density3 = probabilityFunctions.DUNIF(0.9, 0, 1);
      expect(density1).toBe(density2);
      expect(density2).toBe(density3);
      expect(density1).toBe(1);
    });
  });
});