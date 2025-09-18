/**
 * SciPy-inspired Statistical Functions for RexxJS.
 * This file contains implementations of statistical functions inspired by the SciPy library.
 */

const spStatsFunctions = {};

// --- Normal Distribution ---

// Constants for normal distribution calculations
const SQRT_2PI = Math.sqrt(2 * Math.PI);
const SQRT_2 = Math.sqrt(2);

/**
 * Error function (erf) approximation using Abramowitz and Stegun formula 7.1.26.
 * @param {number} x - The input value.
 * @returns {number} The value of the error function.
 */
function erf(x) {
    // save the sign of x
    const sign = (x >= 0) ? 1 : -1;
    x = Math.abs(x);

    // constants
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    // A&S formula 7.1.26
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
}

spStatsFunctions.norm = {
    /**
     * Probability Density Function (PDF) of the normal distribution.
     * @param {number} x - The value at which to evaluate the PDF.
     * @param {number} [loc=0] - The mean of the distribution.
     * @param {number} [scale=1] - The standard deviation of the distribution.
     * @returns {number} The PDF value.
     */
    pdf: (x, loc = 0, scale = 1) => {
        if (scale <= 0) return NaN;
        const z = (x - loc) / scale;
        return Math.exp(-0.5 * z * z) / (scale * SQRT_2PI);
    },

    /**
     * Cumulative Distribution Function (CDF) of the normal distribution.
     * @param {number} x - The value at which to evaluate the CDF.
     * @param {number} [loc=0] - The mean of the distribution.
     * @param {number} [scale=1] - The standard deviation of the distribution.
     * @returns {number} The CDF value.
     */
    cdf: (x, loc = 0, scale = 1) => {
        if (scale <= 0) return NaN;
        const z = (x - loc) / (scale * SQRT_2);
        return 0.5 * (1 + erf(z));
    },

    /**
     * Percent Point Function (PPF) or Quantile Function of the normal distribution.
     * This is the inverse of the CDF.
     * Implementation of Peter J. Acklam's algorithm.
     * @param {number} p - The probability.
     * @param {number} [loc=0] - The mean of the distribution.
     * @param {number} [scale=1] - The standard deviation of the distribution.
     * @returns {number} The PPF value.
     */
    ppf: (p, loc = 0, scale = 1) => {
        if (p < 0 || p > 1) return NaN;
        if (p === 0) return -Infinity;
        if (p === 1) return Infinity;
        if (p === 0.5) return loc;

        // Coefficients for rational approximations
        const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
        const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
        const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
        const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];

        const p_low = 0.02425;
        const p_high = 1 - p_low;

        let x;

        if (p < p_low) {
            const q = Math.sqrt(-2 * Math.log(p));
            x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
                (((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1));
        } else if (p <= p_high) {
            const q = p - 0.5;
            const r = q * q;
            x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
                ((((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1));
        } else {
            const q = Math.sqrt(-2 * Math.log(1 - p));
            x = -((((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
                  (((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)));
        }

        return loc + x * scale;
    }
};

// --- Uniform Distribution ---
spStatsFunctions.uniform = {
    /**
     * Probability Density Function (PDF) of the uniform distribution.
     * @param {number} x - The value at which to evaluate the PDF.
     * @param {number} [loc=0] - The lower bound.
     * @param {number} [scale=1] - The scale (upper bound = loc + scale).
     * @returns {number} The PDF value.
     */
    pdf: (x, loc = 0, scale = 1) => {
        if (scale <= 0) return NaN;
        if (x >= loc && x <= loc + scale) {
            return 1 / scale;
        }
        return 0;
    },

    /**
     * Cumulative Distribution Function (CDF) of the uniform distribution.
     * @param {number} x - The value at which to evaluate the CDF.
     * @param {number} [loc=0] - The lower bound.
     * @param {number} [scale=1] - The scale (upper bound = loc + scale).
     * @returns {number} The CDF value.
     */
    cdf: (x, loc = 0, scale = 1) => {
        if (scale <= 0) return NaN;
        if (x < loc) return 0;
        if (x > loc + scale) return 1;
        return (x - loc) / scale;
    },

    /**
     * Percent Point Function (PPF) of the uniform distribution.
     * @param {number} p - The probability.
     * @param {number} [loc=0] - The lower bound.
     * @param {number} [scale=1] - The scale.
     * @returns {number} The PPF value.
     */
    ppf: (p, loc = 0, scale = 1) => {
        if (p < 0 || p > 1) return NaN;
        return loc + p * scale;
    }
};

// --- Chi-squared Distribution ---
spStatsFunctions.chi2 = {
    /**
     * Probability Density Function (PDF) of the chi-squared distribution.
     * @param {number} x - The value at which to evaluate the PDF.
     * @param {number} df - Degrees of freedom.
     * @returns {number} The PDF value.
     */
    pdf: (x, df) => {
        if (x < 0 || df <= 0) return NaN;
        if (x === 0) return df === 2 ? 0.5 : 0;
        
        // Simplified approximation
        const k = df / 2;
        const prefactor = 1 / (Math.pow(2, k) * gamma(k));
        return prefactor * Math.pow(x, k - 1) * Math.exp(-x / 2);
    },

    /**
     * Cumulative Distribution Function (CDF) of the chi-squared distribution.
     * @param {number} x - The value at which to evaluate the CDF.
     * @param {number} df - Degrees of freedom.
     * @returns {number} The CDF value.
     */
    cdf: (x, df) => {
        if (x < 0 || df <= 0) return NaN;
        if (x === 0) return 0;
        
        // Simplified approximation using incomplete gamma function
        return incompleteGamma(df / 2, x / 2) / gamma(df / 2);
    }
};

// --- Binomial Distribution ---
spStatsFunctions.binom = {
    /**
     * Probability Mass Function (PMF) of the binomial distribution.
     * @param {number} k - Number of successes.
     * @param {number} n - Number of trials.
     * @param {number} p - Probability of success.
     * @returns {number} The PMF value.
     */
    pmf: (k, n, p) => {
        if (k < 0 || k > n || n < 0 || p < 0 || p > 1) return NaN;
        if (p === 0) return k === 0 ? 1 : 0;
        if (p === 1) return k === n ? 1 : 0;
        
        return combination(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
    },

    /**
     * Cumulative Distribution Function (CDF) of the binomial distribution.
     * @param {number} k - Number of successes.
     * @param {number} n - Number of trials.
     * @param {number} p - Probability of success.
     * @returns {number} The CDF value.
     */
    cdf: (k, n, p) => {
        if (k < 0) return 0;
        if (k >= n) return 1;
        
        let sum = 0;
        for (let i = 0; i <= Math.floor(k); i++) {
            sum += spStatsFunctions.binom.pmf(i, n, p);
        }
        return sum;
    }
};

// --- Poisson Distribution ---
spStatsFunctions.poisson = {
    /**
     * Probability Mass Function (PMF) of the Poisson distribution.
     * @param {number} k - Number of occurrences.
     * @param {number} mu - Expected number of occurrences.
     * @returns {number} The PMF value.
     */
    pmf: (k, mu) => {
        if (k < 0 || mu < 0 || k !== Math.floor(k)) return NaN;
        if (mu === 0) return k === 0 ? 1 : 0;
        
        return Math.pow(mu, k) * Math.exp(-mu) / factorial(k);
    },

    /**
     * Cumulative Distribution Function (CDF) of the Poisson distribution.
     * @param {number} k - Number of occurrences.
     * @param {number} mu - Expected number of occurrences.
     * @returns {number} The CDF value.
     */
    cdf: (k, mu) => {
        if (k < 0) return 0;
        if (mu === 0) return 1;
        
        let sum = 0;
        for (let i = 0; i <= Math.floor(k); i++) {
            sum += spStatsFunctions.poisson.pmf(i, mu);
        }
        return sum;
    }
};

// --- Helper functions ---
function gamma(z) {
    // Stirling's approximation for gamma function
    if (z < 0.5) {
        return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
    }
    z -= 1;
    const g = 7;
    const coeff = [
        0.99999999999980993,
        676.5203681218851,
        -1259.1392167224028,
        771.32342877765313,
        -176.61502916214059,
        12.507343278686905,
        -0.13857109526572012,
        9.9843695780195716e-6,
        1.5056327351493116e-7
    ];
    
    let x = coeff[0];
    for (let i = 1; i < g + 2; i++) {
        x += coeff[i] / (z + i);
    }
    
    const t = z + g + 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

function factorial(n) {
    if (n < 0 || n !== Math.floor(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity; // Prevent overflow
    
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

function combination(n, k) {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;
    
    k = Math.min(k, n - k); // Take advantage of symmetry
    let result = 1;
    for (let i = 0; i < k; i++) {
        result = result * (n - i) / (i + 1);
    }
    return result;
}

function incompleteGamma(a, x) {
    // Simplified approximation for incomplete gamma function
    if (x < 0 || a <= 0) return NaN;
    if (x === 0) return 0;
    
    // Series expansion for small x
    if (x < a + 1) {
        let sum = 1 / a;
        let term = 1 / a;
        for (let n = 1; n < 100; n++) {
            term *= x / (a + n);
            sum += term;
            if (Math.abs(term) < 1e-15) break;
        }
        return Math.pow(x, a) * Math.exp(-x) * sum;
    } else {
        // Continued fraction for large x
        return gamma(a) - incompleteGammaComplement(a, x);
    }
}

function incompleteGammaComplement(a, x) {
    // Simplified approximation
    const b = x + 1 - a;
    let c = 1e30;
    let d = 1 / b;
    let h = d;
    
    for (let i = 1; i <= 100; i++) {
        const an = -i * (i - a);
        const bn = b + 2 * i;
        d = an * d + bn;
        if (Math.abs(d) < 1e-30) d = 1e-30;
        c = bn + an / c;
        if (Math.abs(c) < 1e-30) c = 1e-30;
        d = 1 / d;
        const del = d * c;
        h *= del;
        if (Math.abs(del - 1) < 1e-15) break;
    }
    
    return Math.pow(x, a) * Math.exp(-x) * h;
}

// --- Descriptive Statistics ---
spStatsFunctions.gmean = (a) => {
    // Geometric mean
    if (a.length === 0) return NaN;
    let product = 1;
    for (let i = 0; i < a.length; i++) {
        if (a[i] <= 0) return NaN;
        product *= a[i];
    }
    return Math.pow(product, 1 / a.length);
};

spStatsFunctions.hmean = (a) => {
    // Harmonic mean
    if (a.length === 0) return NaN;
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        if (a[i] <= 0) return NaN;
        sum += 1 / a[i];
    }
    return a.length / sum;
};

spStatsFunctions.sem = (a, ddof = 1) => {
    // Standard error of the mean
    if (a.length <= ddof) return NaN;
    const n = a.length;
    const mean = a.reduce((s, v) => s + v, 0) / n;
    const variance = a.reduce((s, v) => s + (v - mean) * (v - mean), 0) / (n - ddof);
    return Math.sqrt(variance / n);
};

spStatsFunctions.mode = (a) => {
    // Mode - most frequently occurring value
    if (a.length === 0) return { mode: [], count: 0 };
    
    const counts = {};
    for (let i = 0; i < a.length; i++) {
        counts[a[i]] = (counts[a[i]] || 0) + 1;
    }
    
    let maxCount = 0;
    for (const value in counts) {
        if (counts[value] > maxCount) {
            maxCount = counts[value];
        }
    }
    
    const modes = [];
    for (const value in counts) {
        if (counts[value] === maxCount) {
            modes.push(parseFloat(value));
        }
    }
    
    return { mode: modes, count: maxCount };
};

spStatsFunctions.skew = (a, bias = true) => {
    // Skewness
    if (a.length < 3) return NaN;
    const n = a.length;
    const mean = a.reduce((s, v) => s + v, 0) / n;
    
    let m2 = 0, m3 = 0;
    for (let i = 0; i < n; i++) {
        const diff = a[i] - mean;
        m2 += diff * diff;
        m3 += diff * diff * diff;
    }
    
    m2 /= n;
    m3 /= n;
    
    const skewness = m3 / Math.pow(m2, 1.5);
    
    if (bias) {
        return skewness;
    } else {
        // Sample skewness (unbiased)
        return Math.sqrt(n * (n - 1)) / (n - 2) * skewness;
    }
};

spStatsFunctions.kurtosis = (a, bias = true) => {
    // Kurtosis
    if (a.length < 4) return NaN;
    const n = a.length;
    const mean = a.reduce((s, v) => s + v, 0) / n;
    
    let m2 = 0, m4 = 0;
    for (let i = 0; i < n; i++) {
        const diff = a[i] - mean;
        const diff2 = diff * diff;
        m2 += diff2;
        m4 += diff2 * diff2;
    }
    
    m2 /= n;
    m4 /= n;
    
    const kurtosisValue = m4 / (m2 * m2) - 3; // Excess kurtosis
    
    if (bias) {
        return kurtosisValue;
    } else {
        // Sample kurtosis (unbiased)
        return (n - 1) / ((n - 2) * (n - 3)) * ((n + 1) * kurtosisValue + 6);
    }
};

spStatsFunctions.sp_describe = (a, ddof = 1) => {
    // Simplified version for 1D array
    const n = a.length;
    if (n === 0) {
        return {
            nobs: 0,
            minmax: [NaN, NaN],
            mean: NaN,
            variance: NaN,
            skewness: NaN,
            kurtosis: NaN
        };
    }

    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    for (let i = 0; i < n; i++) {
        const val = a[i];
        if (val < min) min = val;
        if (val > max) max = val;
        sum += val;
    }
    const mean = sum / n;

    let sum_sq_diff = 0;
    let sum_cub_diff = 0;
    let sum_quar_diff = 0;
    for (let i = 0; i < n; i++) {
        const diff = a[i] - mean;
        const diff_sq = diff * diff;
        sum_sq_diff += diff_sq;
        sum_cub_diff += diff_sq * diff;
        sum_quar_diff += diff_sq * diff_sq;
    }

    const variance = sum_sq_diff / (n - ddof);
    const pop_variance = sum_sq_diff / n;
    const pop_std_dev = Math.sqrt(pop_variance);

    const m3 = sum_cub_diff / n;
    const skewness = pop_std_dev > 0 ? m3 / Math.pow(pop_std_dev, 3) : 0;

    const m4 = sum_quar_diff / n;
    const kurtosis = pop_variance > 0 ? m4 / Math.pow(pop_variance, 2) - 3 : -3; // Fisher's definition (excess kurtosis)

    return {
        nobs: n,
        minmax: [min, max],
        mean: mean,
        variance: variance, // sample variance
        skewness: isNaN(skewness) ? 0 : skewness,
        kurtosis: isNaN(kurtosis) ? -3 : kurtosis
    };
};


// Detection function for REQUIRE system
spStatsFunctions.SP_STATS_FUNCTIONS_MAIN = () => ({
    type: 'library_info',
    name: 'SciPy Stats Functions',
    version: '1.0.0',
    loaded: true
});

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    spStatsFunctions: spStatsFunctions,
    
    // Distributions
    norm: spStatsFunctions.norm,
    uniform: spStatsFunctions.uniform,
    chi2: spStatsFunctions.chi2,
    binom: spStatsFunctions.binom,
    poisson: spStatsFunctions.poisson,
    
    // Descriptive statistics
    gmean: spStatsFunctions.gmean,
    hmean: spStatsFunctions.hmean,
    sem: spStatsFunctions.sem,
    mode: spStatsFunctions.mode,
    skew: spStatsFunctions.skew,
    kurtosis: spStatsFunctions.kurtosis,
    sp_describe: spStatsFunctions.sp_describe,
    
    // Uppercase aliases for REXX compatibility
    NORM: spStatsFunctions.norm,
    UNIFORM: spStatsFunctions.uniform,
    CHI2: spStatsFunctions.chi2,
    BINOM: spStatsFunctions.binom,
    POISSON: spStatsFunctions.poisson,
    GMEAN: spStatsFunctions.gmean,
    HMEAN: spStatsFunctions.hmean,
    SEM: spStatsFunctions.sem,
    MODE: spStatsFunctions.mode,
    SKEW: spStatsFunctions.skew,
    KURTOSIS: spStatsFunctions.kurtosis,
    SP_DESCRIBE: spStatsFunctions.sp_describe,
    
    // Detection function
    SP_STATS_FUNCTIONS_MAIN: spStatsFunctions.SP_STATS_FUNCTIONS_MAIN
  };
} else if (typeof window !== 'undefined') {
  Object.assign(window, spStatsFunctions);
  window.SP_STATS_FUNCTIONS_MAIN = spStatsFunctions.SP_STATS_FUNCTIONS_MAIN;
}
