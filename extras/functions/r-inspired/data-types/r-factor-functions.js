/**
 * R-style factor and categorical data functions for REXX interpreter
 * Mirrors R-language factor operations, categorical data handling, and grouping functions
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

const rFactorFunctions = {
  // Factor Creation and Management
  'FACTOR': (x, levels = null, labels = null, ordered = false) => {
    try {
      if (x === null || x === undefined) {
        return { values: [], levels: [], labels: [], ordered: Boolean(ordered), length: 0 };
      }
      const values = Array.isArray(x) ? x : [x];
      
      // Determine unique levels
      let factorLevels;
      if (levels !== null) {
        factorLevels = Array.isArray(levels) ? levels : [levels];
      } else {
        factorLevels = [...new Set(values)].sort();
      }
      
      // Determine labels
      let factorLabels;
      if (labels !== null) {
        factorLabels = Array.isArray(labels) ? labels : [labels];
        if (factorLabels.length !== factorLevels.length) {
          factorLabels = factorLevels.map((_, i) => factorLabels[i % factorLabels.length]);
        }
      } else {
        factorLabels = factorLevels.map(String);
      }
      
      // Create factor object
      const factor = {
        values: values.map(val => {
          const levelIndex = factorLevels.indexOf(val);
          return levelIndex >= 0 ? levelIndex : null;
        }),
        levels: factorLevels,
        labels: factorLabels,
        ordered: Boolean(ordered),
        length: values.length
      };
      
      return factor;
    } catch (e) {
      return { values: [], levels: [], labels: [], ordered: false, length: 0 };
    }
  },

  'AS_FACTOR': (x, levels = null, labels = null) => {
    return rFactorFunctions.FACTOR(x, levels, labels, false);
  },

  'ORDERED': (x, levels = null, labels = null) => {
    return rFactorFunctions.FACTOR(x, levels, labels, true);
  },

  // Factor Properties
  'LEVELS': (f) => {
    try {
      if (f === null || f === undefined) return [];
      if (f && f.levels) return [...f.levels];
      if (Array.isArray(f)) return [...new Set(f)].sort();
      return [f];
    } catch (e) {
      return [];
    }
  },

  'NLEVELS': (f) => {
    try {
      if (f && f.levels) return f.levels.length;
      if (Array.isArray(f)) return [...new Set(f)].length;
      return 1;
    } catch (e) {
      return 0;
    }
  },

  'IS_FACTOR': (x) => {
    try {
      return x && typeof x === 'object' && x.levels !== undefined && x.values !== undefined;
    } catch (e) {
      return false;
    }
  },

  'IS_ORDERED': (x) => {
    try {
      return rFactorFunctions.IS_FACTOR(x) && Boolean(x.ordered);
    } catch (e) {
      return false;
    }
  },

  // Factor Manipulation
  'DROPLEVELS': (f, exclude = []) => {
    try {
      if (!rFactorFunctions.IS_FACTOR(f)) return f;
      
      const excludeSet = new Set(Array.isArray(exclude) ? exclude : [exclude]);
      const usedIndices = new Set(f.values.filter(v => v !== null));
      
      const newLevels = f.levels.filter((level, i) => 
        usedIndices.has(i) && !excludeSet.has(level)
      );
      const newLabels = f.labels.filter((label, i) => 
        usedIndices.has(i) && !excludeSet.has(f.levels[i])
      );
      
      // Remap indices
      const levelMap = new Map();
      newLevels.forEach((level, newIndex) => {
        const oldIndex = f.levels.indexOf(level);
        levelMap.set(oldIndex, newIndex);
      });
      
      const newValues = f.values.map(oldIndex => 
        oldIndex !== null && levelMap.has(oldIndex) ? levelMap.get(oldIndex) : null
      );
      
      return {
        values: newValues,
        levels: newLevels,
        labels: newLabels,
        ordered: f.ordered,
        length: f.length
      };
    } catch (e) {
      return f;
    }
  },

  'RELEVEL': (f, ref) => {
    try {
      if (!rFactorFunctions.IS_FACTOR(f)) return f;
      
      const refIndex = f.levels.indexOf(ref);
      if (refIndex === -1) return f;
      
      // Move reference level to front
      const newLevels = [ref, ...f.levels.filter(l => l !== ref)];
      const newLabels = [f.labels[refIndex], ...f.labels.filter((_, i) => i !== refIndex)];
      
      // Remap indices
      const levelMap = new Map();
      newLevels.forEach((level, newIndex) => {
        const oldIndex = f.levels.indexOf(level);
        levelMap.set(oldIndex, newIndex);
      });
      
      const newValues = f.values.map(oldIndex => 
        oldIndex !== null ? levelMap.get(oldIndex) : null
      );
      
      return {
        values: newValues,
        levels: newLevels,
        labels: newLabels,
        ordered: f.ordered,
        length: f.length
      };
    } catch (e) {
      return f;
    }
  },

  // Conversion Functions
  'AS_NUMERIC_FACTOR': (f) => {
    try {
      if (!rFactorFunctions.IS_FACTOR(f)) {
        const values = Array.isArray(f) ? f : [f];
        return values.map(v => parseFloat(v)).filter(n => !isNaN(n));
      }
      return f.values.map(index => index !== null ? index + 1 : NaN); // 1-indexed like R
    } catch (e) {
      return [];
    }
  },

  'AS_CHARACTEFACTOR': (f) => {
    try {
      if (!rFactorFunctions.IS_FACTOR(f)) {
        const values = Array.isArray(f) ? f : [f];
        return values.map(String);
      }
      return f.values.map(index => 
        index !== null ? f.labels[index] : 'NA'
      );
    } catch (e) {
      return [];
    }
  },

  // Tabulation Functions
  'TABLE': (...args) => {
    try {
      if (args.length === 0) return {};
      
      if (args.length === 1) {
        // Handle null/undefined inputs
        if (args[0] === null || args[0] === undefined) return {};
        
        const values = Array.isArray(args[0]) ? args[0] : [args[0]];
        // Filter out null/undefined values
        const validValues = values.filter(val => val !== null && val !== undefined);
        
        if (validValues.length === 0) return {};
        
        const counts = {};
        validValues.forEach(val => {
          const key = String(val);
          counts[key] = (counts[key] || 0) + 1;
        });
        return counts;
      }
      
      // Multi-dimensional table
      const dimensions = args.map(arg => Array.isArray(arg) ? arg : [arg]);
      const maxLen = Math.max(...dimensions.map(dim => dim.length));
      const table = {};
      
      for (let i = 0; i < maxLen; i++) {
        const key = dimensions.map(dim => String(dim[i % dim.length])).join(',');
        table[key] = (table[key] || 0) + 1;
      }
      
      return table;
    } catch (e) {
      return {};
    }
  },

  'XTABS': (formula, data = null) => {
    try {
      // Simplified implementation - just count frequencies
      if (data === null) return {};
      
      if (Array.isArray(data)) {
        return rFactorFunctions.TABLE(data);
      }
      
      // For object data, use all values
      const values = Object.values(data).flat();
      return rFactorFunctions.TABLE(values);
    } catch (e) {
      return {};
    }
  },

  // Grouping Functions  
  'SPLIT': (x, f) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      let groupFactor;
      
      if (rFactorFunctions.IS_FACTOR(f)) {
        groupFactor = f;
      } else {
        const groupValues = Array.isArray(f) ? f : [f];
        groupFactor = rFactorFunctions.FACTOR(groupValues);
      }
      
      const groups = {};
      
      for (let i = 0; i < values.length; i++) {
        const groupIndex = i < groupFactor.values.length ? groupFactor.values[i] : null;
        if (groupIndex !== null) {
          const groupLabel = groupFactor.labels[groupIndex];
          if (!groups[groupLabel]) groups[groupLabel] = [];
          groups[groupLabel].push(values[i]);
        }
      }
      
      return groups;
    } catch (e) {
      return {};
    }
  },

  'UNSPLIT': (x, f) => {
    try {
      if (typeof x !== 'object') return [];
      
      const result = [];
      const groupNames = Object.keys(x).sort();
      
      for (let groupName of groupNames) {
        if (Array.isArray(x[groupName])) {
          result.push(...x[groupName]);
        }
      }
      
      return result;
    } catch (e) {
      return [];
    }
  },

  'TAPPLY': (x, index, fun = 'MEAN') => {
    try {
      const groups = rFactorFunctions.SPLIT(x, index);
      const result = {};
      
      for (let [groupName, groupValues] of Object.entries(groups)) {
        const nums = groupValues.map(v => parseFloat(v)).filter(n => !isNaN(n));
        
        let value;
        switch (String(fun).toUpperCase()) {
          case 'MEAN':
            value = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : NaN;
            break;
          case 'SUM':
            value = nums.reduce((a, b) => a + b, 0);
            break;
          case 'MIN':
            value = nums.length > 0 ? Math.min(...nums) : NaN;
            break;
          case 'MAX':
            value = nums.length > 0 ? Math.max(...nums) : NaN;
            break;
          case 'LENGTH':
            value = groupValues.length;
            break;
          case 'VAR':
            if (nums.length > 1) {
              const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
              value = nums.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (nums.length - 1);
            } else {
              value = NaN;
            }
            break;
          case 'SD':
            if (nums.length > 1) {
              const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
              const variance = nums.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (nums.length - 1);
              value = Math.sqrt(variance);
            } else {
              value = NaN;
            }
            break;
          default:
            value = nums.length > 0 ? nums[0] : NaN;
        }
        
        result[groupName] = value;
      }
      
      return result;
    } catch (e) {
      return {};
    }
  },

  'AGGREGATE': (x, by, fun = 'MEAN') => {
    try {
      return rFactorFunctions.TAPPLY(x, by, fun);
    } catch (e) {
      return {};
    }
  },

  // Categorical Data Analysis
  'CHISQ_TEST': (observed, expected = null) => {
    try {
      let obs, exp;
      
      if (Array.isArray(observed)) {
        obs = observed.map(v => parseFloat(v) || 0);
      } else if (typeof observed === 'object') {
        obs = Object.values(observed).map(v => parseFloat(v) || 0);
      } else {
        return { statistic: NaN, pvalue: NaN, df: NaN, method: 'Chi-squared test' };
      }
      
      if (obs.length === 0) {
        return { statistic: NaN, pvalue: NaN, df: NaN, method: 'Chi-squared test' };
      }
      
      if (expected === null) {
        const total = obs.reduce((a, b) => a + b, 0);
        exp = obs.map(() => total / obs.length);
      } else if (Array.isArray(expected)) {
        exp = expected.map(v => parseFloat(v) || 1);
      } else {
        exp = obs.map(() => 1);
      }
      
      // Chi-square statistic
      let chisq = 0;
      for (let i = 0; i < obs.length; i++) {
        if (exp[i] > 0) {
          chisq += Math.pow(obs[i] - exp[i], 2) / exp[i];
        }
      }
      
      // Degrees of freedom
      const df = obs.length - 1;
      
      // Simplified p-value approximation (not exact)
      const pvalue = chisq > 10 ? 0.001 : chisq > 5 ? 0.05 : chisq > 2 ? 0.1 : 0.5;
      
      return {
        statistic: chisq,
        df: df,
        pvalue: pvalue,
        method: 'Chi-squared test'
      };
    } catch (e) {
      return { statistic: NaN, pvalue: NaN };
    }
  },

  // Interaction and Combination
  'INTERACTION': (...factors) => {
    try {
      if (factors.length === 0) return rFactorFunctions.FACTOR([]);
      
      const factorObjects = factors.map(f => 
        rFactorFunctions.IS_FACTOR(f) ? f : rFactorFunctions.FACTOR(f)
      );
      
      const maxLen = Math.max(...factorObjects.map(f => f.length));
      const interactions = [];
      
      for (let i = 0; i < maxLen; i++) {
        const labels = factorObjects.map(f => {
          const index = f.values[i % f.length];
          return index !== null ? f.labels[index] : 'NA';
        });
        interactions.push(labels.join('.'));
      }
      
      return rFactorFunctions.FACTOR(interactions);
    } catch (e) {
      return rFactorFunctions.FACTOR([]);
    }
  },

  'EXPAND_GRID': (...vectors) => {
    try {
      if (vectors.length === 0) return {};
      
      const arrays = vectors.map((v, i) => ({
        name: `Var${i + 1}`,
        values: Array.isArray(v) ? v : [v]
      }));
      
      const totalCombinations = arrays.reduce((prod, arr) => prod * arr.values.length, 1);
      const result = {};
      
      arrays.forEach(arr => {
        result[arr.name] = [];
      });
      
      for (let i = 0; i < totalCombinations; i++) {
        let temp = i;
        for (let j = arrays.length - 1; j >= 0; j--) {
          const arrayLen = arrays[j].values.length;
          const index = temp % arrayLen;
          result[arrays[j].name].push(arrays[j].values[index]);
          temp = Math.floor(temp / arrayLen);
        }
      }
      
      return result;
    } catch (e) {
      return {};
    }
  },

  // Utility Functions
  'CUT': (x, breaks, labels = null, include_lowest = false, right = true) => {
    try {
      const values = Array.isArray(x) ? x.map(v => parseFloat(v)) : [parseFloat(x)];
      const breakPoints = Array.isArray(breaks) ? breaks.map(v => parseFloat(v)).sort((a, b) => a - b) : 
                         typeof breaks === 'number' ? this.generateBreaks(values, breaks) :
                         [Math.min(...values), Math.max(...values)];
      
      let cutLabels;
      if (labels !== null) {
        cutLabels = Array.isArray(labels) ? labels : [String(labels)];
      } else {
        cutLabels = [];
        for (let i = 0; i < breakPoints.length - 1; i++) {
          const left = right ? '(' : '[';
          const rightParen = right ? ']' : ')';
          if (i === 0 && include_lowest) {
            cutLabels.push(`[${breakPoints[i]},${breakPoints[i + 1]}${rightParen}`);
          } else {
            cutLabels.push(`${left}${breakPoints[i]},${breakPoints[i + 1]}${rightParen}`);
          }
        }
      }
      
      const cutValues = values.map(val => {
        if (isNaN(val)) return null;
        
        for (let i = 0; i < breakPoints.length - 1; i++) {
          const lower = breakPoints[i];
          const upper = breakPoints[i + 1];
          
          let inInterval = false;
          if (i === 0 && include_lowest) {
            inInterval = val >= lower && (right ? val <= upper : val < upper);
          } else {
            inInterval = (right ? val > lower && val <= upper : val >= lower && val < upper);
          }
          
          if (inInterval) return i;
        }
        return null;
      });
      
      return rFactorFunctions.FACTOR(
        cutValues.map(index => index !== null ? cutLabels[index] : 'NA'),
        cutLabels,
        cutLabels,
        true
      );
    } catch (e) {
      return rFactorFunctions.FACTOR([]);
    }
  },

  generateBreaks: (values, n) => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const step = (max - min) / n;
    const breaks = [];
    for (let i = 0; i <= n; i++) {
      breaks.push(min + i * step);
    }
    return breaks;
  },

  // Comparison and Ordering
  'MATCH': (x, table, nomatch = null) => {
    try {
      const values = Array.isArray(x) ? x : [x];
      const lookupTable = Array.isArray(table) ? table : [table];
      
      return values.map(val => {
        const index = lookupTable.indexOf(val);
        return index >= 0 ? index + 1 : nomatch; // 1-indexed like R
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
        for (let i = 0; i < lookupTable.length; i++) {
          if (String(lookupTable[i]).startsWith(valStr)) {
            return i + 1; // 1-indexed like R
          }
        }
        return nomatch;
      });
    } catch (e) {
      return [];
    }
  }
};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { rFactorFunctions };
} else if (typeof window !== 'undefined') {
  window.rFactorFunctions = rFactorFunctions;
}