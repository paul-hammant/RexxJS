/**
 * R-style numeric summary functions for REXX interpreter
 * Mirrors R-language statistical summary functions
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

const rSummaryFunctions = {
  // Primary detection function (must be first)
  'MEAN_MAIN': (x, na_rm = false) => {
    // Alias to MEAN for detection purposes
    return rSummaryFunctions.MEAN(x, na_rm);
  },
  // Basic central tendency
  'MEAN': (x, na_rm = false) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      let nums = values.map(v => parseFloat(v));
      const naRm = String(na_rm).toLowerCase() === 'true' || na_rm === true;
      
      if (!naRm && nums.some(n => isNaN(n))) return NaN;
      nums = nums.filter(n => !isNaN(n));
      
      return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : NaN;
    } catch (e) {
      return NaN;
    }
  },
  
  'MEDIAN': (x, na_rm = false) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      let nums = values.map(v => parseFloat(v));
      const naRm = String(na_rm).toLowerCase() === 'true' || na_rm === true;
      
      if (!naRm && nums.some(n => isNaN(n))) return NaN;
      nums = nums.filter(n => !isNaN(n)).sort((a, b) => a - b);
      
      if (nums.length === 0) return NaN;
      const mid = Math.floor(nums.length / 2);
      return nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];
    } catch (e) {
      return NaN;
    }
  },

  // Summation and counting
  'SUM': (x, na_rm = false) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      let nums = values.map(v => parseFloat(v));
      const naRm = String(na_rm).toLowerCase() === 'true' || na_rm === true;
      
      if (!naRm && nums.some(n => isNaN(n))) return NaN;
      nums = nums.filter(n => !isNaN(n));
      
      return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) : 0;
    } catch (e) {
      return NaN;
    }
  },
  
  'LENGTH': (x) => {
    try {
      if (Array.isArray(x)) return x.length;
      if (x === null || x === undefined) return 0;
      return 1;
    } catch (e) {
      return 0;
    }
  },

  // Range functions
  'MIN': (x, na_rm = false) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      let nums = values.map(v => parseFloat(v));
      const naRm = String(na_rm).toLowerCase() === 'true' || na_rm === true;
      
      if (!naRm && nums.some(n => isNaN(n))) return NaN;
      nums = nums.filter(n => !isNaN(n));
      
      return nums.length > 0 ? Math.min(...nums) : Infinity;
    } catch (e) {
      return NaN;
    }
  },
  
  'MAX': (x, na_rm = false) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      let nums = values.map(v => parseFloat(v));
      const naRm = String(na_rm).toLowerCase() === 'true' || na_rm === true;
      
      if (!naRm && nums.some(n => isNaN(n))) return NaN;
      nums = nums.filter(n => !isNaN(n));
      
      return nums.length > 0 ? Math.max(...nums) : -Infinity;
    } catch (e) {
      return NaN;
    }
  },
  
  'RANGE': (x, na_rm = false) => {
    try {
      const minVal = rSummaryFunctions.MIN(x, na_rm);
      const maxVal = rSummaryFunctions.MAX(x, na_rm);
      return [minVal, maxVal];
    } catch (e) {
      return [NaN, NaN];
    }
  },

  // Variance and standard deviation
  'VAR': (x, na_rm = false) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      let nums = values.map(v => parseFloat(v));
      const naRm = String(na_rm).toLowerCase() === 'true' || na_rm === true;
      
      if (!naRm && nums.some(n => isNaN(n))) return NaN;
      nums = nums.filter(n => !isNaN(n));
      
      if (nums.length < 2) return NaN;
      
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      const variance = nums.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / (nums.length - 1);
      return variance;
    } catch (e) {
      return NaN;
    }
  },
  
  'SD': (x, na_rm = false) => {
    try {
      const variance = rSummaryFunctions.VAR(x, na_rm);
      return isNaN(variance) ? NaN : Math.sqrt(variance);
    } catch (e) {
      return NaN;
    }
  },

  // Quantile function (like R's quantile)
  'QUANTILE': (x, probs = [0, 0.25, 0.5, 0.75, 1.0], na_rm = false, type = 7) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      let nums = values.map(v => parseFloat(v));
      const naRm = String(na_rm).toLowerCase() === 'true' || na_rm === true;
      
      const probArray = Array.isArray(probs) ? probs : [probs];
      
      if (!naRm && nums.some(n => isNaN(n))) {
        return probArray.length === 1 ? NaN : probArray.map(() => NaN);
      }
      nums = nums.filter(n => !isNaN(n)).sort((a, b) => a - b);
      
      if (nums.length === 0) {
        return probArray.length === 1 ? NaN : probArray.map(() => NaN);
      }
      
      const result = probArray.map(p => {
        if (p < 0 || p > 1) return NaN;
        if (p === 0) return nums[0];
        if (p === 1) return nums[nums.length - 1];
        
        // R's default quantile method (type 7)
        const h = (nums.length - 1) * p;
        const h_floor = Math.floor(h);
        const h_ceil = Math.ceil(h);
        
        if (h_floor === h_ceil) return nums[h_floor];
        return nums[h_floor] + (h - h_floor) * (nums[h_ceil] - nums[h_floor]);
      });
      
      return probArray.length === 1 ? result[0] : result;
    } catch (e) {
      return Array.isArray(probs) ? probs.map(() => NaN) : NaN;
    }
  },

  // Summary function (like R's summary)
  'SUMMARY': (x, na_rm = false) => {
    try {
      const min = rSummaryFunctions.MIN(x, na_rm);
      const q1 = rSummaryFunctions.QUANTILE(x, 0.25, na_rm);
      const median = rSummaryFunctions.MEDIAN(x, na_rm);
      const mean = rSummaryFunctions.MEAN(x, na_rm);
      const q3 = rSummaryFunctions.QUANTILE(x, 0.75, na_rm);
      const max = rSummaryFunctions.MAX(x, na_rm);
      
      return {
        'Min': min,
        '1st Qu': q1,
        'Median': median,
        'Mean': mean,
        '3rd Qu': q3,
        'Max': max
      };
    } catch (e) {
      return {
        'Min': NaN,
        '1st Qu': NaN,
        'Median': NaN,
        'Mean': NaN,
        '3rd Qu': NaN,
        'Max': NaN
      };
    }
  },

  // Additional useful functions
  'IQR': (x, na_rm = false) => {
    try {
      const q1 = rSummaryFunctions.QUANTILE(x, 0.25, na_rm);
      const q3 = rSummaryFunctions.QUANTILE(x, 0.75, na_rm);
      return q3 - q1;
    } catch (e) {
      return NaN;
    }
  },
  
  'MAD': (x, center = null, constant = 1.4826, na_rm = false) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      let nums = values.map(v => parseFloat(v));
      
      if (!na_rm && nums.some(n => isNaN(n))) return NaN;
      nums = nums.filter(n => !isNaN(n));
      
      if (nums.length === 0) return NaN;
      
      const centerVal = center !== null ? parseFloat(center) : rSummaryFunctions.MEDIAN(nums, true);
      const deviations = nums.map(x => Math.abs(x - centerVal));
      const mad = rSummaryFunctions.MEDIAN(deviations, true);
      
      return mad * parseFloat(constant);
    } catch (e) {
      return NaN;
    }
  },

  'FIVENUM': (x, na_rm = false) => {
    try {
      const min = rSummaryFunctions.MIN(x, na_rm);
      const q1 = rSummaryFunctions.QUANTILE(x, 0.25, na_rm);
      const median = rSummaryFunctions.MEDIAN(x, na_rm);
      const q3 = rSummaryFunctions.QUANTILE(x, 0.75, na_rm);
      const max = rSummaryFunctions.MAX(x, na_rm);
      
      return [min, q1, median, q3, max];
    } catch (e) {
      return [NaN, NaN, NaN, NaN, NaN];
    }
  },

  'DIFF': (x, lag = 1, differences = 1) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      let nums = values.map(v => parseFloat(v));
      
      const lagNum = Math.max(1, parseInt(lag) || 1);
      const diffNum = Math.max(1, parseInt(differences) || 1);
      
      let result = [...nums];
      
      for (let d = 0; d < diffNum; d++) {
        const temp = [];
        for (let i = lagNum; i < result.length; i++) {
          temp.push(result[i] - result[i - lagNum]);
        }
        result = temp;
      }
      
      return result;
    } catch (e) {
      return [];
    }
  },

  'CUMSUM': (x) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const nums = values.map(v => parseFloat(v));
      
      let cumulative = 0;
      let hasNaN = false;
      return nums.map(n => {
        if (isNaN(n) || hasNaN) {
          hasNaN = true;
          return NaN;
        }
        cumulative += n;
        return cumulative;
      });
    } catch (e) {
      return [];
    }
  },

  'CUMPROD': (x) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const nums = values.map(v => parseFloat(v));
      
      let cumulative = 1;
      let hasNaN = false;
      return nums.map(n => {
        if (isNaN(n) || hasNaN) {
          hasNaN = true;
          return NaN;
        }
        cumulative *= n;
        return cumulative;
      });
    } catch (e) {
      return [];
    }
  },

  'CUMMAX': (x) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const nums = values.map(v => parseFloat(v));
      
      let maxSoFar = -Infinity;
      return nums.map(n => {
        if (isNaN(n)) return NaN;
        maxSoFar = Math.max(maxSoFar, n);
        return maxSoFar;
      });
    } catch (e) {
      return [];
    }
  },

  'CUMMIN': (x) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const nums = values.map(v => parseFloat(v));
      
      let minSoFar = Infinity;
      return nums.map(n => {
        if (isNaN(n)) return NaN;
        minSoFar = Math.min(minSoFar, n);
        return minSoFar;
      });
    } catch (e) {
      return [];
    }
  },

  // Correlation function
  'COR': (x, y, use = 'complete.obs') => {
    try {
      const xArray = Array.isArray(x) ? x : [x];
      const yArray = Array.isArray(y) ? y : [y];
      
      if (xArray.length !== yArray.length) {
        return NaN;
      }

      // Remove pairs with missing values if use='complete.obs'
      const pairs = [];
      for (let i = 0; i < xArray.length; i++) {
        const xVal = parseFloat(xArray[i]);
        const yVal = parseFloat(yArray[i]);
        if (!isNaN(xVal) && !isNaN(yVal)) {
          pairs.push([xVal, yVal]);
        }
      }

      if (pairs.length < 2) return NaN;

      const n = pairs.length;
      const xMean = pairs.reduce((sum, pair) => sum + pair[0], 0) / n;
      const yMean = pairs.reduce((sum, pair) => sum + pair[1], 0) / n;

      let numerator = 0;
      let xSumSq = 0;
      let ySumSq = 0;

      for (const [xVal, yVal] of pairs) {
        const xDiff = xVal - xMean;
        const yDiff = yVal - yMean;
        numerator += xDiff * yDiff;
        xSumSq += xDiff * xDiff;
        ySumSq += yDiff * yDiff;
      }

      const denominator = Math.sqrt(xSumSq * ySumSq);
      return denominator === 0 ? NaN : numerator / denominator;
    } catch (e) {
      return NaN;
    }
  },

  // Covariance function
  'COV': (x, y, use = 'complete.obs') => {
    try {
      const xArray = Array.isArray(x) ? x : [x];
      const yArray = Array.isArray(y) ? y : [y];
      
      if (xArray.length !== yArray.length) {
        return NaN;
      }

      // Remove pairs with missing values if use='complete.obs'
      const pairs = [];
      for (let i = 0; i < xArray.length; i++) {
        const xVal = parseFloat(xArray[i]);
        const yVal = parseFloat(yArray[i]);
        if (!isNaN(xVal) && !isNaN(yVal)) {
          pairs.push([xVal, yVal]);
        }
      }

      if (pairs.length < 2) return NaN;

      const n = pairs.length;
      const xMean = pairs.reduce((sum, pair) => sum + pair[0], 0) / n;
      const yMean = pairs.reduce((sum, pair) => sum + pair[1], 0) / n;

      let covariance = 0;
      for (const [xVal, yVal] of pairs) {
        covariance += (xVal - xMean) * (yVal - yMean);
      }

      return covariance / (n - 1); // Sample covariance
    } catch (e) {
      return NaN;
    }
  },

  // Scale function (standardize to mean=0, sd=1)
  'SCALE': (x, center = true, scale = true) => {
    try {
      const array = Array.isArray(x) ? x.map(v => parseFloat(v)).filter(v => !isNaN(v)) : [parseFloat(x)];
      if (array.length === 0) return [];

      let result = [...array];

      if (center) {
        const mean = rSummaryFunctions.MEAN(result);
        result = result.map(v => v - mean);
      }

      if (scale) {
        const sd = Math.sqrt(rSummaryFunctions.VAR(array));
        if (sd > 0) {
          result = result.map(v => v / sd);
        }
      }

      return result.length === 1 ? result[0] : result;
    } catch (e) {
      return Array.isArray(x) ? [] : NaN;
    }
  },

  // Quantile function
  'QUANTILE': (x, probs = [0, 0.25, 0.5, 0.75, 1.0], na_rm = false) => {
    try {
      let array = Array.isArray(x) ? x.map(v => parseFloat(v)) : [parseFloat(x)];
      
      if (na_rm) {
        array = array.filter(v => !isNaN(v));
      } else if (array.some(v => isNaN(v))) {
        return Array.isArray(probs) ? probs.map(() => NaN) : NaN;
      }

      if (array.length === 0) {
        return Array.isArray(probs) ? probs.map(() => NaN) : NaN;
      }

      array.sort((a, b) => a - b);
      const probsArray = Array.isArray(probs) ? probs : [probs];
      
      const quantiles = probsArray.map(p => {
        if (p < 0 || p > 1) return NaN;
        
        const index = (array.length - 1) * p;
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        
        if (lower === upper) {
          return array[lower];
        } else {
          const weight = index - lower;
          return array[lower] * (1 - weight) + array[upper] * weight;
        }
      });

      return Array.isArray(probs) ? quantiles : quantiles[0];
    } catch (e) {
      return Array.isArray(probs) ? probs.map(() => NaN) : NaN;
    }
  },

  // IQR (Interquartile Range)
  'IQR': (x, na_rm = false) => {
    try {
      const quartiles = rSummaryFunctions.QUANTILE(x, [0.25, 0.75], na_rm);
      return Array.isArray(quartiles) && quartiles.length >= 2 ? 
        quartiles[1] - quartiles[0] : NaN;
    } catch (e) {
      return NaN;
    }
  }
};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { rSummaryFunctions };
} else if (typeof window !== 'undefined') {
  window.rSummaryFunctions = rSummaryFunctions;
}