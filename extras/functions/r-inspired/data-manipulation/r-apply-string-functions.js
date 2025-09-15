/**
 * R-style apply family and string processing functions for REXX interpreter
 * Mirrors R-language apply functions (sapply, lapply, mapply) and string operations
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

const rApplyStringFunctions = {
  // Apply family functions
  'SAPPLY': (x, fun, ...args) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const funcName = String(fun).toUpperCase();
      
      const results = values.map(val => {
        try {
          // Handle built-in functions
          switch (funcName) {
            case 'LENGTH':
              return Array.isArray(val) ? val.length : String(val).length;
            case 'NCHAR':
              return String(val).length;
            case 'TOUPPER':
              return String(val).toUpperCase();
            case 'TOLOWER':
              return String(val).toLowerCase();
            case 'AS.NUMERIC':
              const num = parseFloat(val);
              return isNaN(num) ? null : num;
            case 'AS.CHARACTER':
              return String(val);
            case 'IS.NA':
              return val === null || val === undefined || 
                     (typeof val === 'number' && isNaN(val)) ||
                     String(val).toLowerCase() === 'na';
            case 'ABS':
              const absNum = parseFloat(val);
              return isNaN(absNum) ? null : Math.abs(absNum);
            case 'SQRT':
              const sqrtNum = parseFloat(val);
              return isNaN(sqrtNum) || sqrtNum < 0 ? NaN : Math.sqrt(sqrtNum);
            case 'LOG':
              const logNum = parseFloat(val);
              return isNaN(logNum) || logNum <= 0 ? NaN : Math.log(logNum);
            case 'EXP':
              const expNum = parseFloat(val);
              return isNaN(expNum) ? NaN : Math.exp(expNum);
            case 'ROUND':
              const roundNum = parseFloat(val);
              const digits = args.length > 0 ? parseInt(args[0]) || 0 : 0;
              return isNaN(roundNum) ? null : Math.round(roundNum * Math.pow(10, digits)) / Math.pow(10, digits);
            case 'FLOOR':
              const floorNum = parseFloat(val);
              return isNaN(floorNum) ? null : Math.floor(floorNum);
            case 'CEIL':
              const ceilNum = parseFloat(val);
              return isNaN(ceilNum) ? null : Math.ceil(ceilNum);
            default:
              // Unknown function - return null to trigger empty result
              throw new Error('Unknown function');
          }
        } catch (e) {
          return null;
        }
      });
      
      // If all results are null, return empty array
      return results.every(r => r === null) ? [] : results;
    } catch (e) {
      return [];
    }
  },

  'LAPPLY': (x, fun, ...args) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const funcName = String(fun).toUpperCase();
      
      // LAPPLY applies function and returns simple results like SAPPLY
      return values.map(val => {
        try {
          return rApplyStringFunctions.SAPPLY([val], fun, ...args)[0];
        } catch (e) {
          return null;
        }
      });
    } catch (e) {
      return [];
    }
  },

  'MAPPLY': (fun, ...lists) => {
    try {
      if (lists.length === 0) return [];
      
      const funcName = String(fun).toUpperCase();
      const arrays = lists.map(list => Array.isArray(list) ? list : [list]);
      const maxLength = Math.max(...arrays.map(arr => arr.length));
      
      const result = [];
      for (let i = 0; i < maxLength; i++) {
        const args = arrays.map(arr => arr[i % arr.length]);
        
        try {
          // Handle built-in multi-argument functions
          switch (funcName) {
            case 'SUM':
              const nums = args.map(a => parseFloat(a)).filter(n => !isNaN(n));
              result.push(nums.length > 0 ? nums.reduce((a, b) => a + b, 0) : 0);
              break;
            case 'MEAN':
              const means = args.map(a => parseFloat(a)).filter(n => !isNaN(n));
              result.push(means.length > 0 ? means.reduce((a, b) => a + b, 0) / means.length : NaN);
              break;
            case 'MIN':
              const mins = args.map(a => parseFloat(a)).filter(n => !isNaN(n));
              result.push(mins.length > 0 ? Math.min(...mins) : NaN);
              break;
            case 'MAX':
              const maxs = args.map(a => parseFloat(a)).filter(n => !isNaN(n));
              result.push(maxs.length > 0 ? Math.max(...maxs) : NaN);
              break;
            case 'PASTE':
              const sep = lists[lists.length - 1] === ',' ? ',' : ' ';
              result.push(args.join(sep));
              break;
            case 'PASTE0':
              result.push(args.join(''));
              break;
            case 'PLUS':
              const plusNums = args.map(a => parseFloat(a)).filter(n => !isNaN(n));
              result.push(plusNums.length > 0 ? plusNums.reduce((a, b) => a + b, 0) : 0);
              break;
            default:
              result.push(args[0]); // Default: return first argument
          }
        } catch (e) {
          result.push(null);
        }
      }
      
      return result;
    } catch (e) {
      return [];
    }
  },

  // String manipulation functions (R-style)
  'NCHAR': (x) => {
    try {
      if (Array.isArray(x)) {
        return x.map(val => String(val).length);
      }
      return String(x).length;
    } catch (e) {
      return Array.isArray(x) ? [] : 0;
    }
  },

  'TOUPPER': (x) => {
    try {
      if (Array.isArray(x)) {
        return x.map(val => String(val).toUpperCase());
      }
      return String(x).toUpperCase();
    } catch (e) {
      return Array.isArray(x) ? [] : '';
    }
  },

  'TOLOWER': (x) => {
    try {
      if (Array.isArray(x)) {
        return x.map(val => String(val).toLowerCase());
      }
      return String(x).toLowerCase();
    } catch (e) {
      return Array.isArray(x) ? [] : '';
    }
  },

  'SUBSTR': (x, start, stop = null) => {
    try {
      const isInputArray = Array.isArray(x);
      const values = isInputArray ? x : [x];
      const startPos = parseInt(start) || 1;
      const stopPos = stop !== null ? parseInt(stop) : null;
      
      const results = values.map(val => {
        const str = String(val);
        const startIdx = Math.max(0, startPos - 1); // R uses 1-based indexing
        
        if (stopPos !== null) {
          const endIdx = startIdx + Math.max(0, stopPos);
          return str.substring(startIdx, endIdx);
        } else {
          return str.substring(startIdx);
        }
      });
      
      return isInputArray ? results : results[0];
    } catch (e) {
      return Array.isArray(x) ? [''] : '';
    }
  },

  'SUBSTRING': (text, first, last = null) => {
    try {
      const textArray = Array.isArray(text) ? text : [text];
      const firstArray = Array.isArray(first) ? first : [first];
      const lastArray = last !== null ? (Array.isArray(last) ? last : [last]) : null;
      
      const maxLength = Math.max(textArray.length, firstArray.length, 
                                lastArray ? lastArray.length : 0);
      
      const result = [];
      for (let i = 0; i < maxLength; i++) {
        const str = String(textArray[i % textArray.length]);
        const startPos = parseInt(firstArray[i % firstArray.length]) || 1;
        const startIdx = Math.max(0, startPos - 1);
        
        if (lastArray) {
          const stopPos = parseInt(lastArray[i % lastArray.length]) || str.length;
          const endIdx = Math.min(str.length, stopPos);
          result.push(str.substring(startIdx, endIdx));
        } else {
          result.push(str.substring(startIdx));
        }
      }
      
      return result.length === 1 ? result[0] : result;
    } catch (e) {
      return '';
    }
  },

  'PASTE': (...args) => {
    try {
      if (args.length === 0) return '';
      
      // Default separator is space
      let sep = ' ';
      let values = args;
      
      // Handle single array argument
      if (values.length === 1 && Array.isArray(values[0])) {
        return values[0].map(val => String(val)).join(sep);
      }
      
      // Handle multiple arguments
      const arrays = values.map(val => Array.isArray(val) ? val : [val]);
      const maxLength = Math.max(...arrays.map(arr => arr.length));
      
      const result = [];
      for (let i = 0; i < maxLength; i++) {
        const parts = arrays.map(arr => String(arr[i % arr.length]));
        result.push(parts.join(sep));
      }
      
      return result.length === 1 ? result[0] : result;
    } catch (e) {
      return '';
    }
  },

  'PASTE0': (...args) => {
    try {
      if (args.length === 0) return '';
      
      // Handle single array argument
      if (args.length === 1 && Array.isArray(args[0])) {
        return args[0].map(val => String(val)).join('');
      }
      
      // Handle multiple arguments - concatenate without separator
      const arrays = args.map(val => Array.isArray(val) ? val : [val]);
      const maxLength = Math.max(...arrays.map(arr => arr.length));
      
      const result = [];
      for (let i = 0; i < maxLength; i++) {
        const parts = arrays.map(arr => String(arr[i % arr.length]));
        result.push(parts.join(''));
      }
      
      return result.length === 1 ? result[0] : result;
    } catch (e) {
      return '';
    }
  },

  'STRSPLIT': (x, pattern, fixed = true) => {
    try {
      const isInputArray = Array.isArray(x);
      const values = isInputArray ? x : [x];
      const splitPattern = String(pattern);
      
      let results;
      if (fixed) {
        results = values.map(val => {
          const str = String(val);
          if (splitPattern === '') {
            // Split into individual characters
            return str.split('');
          }
          return str.split(splitPattern);
        });
      } else {
        // Treat as regex
        const regex = new RegExp(splitPattern);
        results = values.map(val => String(val).split(regex));
      }
      
      return isInputArray ? results : results[0];
    } catch (e) {
      return Array.isArray(x) ? [['']] : [''];
    }
  },

  // R's sprintf equivalent
  'SPRINTF': (fmt, ...args) => {
    try {
      let format = String(fmt);
      let argIndex = 0;
      
      // Simple sprintf implementation for common cases
      format = format.replace(/%[sd%]/g, (match) => {
        if (match === '%%') return '%';
        if (argIndex >= args.length) return match;
        
        const arg = args[argIndex++];
        if (match === '%s') return String(arg);
        if (match === '%d') {
          const num = parseInt(arg);
          return isNaN(num) ? '0' : String(num);
        }
        return match;
      });
      
      return format;
    } catch (e) {
      return String(fmt);
    }
  },

  // Pattern matching (R-style grep functions)
  'GREP': (pattern, x, value = true, ignore_case = false, fixed = true) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const searchPattern = String(pattern);
      
      let regex;
      if (fixed) {
        const escapedPattern = searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(escapedPattern, ignore_case ? 'i' : '');
      } else {
        regex = new RegExp(searchPattern, ignore_case ? 'i' : '');
      }
      
      const matches = [];
      values.forEach((val, index) => {
        if (regex.test(String(val))) {
          if (value) {
            matches.push(val);
          } else {
            matches.push(index); // Use 0-based indexing for JS compatibility
          }
        }
      });
      
      return matches;
    } catch (e) {
      return [];
    }
  },

  'GREPL': (pattern, x, ignore_case = false, fixed = true) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const searchPattern = String(pattern);
      
      let regex;
      if (fixed) {
        const escapedPattern = searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(escapedPattern, ignore_case ? 'i' : '');
      } else {
        regex = new RegExp(searchPattern, ignore_case ? 'i' : '');
      }
      
      return values.map(val => regex.test(String(val)));
    } catch (e) {
      return [false];
    }
  },

  'GSUB': (pattern, replacement, x, ignore_case = false, fixed = true) => {
    try {
      const isInputArray = Array.isArray(x);
      const values = isInputArray ? x : [x];
      const searchPattern = String(pattern);
      const replaceWith = String(replacement);
      
      let regex;
      if (fixed) {
        const escapedPattern = searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(escapedPattern, ignore_case ? 'ig' : 'g');
      } else {
        regex = new RegExp(searchPattern, ignore_case ? 'ig' : 'g');
      }
      
      const results = values.map(val => String(val).replace(regex, replaceWith));
      return isInputArray ? results : results[0];
    } catch (e) {
      const fallback = values.map(val => String(val));
      return Array.isArray(x) ? fallback : fallback[0];
    }
  },

  'SUB': (pattern, replacement, x, ignore_case = false, fixed = true) => {
    try {
      const isInputArray = Array.isArray(x);
      const values = isInputArray ? x : [x];
      const searchPattern = String(pattern);
      const replaceWith = String(replacement);
      
      let regex;
      if (fixed) {
        const escapedPattern = searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(escapedPattern, ignore_case ? 'i' : '');
      } else {
        regex = new RegExp(searchPattern, ignore_case ? 'i' : '');
      }
      
      const results = values.map(val => String(val).replace(regex, replaceWith));
      return isInputArray ? results : results[0];
    } catch (e) {
      const fallback = values.map(val => String(val));
      return Array.isArray(x) ? fallback : fallback[0];
    }
  },

  // String trimming and padding
  'TRIMWS': (x, which = 'both') => {
    try {
      const isInputArray = Array.isArray(x);
      const values = isInputArray ? x : [x];
      const trimType = String(which).toLowerCase();
      
      const results = values.map(val => {
        const str = String(val);
        switch (trimType) {
          case 'left':
            return str.replace(/^\s+/, '');
          case 'right':
            return str.replace(/\s+$/, '');
          case 'both':
          default:
            return str.trim();
        }
      });
      return isInputArray ? results : results[0];
    } catch (e) {
      return Array.isArray(x) ? [''] : '';
    }
  },

  'STARTSWITH': (x, prefix, ignore_case = false) => {
    try {
      const isInputArray = Array.isArray(x);
      const values = isInputArray ? x : [x];
      const prefixStr = String(prefix);
      
      const results = values.map(val => {
        const str = String(val);
        if (ignore_case) {
          return str.toLowerCase().startsWith(prefixStr.toLowerCase());
        } else {
          return str.startsWith(prefixStr);
        }
      });
      return isInputArray ? results : results[0];
    } catch (e) {
      return Array.isArray(x) ? [false] : false;
    }
  },

  'ENDSWITH': (x, suffix, ignore_case = false) => {
    try {
      const isInputArray = Array.isArray(x);
      const values = isInputArray ? x : [x];
      const suffixStr = String(suffix);
      
      const results = values.map(val => {
        const str = String(val);
        if (ignore_case) {
          return str.toLowerCase().endsWith(suffixStr.toLowerCase());
        } else {
          return str.endsWith(suffixStr);
        }
      });
      
      return isInputArray ? results : results[0];
    } catch (e) {
      return Array.isArray(x) ? [false] : false;
    }
  },

  // String conversion functions
  'AS_CHARACTER': (x) => {
    try {
      const isInputArray = Array.isArray(x);
      const values = isInputArray ? x : [x];
      const results = values.map(val => String(val));
      return isInputArray ? results : results[0];
    } catch (e) {
      return Array.isArray(x) ? [''] : '';
    }
  },

  'AS_NUMERIC': (x) => {
    try {
      const isInputArray = Array.isArray(x);
      const values = isInputArray ? x : [x];
      const results = values.map(val => {
        if (val === 'true' || val === 'TRUE') return 1;
        if (val === 'false' || val === 'FALSE') return 0;
        const num = parseFloat(val);
        return isNaN(num) ? NaN : num;
      });
      return isInputArray ? results : results[0];
    } catch (e) {
      return Array.isArray(x) ? [null] : null;
    }
  },

  // Aggregation functions that work with apply
  'AGGREGATE': (x, by, fun) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const groups = Array.isArray(by) ? by : [by];
      const funcName = String(fun).toUpperCase();
      
      if (values.length !== groups.length) {
        throw new Error('x and by must have the same length');
      }
      
      const groupMap = new Map();
      
      // Group values by the grouping variable
      for (let i = 0; i < values.length; i++) {
        const group = String(groups[i]);
        if (!groupMap.has(group)) {
          groupMap.set(group, []);
        }
        groupMap.get(group).push(values[i]);
      }
      
      // Apply function to each group
      const result = [];
      for (const [group, groupValues] of groupMap) {
        const aggregatedValue = rApplyStringFunctions.SAPPLY(groupValues, fun)[0];
        result.push({
          group: group,
          value: aggregatedValue
        });
      }
      
      return result;
    } catch (e) {
      return [];
    }
  },

  // Text analysis functions
  'WORD_COUNT': (x) => {
    try {
      const isInputArray = Array.isArray(x);
      const values = isInputArray ? x : [x];
      const results = values.map(val => {
        const str = String(val).trim();
        if (str === '') return 0;
        return str.split(/\s+/).length;
      });
      return isInputArray ? results : results[0];
    } catch (e) {
      return Array.isArray(x) ? [0] : 0;
    }
  },

  'CHACOUNT': (x, char) => {
    try {
      const isInputArray = Array.isArray(x);
      const values = isInputArray ? x : [x];
      const searchChar = String(char);
      
      const results = values.map(val => {
        const str = String(val);
        return (str.match(new RegExp(searchChar, 'g')) || []).length;
      });
      return isInputArray ? results : results[0];
    } catch (e) {
      return Array.isArray(x) ? [0] : 0;
    }
  },

  // String padding
  'STPAD': (string, width, pad = ' ', side = 'left') => {
    try {
      const isInputArray = Array.isArray(string);
      const values = isInputArray ? string : [string];
      const targetWidth = parseInt(width) || 0;
      const padChar = String(pad).charAt(0) || ' ';
      const padSide = String(side).toLowerCase();
      
      const results = values.map(val => {
        const str = String(val);
        if (str.length >= targetWidth) return str;
        
        const padLength = targetWidth - str.length;
        const padding = padChar.repeat(padLength);
        
        switch (padSide) {
          case 'left':
            return padding + str;
          case 'right':
            return str + padding;
          case 'both':
          case 'center':
            const leftPad = Math.floor(padLength / 2);
            const rightPad = padLength - leftPad;
            return padChar.repeat(leftPad) + str + padChar.repeat(rightPad);
          default:
            return padding + str;
        }
      });
      return isInputArray ? results : results[0];
    } catch (e) {
      return Array.isArray(string) ? [''] : '';
    }
  }

  //TODO: Add more advanced string functions like str_detect, str_extract, etc.
};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { rApplyStringFunctions };
} else if (typeof window !== 'undefined') {
  window.rApplyStringFunctions = rApplyStringFunctions;
}