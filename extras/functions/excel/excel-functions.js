/*!
 * excel-functions v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta {"canonical":"org.rexxjs/excel-functions","type":"functions-library","dependencies":{}}
 */
/**
 * Excel/Spreadsheet functions for REXX interpreter
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

const excelFunctions = {
  // Detection function for REQUIRE system
  'EXCEL_FUNCTIONS_MAIN': () => ({
    type: 'library_info',
    name: 'Excel Functions',
    version: '1.0.0',
    loaded: true
  }),
  
  // Lookup Functions
  'VLOOKUP': (lookupValue, tableArray, colIndex, exactMatch = false) => {
    try {
      const table = typeof tableArray === 'string' ? JSON.parse(tableArray) : tableArray;
      if (!Array.isArray(table) || table.length === 0) return null;
      
      const colIdx = parseInt(colIndex) - 1;
      const exact = String(exactMatch).toLowerCase() === 'true';
      
      for (const row of table) {
        if (!Array.isArray(row) || row.length <= colIdx) continue;
        
        if (exact) {
          if (row[0] === lookupValue) return row[colIdx];
        } else {
          if (String(row[0]).toLowerCase().includes(String(lookupValue).toLowerCase())) {
            return row[colIdx];
          }
        }
      }
      
      return null;
    } catch (e) {
      return null;
    }
  },
  
  'HLOOKUP': (lookupValue, tableArray, rowIndex, exactMatch = false) => {
    try {
      const table = typeof tableArray === 'string' ? JSON.parse(tableArray) : tableArray;
      if (!Array.isArray(table) || table.length === 0) return null;
      
      const rowIdx = parseInt(rowIndex) - 1;
      const exact = String(exactMatch).toLowerCase() === 'true';
      
      if (!Array.isArray(table[0])) return null;
      
      for (let col = 0; col < table[0].length; col++) {
        const value = table[0][col];
        if (exact) {
          if (value === lookupValue && table[rowIdx] && table[rowIdx][col] !== undefined) {
            return table[rowIdx][col];
          }
        } else {
          if (String(value).toLowerCase().includes(String(lookupValue).toLowerCase()) && 
              table[rowIdx] && table[rowIdx][col] !== undefined) {
            return table[rowIdx][col];
          }
        }
      }
      
      return null;
    } catch (e) {
      return null;
    }
  },
  
  'INDEX': (array, row, col = 1) => {
    try {
      const arr = typeof array === 'string' ? JSON.parse(array) : array;
      if (!Array.isArray(arr)) return null;
      
      const rowIdx = parseInt(row) - 1;
      const colIdx = parseInt(col) - 1;
      
      if (rowIdx < 0 || rowIdx >= arr.length) return null;
      
      if (Array.isArray(arr[rowIdx])) {
        return arr[rowIdx][colIdx] || null;
      } else {
        return colIdx === 0 ? arr[rowIdx] : null;
      }
    } catch (e) {
      return null;
    }
  },
  
  'MATCH': (lookupValue, lookupArray, matchType = 0) => {
    try {
      const arr = typeof lookupArray === 'string' ? JSON.parse(lookupArray) : lookupArray;
      if (!Array.isArray(arr)) return null;
      
      const type = parseInt(matchType);
      
      for (let i = 0; i < arr.length; i++) {
        switch (type) {
          case 0: // Exact match
            if (arr[i] === lookupValue) return i + 1;
            break;
          case 1: // Largest value less than or equal to lookup_value
            if (arr[i] <= lookupValue) {
              if (i === arr.length - 1 || arr[i + 1] > lookupValue) return i + 1;
            }
            break;
          case -1: // Smallest value greater than or equal to lookup_value
            if (arr[i] >= lookupValue) return i + 1;
            break;
        }
      }
      
      return null;
    } catch (e) {
      return null;
    }
  },

  // Text Functions
  'CONCATENATE': (...values) => {
    try {
      return values.map(v => String(v)).join('');
    } catch (e) {
      return '';
    }
  },
  
  'LEFT': (text, numChars = 1) => {
    try {
      return String(text).substring(0, parseInt(numChars) || 1);
    } catch (e) {
      return '';
    }
  },
  
  'RIGHT': (text, numChars = 1) => {
    try {
      const str = String(text);
      const chars = parseInt(numChars) || 1;
      return str.substring(str.length - chars);
    } catch (e) {
      return '';
    }
  },
  
  'MID': (text, startNum, numChars) => {
    try {
      const str = String(text);
      const start = (parseInt(startNum) || 1) - 1;
      const length = parseInt(numChars) || str.length;
      return str.substring(start, start + length);
    } catch (e) {
      return '';
    }
  },
  
  'LEN': (text) => {
    try {
      return String(text).length;
    } catch (e) {
      return 0;
    }
  },
  
  'EXCEL_UPPER': (text) => {
    try {
      return String(text).toUpperCase();
    } catch (e) {
      return '';
    }
  },
  
  'EXCEL_LOWER': (text) => {
    try {
      return String(text).toLowerCase();
    } catch (e) {
      return '';
    }
  },
  
  'PROPER': (text) => {
    try {
      return String(text).replace(/\b\w/g, l => l.toUpperCase());
    } catch (e) {
      return '';
    }
  },
  
  'EXCEL_TRIM': (text) => {
    try {
      return String(text).trim();
    } catch (e) {
      return '';
    }
  },
  
  'SUBSTITUTE': (text, oldText, newText, instanceNum = 0) => {
    try {
      const str = String(text);
      const old = String(oldText);
      const newStr = String(newText);
      const instance = parseInt(instanceNum) || 0;
      
      if (instance === 0) {
        return str.split(old).join(newStr);
      } else {
        let count = 0;
        let result = str;
        let index = 0;
        
        while ((index = result.indexOf(old, index)) !== -1) {
          count++;
          if (count === instance) {
            result = result.substring(0, index) + newStr + result.substring(index + old.length);
            break;
          }
          index += old.length;
        }
        
        return result;
      }
    } catch (e) {
      return String(text);
    }
  },

  // Date Functions (Excel style)
  'TODAY': () => {
    try {
      return Math.floor(Date.now() / 86400000) + 25569; // Excel serial date
    } catch (e) {
      return 0;
    }
  },
  
  'EXCEL_NOW': () => {
    try {
      return Date.now() / 86400000 + 25569; // Excel serial date with time
    } catch (e) {
      return 0;
    }
  },
  
  'YEAR': (date) => {
    try {
      const d = new Date(date);
      return isNaN(d.getTime()) ? 0 : d.getFullYear();
    } catch (e) {
      return 0;
    }
  },
  
  'MONTH': (date) => {
    try {
      const d = new Date(date);
      return isNaN(d.getTime()) ? 0 : d.getMonth() + 1;
    } catch (e) {
      return 0;
    }
  },
  
  'DAY': (date) => {
    try {
      const d = new Date(date);
      return isNaN(d.getTime()) ? 0 : d.getDate();
    } catch (e) {
      return 0;
    }
  },
  
  'WEEKDAY': (date, type = 1) => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 0;
      
      const day = d.getDay();
      const t = parseInt(type) || 1;
      
      switch (t) {
        case 1: return day === 0 ? 7 : day; // Sunday = 7
        case 2: return day === 0 ? 6 : day - 1; // Monday = 0
        case 3: return day === 0 ? 6 : day - 1; // Monday = 0
        default: return day + 1; // Sunday = 1
      }
    } catch (e) {
      return 0;
    }
  },

  // Financial Functions
  'PMT': (rate, nper, pv, fv = 0, type = 0) => {
    try {
      const r = parseFloat(rate);
      const n = parseFloat(nper);
      const p = parseFloat(pv);
      const f = parseFloat(fv) || 0;
      const t = parseInt(type) || 0;
      
      if (r === 0) return -(p + f) / n;
      
      const factor = Math.pow(1 + r, n);
      let pmt = (r * (f + p * factor)) / ((t ? r + 1 : 1) * (factor - 1));
      
      return -pmt;
    } catch (e) {
      return 0;
    }
  },
  
  'FV': (rate, nper, pmt, pv = 0, type = 0) => {
    try {
      const r = parseFloat(rate);
      const n = parseFloat(nper);
      const p = parseFloat(pmt);
      const present = parseFloat(pv) || 0;
      const t = parseInt(type) || 0;
      
      if (r === 0) return -(present + p * n);
      
      const factor = Math.pow(1 + r, n);
      return -(present * factor + p * (t ? r + 1 : 1) * (factor - 1) / r);
    } catch (e) {
      return 0;
    }
  },
  
  'PV': (rate, nper, pmt, fv = 0, type = 0) => {
    try {
      const r = parseFloat(rate);
      const n = parseFloat(nper);
      const p = parseFloat(pmt);
      const f = parseFloat(fv) || 0;
      const t = parseInt(type) || 0;
      
      if (r === 0) return -(f + p * n);
      
      const factor = Math.pow(1 + r, n);
      return -(f + p * (t ? r + 1 : 1) * (factor - 1) / r) / factor;
    } catch (e) {
      return 0;
    }
  },
  
  'NPV': (rate, ...values) => {
    try {
      const r = parseFloat(rate);
      const nums = values.flat().map(v => parseFloat(v)).filter(n => !isNaN(n));
      
      return nums.reduce((sum, value, index) => {
        return sum + value / Math.pow(1 + r, index + 1);
      }, 0);
    } catch (e) {
      return 0;
    }
  },
  
  'IRR': (values, guess = 0.1) => {
    try {
      const nums = (Array.isArray(values) ? values : [values]).map(v => parseFloat(v)).filter(n => !isNaN(n));
      if (nums.length < 2) return 0;
      
      let rate = parseFloat(guess) || 0.1;
      
      // Newton-Raphson method for finding IRR
      for (let i = 0; i < 100; i++) {
        let npv = 0;
        let dnpv = 0;
        
        for (let j = 0; j < nums.length; j++) {
          const factor = Math.pow(1 + rate, j);
          npv += nums[j] / factor;
          dnpv += -j * nums[j] / (factor * (1 + rate));
        }
        
        if (Math.abs(npv) < 0.0001) return rate;
        if (Math.abs(dnpv) < 0.0001) break;
        
        rate = rate - npv / dnpv;
      }
      
      return rate;
    } catch (e) {
      return 0;
    }
  },

  // Logical Functions
  'IF': (logical_test, value_if_true, value_if_false) => {
    try {
      return logical_test ? value_if_true : (value_if_false !== undefined ? value_if_false : false);
    } catch (e) {
      return false;
    }
  },

  'AND': (...conditions) => {
    try {
      return conditions.every(condition => {
        if (typeof condition === 'string') {
          return condition.toLowerCase() === 'true' || (condition !== '0' && condition !== 'false' && condition !== '');
        }
        return Boolean(condition);
      });
    } catch (e) {
      return false;
    }
  },

  'OR': (...conditions) => {
    try {
      return conditions.some(condition => {
        if (typeof condition === 'string') {
          return condition.toLowerCase() === 'true' || (condition !== '0' && condition !== 'false' && condition !== '');
        }
        return Boolean(condition);
      });
    } catch (e) {
      return false;
    }
  },

  'NOT': (logical) => {
    try {
      // Handle string representations of booleans
      if (typeof logical === 'string') {
        if (logical.toLowerCase() === 'false' || logical === '0' || logical === '') {
          return true;
        } else if (logical.toLowerCase() === 'true' || logical !== '0') {
          return false;
        }
      }
      return !Boolean(logical);
    } catch (e) {
      return true;
    }
  },

  // Text Functions
  'CONCATENATE': (...texts) => {
    try {
      return texts.join('');
    } catch (e) {
      return '';
    }
  },

  'LEFT': (text, num_chars) => {
    try {
      const str = String(text);
      const n = parseInt(num_chars) || 1;
      return str.substring(0, Math.max(0, n));
    } catch (e) {
      return '';
    }
  },

  'RIGHT': (text, num_chars) => {
    try {
      const str = String(text);
      const n = parseInt(num_chars) || 1;
      return str.substring(str.length - Math.max(0, n));
    } catch (e) {
      return '';
    }
  },

  'MID': (text, start_num, num_chars) => {
    try {
      const str = String(text);
      const start = Math.max(1, parseInt(start_num) || 1) - 1; // Excel is 1-based
      const length = Math.max(0, parseInt(num_chars) || 0);
      return str.substring(start, start + length);
    } catch (e) {
      return '';
    }
  },

  'LEN': (text) => {
    try {
      return String(text).length;
    } catch (e) {
      return 0;
    }
  },

  'UPPER': (text) => {
    try {
      return String(text).toUpperCase();
    } catch (e) {
      return '';
    }
  },

  'LOWER': (text) => {
    try {
      return String(text).toLowerCase();
    } catch (e) {
      return '';
    }
  },

  'TRIM': (text) => {
    try {
      return String(text).trim();
    } catch (e) {
      return '';
    }
  },

  // Date Functions

  'NOW': () => {
    try {
      return new Date().toISOString();
    } catch (e) {
      return '';
    }
  },

  'YEAR': (date) => {
    try {
      const d = new Date(date);
      return d.getFullYear();
    } catch (e) {
      return 0;
    }
  },

  'MONTH': (date) => {
    try {
      const d = new Date(date);
      return d.getMonth() + 1; // Excel months are 1-based
    } catch (e) {
      return 0;
    }
  },

  'DAY': (date) => {
    try {
      const d = new Date(date);
      return d.getDate();
    } catch (e) {
      return 0;
    }
  },

  // Math Functions
  'POWER': (number, power) => {
    try {
      return Math.pow(parseFloat(number), parseFloat(power));
    } catch (e) {
      return 0;
    }
  },

  'SQRT': (number) => {
    try {
      const n = parseFloat(number);
      return n >= 0 ? Math.sqrt(n) : NaN;
    } catch (e) {
      return NaN;
    }
  },

  'MOD': (number, divisor) => {
    try {
      const n = parseFloat(number);
      const d = parseFloat(divisor);
      return d !== 0 ? n % d : NaN;
    } catch (e) {
      return NaN;
    }
  },

  'ROUND': (number, num_digits) => {
    try {
      const n = parseFloat(number);
      const digits = parseInt(num_digits) || 0;
      const factor = Math.pow(10, digits);
      return Math.round(n * factor) / factor;
    } catch (e) {
      return 0;
    }
  }

};

// Export for both Node.js and browser in REQUIRE system format
if (typeof module !== 'undefined' && module.exports) {
  module.exports = excelFunctions;
  if (typeof global !== 'undefined') {
    // Put functions directly in global scope for detection
    Object.assign(global, excelFunctions);
  }
} else if (typeof window !== 'undefined') {
  // Put functions directly in window scope for detection
  Object.assign(window, excelFunctions);
}