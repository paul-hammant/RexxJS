/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Tests for R Regression & Statistical Modeling Functions
 */

const { rRegressionFunctions } = require('./r-regression-functions');

describe('R Regression & Statistical Modeling Functions', () => {
  let sampleData;
  
  beforeEach(() => {
    // Create sample data for testing
    sampleData = {
      type: 'data.frame',
      nrow: 10,
      ncol: 3,
      columns: {
        x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        y: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20], // y = 2x
        z: [1, 3, 2, 6, 5, 9, 8, 12, 11, 15]     // Some variation
      },
      rowNames: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
    };
  });

  describe('Linear Regression (LM)', () => {
    test('should perform simple linear regression', () => {
      const model = rRegressionFunctions.LM('y ~ x', sampleData);
      
      expect(model.type).toBe('lm');
      expect(model.error).toBeUndefined();
      expect(model.coefficients).toHaveLength(2);
      expect(model.coefficientNames).toEqual(['(Intercept)', 'x']);
      
      // For y = 2x, intercept should be ~0, slope should be ~2
      expect(model.coefficients[0]).toBeCloseTo(0, 10); // Intercept
      expect(model.coefficients[1]).toBeCloseTo(2, 10); // Slope
      expect(model.rSquared).toBeCloseTo(1, 10); // Perfect fit
    });

    test('should handle multiple regression', () => {
      const model = rRegressionFunctions.LM('y ~ x + z', sampleData);
      
      expect(model.type).toBe('lm');
      expect(model.error).toBeUndefined();
      expect(model.coefficients).toHaveLength(3);
      expect(model.coefficientNames).toEqual(['(Intercept)', 'x', 'z']);
      expect(model.fitted).toHaveLength(10);
      expect(model.residuals).toHaveLength(10);
    });

    test('should calculate model statistics', () => {
      const model = rRegressionFunctions.LM('y ~ x', sampleData);
      
      expect(model.rSquared).toBeDefined();
      expect(model.adjustedRSquared).toBeDefined();
      expect(model.fStatistic).toBeDefined();
      expect(model.residualStdError).toBeDefined();
      expect(model.degreesOfFreedom).toBe(8); // n - p = 10 - 2
      expect(model.standardErrors).toHaveLength(2);
      expect(model.tValues).toHaveLength(2);
      expect(model.pValues).toHaveLength(2);
    });

    test('should handle missing data', () => {
      const dataWithNAs = {
        ...sampleData,
        columns: {
          x: [1, 2, null, 4, 5],
          y: [2, 4, 6, null, 10]
        },
        nrow: 5
      };
      
      const model = rRegressionFunctions.LM('y ~ x', dataWithNAs);
      
      expect(model.type).toBe('lm');
      expect(model.n).toBeLessThan(5); // Should exclude rows with NAs
    });

    test('should handle invalid inputs', () => {
      const model1 = rRegressionFunctions.LM(null, sampleData);
      expect(model1.error).toBeDefined();
      
      const model2 = rRegressionFunctions.LM('y ~ x', null);
      expect(model2.error).toBeDefined();
      
      const model3 = rRegressionFunctions.LM('nonexistent ~ x', sampleData);
      expect(model3.error).toBeDefined();
    });
  });

  describe('Model Summary', () => {
    test('should provide comprehensive model summary', () => {
      const model = rRegressionFunctions.LM('y ~ x', sampleData);
      const summary = rRegressionFunctions.SUMMARY_LM(model);
      
      expect(summary.error).toBeUndefined();
      expect(summary.call).toBe(model.call);
      expect(summary.coefficients.names).toEqual(['(Intercept)', 'x']);
      expect(summary.coefficients.estimate).toEqual(model.coefficients);
      expect(summary.coefficients.stdError).toEqual(model.standardErrors);
      expect(summary.coefficients.significance).toHaveLength(2);
      expect(summary.fStatistic.value).toBeDefined();
      expect(summary.fStatistic.pValue).toBeDefined();
    });

    test('should calculate significance levels', () => {
      const model = rRegressionFunctions.LM('y ~ x', sampleData);
      const summary = rRegressionFunctions.SUMMARY_LM(model);
      
      // For perfect fit, p-values should be very small
      expect(summary.coefficients.significance[1]).toMatch(/\*+/);
    });

    test('should handle invalid model', () => {
      const summary1 = rRegressionFunctions.SUMMARY_LM(null);
      expect(summary1.error).toBeDefined();
      
      const summary2 = rRegressionFunctions.SUMMARY_LM({type: 'invalid'});
      expect(summary2.error).toBeDefined();
    });
  });

  describe('Prediction', () => {
    test('should predict from model', () => {
      const model = rRegressionFunctions.LM('y ~ x', sampleData);
      const predictions = rRegressionFunctions.PREDICT_LM(model);
      
      expect(predictions.error).toBeUndefined();
      expect(predictions.fit).toHaveLength(10);
      expect(predictions.fit[0]).toBeCloseTo(2, 5); // x=1, y=2*1=2
      expect(predictions.fit[4]).toBeCloseTo(10, 5); // x=5, y=2*5=10
    });

    test('should predict with new data', () => {
      const model = rRegressionFunctions.LM('y ~ x', sampleData);
      const newData = [
        {x: 11},
        {x: 12},
        {x: 13}
      ];
      
      const predictions = rRegressionFunctions.PREDICT_LM(model, newData);
      
      expect(predictions.error).toBeUndefined();
      expect(predictions.fit).toHaveLength(3);
      expect(predictions.fit[0]).toBeCloseTo(22, 5); // x=11, y=2*11=22
      expect(predictions.fit[1]).toBeCloseTo(24, 5); // x=12, y=2*12=24
    });

    test('should calculate confidence intervals', () => {
      const model = rRegressionFunctions.LM('y ~ x', sampleData);
      const predictions = rRegressionFunctions.PREDICT_LM(model, null, 'confidence', 0.95);
      
      expect(predictions.error).toBeUndefined();
      expect(predictions.fit).toHaveLength(10);
      expect(predictions.lwr).toHaveLength(10);
      expect(predictions.upr).toHaveLength(10);
      expect(predictions.interval).toBe('confidence');
      expect(predictions.level).toBe(0.95);
      
      // Upper bounds should be greater than lower bounds
      for (let i = 0; i < 10; i++) {
        expect(predictions.upr[i]).toBeGreaterThan(predictions.lwr[i]);
      }
    });

    test('should handle invalid model for prediction', () => {
      const predictions = rRegressionFunctions.PREDICT_LM(null);
      expect(predictions.error).toBeDefined();
    });
  });

  describe('Analysis of Variance (ANOVA)', () => {
    test('should perform ANOVA on linear model', () => {
      const model = rRegressionFunctions.LM('y ~ x + z', sampleData);
      const anova = rRegressionFunctions.ANOVA(model);
      
      expect(anova.error).toBeUndefined();
      expect(anova.type).toBe('anova');
      expect(anova.terms).toHaveLength(3); // x, z, Residuals
      expect(anova.call).toBe(model.call);
      
      const terms = anova.terms;
      expect(terms[0].term).toBe('x');
      expect(terms[1].term).toBe('z');
      expect(terms[2].term).toBe('Residuals');
      
      // Check structure
      terms.forEach((term, i) => {
        expect(term.df).toBeDefined();
        expect(term.sumSq).toBeDefined();
        expect(term.meanSq).toBeDefined();
        if (i < terms.length - 1) { // Not residuals
          expect(term.fValue).toBeDefined();
          expect(term.pValue).toBeDefined();
        }
      });
    });

    test('should handle invalid model for ANOVA', () => {
      const anova = rRegressionFunctions.ANOVA(null);
      expect(anova.error).toBeDefined();
    });
  });

  describe('Correlation Functions', () => {
    test('should calculate Pearson correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      
      const r = rRegressionFunctions.COR(x, y, 'pearson');
      expect(r).toBeCloseTo(1, 10); // Perfect positive correlation
    });

    test('should calculate Spearman correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [1, 4, 9, 16, 25]; // y = x^2
      
      const r = rRegressionFunctions.COR(x, y, 'spearman');
      expect(r).toBeCloseTo(1, 5); // Perfect rank correlation
    });

    test('should calculate Kendall correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [1, 2, 3, 4, 5];
      
      const r = rRegressionFunctions.COR(x, y, 'kendall');
      expect(r).toBeCloseTo(1, 5); // Perfect concordance
    });

    test('should handle missing values in correlation', () => {
      const x = [1, 2, null, 4, 5];
      const y = [2, 4, 6, 8, 10];
      
      const r = rRegressionFunctions.COR(x, y);
      expect(r).not.toBeNull(); // Should exclude missing pairs
    });

    test('should handle invalid correlation inputs', () => {
      expect(rRegressionFunctions.COR([], [])).toBeNull();
      expect(rRegressionFunctions.COR([1, 2], [1])).toBeNull(); // Mismatched lengths
    });
  });

  describe('Correlation Test', () => {
    test('should perform correlation significance test', () => {
      const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const y = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
      
      const test = rRegressionFunctions.COTEST(x, y, 'pearson');
      
      expect(test.error).toBeUndefined();
      expect(test.correlation).toBeCloseTo(1, 10);
      expect(test.statistic).toBeDefined();
      expect(test.pValue).toBeDefined();
      expect(test.degreesOfFreedom).toBe(8);
      expect(test.significant).toBe(true);
      expect(test.confidenceInterval).toHaveLength(2);
      expect(test.method).toBe('pearson');
    });

    test('should handle different alternative hypotheses', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [1, 2, 3, 4, 5];
      
      const testTwo = rRegressionFunctions.COTEST(x, y, 'pearson', 'two.sided');
      const testGreater = rRegressionFunctions.COTEST(x, y, 'pearson', 'greater');
      const testLess = rRegressionFunctions.COTEST(x, y, 'pearson', 'less');
      
      expect(testTwo.alternative).toBe('two.sided');
      expect(testGreater.alternative).toBe('greater');
      expect(testLess.alternative).toBe('less');
    });

    test('should handle different correlation methods in test', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [1, 2, 3, 4, 5];
      
      const pearson = rRegressionFunctions.COTEST(x, y, 'pearson');
      const spearman = rRegressionFunctions.COTEST(x, y, 'spearman');
      const kendall = rRegressionFunctions.COTEST(x, y, 'kendall');
      
      expect(pearson.method).toBe('pearson');
      expect(spearman.method).toBe('spearman');
      expect(kendall.method).toBe('kendall');
      expect(pearson.confidenceInterval).not.toBeNull();
      expect(spearman.confidenceInterval).toBeNull(); // Only Pearson has CI
    });

    test('should handle invalid test inputs', () => {
      const test = rRegressionFunctions.COTEST([1, 2], [1]);
      expect(test.error).toBeDefined();
    });
  });

  describe('Matrix Operations', () => {
    test('should multiply matrices correctly', () => {
      const A = [[1, 2], [3, 4]];
      const B = [[2, 0], [1, 2]];
      const result = rRegressionFunctions.matrixMultiply(A, B);
      
      expect(result).toEqual([[4, 4], [10, 8]]);
    });

    test('should transpose matrices', () => {
      const matrix = [[1, 2, 3], [4, 5, 6]];
      const transposed = rRegressionFunctions.transpose(matrix);
      
      expect(transposed).toEqual([[1, 4], [2, 5], [3, 6]]);
    });

    test('should calculate matrix inverse', () => {
      const matrix = [[4, 7], [2, 6]];
      const inverse = rRegressionFunctions.matrixInverse(matrix);
      
      // Check that A * A^(-1) = I (approximately)
      const identity = rRegressionFunctions.matrixMultiply(matrix, inverse);
      expect(identity[0][0]).toBeCloseTo(1, 5);
      expect(identity[0][1]).toBeCloseTo(0, 5);
      expect(identity[1][0]).toBeCloseTo(0, 5);
      expect(identity[1][1]).toBeCloseTo(1, 5);
    });

    test('should handle singular matrix', () => {
      const singular = [[1, 2], [2, 4]]; // Rank deficient
      expect(() => rRegressionFunctions.matrixInverse(singular)).toThrow();
    });
  });

  describe('Statistical Distributions', () => {
    test('should calculate normal CDF', () => {
      expect(rRegressionFunctions.normalCDF(0)).toBeCloseTo(0.5, 5);
      expect(rRegressionFunctions.normalCDF(-1.96)).toBeCloseTo(0.025, 2);
      expect(rRegressionFunctions.normalCDF(1.96)).toBeCloseTo(0.975, 2);
    });

    test('should calculate normal quantiles', () => {
      expect(rRegressionFunctions.normalQuantile(0.5)).toBeCloseTo(0, 5);
      expect(rRegressionFunctions.normalQuantile(0.025)).toBeCloseTo(-1.96, 1);
      expect(rRegressionFunctions.normalQuantile(0.975)).toBeCloseTo(1.96, 1);
    });

    test('should calculate t-distribution values', () => {
      const df = 10;
      const t = 2.228; // Approximate 95% quantile for df=10
      
      const cdf = rRegressionFunctions.tCDF(t, df);
      expect(cdf).toBeCloseTo(0.975, 2);
      
      const quantile = rRegressionFunctions.tQuantile(0.975, df);
      expect(quantile).toBeCloseTo(t, 1);
    });

    test('should handle edge cases in distributions', () => {
      expect(rRegressionFunctions.normalQuantile(0)).toBe(-Infinity);
      expect(rRegressionFunctions.normalQuantile(1)).toBe(Infinity);
      expect(rRegressionFunctions.normalCDF(-Infinity)).toBe(0);
      expect(rRegressionFunctions.normalCDF(Infinity)).toBe(1);
    });
  });

  describe('Helper Functions', () => {
    test('should calculate mean correctly', () => {
      expect(rRegressionFunctions.mean([1, 2, 3, 4, 5])).toBe(3);
      expect(rRegressionFunctions.mean([2, 4, 6])).toBe(4);
    });

    test('should calculate variance correctly', () => {
      const data = [1, 2, 3, 4, 5];
      const variance = rRegressionFunctions.variance(data);
      expect(variance).toBeCloseTo(2.5, 5); // Sample variance
    });

    test('should get ranks correctly', () => {
      const data = [3, 1, 4, 1, 5];
      const ranks = rRegressionFunctions.getRanks(data);
      expect(ranks).toEqual([3, 1, 4, 2, 5]); // Ties handled by order
    });

    test('should calculate Fisher transform', () => {
      const r = 0.5;
      const n = 20;
      const ci = rRegressionFunctions.fisherTransform(r, n);
      
      expect(ci).toHaveLength(2);
      expect(ci[0]).toBeLessThan(r); // Lower bound
      expect(ci[1]).toBeGreaterThan(r); // Upper bound
    });
  });

  describe('Error Handling', () => {
    test('should handle null/undefined inputs gracefully', () => {
      expect(rRegressionFunctions.LM(null, null).error).toBeDefined();
      expect(rRegressionFunctions.COR(null, null)).toBeNull();
      expect(rRegressionFunctions.mean([])).toBeNaN();
    });

    test('should handle empty data', () => {
      const emptyData = {
        type: 'data.frame',
        nrow: 0,
        ncol: 2,
        columns: { x: [], y: [] }
      };
      
      const model = rRegressionFunctions.LM('y ~ x', emptyData);
      expect(model.error).toBeDefined();
    });

    test('should handle insufficient data', () => {
      const smallData = {
        type: 'data.frame',
        nrow: 1,
        ncol: 2,
        columns: { x: [1], y: [2] }
      };
      
      const model = rRegressionFunctions.LM('y ~ x', smallData);
      expect(model.error).toBeDefined();
    });
  });

  describe('Complex Regression Scenarios', () => {
    test('should handle perfect multicollinearity', () => {
      const collinearData = {
        type: 'data.frame',
        nrow: 5,
        ncol: 3,
        columns: {
          y: [1, 2, 3, 4, 5],
          x1: [1, 2, 3, 4, 5],
          x2: [2, 4, 6, 8, 10] // x2 = 2 * x1
        }
      };
      
      const model = rRegressionFunctions.LM('y ~ x1 + x2', collinearData);
      // Should handle this gracefully (might throw error or have high standard errors)
      expect(model.type).toBe('lm');
    });

    test('should handle regression with different data types', () => {
      const mixedData = {
        type: 'data.frame',
        nrow: 5,
        ncol: 3,
        columns: {
          y: [1.1, 2.2, 3.3, 4.4, 5.5],
          x1: [1, 2, 3, 4, 5],
          x2: [1, 3, 2, 5, 4]  // Different pattern to avoid collinearity
        }
      };
      
      const model = rRegressionFunctions.LM('y ~ x1 + x2', mixedData);
      expect(model.error).toBeUndefined();
      expect(model.coefficients).toHaveLength(3);
    });

    test('should maintain statistical properties', () => {
      const model = rRegressionFunctions.LM('y ~ x', sampleData);
      
      // Sum of residuals should be approximately 0
      const residualSum = model.residuals.reduce((sum, r) => sum + r, 0);
      expect(Math.abs(residualSum)).toBeLessThan(1e-10);
      
      // Fitted values + residuals should equal observed values
      for (let i = 0; i < model.fitted.length; i++) {
        const observed = sampleData.columns.y[i];
        const predicted = model.fitted[i] + model.residuals[i];
        expect(predicted).toBeCloseTo(observed, 10);
      }
    });
  });

  describe('R Compatibility', () => {
    test('should match R linear model structure', () => {
      const model = rRegressionFunctions.LM('y ~ x', sampleData);
      
      // Check that result has R-like structure
      expect(model).toHaveProperty('coefficients');
      expect(model).toHaveProperty('residuals');
      expect(model).toHaveProperty('fitted');
      expect(model).toHaveProperty('rSquared');
      expect(model).toHaveProperty('call');
      expect(model).toHaveProperty('degreesOfFreedom');
      
      // Call should match R format
      expect(model.call).toContain('lm(formula =');
    });

    test('should match R summary structure', () => {
      const model = rRegressionFunctions.LM('y ~ x', sampleData);
      const summary = rRegressionFunctions.SUMMARY_LM(model);
      
      expect(summary.coefficients).toHaveProperty('names');
      expect(summary.coefficients).toHaveProperty('estimate');
      expect(summary.coefficients).toHaveProperty('stdError');
      expect(summary.coefficients).toHaveProperty('tValue');
      expect(summary.coefficients).toHaveProperty('pValue');
      expect(summary.coefficients).toHaveProperty('significance');
      expect(summary).toHaveProperty('fStatistic');
    });

    test('should match R correlation methods', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      
      const pearson = rRegressionFunctions.COR(x, y, 'pearson');
      const spearman = rRegressionFunctions.COR(x, y, 'spearman');
      const kendall = rRegressionFunctions.COR(x, y, 'kendall');
      
      // All should be close to 1 for this linear relationship
      expect(pearson).toBeCloseTo(1, 5);
      expect(spearman).toBeCloseTo(1, 5);
      expect(kendall).toBeCloseTo(1, 5);
    });
  });
});