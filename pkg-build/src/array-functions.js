/**
 * Array and Object manipulation functions for REXX interpreter
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

const arrayFunctions = {
  'ARRAY_GET': (array, key) => {
    if (typeof array === 'object' && array !== null) {
      return array[key];
    }
    return '';
  },

  'ARRAY_SET': (array, key, value) => {
    if (typeof array === 'object' && array !== null) {
      array[key] = value;
      return array;
    }
    return {};
  },

  'ARRAY_LENGTH': (array) => {
    if (Array.isArray(array)) {
      return array.length;
    } else if (typeof array === 'object' && array !== null) {
      return Object.keys(array).length;
    } else if (typeof array === 'string') {
      try {
        return JSON.parse(array).length;
      } catch (e) {
        throw new Error(`Invalid array JSON: ${e.message}`);
      }
    }
    return 0;
  },

  'ARRAY_PUSH': (array, ...items) => {
    let arr;
    if (Array.isArray(array)) {
      arr = [...array];
    } else if (typeof array === 'string') {
      try {
        arr = JSON.parse(String(array));
      } catch (e) {
        throw new Error(`Invalid array JSON: ${e.message}`);
      }
    } else {
      throw new Error('First argument must be an array or JSON string');
    }
    arr.push(...items);
    return arr;
  },

  'ARRAY_POP': (array) => {
    let arr;
    if (Array.isArray(array)) {
      arr = [...array];
    } else if (typeof array === 'string') {
      try {
        arr = JSON.parse(String(array));
      } catch (e) {
        throw new Error(`Invalid array JSON: ${e.message}`);
      }
    } else {
      throw new Error('Input must be an array or JSON string');
    }
    return arr.pop(); // Returns undefined for empty array (correct behavior)
  },

  'ARRAY_SHIFT': (array) => {
    try {
      let arr = Array.isArray(array) ? [...array] : JSON.parse(String(array));
      return arr.shift();
    } catch (e) {
      return null;
    }
  },

  'ARRAY_UNSHIFT': (array, ...items) => {
    try {
      let arr = Array.isArray(array) ? [...array] : JSON.parse(String(array));
      arr.unshift(...items);
      return arr;
    } catch (e) {
      return [...items];
    }
  },

  'SPLIT': (string, separator = ' ') => {
    try {
      if (separator === '') {
        // Split into individual characters
        return string.split('');
      }
      return string.split(separator);
    } catch (e) {
      return [string];
    }
  },

  'MODERN_SPLIT': (string, separator = ' ') => {
    try {
      // Strip quotes and process escape sequences for both parameters
      let processedString = string;
      let processedSeparator = separator;
      
      // Strip quotes if present
      if (typeof processedString === 'string' && 
          ((processedString.startsWith('"') && processedString.endsWith('"')) ||
           (processedString.startsWith("'") && processedString.endsWith("'")))) {
        processedString = processedString.substring(1, processedString.length - 1);
      }
      
      if (typeof processedSeparator === 'string' && 
          ((processedSeparator.startsWith('"') && processedSeparator.endsWith('"')) ||
           (processedSeparator.startsWith("'") && processedSeparator.endsWith("'")))) {
        processedSeparator = processedSeparator.substring(1, processedSeparator.length - 1);
      }
      
      // Process escape sequences
      processedString = processedString.replace(/\\n/g, '\n');
      processedString = processedString.replace(/\\t/g, '\t');
      processedString = processedString.replace(/\\r/g, '\r');
      processedString = processedString.replace(/\\\\/g, '\\');
      
      processedSeparator = processedSeparator.replace(/\\n/g, '\n');
      processedSeparator = processedSeparator.replace(/\\t/g, '\t');
      processedSeparator = processedSeparator.replace(/\\r/g, '\r');
      processedSeparator = processedSeparator.replace(/\\\\/g, '\\');
      
      if (processedSeparator === '') {
        // Split into individual characters
        return processedString.split('');
      }
      
      // Use a regex to split by one or more occurrences of the separator
      const regex = new RegExp(processedSeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '+');
      return processedString.split(regex).filter(part => part !== '');
    } catch (e) {
      return [string];
    }
  },

  'JOIN': (array, separator = '') => {
    try {
      if (Array.isArray(array)) {
        return array.join(separator);
      }
      return String(array);
    } catch (e) {
      return '';
    }
  },

  'ARRAY_SLICE': (array, start, end) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      const startIndex = parseInt(start) || 0;
      const endIndex = end !== undefined ? parseInt(end) : undefined;
      return arr.slice(startIndex, endIndex);
    } catch (e) {
      return [];
    }
  },

  'ARRAY_CONCAT': (array1, array2) => {
    try {
      let arr1 = Array.isArray(array1) ? array1 : JSON.parse(String(array1));
      let arr2 = Array.isArray(array2) ? array2 : JSON.parse(String(array2));
      return arr1.concat(arr2);
    } catch (e) {
      return [];
    }
  },

  'ARRAY_REVERSE': (array) => {
    try {
      let arr = Array.isArray(array) ? [...array] : [...JSON.parse(String(array))];
      return arr.reverse();
    } catch (e) {
      return [];
    }
  },

  'ARRAY_SORT': (array, order = 'asc') => {
    try {
      let arr = Array.isArray(array) ? [...array] : [...JSON.parse(String(array))];
      return arr.sort((a, b) => {
        if (order === 'desc') {
          return String(b).localeCompare(String(a));
        }
        return String(a).localeCompare(String(b));
      });
    } catch (e) {
      return [];
    }
  },

  'ARRAY_INCLUDES': (array, item) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      return arr.includes(item);
    } catch (e) {
      return false;
    }
  },

  'ARRAY_INDEXOF': (array, item) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      return arr.indexOf(item);
    } catch (e) {
      return -1;
    }
  },

  'ARRAY_MIN': (array) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      const numbers = arr.map(Number).filter(n => !isNaN(n));
      return numbers.length ? Math.min(...numbers) : null;
    } catch (e) {
      return null;
    }
  },

  'ARRAY_MAX': (array) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      const numbers = arr.map(Number).filter(n => !isNaN(n));
      return numbers.length ? Math.max(...numbers) : null;
    } catch (e) {
      return null;
    }
  },

  'ARRAY_SUM': (array) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      const numbers = arr.map(Number).filter(n => !isNaN(n));
      return numbers.reduce((sum, num) => sum + num, 0);
    } catch (e) {
      return 0;
    }
  },

  'ARRAY_AVERAGE': (array) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      const numbers = arr.map(Number).filter(n => !isNaN(n));
      return numbers.length ? numbers.reduce((sum, num) => sum + num, 0) / numbers.length : 0;
    } catch (e) {
      return 0;
    }
  },

  'ARRAY_FILTER': (array, callback) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      // Simple filter for non-null/undefined/empty values if no callback
      if (!callback) {
        return arr.filter(item => item != null && item !== '');
      }
      // For advanced filtering, would need to evaluate callback - simplified for now
      return arr;
    } catch (e) {
      return [];
    }
  },

  'ARRAY_MAP': (array, callback) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      // Simple identity mapping if no callback - would need callback evaluation for full implementation
      return [...arr];
    } catch (e) {
      return [];
    }
  },

  'ARRAY_FIND': (array, item) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      const found = arr.find(element => element === item);
      return found !== undefined ? found : null;
    } catch (e) {
      return null;
    }
  },

  'ARRAY_UNIQUE': (array) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      return [...new Set(arr)];
    } catch (e) {
      return [];
    }
  },

  'ARRAY_FLATTEN': (array, depth = 1) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      const flattenDepth = parseInt(depth) || 1;
      return arr.flat(flattenDepth);
    } catch (e) {
      return [];
    }
  }

  //TODO insert more here

};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { arrayFunctions };
} else if (typeof window !== 'undefined') {
  window.arrayFunctions = arrayFunctions;
}