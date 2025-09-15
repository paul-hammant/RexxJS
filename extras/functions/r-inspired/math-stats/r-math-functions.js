/**
 * R Mathematical & Statistical Computing Functions
 * Comprehensive mathematical operations, linear algebra, optimization, and numerical analysis
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const rMathFunctions = {
  // Primary detection function (must be first)
  'ABS_MAIN': (x) => {
    // Alias to ABS for detection purposes
    return rMathFunctions.ABS(x);
  },
  // Basic Mathematical Operations
  'ABS': (x) => {
    try {
      if (x === null || x === undefined) return null;
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.ABS(val));
      }
      const num = parseFloat(x);
      return isNaN(num) ? NaN : Math.abs(num);
    } catch (e) {
      return NaN;
    }
  },

  'SQRT': (x) => {
    try {
      if (x === null || x === undefined) return null;
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.SQRT(val));
      }
      const num = parseFloat(x);
      return isNaN(num) ? NaN : Math.sqrt(num);
    } catch (e) {
      return NaN;
    }
  },

  'EXP': (x) => {
    try {
      if (x === null || x === undefined) return null;
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.EXP(val));
      }
      const num = parseFloat(x);
      return isNaN(num) ? NaN : Math.exp(num);
    } catch (e) {
      return NaN;
    }
  },

  'LOG': (x, base = Math.E) => {
    try {
      if (x === null || x === undefined) return null;
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.LOG(val, base));
      }
      const num = parseFloat(x);
      const b = parseFloat(base);
      if (isNaN(num) || isNaN(b) || num <= 0 || b <= 0 || b === 1) return NaN;
      return Math.log(num) / Math.log(b);
    } catch (e) {
      return NaN;
    }
  },

  'LOG10': (x) => {
    return rMathFunctions.LOG(x, 10);
  },

  'LOG2': (x) => {
    return rMathFunctions.LOG(x, 2);
  },

  'POW': (x, y) => {
    try {
      if (x === null || x === undefined || y === null || y === undefined) return null;
      if (Array.isArray(x) && Array.isArray(y)) {
        const maxLen = Math.max(x.length, y.length);
        return Array.from({length: maxLen}, (_, i) => 
          rMathFunctions.POW(x[i % x.length], y[i % y.length])
        );
      }
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.POW(val, y));
      }
      if (Array.isArray(y)) {
        return y.map(val => rMathFunctions.POW(x, val));
      }
      const base = parseFloat(x);
      const exp = parseFloat(y);
      return isNaN(base) || isNaN(exp) ? NaN : Math.pow(base, exp);
    } catch (e) {
      return NaN;
    }
  },

  // Trigonometric Functions
  'SIN': (x) => {
    try {
      if (x === null || x === undefined) return null;
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.SIN(val));
      }
      const num = parseFloat(x);
      return isNaN(num) ? NaN : Math.sin(num);
    } catch (e) {
      return NaN;
    }
  },

  'COS': (x) => {
    try {
      if (x === null || x === undefined) return null;
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.COS(val));
      }
      const num = parseFloat(x);
      return isNaN(num) ? NaN : Math.cos(num);
    } catch (e) {
      return NaN;
    }
  },

  'TAN': (x) => {
    try {
      if (x === null || x === undefined) return null;
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.TAN(val));
      }
      const num = parseFloat(x);
      return isNaN(num) ? NaN : Math.tan(num);
    } catch (e) {
      return NaN;
    }
  },

  'ASIN': (x) => {
    try {
      if (x === null || x === undefined) return null;
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.ASIN(val));
      }
      const num = parseFloat(x);
      return isNaN(num) || num < -1 || num > 1 ? NaN : Math.asin(num);
    } catch (e) {
      return NaN;
    }
  },

  'ACOS': (x) => {
    try {
      if (x === null || x === undefined) return null;
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.ACOS(val));
      }
      const num = parseFloat(x);
      return isNaN(num) || num < -1 || num > 1 ? NaN : Math.acos(num);
    } catch (e) {
      return NaN;
    }
  },

  'ATAN': (x) => {
    try {
      if (x === null || x === undefined) return null;
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.ATAN(val));
      }
      const num = parseFloat(x);
      return isNaN(num) ? NaN : Math.atan(num);
    } catch (e) {
      return NaN;
    }
  },

  'ATAN2': (y, x) => {
    try {
      if (y === null || y === undefined || x === null || x === undefined) return null;
      if (Array.isArray(y) && Array.isArray(x)) {
        const maxLen = Math.max(y.length, x.length);
        return Array.from({length: maxLen}, (_, i) => 
          rMathFunctions.ATAN2(y[i % y.length], x[i % x.length])
        );
      }
      const numY = parseFloat(y);
      const numX = parseFloat(x);
      return isNaN(numY) || isNaN(numX) ? NaN : Math.atan2(numY, numX);
    } catch (e) {
      return NaN;
    }
  },

  // Hyperbolic Functions
  'SINH': (x) => {
    try {
      if (x === null || x === undefined) return null;
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.SINH(val));
      }
      const num = parseFloat(x);
      return isNaN(num) ? NaN : Math.sinh(num);
    } catch (e) {
      return NaN;
    }
  },

  'COSH': (x) => {
    try {
      if (x === null || x === undefined) return null;
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.COSH(val));
      }
      const num = parseFloat(x);
      return isNaN(num) ? NaN : Math.cosh(num);
    } catch (e) {
      return NaN;
    }
  },

  'TANH': (x) => {
    try {
      if (x === null || x === undefined) return null;
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.TANH(val));
      }
      const num = parseFloat(x);
      return isNaN(num) ? NaN : Math.tanh(num);
    } catch (e) {
      return NaN;
    }
  },

  // Rounding and Ceiling Functions
  'CEILING': (x) => {
    try {
      if (x === null || x === undefined) return null;
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.CEILING(val));
      }
      const num = parseFloat(x);
      return isNaN(num) ? NaN : Math.ceil(num);
    } catch (e) {
      return NaN;
    }
  },

  'FLOOR': (x) => {
    try {
      if (x === null || x === undefined) return null;
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.FLOOR(val));
      }
      const num = parseFloat(x);
      return isNaN(num) ? NaN : Math.floor(num);
    } catch (e) {
      return NaN;
    }
  },

  'ROUND': (x, digits = 0) => {
    try {
      if (x === null || x === undefined) return null;
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.ROUND(val, digits));
      }
      const num = parseFloat(x);
      const d = parseInt(digits) || 0;
      if (isNaN(num)) return NaN;
      const factor = Math.pow(10, d);
      // Use R-style rounding (round half away from zero)
      if (num >= 0) {
        return Math.round(num * factor) / factor;
      } else {
        return -Math.round(-num * factor) / factor;
      }
    } catch (e) {
      return NaN;
    }
  },

  'TRUNC': (x) => {
    try {
      if (x === null || x === undefined) return null;
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.TRUNC(val));
      }
      const num = parseFloat(x);
      return isNaN(num) ? NaN : Math.trunc(num);
    } catch (e) {
      return NaN;
    }
  },

  'SIGNIF': (x, digits = 6) => {
    try {
      if (x === null || x === undefined) return null;
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.SIGNIF(val, digits));
      }
      const num = parseFloat(x);
      const d = parseInt(digits) || 6;
      if (isNaN(num) || num === 0) return num;
      const magnitude = Math.floor(Math.log10(Math.abs(num)));
      const factor = Math.pow(10, d - 1 - magnitude);
      return Math.round(num * factor) / factor;
    } catch (e) {
      return NaN;
    }
  },

  // Vector Operations
  'CUMSUM': (x) => {
    try {
      if (x === null || x === undefined) return null;
      if (!Array.isArray(x)) x = [x];
      let sum = 0;
      return x.map(val => {
        const num = parseFloat(val);
        if (!isNaN(num)) sum += num;
        return sum;
      });
    } catch (e) {
      return null;
    }
  },

  'CUMPROD': (x) => {
    try {
      if (x === null || x === undefined) return null;
      if (!Array.isArray(x)) x = [x];
      let product = 1;
      return x.map(val => {
        const num = parseFloat(val);
        if (!isNaN(num)) product *= num;
        return product;
      });
    } catch (e) {
      return null;
    }
  },

  'CUMMAX': (x) => {
    try {
      if (x === null || x === undefined) return null;
      if (!Array.isArray(x)) x = [x];
      let max = -Infinity;
      return x.map(val => {
        const num = parseFloat(val);
        if (!isNaN(num) && num > max) max = num;
        return max === -Infinity ? NaN : max;
      });
    } catch (e) {
      return null;
    }
  },

  'CUMMIN': (x) => {
    try {
      if (x === null || x === undefined) return null;
      if (!Array.isArray(x)) x = [x];
      let min = Infinity;
      return x.map(val => {
        const num = parseFloat(val);
        if (!isNaN(num) && num < min) min = num;
        return min === Infinity ? NaN : min;
      });
    } catch (e) {
      return null;
    }
  },

  'DIFF': (x, lag = 1) => {
    try {
      if (x === null || x === undefined) return null;
      if (!Array.isArray(x)) return null;
      const l = parseInt(lag) || 1;
      const result = [];
      for (let i = l; i < x.length; i++) {
        const current = parseFloat(x[i]);
        const previous = parseFloat(x[i - l]);
        if (!isNaN(current) && !isNaN(previous)) {
          result.push(current - previous);
        } else {
          result.push(NaN);
        }
      }
      return result;
    } catch (e) {
      return null;
    }
  },

  // Mathematical Constants
  'PI': () => Math.PI,
  'E': () => Math.E,

  // Statistical Functions
  'PSUM': (x, na_rm = false) => {
    try {
      if (x === null || x === undefined) return null;
      if (!Array.isArray(x)) x = [x];
      let sum = 0;
      let hasValidValue = false;
      for (const val of x) {
        const num = parseFloat(val);
        if (!isNaN(num)) {
          sum += num;
          hasValidValue = true;
        } else if (!na_rm) {
          return NaN;
        }
      }
      return hasValidValue ? sum : (na_rm ? 0 : NaN);
    } catch (e) {
      return NaN;
    }
  },

  'PROD': (x, na_rm = false) => {
    try {
      if (x === null || x === undefined) return null;
      if (!Array.isArray(x)) x = [x];
      let product = 1;
      let hasValidValue = false;
      for (const val of x) {
        const num = parseFloat(val);
        if (!isNaN(num)) {
          product *= num;
          hasValidValue = true;
        } else if (!na_rm) {
          return NaN;
        }
      }
      return hasValidValue ? product : (na_rm ? 1 : NaN);
    } catch (e) {
      return NaN;
    }
  },

  // Range and Extremes
  'PMIN': (...args) => {
    try {
      const flatArgs = args.flat();
      if (flatArgs.length === 0) return null;
      let min = Infinity;
      let hasValidValue = false;
      for (const val of flatArgs) {
        const num = parseFloat(val);
        if (!isNaN(num)) {
          if (num < min) min = num;
          hasValidValue = true;
        }
      }
      return hasValidValue ? min : NaN;
    } catch (e) {
      return NaN;
    }
  },

  'PMAX': (...args) => {
    try {
      const flatArgs = args.flat();
      if (flatArgs.length === 0) return null;
      let max = -Infinity;
      let hasValidValue = false;
      for (const val of flatArgs) {
        const num = parseFloat(val);
        if (!isNaN(num)) {
          if (num > max) max = num;
          hasValidValue = true;
        }
      }
      return hasValidValue ? max : NaN;
    } catch (e) {
      return NaN;
    }
  },

  'RANGE': (x, na_rm = false) => {
    try {
      if (x === null || x === undefined) return null;
      if (!Array.isArray(x)) x = [x];
      let min = Infinity, max = -Infinity;
      let hasValidValue = false;
      for (const val of x) {
        const num = parseFloat(val);
        if (!isNaN(num)) {
          if (num < min) min = num;
          if (num > max) max = num;
          hasValidValue = true;
        } else if (!na_rm) {
          return [NaN, NaN];
        }
      }
      return hasValidValue ? [min, max] : (na_rm ? [Infinity, -Infinity] : [NaN, NaN]);
    } catch (e) {
      return [NaN, NaN];
    }
  },

  // Special Mathematical Functions
  'GAMMA': (x) => {
    try {
      if (x === null || x === undefined) return null;
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.GAMMA(val));
      }
      const num = parseFloat(x);
      if (isNaN(num)) return NaN;
      if (num <= 0 && Number.isInteger(num)) return NaN; // Gamma not defined for non-positive integers
      
      // Handle special cases
      if (num === 0.5) return Math.sqrt(Math.PI);
      if (num === 1) return 1;
      if (num === 2) return 1;
      
      // For integers n > 2, gamma(n) = (n-1)!
      if (Number.isInteger(num) && num > 2 && num <= 20) {
        let result = 1;
        for (let i = 2; i < num; i++) {
          result *= i;
        }
        return result;
      }
      
      // Lanczos approximation for gamma function
      if (num < 0.5) {
        // Use reflection formula: Γ(z) * Γ(1-z) = π / sin(πz)
        return Math.PI / (Math.sin(Math.PI * num) * rMathFunctions.GAMMA(1 - num));
      }
      
      const g = 7;
      const p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
                 771.32342877765313, -176.61502916214059, 12.507343278686905,
                 -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
      
      const z = num - 1;
      let a = p[0];
      for (let i = 1; i < g + 2; i++) {
        a += p[i] / (z + i);
      }
      const t = z + g + 0.5;
      const sqrt2pi = Math.sqrt(2 * Math.PI);
      return sqrt2pi * Math.pow(t, z + 0.5) * Math.exp(-t) * a;
    } catch (e) {
      return NaN;
    }
  },

  'LGAMMA': (x) => {
    try {
      if (x === null || x === undefined) return null;
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.LGAMMA(val));
      }
      const gamma = rMathFunctions.GAMMA(x);
      return isNaN(gamma) || gamma <= 0 ? NaN : Math.log(gamma);
    } catch (e) {
      return NaN;
    }
  },

  'FACTORIAL': (x) => {
    try {
      if (x === null || x === undefined) return null;
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.FACTORIAL(val));
      }
      const num = parseFloat(x);
      if (isNaN(num) || num < 0 || !Number.isInteger(num)) return NaN;
      if (num === 0 || num === 1) return 1;
      return rMathFunctions.GAMMA(num + 1);
    } catch (e) {
      return NaN;
    }
  },

  'CHOOSE': (n, k) => {
    try {
      if (n === null || n === undefined || k === null || k === undefined) return null;
      if (Array.isArray(n) && Array.isArray(k)) {
        const maxLen = Math.max(n.length, k.length);
        return Array.from({length: maxLen}, (_, i) => 
          rMathFunctions.CHOOSE(n[i % n.length], k[i % k.length])
        );
      }
      const numN = parseFloat(n);
      const numK = parseFloat(k);
      if (isNaN(numN) || isNaN(numK) || numK < 0 || numN < numK) return NaN;
      if (numK === 0 || numK === numN) return 1;
      return rMathFunctions.GAMMA(numN + 1) / (rMathFunctions.GAMMA(numK + 1) * rMathFunctions.GAMMA(numN - numK + 1));
    } catch (e) {
      return NaN;
    }
  },

  // Complex Number Utilities
  'COMPLEX': (real, imaginary = 0) => {
    try {
      if (real === null || real === undefined) return null;
      const r = parseFloat(real);
      const i = parseFloat(imaginary);
      if (isNaN(r) || isNaN(i)) return NaN;
      return { real: r, imaginary: i, type: 'complex' };
    } catch (e) {
      return NaN;
    }
  },

  'RE': (x) => {
    try {
      if (x === null || x === undefined) return null;
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.RE(val));
      }
      if (typeof x === 'object' && x.type === 'complex') {
        return x.real;
      }
      const num = parseFloat(x);
      return isNaN(num) ? NaN : num;
    } catch (e) {
      return NaN;
    }
  },

  'IM': (x) => {
    try {
      if (x === null || x === undefined) return null;
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.IM(val));
      }
      if (typeof x === 'object' && x.type === 'complex') {
        return x.imaginary;
      }
      return 0; // Real numbers have imaginary part = 0
    } catch (e) {
      return NaN;
    }
  },

  'MOD': (x, y) => {
    try {
      if (x === null || x === undefined || y === null || y === undefined) return null;
      if (Array.isArray(x) && Array.isArray(y)) {
        const maxLen = Math.max(x.length, y.length);
        return Array.from({length: maxLen}, (_, i) => 
          rMathFunctions.MOD(x[i % x.length], y[i % y.length])
        );
      }
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.MOD(val, y));
      }
      if (Array.isArray(y)) {
        return y.map(val => rMathFunctions.MOD(x, val));
      }
      const numX = parseFloat(x);
      const numY = parseFloat(y);
      if (isNaN(numX) || isNaN(numY) || numY === 0) return NaN;
      return ((numX % numY) + numY) % numY; // Ensure positive result like R
    } catch (e) {
      return NaN;
    }
  },

  'SIGN': (x) => {
    try {
      if (x === null || x === undefined) return null;
      if (Array.isArray(x)) {
        return x.map(val => rMathFunctions.SIGN(val));
      }
      const num = parseFloat(x);
      if (isNaN(num)) return NaN;
      return num > 0 ? 1 : num < 0 ? -1 : 0;
    } catch (e) {
      return NaN;
    }
  }
};

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { rMathFunctions };
} else if (typeof window !== 'undefined') {
  window.rMathFunctions = rMathFunctions;
}