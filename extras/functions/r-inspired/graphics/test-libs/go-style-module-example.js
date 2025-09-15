/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Go-Style Module Path Example for RexxJS Libraries
 * 
 * This demonstrates the Go-inspired module path system for RexxJS libraries.
 * Instead of just "username/repo", you can use the full repository URL path.
 * 
 * Repository: https://github.com/alice-dev/advanced-math-utils
 * Module Path: github.com/alice-dev/advanced-math-utils
 * Usage: REQUIRE "github.com/alice-dev/advanced-math-utils"
 * 
 * The system will:
 * 1. Parse "github.com/alice-dev/advanced-math-utils"
 * 2. Resolve to: https://raw.githubusercontent.com/alice-dev/advanced-math-utils/main/dist/advanced-math-utils.js
 * 3. Export as: window['advanced-math-utils'] or global['advanced-math-utils']
 * 4. Detection function: ADVANCED_MATH_UTILS_MAIN
 */

const advancedMathUtils = {
  // PRIMARY DETECTION FUNCTION (REQUIRED)
  'ADVANCED_MATH_UTILS_MAIN': () => {
    return {
      type: 'module_info',
      module: 'github.com/alice-dev/advanced-math-utils',
      name: 'Advanced Math Utils',
      version: '2.1.0',
      author: 'Alice Developer',
      description: 'Advanced mathematical utilities for RexxJS',
      repository: 'https://github.com/alice-dev/advanced-math-utils',
      functions: Object.keys(advancedMathUtils).filter(key => typeof advancedMathUtils[key] === 'function'),
      loaded: true,
      timestamp: new Date().toISOString()
    };
  },

  // Advanced mathematical functions
  'CALCULATE_PRIME_FACTORS': (n) => {
    try {
      const num = parseInt(n);
      if (isNaN(num) || num < 2) {
        throw new Error('CALCULATE_PRIME_FACTORS: n must be an integer >= 2');
      }
      
      const factors = [];
      let current = num;
      let divisor = 2;
      
      while (divisor * divisor <= current) {
        while (current % divisor === 0) {
          factors.push(divisor);
          current /= divisor;
        }
        divisor++;
      }
      
      if (current > 1) {
        factors.push(current);
      }
      
      return {
        type: 'prime_factors',
        input: num,
        factors: factors,
        count: factors.length,
        unique_factors: [...new Set(factors)]
      };
    } catch (error) {
      return { type: 'error', error: error.message };
    }
  },

  'MATRIX_DETERMINANT': (matrix) => {
    try {
      if (!Array.isArray(matrix) || !Array.isArray(matrix[0])) {
        throw new Error('MATRIX_DETERMINANT: input must be a 2D array');
      }
      
      const n = matrix.length;
      if (matrix.some(row => row.length !== n)) {
        throw new Error('MATRIX_DETERMINANT: matrix must be square');
      }
      
      // Simple recursive determinant calculation (for small matrices)
      const det = this.calculateDeterminant(matrix);
      
      return {
        type: 'determinant',
        matrix_size: `${n}x${n}`,
        determinant: det,
        is_singular: Math.abs(det) < 1e-10
      };
    } catch (error) {
      return { type: 'error', error: error.message };
    }
  },

  'STATISTICAL_ANALYSIS': (data, options = {}) => {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('STATISTICAL_ANALYSIS: data must be a non-empty array');
      }
      
      const numbers = data.map(x => parseFloat(x)).filter(x => !isNaN(x));
      if (numbers.length === 0) {
        throw new Error('STATISTICAL_ANALYSIS: no valid numbers found in data');
      }
      
      numbers.sort((a, b) => a - b);
      const n = numbers.length;
      const sum = numbers.reduce((a, b) => a + b, 0);
      const mean = sum / n;
      
      const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
      const stdDev = Math.sqrt(variance);
      
      const median = n % 2 === 0 
        ? (numbers[n/2 - 1] + numbers[n/2]) / 2
        : numbers[Math.floor(n/2)];
      
      const q1 = this.calculatePercentile(numbers, 25);
      const q3 = this.calculatePercentile(numbers, 75);
      
      return {
        type: 'statistical_analysis',
        sample_size: n,
        mean: mean,
        median: median,
        mode: this.calculateMode(numbers),
        std_dev: stdDev,
        variance: variance,
        min: numbers[0],
        max: numbers[n-1],
        range: numbers[n-1] - numbers[0],
        quartiles: { q1, median, q3 },
        iqr: q3 - q1,
        skewness: this.calculateSkewness(numbers, mean, stdDev),
        kurtosis: this.calculateKurtosis(numbers, mean, stdDev)
      };
    } catch (error) {
      return { type: 'error', error: error.message };
    }
  },

  // Private helper methods
  calculateDeterminant: function(matrix) {
    const n = matrix.length;
    if (n === 1) return matrix[0][0];
    if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    
    let det = 0;
    for (let i = 0; i < n; i++) {
      const minor = matrix.slice(1).map(row => row.filter((_, j) => j !== i));
      det += Math.pow(-1, i) * matrix[0][i] * this.calculateDeterminant(minor);
    }
    return det;
  },

  calculatePercentile: function(sortedArray, percentile) {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  },

  calculateMode: function(numbers) {
    const frequency = {};
    numbers.forEach(num => frequency[num] = (frequency[num] || 0) + 1);
    const maxFreq = Math.max(...Object.values(frequency));
    return Object.keys(frequency).filter(key => frequency[key] === maxFreq).map(Number);
  },

  calculateSkewness: function(numbers, mean, stdDev) {
    const n = numbers.length;
    const sum = numbers.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0);
    return (n / ((n - 1) * (n - 2))) * sum;
  },

  calculateKurtosis: function(numbers, mean, stdDev) {
    const n = numbers.length;
    const sum = numbers.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0);
    return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum - (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
  }
};

