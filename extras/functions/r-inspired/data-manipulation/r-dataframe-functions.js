/**
 * R Data Structures & Advanced Manipulation Functions
 * Comprehensive data frame operations, list manipulation, reshaping, merging, and advanced data wrangling
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

const rDataFrameFunctions = {
  // Primary detection function (must be first)
  'DATAFRAME_MAIN': (data, options = {}) => {
    // Alias to DATA_FRAME for detection purposes
    return rDataFrameFunctions.DATA_FRAME(data, options);
  },

  // Data Frame Creation and Structure
  'DATA_FRAME': (...args) => {
    try {
      const df = { type: 'data.frame', columns: {}, rowNames: [], nrow: 0, ncol: 0 };
      
      if (args.length === 0) return df;
      
      // Handle single object argument
      if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])) {
        const obj = args[0];
        for (const [key, value] of Object.entries(obj)) {
          if (Array.isArray(value)) {
            df.columns[key] = value;
            df.nrow = Math.max(df.nrow, value.length);
          } else {
            df.columns[key] = [value];
            df.nrow = Math.max(df.nrow, 1);
          }
        }
        df.ncol = Object.keys(df.columns).length;
        df.rowNames = Array.from({length: df.nrow}, (_, i) => String(i + 1));
        
        // Extend shorter columns with NAs
        for (const key of Object.keys(df.columns)) {
          while (df.columns[key].length < df.nrow) {
            df.columns[key].push(null);
          }
        }
        return df;
      }
      
      // Handle multiple arguments as column vectors
      const columnData = {};
      let maxLength = 0;
      
      for (let i = 0; i < args.length; i += 2) {
        if (i + 1 < args.length) {
          const name = String(args[i]);
          const values = Array.isArray(args[i + 1]) ? args[i + 1] : [args[i + 1]];
          columnData[name] = values;
          maxLength = Math.max(maxLength, values.length);
        }
      }
      
      df.columns = columnData;
      df.nrow = maxLength;
      df.ncol = Object.keys(columnData).length;
      df.rowNames = Array.from({length: maxLength}, (_, i) => String(i + 1));
      
      // Extend shorter columns with NAs
      for (const key of Object.keys(df.columns)) {
        while (df.columns[key].length < df.nrow) {
          df.columns[key].push(null);
        }
      }
      
      return df;
    } catch (e) {
      return null;
    }
  },

  'NROW': (x) => {
    try {
      if (x === null || x === undefined) return 0;
      if (typeof x === 'object' && x.type === 'data.frame') {
        return x.nrow || 0;
      }
      if (Array.isArray(x)) {
        return x.length;
      }
      return 1;
    } catch (e) {
      return 0;
    }
  },

  'NCOL': (x) => {
    try {
      if (x === null || x === undefined) return 0;
      if (typeof x === 'object' && x.type === 'data.frame') {
        return x.ncol || 0;
      }
      if (Array.isArray(x)) {
        return 1;
      }
      return 1;
    } catch (e) {
      return 0;
    }
  },

  'COLNAMES': (x) => {
    try {
      if (x === null || x === undefined) return [];
      if (typeof x === 'object' && x.type === 'data.frame') {
        return Object.keys(x.columns || {});
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  'ROWNAMES': (x) => {
    try {
      if (x === null || x === undefined) return [];
      if (typeof x === 'object' && x.type === 'data.frame') {
        return x.rowNames || [];
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  // Data Frame Subsetting
  'SUBSET': (x, condition, select = null) => {
    try {
      if (!x || typeof x !== 'object' || x.type !== 'data.frame') return null;
      
      const result = {
        type: 'data.frame',
        columns: {},
        rowNames: [],
        nrow: 0,
        ncol: 0
      };
      
      // Determine which columns to select
      let columnsToSelect = Object.keys(x.columns);
      if (select !== null) {
        if (Array.isArray(select)) {
          columnsToSelect = select.filter(col => x.columns.hasOwnProperty(col));
        } else if (typeof select === 'string') {
          columnsToSelect = x.columns.hasOwnProperty(select) ? [select] : [];
        }
      }
      
      // Apply condition if provided
      let rowsToInclude = [];
      if (condition && typeof condition === 'function') {
        for (let i = 0; i < x.nrow; i++) {
          const row = {};
          for (const col of Object.keys(x.columns)) {
            row[col] = x.columns[col][i];
          }
          if (condition(row, i)) {
            rowsToInclude.push(i);
          }
        }
      } else if (Array.isArray(condition)) {
        // Boolean indexing
        rowsToInclude = condition.map((val, i) => val ? i : -1).filter(i => i >= 0);
      } else {
        // Include all rows
        rowsToInclude = Array.from({length: x.nrow}, (_, i) => i);
      }
      
      // Build result
      for (const col of columnsToSelect) {
        result.columns[col] = rowsToInclude.map(i => x.columns[col][i]);
      }
      
      result.rowNames = rowsToInclude.map(i => x.rowNames[i]);
      result.nrow = rowsToInclude.length;
      result.ncol = columnsToSelect.length;
      
      return result;
    } catch (e) {
      return null;
    }
  },

  'HEAD': (x, n = 6) => {
    try {
      if (!x || typeof x !== 'object' || x.type !== 'data.frame') return null;
      const numRows = Math.min(parseInt(n) || 6, x.nrow);
      
      const result = {
        type: 'data.frame',
        columns: {},
        rowNames: x.rowNames.slice(0, numRows),
        nrow: numRows,
        ncol: x.ncol
      };
      
      for (const [col, values] of Object.entries(x.columns)) {
        result.columns[col] = values.slice(0, numRows);
      }
      
      return result;
    } catch (e) {
      return null;
    }
  },

  'TAIL': (x, n = 6) => {
    try {
      if (!x || typeof x !== 'object' || x.type !== 'data.frame') return null;
      const numRows = Math.min(parseInt(n) || 6, x.nrow);
      const startIndex = Math.max(0, x.nrow - numRows);
      
      const result = {
        type: 'data.frame',
        columns: {},
        rowNames: x.rowNames.slice(startIndex),
        nrow: numRows,
        ncol: x.ncol
      };
      
      for (const [col, values] of Object.entries(x.columns)) {
        result.columns[col] = values.slice(startIndex);
      }
      
      return result;
    } catch (e) {
      return null;
    }
  },

  // Data Reshaping
  'MELT': (data, id_vars = [], value_vars = null, var_name = 'variable', value_name = 'value') => {
    try {
      if (!data || typeof data !== 'object' || data.type !== 'data.frame') return null;
      
      const idVars = Array.isArray(id_vars) ? id_vars : [id_vars];
      let valueVars = value_vars;
      if (valueVars === null) {
        valueVars = Object.keys(data.columns).filter(col => !idVars.includes(col));
      } else {
        valueVars = Array.isArray(valueVars) ? valueVars : [valueVars];
      }
      
      const result = {
        type: 'data.frame',
        columns: {},
        rowNames: [],
        nrow: 0,
        ncol: 0
      };
      
      // Initialize result columns
      for (const idVar of idVars) {
        result.columns[idVar] = [];
      }
      result.columns[var_name] = [];
      result.columns[value_name] = [];
      
      // Melt the data
      for (let i = 0; i < data.nrow; i++) {
        for (const valueVar of valueVars) {
          // Add id variables
          for (const idVar of idVars) {
            result.columns[idVar].push(data.columns[idVar] ? data.columns[idVar][i] : null);
          }
          // Add variable name and value
          result.columns[var_name].push(valueVar);
          result.columns[value_name].push(data.columns[valueVar] ? data.columns[valueVar][i] : null);
        }
      }
      
      result.nrow = result.columns[var_name].length;
      result.ncol = Object.keys(result.columns).length;
      result.rowNames = Array.from({length: result.nrow}, (_, i) => String(i + 1));
      
      return result;
    } catch (e) {
      return null;
    }
  },

  'CAST': (data, formula, value_var = 'value', fun_aggregate = null) => {
    try {
      if (!data || typeof data !== 'object' || data.type !== 'data.frame') return null;
      
      // Parse formula (simplified: "row_var ~ col_var")
      const [rowVar, colVar] = formula.split('~').map(s => s.trim());
      
      if (!data.columns[rowVar] || !data.columns[colVar] || !data.columns[value_var]) {
        return null;
      }
      
      // Get unique values for rows and columns
      const uniqueRows = [...new Set(data.columns[rowVar])].sort();
      const uniqueCols = [...new Set(data.columns[colVar])].sort();
      
      const result = {
        type: 'data.frame',
        columns: {},
        rowNames: uniqueRows.map(String),
        nrow: uniqueRows.length,
        ncol: uniqueCols.length + 1
      };
      
      // Initialize columns
      result.columns[rowVar] = [...uniqueRows];
      for (const col of uniqueCols) {
        result.columns[String(col)] = [];
      }
      
      // Fill the cast table
      for (const row of uniqueRows) {
        for (const col of uniqueCols) {
          const values = [];
          for (let i = 0; i < data.nrow; i++) {
            if (data.columns[rowVar][i] === row && data.columns[colVar][i] === col) {
              values.push(data.columns[value_var][i]);
            }
          }
          
          let aggregatedValue;
          if (values.length === 0) {
            aggregatedValue = null;
          } else if (values.length === 1) {
            aggregatedValue = values[0];
          } else if (fun_aggregate) {
            aggregatedValue = fun_aggregate(values);
          } else {
            // Default: sum for numeric, first for non-numeric
            const numericValues = values.filter(v => !isNaN(parseFloat(v))).map(parseFloat);
            if (numericValues.length === values.length) {
              aggregatedValue = numericValues.reduce((sum, val) => sum + val, 0);
            } else {
              aggregatedValue = values[0];
            }
          }
          
          result.columns[String(col)].push(aggregatedValue);
        }
      }
      
      return result;
    } catch (e) {
      return null;
    }
  },

  // Data Merging
  'MERGE': (x, y, by = null, all_x = false, all_y = false) => {
    try {
      if (!x || !y || x.type !== 'data.frame' || y.type !== 'data.frame') return null;
      
      let joinCols = by;
      if (joinCols === null) {
        // Find common column names
        joinCols = Object.keys(x.columns).filter(col => y.columns.hasOwnProperty(col));
      } else if (typeof joinCols === 'string') {
        joinCols = [joinCols];
      }
      
      if (joinCols.length === 0) return null;
      
      const result = {
        type: 'data.frame',
        columns: {},
        rowNames: [],
        nrow: 0,
        ncol: 0
      };
      
      // Initialize result columns
      const allCols = new Set([...Object.keys(x.columns), ...Object.keys(y.columns)]);
      for (const col of allCols) {
        result.columns[col] = [];
      }
      
      // Perform merge
      const matches = [];
      for (let i = 0; i < x.nrow; i++) {
        for (let j = 0; j < y.nrow; j++) {
          let isMatch = true;
          for (const col of joinCols) {
            if (x.columns[col][i] !== y.columns[col][j]) {
              isMatch = false;
              break;
            }
          }
          if (isMatch) {
            matches.push({xIndex: i, yIndex: j});
          }
        }
      }
      
      // Add matched rows
      for (const match of matches) {
        for (const col of Object.keys(x.columns)) {
          result.columns[col].push(x.columns[col][match.xIndex]);
        }
        for (const col of Object.keys(y.columns)) {
          if (!x.columns.hasOwnProperty(col)) {
            result.columns[col].push(y.columns[col][match.yIndex]);
          }
        }
      }
      
      // Handle unmatched rows if all_x or all_y
      if (all_x) {
        const matchedXIndices = new Set(matches.map(m => m.xIndex));
        for (let i = 0; i < x.nrow; i++) {
          if (!matchedXIndices.has(i)) {
            for (const col of Object.keys(result.columns)) {
              if (x.columns.hasOwnProperty(col)) {
                result.columns[col].push(x.columns[col][i]);
              } else {
                result.columns[col].push(null);
              }
            }
          }
        }
      }
      
      if (all_y) {
        const matchedYIndices = new Set(matches.map(m => m.yIndex));
        for (let j = 0; j < y.nrow; j++) {
          if (!matchedYIndices.has(j)) {
            for (const col of Object.keys(result.columns)) {
              if (y.columns.hasOwnProperty(col)) {
                result.columns[col].push(y.columns[col][j]);
              } else {
                result.columns[col].push(null);
              }
            }
          }
        }
      }
      
      result.nrow = result.columns[Object.keys(result.columns)[0]].length;
      result.ncol = Object.keys(result.columns).length;
      result.rowNames = Array.from({length: result.nrow}, (_, i) => String(i + 1));
      
      return result;
    } catch (e) {
      return null;
    }
  },

  // List Operations
  'LIST': (...args) => {
    try {
      const result = { type: 'list', elements: [], names: [] };
      
      // Detect if we have a pattern of alternating string-value pairs
      let isNamedPattern = false;
      if (args.length >= 4 && args.length % 2 === 0) {
        isNamedPattern = args.every((arg, i) => {
          if (i % 2 === 0) {
            return typeof arg === 'string';
          }
          return true;
        });
      }
      
      if (isNamedPattern) {
        // Process as named list
        for (let i = 0; i < args.length; i += 2) {
          result.names.push(args[i]);
          result.elements.push(args[i + 1]);
        }
      } else {
        // Process as unnamed list
        for (let i = 0; i < args.length; i++) {
          result.names.push(String(i));
          result.elements.push(args[i]);
        }
      }
      
      return result;
    } catch (e) {
      return { type: 'list', elements: [], names: [] };
    }
  },

  'UNLIST': (x, recursive = true) => {
    try {
      if (!x || typeof x !== 'object' || x.type !== 'list') return [];
      
      const result = [];
      
      function flatten(obj) {
        if (obj && typeof obj === 'object' && obj.type === 'list') {
          for (const element of obj.elements) {
            if (recursive && element && typeof element === 'object' && element.type === 'list') {
              flatten(element);
            } else {
              result.push(element);
            }
          }
        } else {
          result.push(obj);
        }
      }
      
      flatten(x);
      return result;
    } catch (e) {
      return [];
    }
  },

  'LAPPLY': (x, func) => {
    try {
      if (!x || typeof func !== 'function') return null;
      
      if (Array.isArray(x)) {
        const result = { type: 'list', elements: [], names: [] };
        for (let i = 0; i < x.length; i++) {
          result.elements.push(func(x[i], i));
          result.names.push(String(i));
        }
        return result;
      }
      
      if (x.type === 'list') {
        const result = { type: 'list', elements: [], names: [...x.names] };
        for (let i = 0; i < x.elements.length; i++) {
          result.elements.push(func(x.elements[i], i));
        }
        return result;
      }
      
      if (x.type === 'data.frame') {
        const result = { type: 'list', elements: [], names: [] };
        for (const [colName, colData] of Object.entries(x.columns)) {
          result.elements.push(func(colData, colName));
          result.names.push(colName);
        }
        return result;
      }
      
      return null;
    } catch (e) {
      return null;
    }
  },

  'SAPPLY': (x, func, simplify = true) => {
    try {
      const listResult = rDataFrameFunctions.LAPPLY(x, func);
      if (!listResult || !simplify) return listResult;
      
      // Try to simplify to vector if all elements are scalars
      const elements = listResult.elements;
      if (elements.every(el => typeof el === 'number' || typeof el === 'string' || el === null)) {
        return elements;
      }
      
      return listResult;
    } catch (e) {
      return null;
    }
  },

  // Data Ordering
  'ORDER': (x, decreasing = false, na_last = true) => {
    try {
      if (!Array.isArray(x)) return [];
      
      const indexed = x.map((val, i) => ({value: val, index: i}));
      
      indexed.sort((a, b) => {
        const aVal = a.value;
        const bVal = b.value;
        
        // Handle NaN/null values
        const aIsNA = aVal === null || aVal === undefined || (typeof aVal === 'number' && isNaN(aVal));
        const bIsNA = bVal === null || bVal === undefined || (typeof bVal === 'number' && isNaN(bVal));
        
        if (aIsNA && bIsNA) return 0;
        if (aIsNA) return na_last ? 1 : -1;
        if (bIsNA) return na_last ? -1 : 1;
        
        // Compare values
        let comparison;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal);
        } else {
          const aNum = parseFloat(aVal);
          const bNum = parseFloat(bVal);
          comparison = aNum - bNum;
        }
        
        return decreasing ? -comparison : comparison;
      });
      
      return indexed.map(item => item.index);
    } catch (e) {
      return [];
    }
  },

  'SORT': (x, decreasing = false, na_last = true) => {
    try {
      if (!Array.isArray(x)) return x;
      
      const indices = rDataFrameFunctions.ORDER(x, decreasing, na_last);
      return indices.map(i => x[i]);
    } catch (e) {
      return x;
    }
  },

  // Data Aggregation
  'AGGREGATE': (data, by, func, na_rm = false) => {
    try {
      if (!data || typeof data !== 'object' || data.type !== 'data.frame') return null;
      if (!Array.isArray(by) || by.length === 0 || typeof func !== 'function') return null;
      
      // Group data by the 'by' columns
      const groups = new Map();
      
      for (let i = 0; i < data.nrow; i++) {
        const groupKey = by.map(col => data.columns[col] ? data.columns[col][i] : null).join('|');
        
        if (!groups.has(groupKey)) {
          groups.set(groupKey, {
            keys: by.map(col => data.columns[col] ? data.columns[col][i] : null),
            indices: []
          });
        }
        groups.get(groupKey).indices.push(i);
      }
      
      const result = {
        type: 'data.frame',
        columns: {},
        rowNames: [],
        nrow: groups.size,
        ncol: 0
      };
      
      // Initialize result columns for grouping variables
      for (const col of by) {
        result.columns[col] = [];
      }
      
      // Initialize result columns for aggregated data
      const dataCols = Object.keys(data.columns).filter(col => !by.includes(col));
      for (const col of dataCols) {
        result.columns[col] = [];
      }
      
      // Perform aggregation
      for (const [groupKey, group] of groups) {
        // Add grouping variables
        for (let i = 0; i < by.length; i++) {
          result.columns[by[i]].push(group.keys[i]);
        }
        
        // Aggregate data columns
        for (const col of dataCols) {
          const values = group.indices.map(idx => data.columns[col][idx]);
          const filteredValues = na_rm ? values.filter(v => v !== null && v !== undefined && !isNaN(v)) : values;
          result.columns[col].push(func(filteredValues));
        }
      }
      
      result.ncol = Object.keys(result.columns).length;
      result.rowNames = Array.from({length: result.nrow}, (_, i) => String(i + 1));
      
      return result;
    } catch (e) {
      return null;
    }
  },

  // Utility Functions
  'IS_DATA_FRAME': (x) => {
    return !!(x && typeof x === 'object' && x.type === 'data.frame');
  },

  'IS_LIST': (x) => {
    return x && typeof x === 'object' && x.type === 'list';
  },

  'STR': (x) => {
    try {
      if (rDataFrameFunctions.IS_DATA_FRAME(x)) {
        return `data.frame: ${x.nrow} obs. of ${x.ncol} variables:\n${Object.keys(x.columns).map(col => ` $ ${col}: ${x.columns[col].slice(0, 3).join(', ')}...`).join('\n')}`;
      }
      
      if (rDataFrameFunctions.IS_LIST(x)) {
        return `List of ${x.elements.length}:\n${x.names.map((name, i) => ` $ ${name}: ${typeof x.elements[i]}`).join('\n')}`;
      }
      
      if (Array.isArray(x)) {
        return `${typeof x[0]} [1:${x.length}] ${x.slice(0, 6).join(' ')}${x.length > 6 ? ' ...' : ''}`;
      }
      
      return `${typeof x}: ${String(x)}`;
    } catch (e) {
      return 'Error in str()';
    }
  }
};

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { rDataFrameFunctions };
} else if (typeof window !== 'undefined') {
  window.rDataFrameFunctions = rDataFrameFunctions;
  
  // Auto-register with RexxJS interpreter if present
  if (typeof window.Interpreter !== 'undefined' || typeof window.RexxInterpreter !== 'undefined') {
    // Function will be available when REQUIRE system checks
    console.log('✓ r-dataframe-functions loaded via <script> tag');
  }
}