/**
 * Mathematical functions for REXX interpreter
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

const mathFunctions = {
  'ABS': (num) => {
    const n = typeof num === 'number' ? num : parseFloat(num);
    return isNaN(n) ? 0 : Math.abs(n);
  },

  'MAX': (...args) => {
    if (args.length === 0) return 0;
    // Flatten arrays if passed as single argument
    const flatArgs = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
    const numbers = flatArgs.map(arg => typeof arg === 'number' ? arg : parseFloat(arg)).filter(n => !isNaN(n));
    return numbers.length > 0 ? Math.max(...numbers) : 0;
  },

  'MIN': (...args) => {
    if (args.length === 0) return 0;
    // Flatten arrays if passed as single argument
    const flatArgs = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
    const numbers = flatArgs.map(arg => typeof arg === 'number' ? arg : parseFloat(arg)).filter(n => !isNaN(n));
    return numbers.length > 0 ? Math.min(...numbers) : 0;
  },

  'MATH_ABS': (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      throw new Error(`Cannot calculate absolute value of '${value}' - not a number`);
    }
    return Math.abs(num);
  },
  
  'MATH_CEIL': (value) => {
    try {
      return Math.ceil(parseFloat(value));
    } catch (e) {
      return 0;
    }
  },
  
  'MATH_FLOOR': (value) => {
    try {
      return Math.floor(parseFloat(value));
    } catch (e) {
      return 0;
    }
  },
  
  'MATH_ROUND': (value, precision = 0) => {
    try {
      const num = parseFloat(value);
      const prec = parseInt(precision) || 0;
      return Math.round(num * Math.pow(10, prec)) / Math.pow(10, prec);
    } catch (e) {
      return 0;
    }
  },
  
  'MATH_MAX': (...values) => {
    try {
      const nums = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
      return nums.length > 0 ? Math.max(...nums) : 0;
    } catch (e) {
      return 0;
    }
  },
  
  'MATH_MIN': (...values) => {
    try {
      const nums = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
      return nums.length > 0 ? Math.min(...nums) : 0;
    } catch (e) {
      return 0;
    }
  },
  
  'MATH_SUM': (...values) => {
    try {
      return values.reduce((sum, val) => {
        const num = parseFloat(val);
        return sum + (isNaN(num) ? 0 : num);
      }, 0);
    } catch (e) {
      return 0;
    }
  },
  
  'MATH_ADD': (...values) => {
    try {
      return values.reduce((sum, val) => {
        const num = parseFloat(val);
        return sum + (isNaN(num) ? 0 : num);
      }, 0);
    } catch (e) {
      return 0;
    }
  },
  
  'MATH_MULTIPLY': (...values) => {
    try {
      return values.reduce((product, val) => {
        const num = parseFloat(val);
        return product * (isNaN(num) ? 1 : num);
      }, 1);
    } catch (e) {
      return 0;
    }
  },
  
  'MATH_AVERAGE': (...values) => {
    try {
      const nums = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
      return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
    } catch (e) {
      return 0;
    }
  },
  
  'MATH_POWER': (base, exponent) => {
    try {
      return Math.pow(parseFloat(base), parseFloat(exponent));
    } catch (e) {
      return 0;
    }
  },
  
  'MATH_SQRT': (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      throw new Error(`Cannot calculate square root of '${value}' - not a number`);
    }
    if (num < 0) {
      throw new Error(`Cannot calculate square root of negative number: ${num}`);
    }
    return Math.sqrt(num);
  },
  
  'MATH_LOG': (value, base = Math.E) => {
    try {
      const num = parseFloat(value);
      const logBase = parseFloat(base);
      if (num <= 0) return NaN;
      return logBase === Math.E ? Math.log(num) : Math.log(num) / Math.log(logBase);
    } catch (e) {
      return NaN;
    }
  },
  
  'MATH_SIN': (value, unit = 'radians') => {
    try {
      const num = parseFloat(value);
      const radians = unit.toLowerCase() === 'degrees' ? num * Math.PI / 180 : num;
      return Math.sin(radians);
    } catch (e) {
      return 0;
    }
  },
  
  'MATH_COS': (value, unit = 'radians') => {
    try {
      const num = parseFloat(value);
      const radians = unit.toLowerCase() === 'degrees' ? num * Math.PI / 180 : num;
      return Math.cos(radians);
    } catch (e) {
      return 0;
    }
  },
  
  'MATH_TAN': (value, unit = 'radians') => {
    try {
      const num = parseFloat(value);
      const radians = unit.toLowerCase() === 'degrees' ? num * Math.PI / 180 : num;
      return Math.tan(radians);
    } catch (e) {
      return 0;
    }
  },
  
  'MATH_RANDOM': (min = 0, max = 1) => {
    try {
      const minNum = parseFloat(min);
      const maxNum = parseFloat(max);
      return Math.random() * (maxNum - minNum) + minNum;
    } catch (e) {
      return Math.random();
    }
  },
  
  'MATH_RANDOM_INT': (min = 0, max = 100) => {
    try {
      const minNum = Math.ceil(parseFloat(min));
      const maxNum = Math.floor(parseFloat(max));
      return Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
    } catch (e) {
      return Math.floor(Math.random() * 101);
    }
  },
  
  'MATH_CLAMP': (value, min, max) => {
    try {
      const num = parseFloat(value);
      const minNum = parseFloat(min);
      const maxNum = parseFloat(max);
      return Math.min(Math.max(num, minNum), maxNum);
    } catch (e) {
      return 0;
    }
  },
  
  'MATH_PERCENTAGE': (value, total) => {
    try {
      const num = parseFloat(value);
      const totalNum = parseFloat(total);
      return totalNum !== 0 ? (num / totalNum) * 100 : 0;
    } catch (e) {
      return 0;
    }
  },
  
  'MATH_FACTORIAL': (n) => {
    try {
      const num = Math.floor(parseFloat(n));
      if (num < 0) return NaN;
      if (num === 0 || num === 1) return 1;
      let result = 1;
      for (let i = 2; i <= num && i <= 170; i++) { // Limit to prevent overflow
        result *= i;
      }
      return result;
    } catch (e) {
      return NaN;
    }
  },
  
  'MATH_GCD': (a, b) => {
    try {
      let numA = Math.abs(Math.floor(parseFloat(a)));
      let numB = Math.abs(Math.floor(parseFloat(b)));
      while (numB !== 0) {
        const temp = numB;
        numB = numA % numB;
        numA = temp;
      }
      return numA;
    } catch (e) {
      return 0;
    }
  },
  
  'MATH_LCM': (a, b) => {
    try {
      const numA = Math.abs(Math.floor(parseFloat(a)));
      const numB = Math.abs(Math.floor(parseFloat(b)));
      // Calculate GCD inline since we can't reference other functions directly
      let gcdA = numA, gcdB = numB;
      while (gcdB !== 0) {
        const temp = gcdB;
        gcdB = gcdA % gcdB;
        gcdA = temp;
      }
      return gcdA !== 0 ? (numA * numB) / gcdA : 0;
    } catch (e) {
      return 0;
    }
  },
  
  'MATH_DISTANCE_2D': (x1, y1, x2, y2) => {
    try {
      const dx = parseFloat(x2) - parseFloat(x1);
      const dy = parseFloat(y2) - parseFloat(y1);
      return Math.sqrt(dx * dx + dy * dy);
    } catch (e) {
      return 0;
    }
  },
  
  'MATH_ANGLE_2D': (x1, y1, x2, y2, unit = 'radians') => {
    try {
      const dx = parseFloat(x2) - parseFloat(x1);
      const dy = parseFloat(y2) - parseFloat(y1);
      const radians = Math.atan2(dy, dx);
      return unit.toLowerCase() === 'degrees' ? radians * 180 / Math.PI : radians;
    } catch (e) {
      return 0;
    }
  }

  //TODO insert more here

};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { mathFunctions };
} else if (typeof window !== 'undefined') {
  window.mathFunctions = mathFunctions;
}