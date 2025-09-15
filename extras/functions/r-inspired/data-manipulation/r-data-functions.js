/**
 * R-style data manipulation and reshaping functions for REXX interpreter
 * Mirrors R-language core data manipulation operations
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

const rDataFunctions = {
  // Sequence generation (like R's seq, rep, etc.)
  'SEQ': (from, to, by = 1, length_out = null) => {
    try {
      const start = parseFloat(from);
      const end = parseFloat(to);
      const step = parseFloat(by);
      const actualStep = isNaN(step) ? 1 : step;
      
      if (isNaN(start) || isNaN(end)) return [];
      if (actualStep === 0) return [];
      
      if (length_out !== null) {
        const len = parseInt(length_out);
        if (len <= 0) return [];
        if (len === 1) return [start];
        
        const stepSize = (end - start) / (len - 1);
        return Array.from({length: len}, (_, i) => start + i * stepSize);
      }
      
      const result = [];
      if (actualStep > 0) {
        for (let i = start; i <= end; i += actualStep) {
          result.push(i);
        }
      } else {
        for (let i = start; i >= end; i += actualStep) {
          result.push(i);
        }
      }
      
      return result;
    } catch (e) {
      return [];
    }
  },

  'SEQ_LEN': (length_out) => {
    try {
      const len = parseInt(length_out);
      if (len <= 0) return [];
      return Array.from({length: len}, (_, i) => i + 1);
    } catch (e) {
      return [];
    }
  },

  'SEQ_ALONG': (along_with) => {
    try {
      const arr = Array.isArray(along_with) ? along_with : [along_with];
      return Array.from({length: arr.length}, (_, i) => i + 1);
    } catch (e) {
      return [];
    }
  },

  'REP': (x, times = 1, length_out = null, each = 1) => {
    try {
      if (x === null || x === undefined) return [];
      const values = Array.isArray(x) ? x : [x];
      const timesVal = parseInt(times);
      if (timesVal === 0) return [];
      const actualTimes = isNaN(timesVal) ? 1 : timesVal;
      const eachVal = parseInt(each) || 1;
      
      let result = [];
      
      // First handle 'each' parameter
      for (const val of values) {
        for (let i = 0; i < eachVal; i++) {
          result.push(val);
        }
      }
      
      // Then handle 'times' parameter
      const baseResult = result;
      result = [];
      for (let i = 0; i < actualTimes; i++) {
        result.push(...baseResult);
      }
      
      // Handle length_out parameter
      if (length_out !== null) {
        const len = parseInt(length_out);
        if (len <= 0) return [];
        if (len < result.length) return result.slice(0, len);
        
        // Extend by repeating pattern
        while (result.length < len) {
          const remaining = len - result.length;
          const toAdd = Math.min(remaining, baseResult.length);
          result.push(...baseResult.slice(0, toAdd));
        }
      }
      
      return result;
    } catch (e) {
      return [];
    }
  },

  // Index and logical operations
  'WHICH': (x) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const result = [];
      
      for (let i = 0; i < values.length; i++) {
        const val = values[i];
        if (val === true || val === 1 || val === '1' || val === 'true' || val === 'TRUE') {
          result.push(i + 1); // R uses 1-based indexing
        }
      }
      
      return result;
    } catch (e) {
      return [];
    }
  },

  'WHICH_MAX': (x) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const nums = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
      
      if (nums.length === 0) return NaN;
      
      const maxVal = Math.max(...nums);
      const originalIndex = values.findIndex(v => parseFloat(v) === maxVal);
      
      return originalIndex + 1; // R uses 1-based indexing
    } catch (e) {
      return NaN;
    }
  },

  'WHICH_MIN': (x) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const nums = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
      
      if (nums.length === 0) return NaN;
      
      const minVal = Math.min(...nums);
      const originalIndex = values.findIndex(v => parseFloat(v) === minVal);
      
      return originalIndex + 1; // R uses 1-based indexing
    } catch (e) {
      return NaN;
    }
  },

  // Sorting and ordering
  'ORDER': (x, decreasing = false) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const indexed = values.map((val, idx) => ({ val, idx: idx + 1 }));
      
      indexed.sort((a, b) => {
        const aNum = parseFloat(a.val);
        const bNum = parseFloat(b.val);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return decreasing ? bNum - aNum : aNum - bNum;
        }
        
        const aStr = String(a.val);
        const bStr = String(b.val);
        if (decreasing) {
          return bStr.localeCompare(aStr);
        } else {
          return aStr.localeCompare(bStr);
        }
      });
      
      return indexed.map(item => item.idx);
    } catch (e) {
      return [];
    }
  },

  'SORT': (x, decreasing = false, na_last = true) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const nums = [];
      const strs = [];
      const nas = [];
      
      for (const val of values) {
        const num = parseFloat(val);
        if (isNaN(num)) {
          if (val === null || val === undefined || String(val).toLowerCase() === 'na') {
            nas.push(val);
          } else {
            strs.push(String(val));
          }
        } else {
          nums.push(num);
        }
      }
      
      nums.sort((a, b) => decreasing ? b - a : a - b);
      strs.sort((a, b) => decreasing ? b.localeCompare(a) : a.localeCompare(b));
      
      let result = [...nums, ...strs];
      if (na_last) {
        result = [...result, ...nas];
      } else {
        result = [...nas, ...result];
      }
      
      return result;
    } catch (e) {
      return [];
    }
  },

  'RANK': (x, ties_method = 'average') => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const indexed = values.map((val, idx) => ({ val: parseFloat(val), idx }));
      
      // Sort by value
      indexed.sort((a, b) => a.val - b.val);
      
      const ranks = new Array(values.length);
      let currentRank = 1;
      
      for (let i = 0; i < indexed.length; i++) {
        if (isNaN(indexed[i].val)) {
          ranks[indexed[i].idx] = NaN;
          continue;
        }
        
        // Find ties
        let tieEnd = i;
        while (tieEnd + 1 < indexed.length && 
               indexed[tieEnd + 1].val === indexed[i].val) {
          tieEnd++;
        }
        
        // Assign ranks based on ties method
        if (ties_method === 'average') {
          const avgRank = (currentRank + currentRank + tieEnd - i) / 2;
          for (let j = i; j <= tieEnd; j++) {
            ranks[indexed[j].idx] = avgRank;
          }
        } else if (ties_method === 'min') {
          for (let j = i; j <= tieEnd; j++) {
            ranks[indexed[j].idx] = currentRank;
          }
        } else if (ties_method === 'max') {
          for (let j = i; j <= tieEnd; j++) {
            ranks[indexed[j].idx] = currentRank + tieEnd - i;
          }
        }
        
        currentRank += tieEnd - i + 1;
        i = tieEnd;
      }
      
      return ranks;
    } catch (e) {
      return [];
    }
  },

  // Data binning and categorization
  'CUT': (x, breaks, labels = null, right = true, include_lowest = false) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const breakPoints = Array.isArray(breaks) ? breaks : [breaks];
      
      if (breakPoints.length < 2) {
        throw new Error('breaks must have at least 2 values');
      }
      
      const sortedBreaks = [...breakPoints].sort((a, b) => a - b);
      const result = [];
      
      for (const val of values) {
        const num = parseFloat(val);
        if (isNaN(num)) {
          result.push(null);
          continue;
        }
        
        let category = null;
        for (let i = 0; i < sortedBreaks.length - 1; i++) {
          const lower = sortedBreaks[i];
          const upper = sortedBreaks[i + 1];
          
          let inRange = false;
          if (right) {
            if (i === 0 && include_lowest) {
              inRange = num >= lower && num <= upper;
            } else {
              inRange = num > lower && num <= upper;
            }
          } else {
            if (i === sortedBreaks.length - 2 && include_lowest) {
              inRange = num >= lower && num <= upper;
            } else {
              inRange = num >= lower && num < upper;
            }
          }
          
          if (inRange) {
            if (labels && Array.isArray(labels) && labels[i]) {
              category = labels[i];
            } else {
              if (right) {
                category = `(${lower},${upper}]`;
              } else {
                category = `[${lower},${upper})`;
              }
            }
            break;
          }
        }
        
        result.push(category);
      }
      
      return result;
    } catch (e) {
      return [];
    }
  },

  'FINDINTERVAL': (x, vec, rightmost_closed = false, left_open = false) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const breakPoints = Array.isArray(vec) ? vec : [vec];
      const sortedBreaks = [...breakPoints].sort((a, b) => a - b);
      
      return values.map(val => {
        const num = parseFloat(val);
        if (isNaN(num)) return 0;
        
        let interval = 0;
        for (let i = 0; i < sortedBreaks.length; i++) {
          if (left_open) {
            if (num > sortedBreaks[i]) {
              interval = i + 1;
            }
          } else {
            if (num >= sortedBreaks[i]) {
              interval = i + 1;
            }
          }
        }
        
        return interval;
      });
    } catch (e) {
      return [];
    }
  },

  // Advanced matching and lookup
  'MATCH': (x, table, nomatch = null) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const lookupTable = Array.isArray(table) ? table : [table];
      
      return values.map(val => {
        const index = lookupTable.findIndex(item => String(item) === String(val));
        return index >= 0 ? index + 1 : nomatch; // R uses 1-based indexing
      });
    } catch (e) {
      return [];
    }
  },

  'PMATCH': (x, table, nomatch = null, duplicates_ok = true) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const lookupTable = Array.isArray(table) ? table : [table];
      
      return values.map(val => {
        const valStr = String(val);
        
        // Look for exact match first
        let index = lookupTable.findIndex(item => String(item) === valStr);
        if (index >= 0) return index + 1;
        
        // Look for partial match
        const matches = lookupTable
          .map((item, idx) => ({ item: String(item), idx }))
          .filter(({item}) => item.startsWith(valStr));
        
        if (matches.length === 1) {
          return matches[0].idx + 1;
        } else if (matches.length > 1 && !duplicates_ok) {
          return nomatch;
        } else if (matches.length > 1) {
          return matches[0].idx + 1; // Return first match
        }
        
        return nomatch;
      });
    } catch (e) {
      return [];
    }
  },

  // Parallel min/max operations
  'PMAX': (...args) => {
    try {
      if (args.length === 0) return [];
      
      const arrays = args.map(arg => Array.isArray(arg) ? arg : [arg]);
      const maxLength = Math.max(...arrays.map(arr => arr.length));
      
      const result = [];
      for (let i = 0; i < maxLength; i++) {
        const values = arrays.map(arr => {
          const val = arr[i % arr.length];
          return parseFloat(val);
        });
        
        const numericValues = values.filter(v => !isNaN(v));
        result.push(numericValues.length > 0 ? Math.max(...numericValues) : NaN);
      }
      
      return result;
    } catch (e) {
      return [];
    }
  },

  'PMIN': (...args) => {
    try {
      if (args.length === 0) return [];
      
      const arrays = args.map(arg => Array.isArray(arg) ? arg : [arg]);
      const maxLength = Math.max(...arrays.map(arr => arr.length));
      
      const result = [];
      for (let i = 0; i < maxLength; i++) {
        const values = arrays.map(arr => {
          const val = arr[i % arr.length];
          return parseFloat(val);
        }).filter(v => !isNaN(v));
        
        result.push(values.length > 0 ? Math.min(...values) : NaN);
      }
      
      return result;
    } catch (e) {
      return [];
    }
  },

  // Vector operations
  'REV': (x) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      return [...values].reverse();
    } catch (e) {
      return [];
    }
  },

  'HEAD': (x, n = 6) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const count = parseInt(n);
      if (count === 0) return [];
      const actualCount = isNaN(count) ? 6 : count;
      return values.slice(0, actualCount);
    } catch (e) {
      return [];
    }
  },

  'TAIL': (x, n = 6) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const count = parseInt(n);
      if (count === 0) return [];
      const actualCount = isNaN(count) ? 6 : count;
      return values.slice(-actualCount);
    } catch (e) {
      return [];
    }
  },

  // Logical operations  
  'ANY': (x, na_rm = false) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      
      for (const val of values) {
        if (val === null || val === undefined) {
          if (!na_rm) return null;
          continue;
        }
        
        if (val === true || val === 1 || val === '1' || 
            String(val).toLowerCase() === 'true') {
          return true;
        }
      }
      
      return false;
    } catch (e) {
      return false;
    }
  },

  'ALL': (x, na_rm = false) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      
      for (const val of values) {
        if (val === null || val === undefined) {
          if (!na_rm) return null;
          continue;
        }
        
        if (val === false || val === 0 || val === '0' || 
            String(val).toLowerCase() === 'false') {
          return false;
        }
      }
      
      return true;
    } catch (e) {
      return false;
    }
  },

  // Vectorized ifelse
  'IFELSE': (test, yes, no) => {
    try {
      const testArray = Array.isArray(test) ? test : [test];
      const yesArray = Array.isArray(yes) ? yes : [yes];
      const noArray = Array.isArray(no) ? no : [no];
      
      const maxLength = Math.max(testArray.length, yesArray.length, noArray.length);
      const result = [];
      
      for (let i = 0; i < maxLength; i++) {
        const testVal = testArray[i % testArray.length];
        const yesVal = yesArray[i % yesArray.length];
        const noVal = noArray[i % noArray.length];
        
        if (testVal === true || testVal === 1 || testVal === '1' || 
            String(testVal).toLowerCase() === 'true') {
          result.push(yesVal);
        } else {
          result.push(noVal);
        }
      }
      
      return result.length === 1 ? result[0] : result;
    } catch (e) {
      return [];
    }
  },

  // Type checking functions
  'IS_NA': (x) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      return values.map(val => 
        val === null || val === undefined || 
        String(val).toLowerCase() === 'na' || 
        (typeof val === 'number' && isNaN(val))
      );
    } catch (e) {
      return [true];
    }
  },

  'IS_NULL': (x) => {
    try {
      return x === null || x === undefined;
    } catch (e) {
      return true;
    }
  },

  'IS_FINITE': (x) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      return values.map(val => {
        const num = parseFloat(val);
        return !isNaN(num) && isFinite(num);
      });
    } catch (e) {
      return [false];
    }
  },

  'IS_INFINITE': (x) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      return values.map(val => {
        const num = parseFloat(val);
        return !isNaN(num) && !isFinite(num);
      });
    } catch (e) {
      return [false];
    }
  }

  //TODO: Add rbind, cbind, matrix operations, etc.
};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { rDataFunctions };
} else if (typeof window !== 'undefined') {
  window.rDataFunctions = rDataFunctions;
}