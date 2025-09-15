const { spStatsFunctions } = require('../src/sp-stats-functions');
const { norm, sp_describe } = spStatsFunctions;

describe('SciPy-inspired statistical functions', () => {

    describe('norm distribution', () => {
        const tolerance = 1e-7;

        it('should calculate the pdf correctly', () => {
            // For standard normal distribution, pdf(0) should be 1/sqrt(2*pi)
            expect(norm.pdf(0, 0, 1)).toBeCloseTo(1 / Math.sqrt(2 * Math.PI), 7);
            // Test with a different value
            expect(norm.pdf(1, 0, 1)).toBeCloseTo(0.24197072, 7);
            // Test with different loc and scale
            expect(norm.pdf(5, 5, 2)).toBeCloseTo(1 / (2 * Math.sqrt(2 * Math.PI)), 7);
        });

        it('should calculate the cdf correctly', () => {
            // For standard normal distribution, cdf(0) should be 0.5
            expect(norm.cdf(0, 0, 1)).toBeCloseTo(0.5, 7);
            // Test with a known value from z-table (z=1.96 -> p=0.975)
            expect(norm.cdf(1.96, 0, 1)).toBeCloseTo(0.9750021, 6); // Lower precision
            // Test with different loc and scale
            expect(norm.cdf(7, 5, 2)).toBeCloseTo(norm.cdf(1, 0, 1), 7);
        });

        it('should calculate the ppf correctly', () => {
            // For standard normal distribution, ppf(0.5) should be 0
            expect(norm.ppf(0.5, 0, 1)).toBeCloseTo(0, 7);
            // Test with a known value from z-table (p=0.975 -> z=1.96)
            expect(norm.ppf(0.975, 0, 1)).toBeCloseTo(1.95996398, 7);
            // Test with different loc and scale
            expect(norm.ppf(0.841344746, 10, 5)).toBeCloseTo(15, 7); // p for z=1 is ~0.8413
        });

        it('should show that ppf is the inverse of cdf', () => {
            const x = 1.5;
            const p = norm.cdf(x, 0, 1);
            expect(norm.ppf(p, 0, 1)).toBeCloseTo(x, 5); // Use a slightly lower precision for roundtrip

            const x2 = -0.8;
            const p2 = norm.cdf(x2, 2, 3);
            expect(norm.ppf(p2, 2, 3)).toBeCloseTo(x2, 5);
        });

        it('should handle edge cases for ppf', () => {
            expect(norm.ppf(0)).toBe(-Infinity);
            expect(norm.ppf(1)).toBe(Infinity);
            expect(isNaN(norm.ppf(-0.1))).toBe(true);
            expect(isNaN(norm.ppf(1.1))).toBe(true);
        });
    });

    describe('sp_describe function', () => {
        it('should correctly describe a simple dataset', () => {
            const data = [1, 2, 3, 4, 5];
            const result = sp_describe(data);

            expect(result.nobs).toBe(5);
            expect(result.minmax).toEqual([1, 5]);
            expect(result.mean).toBeCloseTo(3, 7);
            expect(result.variance).toBeCloseTo(2.5, 7);
            expect(result.skewness).toBeCloseTo(0, 7);
            expect(result.kurtosis).toBeCloseTo(-1.3, 7);
        });

        it('should correctly describe a dataset with negative numbers', () => {
            const data = [-2, -1, 0, 1, 2];
            const result = sp_describe(data);

            expect(result.nobs).toBe(5);
            expect(result.minmax).toEqual([-2, 2]);
            expect(result.mean).toBeCloseTo(0, 7);
            expect(result.variance).toBeCloseTo(2.5, 7);
            expect(result.skewness).toBeCloseTo(0, 7);
            expect(result.kurtosis).toBeCloseTo(-1.3, 7);
        });

        it('should handle an empty array', () => {
            const data = [];
            const result = sp_describe(data);

            expect(result.nobs).toBe(0);
            expect(isNaN(result.minmax[0])).toBe(true);
            expect(isNaN(result.minmax[1])).toBe(true);
            expect(isNaN(result.mean)).toBe(true);
            expect(isNaN(result.variance)).toBe(true);
            expect(isNaN(result.skewness)).toBe(true);
            expect(isNaN(result.kurtosis)).toBe(true);
        });

        it('should handle ddof parameter', () => {
            const data = [1, 2, 3, 4, 5];
            const result_pop = sp_describe(data, 0); // population variance
            expect(result_pop.variance).toBeCloseTo(2, 7);
        });
    });
});
