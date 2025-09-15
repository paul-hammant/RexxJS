/**
 * R-style logical and conditional functions for REXX interpreter
 * Mirrors R-language logical operations, conditional functions, and boolean operations
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

const rLogicalFunctions = {
  // Logical Operations
  'ALL': (...args) => {
    try {
      const values = args.flat();
      if (values.length === 0) return true;
      return values.every(val => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'boolean') return val;
        if (typeof val === 'number') return val !== 0 && !isNaN(val);
        if (typeof val === 'string') return val.toLowerCase() !== 'false' && val !== '0' && val !== '';
        return Boolean(val);
      });
    } catch (e) {
      return false;
    }
  },

  'ANY': (...args) => {
    try {
      const values = args.flat();
      if (values.length === 0) return false;
      return values.some(val => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'boolean') return val;
        if (typeof val === 'number') return val !== 0 && !isNaN(val);
        if (typeof val === 'string') return val.toLowerCase() !== 'false' && val !== '0' && val !== '';
        return Boolean(val);
      });
    } catch (e) {
      return false;
    }
  },

  'WHICH': (x) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const indices = [];
      values.forEach((val, idx) => {
        let isTruthy = false;
        if (val === null || val === undefined) isTruthy = false;
        else if (typeof val === 'boolean') isTruthy = val;
        else if (typeof val === 'number') isTruthy = val !== 0 && !isNaN(val);
        else if (typeof val === 'string') isTruthy = val.toLowerCase() !== 'false' && val !== '0' && val !== '';
        else isTruthy = Boolean(val);
        
        if (isTruthy) indices.push(idx);
      });
      return Array.isArray(x) ? indices : (indices.length > 0 ? indices : []);
    } catch (e) {
      return [];
    }
  },

  'WHICH_MAX': (x) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const nums = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
      if (nums.length === 0) return Array.isArray(x) ? [] : -1;
      
      const maxVal = Math.max(...nums);
      const indices = [];
      values.forEach((val, idx) => {
        const num = parseFloat(val);
        if (!isNaN(num) && num === maxVal) indices.push(idx);
      });
      return Array.isArray(x) ? indices : (indices.length > 0 ? indices[0] : -1);
    } catch (e) {
      return Array.isArray(x) ? [] : -1;
    }
  },

  'WHICH_MIN': (x) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const nums = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
      if (nums.length === 0) return Array.isArray(x) ? [] : -1;
      
      const minVal = Math.min(...nums);
      const indices = [];
      values.forEach((val, idx) => {
        const num = parseFloat(val);
        if (!isNaN(num) && num === minVal) indices.push(idx);
      });
      return Array.isArray(x) ? indices : (indices.length > 0 ? indices[0] : -1);
    } catch (e) {
      return Array.isArray(x) ? [] : -1;
    }
  },

  // Conditional Functions
  'IFELSE': (test, yes, no) => {
    try {
      const testVals = Array.isArray(test) ? test : [test];
      const yesVals = Array.isArray(yes) ? yes : [yes];
      const noVals = Array.isArray(no) ? no : [no];
      
      const maxLen = Math.max(testVals.length, yesVals.length, noVals.length);
      const result = [];
      
      for (let i = 0; i < maxLen; i++) {
        const testVal = testVals[i % testVals.length];
        const yesVal = yesVals[i % yesVals.length];
        const noVal = noVals[i % noVals.length];
        
        let condition = false;
        if (testVal === null || testVal === undefined) condition = false;
        else if (typeof testVal === 'boolean') condition = testVal;
        else if (typeof testVal === 'number') condition = testVal !== 0 && !isNaN(testVal);
        else if (typeof testVal === 'string') condition = testVal.toLowerCase() !== 'false' && testVal !== '0' && testVal !== '';
        else condition = Boolean(testVal);
        
        result.push(condition ? yesVal : noVal);
      }
      
      return Array.isArray(test) || Array.isArray(yes) || Array.isArray(no) ? result : result[0];
    } catch (e) {
      return no;
    }
  },

  'SWITCH': (expr, ...cases) => {
    try {
      const exprVal = String(expr);
      
      // Handle named cases (key=value pairs)
      for (let i = 0; i < cases.length - 1; i += 2) {
        if (String(cases[i]) === exprVal) {
          return cases[i + 1];
        }
      }
      
      // If odd number of cases, last one is default
      if (cases.length % 2 === 1) {
        return cases[cases.length - 1];
      }
      
      return null;
    } catch (e) {
      return null;
    }
  },

  // Missing Value Functions
  'IS_NA': (x) => {
    try {
      if (Array.isArray(x)) {
        return x.map(val => 
          val === null || val === undefined || 
          (typeof val === 'number' && isNaN(val)) ||
          String(val).toLowerCase() === 'na'
        );
      }
      return x === null || x === undefined || 
             (typeof x === 'number' && isNaN(x)) ||
             String(x).toLowerCase() === 'na';
    } catch (e) {
      return Array.isArray(x) ? [] : false;
    }
  },

  'IS_NULL': (x) => {
    try {
      if (Array.isArray(x)) {
        return x.map(val => val === null);
      }
      return x === null;
    } catch (e) {
      return Array.isArray(x) ? [] : false;
    }
  },

  'IS_FINITE': (x) => {
    try {
      if (Array.isArray(x)) {
        return x.map(val => {
          const num = parseFloat(val);
          return !isNaN(num) && isFinite(num);
        });
      }
      const num = parseFloat(x);
      return !isNaN(num) && isFinite(num);
    } catch (e) {
      return Array.isArray(x) ? [] : false;
    }
  },

  'IS_INFINITE': (x) => {
    try {
      if (Array.isArray(x)) {
        return x.map(val => {
          const num = parseFloat(val);
          return !isNaN(num) && !isFinite(num) && num !== NaN;
        });
      }
      const num = parseFloat(x);
      return !isNaN(num) && !isFinite(num) && num !== NaN;
    } catch (e) {
      return Array.isArray(x) ? [] : false;
    }
  },

  'IS_NAN': (x) => {
    try {
      if (Array.isArray(x)) {
        return x.map(val => {
          const num = parseFloat(val);
          return isNaN(num);
        });
      }
      const num = parseFloat(x);
      return isNaN(num);
    } catch (e) {
      return Array.isArray(x) ? [] : false;
    }
  },

  // Remove Missing Values
  'NA_OMIT': (x) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const filtered = values.filter(val => 
        val !== null && val !== undefined && 
        !(typeof val === 'number' && isNaN(val)) &&
        String(val).toLowerCase() !== 'na'
      );
      return Array.isArray(x) ? filtered : (filtered.length > 0 ? filtered[0] : null);
    } catch (e) {
      return Array.isArray(x) ? [] : null;
    }
  },

  'COMPLETE_CASES': (...args) => {
    try {
      if (args.length === 0) return [];
      
      const arrays = args.map(arg => Array.isArray(arg) ? arg : [arg]);
      const maxLen = Math.max(...arrays.map(arr => arr.length));
      const result = [];
      
      for (let i = 0; i < maxLen; i++) {
        let isComplete = true;
        for (let arr of arrays) {
          const val = arr[i % arr.length];
          if (val === null || val === undefined || 
              (typeof val === 'number' && isNaN(val)) ||
              String(val).toLowerCase() === 'na') {
            isComplete = false;
            break;
          }
        }
        result.push(isComplete);
      }
      
      return result;
    } catch (e) {
      return [];
    }
  },

  // Comparison Functions
  'PMAX': (...args) => {
    try {
      if (args.length === 0) return [];
      
      const arrays = args.map(arg => Array.isArray(arg) ? arg : [arg]);
      const maxLen = Math.max(...arrays.map(arr => arr.length));
      const result = [];
      
      for (let i = 0; i < maxLen; i++) {
        const values = arrays.map(arr => {
          const val = arr[i % arr.length];
          const num = parseFloat(val);
          return isNaN(num) ? -Infinity : num;
        });
        result.push(Math.max(...values));
      }
      
      return args.every(arg => !Array.isArray(arg)) && result.length === 1 ? result[0] : result;
    } catch (e) {
      return [];
    }
  },

  'PMIN': (...args) => {
    try {
      if (args.length === 0) return [];
      
      const arrays = args.map(arg => Array.isArray(arg) ? arg : [arg]);
      const maxLen = Math.max(...arrays.map(arr => arr.length));
      const result = [];
      
      for (let i = 0; i < maxLen; i++) {
        const values = arrays.map(arr => {
          const val = arr[i % arr.length];
          const num = parseFloat(val);
          return isNaN(num) ? Infinity : num;
        });
        result.push(Math.min(...values));
      }
      
      return args.every(arg => !Array.isArray(arg)) && result.length === 1 ? result[0] : result;
    } catch (e) {
      return [];
    }
  },

  // Logical Operators
  'XOR': (x, y) => {
    try {
      const xVals = Array.isArray(x) ? x : [x];
      const yVals = Array.isArray(y) ? y : [y];
      const maxLen = Math.max(xVals.length, yVals.length);
      const result = [];
      
      for (let i = 0; i < maxLen; i++) {
        const xVal = xVals[i % xVals.length];
        const yVal = yVals[i % yVals.length];
        
        const xBool = Boolean(xVal && xVal !== 0 && xVal !== '0' && xVal !== 'false');
        const yBool = Boolean(yVal && yVal !== 0 && yVal !== '0' && yVal !== 'false');
        
        result.push(xBool !== yBool);
      }
      
      return Array.isArray(x) || Array.isArray(y) ? result : result[0];
    } catch (e) {
      return false;
    }
  },

  // Type Checking Functions
  'IS_LOGICAL': (x) => {
    try {
      if (Array.isArray(x)) {
        return x.map(val => typeof val === 'boolean');
      }
      return typeof x === 'boolean';
    } catch (e) {
      return Array.isArray(x) ? [] : false;
    }
  },

  'IS_NUMERIC': (x) => {
    try {
      if (Array.isArray(x)) {
        return x.map(val => {
          const num = parseFloat(val);
          return !isNaN(num) && isFinite(num);
        });
      }
      const num = parseFloat(x);
      return !isNaN(num) && isFinite(num);
    } catch (e) {
      return Array.isArray(x) ? [] : false;
    }
  },

  'IS_CHARACTER': (x) => {
    try {
      if (Array.isArray(x)) {
        return x.map(val => typeof val === 'string');
      }
      return typeof x === 'string';
    } catch (e) {
      return Array.isArray(x) ? [] : false;
    }
  },

  'IS_INTEGER': (x) => {
    try {
      if (Array.isArray(x)) {
        return x.map(val => {
          const num = parseFloat(val);
          return !isNaN(num) && isFinite(num) && Number.isInteger(num);
        });
      }
      const num = parseFloat(x);
      return !isNaN(num) && isFinite(num) && Number.isInteger(num);
    } catch (e) {
      return Array.isArray(x) ? [] : false;
    }
  },

  // Range and Duplicate Functions
  'DUPLICATED': (x) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const seen = new Set();
      const result = values.map(val => {
        const key = JSON.stringify(val);
        if (seen.has(key)) {
          return true;
        }
        seen.add(key);
        return false;
      });
      return Array.isArray(x) ? result : result[0];
    } catch (e) {
      return Array.isArray(x) ? [] : false;
    }
  },

  'ANYDUPLICATES': (x) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const seen = new Set();
      for (let val of values) {
        const key = JSON.stringify(val);
        if (seen.has(key)) {
          return true;
        }
        seen.add(key);
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  // Validation Functions
  'STOPIFNOT': (...conditions) => {
    try {
      for (let condition of conditions) {
        let result;
        if (Array.isArray(condition)) {
          result = condition.every(val => {
            if (typeof val === 'boolean') return val;
            if (typeof val === 'number') return val !== 0 && !isNaN(val);
            if (typeof val === 'string') return val.toLowerCase() !== 'false' && val !== '0' && val !== '';
            return Boolean(val);
          });
        } else {
          if (typeof condition === 'boolean') result = condition;
          else if (typeof condition === 'number') result = condition !== 0 && !isNaN(condition);
          else if (typeof condition === 'string') result = condition.toLowerCase() !== 'false' && condition !== '0' && condition !== '';
          else result = Boolean(condition);
        }
        
        if (!result) {
          throw new Error('Condition failed in STOPIFNOT');
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  },

  // Element-wise Logical Operations
  'AND': (x, y) => {
    try {
      const xVals = Array.isArray(x) ? x : [x];
      const yVals = Array.isArray(y) ? y : [y];
      const maxLen = Math.max(xVals.length, yVals.length);
      const result = [];
      
      for (let i = 0; i < maxLen; i++) {
        const xVal = xVals[i % xVals.length];
        const yVal = yVals[i % yVals.length];
        
        const xBool = Boolean(xVal && xVal !== 0 && xVal !== '0' && xVal !== 'false');
        const yBool = Boolean(yVal && yVal !== 0 && yVal !== '0' && yVal !== 'false');
        
        result.push(xBool && yBool);
      }
      
      return Array.isArray(x) || Array.isArray(y) ? result : result[0];
    } catch (e) {
      return false;
    }
  },

  'OR': (x, y) => {
    try {
      const xVals = Array.isArray(x) ? x : [x];
      const yVals = Array.isArray(y) ? y : [y];
      const maxLen = Math.max(xVals.length, yVals.length);
      const result = [];
      
      for (let i = 0; i < maxLen; i++) {
        const xVal = xVals[i % xVals.length];
        const yVal = yVals[i % yVals.length];
        
        const xBool = Boolean(xVal && xVal !== 0 && xVal !== '0' && xVal !== 'false');
        const yBool = Boolean(yVal && yVal !== 0 && yVal !== '0' && yVal !== 'false');
        
        result.push(xBool || yBool);
      }
      
      return Array.isArray(x) || Array.isArray(y) ? result : result[0];
    } catch (e) {
      return false;
    }
  },

  'NOT': (x) => {
    try {
      if (Array.isArray(x)) {
        return x.map(val => {
          const bool = Boolean(val && val !== 0 && val !== '0' && val !== 'false');
          return !bool;
        });
      }
      const bool = Boolean(x && x !== 0 && x !== '0' && x !== 'false');
      return !bool;
    } catch (e) {
      return Array.isArray(x) ? [] : true;
    }
  }
};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { rLogicalFunctions };
} else if (typeof window !== 'undefined') {
  window.rLogicalFunctions = rLogicalFunctions;
}