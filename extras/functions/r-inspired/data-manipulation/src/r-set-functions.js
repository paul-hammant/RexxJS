/**
 * R-style set operation functions for REXX interpreter
 * Mirrors R-language set operations and membership testing
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

const rSetFunctions = {
  // Basic set operations
  'UNIQUE': (x) => {
    try {
      if (x === null || x === undefined) return [];
      const values = Array.isArray(x) ? x : [x];
      const uniqueValues = [];
      const seen = new Set();
      
      for (const val of values) {
        if (val === null || val === undefined) continue;
        const stringVal = String(val);
        if (!seen.has(stringVal)) {
          seen.add(stringVal);
          uniqueValues.push(val);
        }
      }
      
      return uniqueValues;
    } catch (e) {
      return [];
    }
  },

  'UNION': (x, y) => {
    try {
      if ((x === null || x === undefined) && (y === null || y === undefined)) return [];
      if (x === null || x === undefined) return rSetFunctions.UNIQUE(y);
      if (y === null || y === undefined) return rSetFunctions.UNIQUE(x);
      
      const valuesX = Array.isArray(x) ? x : [x];
      const valuesY = Array.isArray(y) ? y : [y];
      
      // Get unique values from x first
      const result = rSetFunctions.UNIQUE(valuesX);
      const resultSet = new Set(result.map(v => String(v)));
      
      // Add unique values from y that aren't already in result
      for (const val of valuesY) {
        if (val === null || val === undefined) continue;
        const stringVal = String(val);
        if (!resultSet.has(stringVal)) {
          result.push(val);
          resultSet.add(stringVal);
        }
      }
      
      return result;
    } catch (e) {
      return [];
    }
  },

  'INTERSECT': (x, y) => {
    try {
      if (x === null || x === undefined || y === null || y === undefined) return [];
      
      const valuesX = Array.isArray(x) ? x : [x];
      const valuesY = Array.isArray(y) ? y : [y];
      
      const setY = new Set(valuesY.filter(v => v !== null && v !== undefined).map(v => String(v)));
      const result = [];
      const seen = new Set();
      
      for (const val of valuesX) {
        if (val === null || val === undefined) continue;
        const stringVal = String(val);
        if (setY.has(stringVal) && !seen.has(stringVal)) {
          result.push(val);
          seen.add(stringVal);
        }
      }
      
      return result;
    } catch (e) {
      return [];
    }
  },

  'SETDIFF': (x, y) => {
    try {
      const valuesX = Array.isArray(x) ? x : [x];
      const valuesY = Array.isArray(y) ? y : [y];
      
      const setY = new Set(valuesY.map(v => String(v)));
      const result = [];
      const seen = new Set();
      
      for (const val of valuesX) {
        const stringVal = String(val);
        if (!setY.has(stringVal) && !seen.has(stringVal)) {
          result.push(val);
          seen.add(stringVal);
        }
      }
      
      return result;
    } catch (e) {
      return [];
    }
  },

  // Membership testing (R's %in% operator)
  'IS_ELEMENT': (x, table) => {
    try {
      const valuesX = Array.isArray(x) ? x : [x];
      const valuesTable = Array.isArray(table) ? table : [table];
      
      const setTable = new Set(valuesTable.map(v => String(v)));
      
      return valuesX.map(val => setTable.has(String(val)));
    } catch (e) {
      return Array.isArray(x) ? x.map(() => false) : [false];
    }
  },

  // Alternative name for IS_ELEMENT (more R-like)
  'IN': (x, table) => {
    return rSetFunctions.IS_ELEMENT(x, table);
  },

  // Check if any elements are duplicated
  'DUPLICATED': (x, fromLast = false) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const seen = new Set();
      const result = new Array(values.length).fill(false);
      const stringValues = values.map(v => String(v));
      
      if (fromLast) {
        // Check from the end
        for (let i = values.length - 1; i >= 0; i--) {
          if (seen.has(stringValues[i])) {
            result[i] = true;
          } else {
            seen.add(stringValues[i]);
          }
        }
      } else {
        // Check from the beginning
        for (let i = 0; i < values.length; i++) {
          if (seen.has(stringValues[i])) {
            result[i] = true;
          } else {
            seen.add(stringValues[i]);
          }
        }
      }
      
      return result;
    } catch (e) {
      return Array.isArray(x) ? x.map(() => false) : [false];
    }
  },

  // Check if any duplicates exist
  'ANY_DUPLICATED': (x) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const seen = new Set();
      
      for (const val of values) {
        const stringVal = String(val);
        if (seen.has(stringVal)) {
          return true;
        }
        seen.add(stringVal);
      }
      
      return false;
    } catch (e) {
      return false;
    }
  },

  // Advanced set operations
  'SETEQUAL': (x, y) => {
    try {
      const uniqueX = rSetFunctions.UNIQUE(x);
      const uniqueY = rSetFunctions.UNIQUE(y);
      
      if (uniqueX.length !== uniqueY.length) return false;
      
      const setX = new Set(uniqueX.map(v => String(v)));
      const setY = new Set(uniqueY.map(v => String(v)));
      
      if (setX.size !== setY.size) return false;
      
      for (const val of setX) {
        if (!setY.has(val)) return false;
      }
      
      return true;
    } catch (e) {
      return false;
    }
  },

  // Check if x is a subset of y
  'IS_SUBSET': (x, y) => {
    try {
      const uniqueX = rSetFunctions.UNIQUE(x);
      const setY = new Set((Array.isArray(y) ? y : [y]).map(v => String(v)));
      
      for (const val of uniqueX) {
        if (!setY.has(String(val))) {
          return false;
        }
      }
      
      return true;
    } catch (e) {
      return false;
    }
  },

  // Check if x is a superset of y  
  'IS_SUPERSET': (x, y) => {
    return rSetFunctions.IS_SUBSET(y, x);
  },

  // Set complement (elements in universal set but not in x)
  'SETCOMPLEMENT': (x, universal) => {
    try {
      const valuesX = Array.isArray(x) ? x : [x];
      const valuesUniversal = Array.isArray(universal) ? universal : [universal];
      
      const setX = new Set(valuesX.map(v => String(v)));
      const result = [];
      const seen = new Set();
      
      for (const val of valuesUniversal) {
        const stringVal = String(val);
        if (!setX.has(stringVal) && !seen.has(stringVal)) {
          result.push(val);
          seen.add(stringVal);
        }
      }
      
      return result;
    } catch (e) {
      return [];
    }
  },

  // Symmetric difference (elements in either x or y, but not both)
  'SYMDIFF': (x, y) => {
    try {
      const xDiffY = rSetFunctions.SETDIFF(x, y);
      const yDiffX = rSetFunctions.SETDIFF(y, x);
      return rSetFunctions.UNION(xDiffY, yDiffX);
    } catch (e) {
      return [];
    }
  },

  // Multiple set operations
  'UNION_ALL': (...sets) => {
    try {
      if (sets.length === 0) return [];
      if (sets.length === 1) return rSetFunctions.UNIQUE(sets[0]);
      
      let result = sets[0];
      for (let i = 1; i < sets.length; i++) {
        result = rSetFunctions.UNION(result, sets[i]);
      }
      
      return result;
    } catch (e) {
      return [];
    }
  },

  'INTERSECT_ALL': (...sets) => {
    try {
      if (sets.length === 0) return [];
      if (sets.length === 1) return rSetFunctions.UNIQUE(sets[0]);
      
      let result = sets[0];
      for (let i = 1; i < sets.length; i++) {
        result = rSetFunctions.INTERSECT(result, sets[i]);
        if (result.length === 0) break; // Early termination
      }
      
      return result;
    } catch (e) {
      return [];
    }
  },

  // Utility functions
  'LENGTH_UNIQUE': (x) => {
    try {
      return rSetFunctions.UNIQUE(x).length;
    } catch (e) {
      return 0;
    }
  },

  'IS_EMPTY_SET': (x) => {
    try {
      return rSetFunctions.UNIQUE(x).length === 0;
    } catch (e) {
      return true;
    }
  },

  // Frequency/count operations
  'TABLE': (x) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const counts = {};
      
      for (const val of values) {
        const stringVal = String(val);
        counts[stringVal] = (counts[stringVal] || 0) + 1;
      }
      
      return counts;
    } catch (e) {
      return {};
    }
  },

  'TABULATE': (x, levels = null) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const counts = rSetFunctions.TABLE(values);
      
      if (levels === null) {
        return counts;
      }
      
      // Use provided levels
      const levelArray = Array.isArray(levels) ? levels : [levels];
      const result = {};
      
      for (const level of levelArray) {
        const stringLevel = String(level);
        result[stringLevel] = counts[stringLevel] || 0;
      }
      
      return result;
    } catch (e) {
      return {};
    }
  },

  // Set cardinality and operations
  'CARDINALITY': (x) => {
    return rSetFunctions.LENGTH_UNIQUE(x);
  },

  'POWESET': (x, maxSize = 10) => {
    try {
      const unique = rSetFunctions.UNIQUE(x);
      
      // Limit size to prevent memory issues
      if (unique.length > maxSize) {
        throw new Error(`Set too large for power set (${unique.length} > ${maxSize})`);
      }
      
      const result = [];
      const n = unique.length;
      
      // Generate all 2^n subsets
      for (let i = 0; i < Math.pow(2, n); i++) {
        const subset = [];
        for (let j = 0; j < n; j++) {
          if (i & (1 << j)) {
            subset.push(unique[j]);
          }
        }
        result.push(subset);
      }
      
      return result;
    } catch (e) {
      throw e; // Re-throw the error instead of catching it
    }
  },

  // Cartesian product
  'CARTESIAN_PRODUCT': (x, y) => {
    try {
      const valuesX = Array.isArray(x) ? x : [x];
      const valuesY = Array.isArray(y) ? y : [y];
      
      const result = [];
      
      for (const xVal of valuesX) {
        for (const yVal of valuesY) {
          result.push([xVal, yVal]);
        }
      }
      
      return result;
    } catch (e) {
      return [];
    }
  },

  // R's expand.grid equivalent
  'EXPAND_GRID': (...vectors) => {
    try {
      if (vectors.length === 0) return [];
      
      const arrays = vectors.map(v => Array.isArray(v) ? v : [v]);
      const result = [];
      
      function cartesianProduct(arrs, current = []) {
        if (current.length === arrs.length) {
          result.push([...current]);
          return;
        }
        
        for (const item of arrs[current.length]) {
          current.push(item);
          cartesianProduct(arrs, current);
          current.pop();
        }
      }
      
      cartesianProduct(arrays);
      return result;
    } catch (e) {
      return [];
    }
  }

  //TODO: Add more advanced set operations like choose, combn, etc.
};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { rSetFunctions };
} else if (typeof window !== 'undefined') {
  window.rSetFunctions = rSetFunctions;
}