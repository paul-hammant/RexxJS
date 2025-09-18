/**
 * Statistical analysis functions for REXX interpreter
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

const statisticsFunctions = {
  'AVERAGE': (...values) => {
    try {
      const nums = values.flat().map(v => parseFloat(v)).filter(n => !isNaN(n));
      return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
    } catch (e) {
      return 0;
    }
  },
  
  'MEDIAN': (...values) => {
    try {
      const nums = values.flat().map(v => parseFloat(v)).filter(n => !isNaN(n)).sort((a, b) => a - b);
      if (nums.length === 0) return 0;
      const mid = Math.floor(nums.length / 2);
      return nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];
    } catch (e) {
      return 0;
    }
  },
  
  'MODE': (...values) => {
    try {
      const nums = values.flat().map(v => parseFloat(v)).filter(n => !isNaN(n));
      const counts = {};
      let maxCount = 0;
      let mode = 0;
      
      nums.forEach(num => {
        counts[num] = (counts[num] || 0) + 1;
        if (counts[num] > maxCount) {
          maxCount = counts[num];
          mode = num;
        }
      });
      
      return mode;
    } catch (e) {
      return 0;
    }
  },
  
  'STDEV': (...values) => {
    try {
      const nums = values.flat().map(v => parseFloat(v)).filter(n => !isNaN(n));
      if (nums.length < 2) return 0;
      
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      const variance = nums.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / (nums.length - 1);
      return Math.sqrt(variance);
    } catch (e) {
      return 0;
    }
  },
  
  'VAR': (...values) => {
    try {
      const nums = values.flat().map(v => parseFloat(v)).filter(n => !isNaN(n));
      if (nums.length < 2) return 0;
      
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      return nums.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / (nums.length - 1);
    } catch (e) {
      return 0;
    }
  },
  
  'PERCENTILE': (array, percentile) => {
    try {
      const nums = (Array.isArray(array) ? array : [array]).map(v => parseFloat(v)).filter(n => !isNaN(n)).sort((a, b) => a - b);
      if (nums.length === 0) return 0;
      
      const p = parseFloat(percentile);
      if (p < 0 || p > 1) return 0;
      
      const index = p * (nums.length - 1);
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      
      if (lower === upper) return nums[lower];
      return nums[lower] + (nums[upper] - nums[lower]) * (index - lower);
    } catch (e) {
      return 0;
    }
  }

  //TODO insert more statistical functions here

};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { statisticsFunctions };
} else if (typeof window !== 'undefined') {
  window.statisticsFunctions = statisticsFunctions;
}