// EXPORT USING MODULE PATH AS NAMESPACE
// The library name extracted from the module path becomes the namespace
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = { 'advanced-math-utils': advancedMathUtils };
  
  if (typeof global !== 'undefined') {
    global['advanced-math-utils'] = advancedMathUtils;
  }
} else if (typeof window !== 'undefined') {
  // Browser environment
  window['advanced-math-utils'] = advancedMathUtils;
  
  if (typeof window.Interpreter !== 'undefined' || typeof window.RexxInterpreter !== 'undefined') {
    console.log('✓ github.com/alice-dev/advanced-math-utils loaded and ready for REQUIRE');
  }
}

/*
SUPPORTED MODULE PATHS:

1. Full GitHub module path:
   REQUIRE "github.com/alice-dev/advanced-math-utils"
   → https://raw.githubusercontent.com/alice-dev/advanced-math-utils/main/dist/advanced-math-utils.js

2. Full GitLab module path:
   REQUIRE "gitlab.com/alice-dev/math-tools"  
   → https://raw.githubusercontent.com/alice-dev/math-tools/main/dist/math-tools.js

3. Simple username/repo format:
   REQUIRE "alice-dev/simple-lib"
   → https://raw.githubusercontent.com/alice-dev/simple-lib/main/dist/simple-lib.js

4. Legacy rexx-libs format:
   REQUIRE "scipy-interpolation"
   → https://raw.githubusercontent.com/rexx-libs/scipy-interpolation/main/lib/scipy-interpolation.js

ADVANTAGES OF GO-STYLE MODULE PATHS:
- Clear provenance: You know exactly where the code comes from
- Avoid naming conflicts: github.com/alice/math vs github.com/bob/math
- Version control friendly: Easy to track dependencies
- Self-documenting: The import tells you the repository
- Future-proof: Can support other Git hosts easily

USAGE IN REXX:
```rexx
-- Load the advanced math library  
REQUIRE "github.com/alice-dev/advanced-math-utils"

-- Use the functions
LET factors = CALCULATE_PRIME_FACTORS n=12345
SAY factors.factors

LET matrix = JSON_PARSE text="[[1,2],[3,4]]"
LET det = MATRIX_DETERMINANT matrix=matrix
SAY det.determinant

LET data = JSON_PARSE text="[1,2,3,4,5,6,7,8,9,10]"
LET stats = STATISTICAL_ANALYSIS data=data
SAY stats.mean
SAY stats.std_dev
```
*/