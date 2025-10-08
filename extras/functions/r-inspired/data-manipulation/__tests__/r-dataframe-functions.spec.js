/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Tests for R Data Structures & Advanced Manipulation Functions
 */

const { rDataFrameFunctions } = require('./r-dataframe-functions');

describe('R Data Structures & Advanced Manipulation Functions', () => {
  let sampleDF;
  
  beforeEach(() => {
    sampleDF = rDataFrameFunctions.DATA_FRAME({
      name: ['Alice', 'Bob', 'Charlie'],
      age: [25, 30, 35],
      score: [85, 92, 78]
    });
  });

  describe('DATA_FRAME', () => {
    test('should create data frame from object', () => {
      const df = rDataFrameFunctions.DATA_FRAME({
        x: [1, 2, 3],
        y: ['a', 'b', 'c']
      });
      
      expect(df.type).toBe('data.frame');
      expect(df.nrow).toBe(3);
      expect(df.ncol).toBe(2);
      expect(df.columns.x).toEqual([1, 2, 3]);
      expect(df.columns.y).toEqual(['a', 'b', 'c']);
      expect(df.rowNames).toEqual(['1', '2', '3']);
    });

    test('should create data frame from arguments', () => {
      const df = rDataFrameFunctions.DATA_FRAME('x', [1, 2], 'y', ['a', 'b']);
      
      expect(df.type).toBe('data.frame');
      expect(df.nrow).toBe(2);
      expect(df.ncol).toBe(2);
      expect(df.columns.x).toEqual([1, 2]);
      expect(df.columns.y).toEqual(['a', 'b']);
    });

    test('should handle unequal column lengths', () => {
      const df = rDataFrameFunctions.DATA_FRAME({
        short: [1, 2],
        long: [10, 20, 30]
      });
      
      expect(df.nrow).toBe(3);
      expect(df.columns.short).toEqual([1, 2, null]);
      expect(df.columns.long).toEqual([10, 20, 30]);
    });

    test('should create empty data frame', () => {
      const df = rDataFrameFunctions.DATA_FRAME();
      
      expect(df.type).toBe('data.frame');
      expect(df.nrow).toBe(0);
      expect(df.ncol).toBe(0);
      expect(Object.keys(df.columns)).toEqual([]);
    });
  });

  describe('NROW and NCOL', () => {
    test('NROW should return number of rows', () => {
      expect(rDataFrameFunctions.NROW(sampleDF)).toBe(3);
      expect(rDataFrameFunctions.NROW([1, 2, 3, 4])).toBe(4);
      expect(rDataFrameFunctions.NROW(null)).toBe(0);
      expect(rDataFrameFunctions.NROW(5)).toBe(1);
    });

    test('NCOL should return number of columns', () => {
      expect(rDataFrameFunctions.NCOL(sampleDF)).toBe(3);
      expect(rDataFrameFunctions.NCOL([1, 2, 3])).toBe(1);
      expect(rDataFrameFunctions.NCOL(null)).toBe(0);
      expect(rDataFrameFunctions.NCOL(5)).toBe(1);
    });
  });

  describe('COLNAMES and ROWNAMES', () => {
    test('COLNAMES should return column names', () => {
      expect(rDataFrameFunctions.COLNAMES(sampleDF)).toEqual(['name', 'age', 'score']);
      expect(rDataFrameFunctions.COLNAMES(null)).toEqual([]);
      expect(rDataFrameFunctions.COLNAMES([1, 2, 3])).toEqual([]);
    });

    test('ROWNAMES should return row names', () => {
      expect(rDataFrameFunctions.ROWNAMES(sampleDF)).toEqual(['1', '2', '3']);
      expect(rDataFrameFunctions.ROWNAMES(null)).toEqual([]);
    });
  });

  describe('SUBSET', () => {
    test('should subset by condition function', () => {
      const result = rDataFrameFunctions.SUBSET(sampleDF, (row) => row.age > 26);
      
      expect(result.nrow).toBe(2);
      expect(result.columns.name).toEqual(['Bob', 'Charlie']);
      expect(result.columns.age).toEqual([30, 35]);
    });

    test('should subset by boolean array', () => {
      const result = rDataFrameFunctions.SUBSET(sampleDF, [true, false, true]);
      
      expect(result.nrow).toBe(2);
      expect(result.columns.name).toEqual(['Alice', 'Charlie']);
      expect(result.columns.age).toEqual([25, 35]);
    });

    test('should subset with column selection', () => {
      const result = rDataFrameFunctions.SUBSET(sampleDF, null, ['name', 'score']);
      
      expect(result.ncol).toBe(2);
      expect(rDataFrameFunctions.COLNAMES(result)).toEqual(['name', 'score']);
      expect(result.columns.name).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(result.columns.score).toEqual([85, 92, 78]);
    });

    test('should subset with both condition and column selection', () => {
      const result = rDataFrameFunctions.SUBSET(
        sampleDF, 
        (row) => row.age >= 30, 
        ['name', 'age']
      );
      
      expect(result.nrow).toBe(2);
      expect(result.ncol).toBe(2);
      expect(result.columns.name).toEqual(['Bob', 'Charlie']);
      expect(result.columns.age).toEqual([30, 35]);
    });
  });

  describe('HEAD and TAIL', () => {
    test('HEAD should return first n rows', () => {
      const result = rDataFrameFunctions.HEAD(sampleDF, 2);
      
      expect(result.nrow).toBe(2);
      expect(result.columns.name).toEqual(['Alice', 'Bob']);
      expect(result.columns.age).toEqual([25, 30]);
    });

    test('HEAD should default to 6 rows', () => {
      const largeDF = rDataFrameFunctions.DATA_FRAME({
        x: Array.from({length: 10}, (_, i) => i)
      });
      const result = rDataFrameFunctions.HEAD(largeDF);
      
      expect(result.nrow).toBe(6);
    });

    test('TAIL should return last n rows', () => {
      const result = rDataFrameFunctions.TAIL(sampleDF, 2);
      
      expect(result.nrow).toBe(2);
      expect(result.columns.name).toEqual(['Bob', 'Charlie']);
      expect(result.columns.age).toEqual([30, 35]);
    });

    test('TAIL should default to 6 rows', () => {
      const largeDF = rDataFrameFunctions.DATA_FRAME({
        x: Array.from({length: 10}, (_, i) => i)
      });
      const result = rDataFrameFunctions.TAIL(largeDF);
      
      expect(result.nrow).toBe(6);
      expect(result.columns.x).toEqual([4, 5, 6, 7, 8, 9]);
    });
  });

  describe('MELT', () => {
    test('should melt data frame with all columns as value variables', () => {
      const df = rDataFrameFunctions.DATA_FRAME({
        id: ['A', 'B'],
        x: [1, 2],
        y: [10, 20]
      });
      
      const result = rDataFrameFunctions.MELT(df, ['id']);
      
      expect(result.nrow).toBe(4); // 2 rows × 2 value variables
      expect(result.ncol).toBe(3); // id + variable + value
      expect(result.columns.id).toEqual(['A', 'A', 'B', 'B']);
      expect(result.columns.variable).toEqual(['x', 'y', 'x', 'y']);
      expect(result.columns.value).toEqual([1, 10, 2, 20]);
    });

    test('should melt with specific value variables', () => {
      const df = rDataFrameFunctions.DATA_FRAME({
        id: ['A', 'B'],
        x: [1, 2],
        y: [10, 20],
        z: [100, 200]
      });
      
      const result = rDataFrameFunctions.MELT(df, ['id'], ['x', 'y']);
      
      expect(result.nrow).toBe(4);
      expect(result.columns.variable).toEqual(['x', 'y', 'x', 'y']);
      expect(result.columns.value).toEqual([1, 10, 2, 20]);
    });

    test('should handle custom variable and value names', () => {
      const df = rDataFrameFunctions.DATA_FRAME({
        id: ['A'],
        measure1: [1],
        measure2: [2]
      });
      
      const result = rDataFrameFunctions.MELT(df, ['id'], null, 'metric', 'measurement');
      
      expect(rDataFrameFunctions.COLNAMES(result)).toEqual(['id', 'metric', 'measurement']);
      expect(result.columns.metric).toEqual(['measure1', 'measure2']);
      expect(result.columns.measurement).toEqual([1, 2]);
    });
  });

  describe('CAST', () => {
    test('should cast melted data back to wide format', () => {
      const melted = rDataFrameFunctions.DATA_FRAME({
        id: ['A', 'A', 'B', 'B'],
        variable: ['x', 'y', 'x', 'y'],
        value: [1, 10, 2, 20]
      });
      
      const result = rDataFrameFunctions.CAST(melted, 'id ~ variable');
      
      expect(result.nrow).toBe(2);
      expect(rDataFrameFunctions.COLNAMES(result)).toEqual(['id', 'x', 'y']);
      expect(result.columns.id).toEqual(['A', 'B']);
      expect(result.columns.x).toEqual([1, 2]);
      expect(result.columns.y).toEqual([10, 20]);
    });

    test('should handle aggregation with duplicate combinations', () => {
      const data = rDataFrameFunctions.DATA_FRAME({
        id: ['A', 'A', 'A'],
        var: ['x', 'x', 'y'],
        val: [1, 2, 10]
      });
      
      const result = rDataFrameFunctions.CAST(data, 'id ~ var', 'val');
      
      expect(result.nrow).toBe(1);
      expect(result.columns.id).toEqual(['A']);
      expect(result.columns.x).toEqual([3]); // 1 + 2
      expect(result.columns.y).toEqual([10]);
    });
  });

  describe('MERGE', () => {
    let df1, df2;
    
    beforeEach(() => {
      df1 = rDataFrameFunctions.DATA_FRAME({
        id: [1, 2, 3],
        name: ['Alice', 'Bob', 'Charlie']
      });
      
      df2 = rDataFrameFunctions.DATA_FRAME({
        id: [1, 2, 4],
        score: [85, 92, 88]
      });
    });

    test('should perform inner join by default', () => {
      const result = rDataFrameFunctions.MERGE(df1, df2, ['id']);
      
      expect(result.nrow).toBe(2); // Only ids 1 and 2 match
      expect(rDataFrameFunctions.COLNAMES(result)).toEqual(['id', 'name', 'score']);
      expect(result.columns.id).toEqual([1, 2]);
      expect(result.columns.name).toEqual(['Alice', 'Bob']);
      expect(result.columns.score).toEqual([85, 92]);
    });

    test('should perform left join with all_x=true', () => {
      const result = rDataFrameFunctions.MERGE(df1, df2, ['id'], true, false);
      
      expect(result.nrow).toBe(3); // All rows from df1
      expect(result.columns.id).toEqual([1, 2, 3]);
      expect(result.columns.name).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(result.columns.score).toEqual([85, 92, null]); // Charlie has no score
    });

    test('should perform right join with all_y=true', () => {
      const result = rDataFrameFunctions.MERGE(df1, df2, ['id'], false, true);
      
      expect(result.nrow).toBe(3); // All rows from df2
      expect(result.columns.id).toEqual([1, 2, 4]);
      expect(result.columns.name).toEqual(['Alice', 'Bob', null]); // id=4 has no name
      expect(result.columns.score).toEqual([85, 92, 88]);
    });

    test('should perform full outer join with all_x=true and all_y=true', () => {
      const result = rDataFrameFunctions.MERGE(df1, df2, ['id'], true, true);
      
      expect(result.nrow).toBe(4); // All unique rows
      expect(result.columns.id).toEqual([1, 2, 3, 4]);
    });

    test('should auto-detect common columns when by=null', () => {
      const result = rDataFrameFunctions.MERGE(df1, df2, null);
      
      expect(result.nrow).toBe(2); // Should join on 'id' column
      expect(result.columns.id).toEqual([1, 2]);
    });
  });

  describe('List Operations', () => {
    describe('LIST', () => {
      test('should create list from arguments', () => {
        const list = rDataFrameFunctions.LIST(1, 2, 'hello', [1, 2, 3]);
        
        expect(list.type).toBe('list');
        expect(list.elements).toEqual([1, 2, 'hello', [1, 2, 3]]);
        expect(list.names).toEqual(['0', '1', '2', '3']);
      });

      test('should create named list', () => {
        const list = rDataFrameFunctions.LIST('x', 1, 'y', 'hello', 'data', [1, 2]);
        
        expect(list.type).toBe('list');
        expect(list.elements).toEqual([1, 'hello', [1, 2]]);
        expect(list.names).toEqual(['x', 'y', 'data']);
      });

      test('should create empty list', () => {
        const list = rDataFrameFunctions.LIST();
        
        expect(list.type).toBe('list');
        expect(list.elements).toEqual([]);
        expect(list.names).toEqual([]);
      });
    });

    describe('UNLIST', () => {
      test('should flatten simple list', () => {
        const list = rDataFrameFunctions.LIST(1, 2, 'hello', [3, 4]);
        const result = rDataFrameFunctions.UNLIST(list);
        
        expect(result).toEqual([1, 2, 'hello', [3, 4]]);
      });

      test('should recursively flatten nested lists', () => {
        const innerList = rDataFrameFunctions.LIST(5, 6);
        const outerList = rDataFrameFunctions.LIST(1, 2, innerList, 7);
        const result = rDataFrameFunctions.UNLIST(outerList);
        
        expect(result).toEqual([1, 2, 5, 6, 7]);
      });

      test('should handle non-recursive flattening', () => {
        const innerList = rDataFrameFunctions.LIST(5, 6);
        const outerList = rDataFrameFunctions.LIST(1, innerList, 3);
        const result = rDataFrameFunctions.UNLIST(outerList, false);
        
        expect(result).toEqual([1, innerList, 3]);
      });
    });

    describe('LAPPLY', () => {
      test('should apply function to array', () => {
        const result = rDataFrameFunctions.LAPPLY([1, 2, 3], x => x * 2);
        
        expect(result.type).toBe('list');
        expect(result.elements).toEqual([2, 4, 6]);
        expect(result.names).toEqual(['0', '1', '2']);
      });

      test('should apply function to list', () => {
        const list = rDataFrameFunctions.LIST('a', 1, 'b', 2, 'c', 3);
        const result = rDataFrameFunctions.LAPPLY(list, x => x * 10);
        
        expect(result.type).toBe('list');
        expect(result.elements).toEqual([10, 20, 30]);
        expect(result.names).toEqual(['a', 'b', 'c']);
      });

      test('should apply function to data frame columns', () => {
        const df = rDataFrameFunctions.DATA_FRAME({
          x: [1, 2, 3],
          y: [10, 20, 30]
        });
        
        const result = rDataFrameFunctions.LAPPLY(df, col => col.reduce((sum, val) => sum + val, 0));
        
        expect(result.type).toBe('list');
        expect(result.elements).toEqual([6, 60]); // sum of x and y columns
        expect(result.names).toEqual(['x', 'y']);
      });
    });

    describe('SAPPLY', () => {
      test('should simplify to vector when possible', () => {
        const result = rDataFrameFunctions.SAPPLY([1, 2, 3], x => x * 2);
        
        expect(Array.isArray(result)).toBe(true);
        expect(result).toEqual([2, 4, 6]);
      });

      test('should not simplify complex results', () => {
        const result = rDataFrameFunctions.SAPPLY([1, 2], x => [x, x * 2]);
        
        expect(result.type).toBe('list');
        expect(result.elements).toEqual([[1, 2], [2, 4]]);
      });

      test('should respect simplify=false', () => {
        const result = rDataFrameFunctions.SAPPLY([1, 2, 3], x => x * 2, false);
        
        expect(result.type).toBe('list');
        expect(result.elements).toEqual([2, 4, 6]);
      });
    });
  });

  describe('Data Ordering', () => {
    describe('ORDER', () => {
      test('should return indices for ascending order', () => {
        const result = rDataFrameFunctions.ORDER([30, 10, 20]);
        
        expect(result).toEqual([1, 2, 0]); // indices that would sort the array
      });

      test('should handle descending order', () => {
        const result = rDataFrameFunctions.ORDER([30, 10, 20], true);
        
        expect(result).toEqual([0, 2, 1]);
      });

      test('should handle strings', () => {
        const result = rDataFrameFunctions.ORDER(['charlie', 'alice', 'bob']);
        
        expect(result).toEqual([1, 2, 0]); // alice, bob, charlie
      });

      test('should handle null values', () => {
        const result = rDataFrameFunctions.ORDER([3, null, 1, 2]);
        
        expect(result).toEqual([2, 3, 0, 1]); // 1, 2, 3, null (na_last=true by default)
      });

      test('should handle na_last=false', () => {
        const result = rDataFrameFunctions.ORDER([3, null, 1], false, false);
        
        expect(result).toEqual([1, 2, 0]); // null, 1, 3
      });
    });

    describe('SORT', () => {
      test('should sort array in ascending order', () => {
        const result = rDataFrameFunctions.SORT([30, 10, 20]);
        
        expect(result).toEqual([10, 20, 30]);
      });

      test('should sort in descending order', () => {
        const result = rDataFrameFunctions.SORT([30, 10, 20], true);
        
        expect(result).toEqual([30, 20, 10]);
      });

      test('should sort strings alphabetically', () => {
        const result = rDataFrameFunctions.SORT(['charlie', 'alice', 'bob']);
        
        expect(result).toEqual(['alice', 'bob', 'charlie']);
      });
    });
  });

  describe('AGGREGATE', () => {
    test('should aggregate by single grouping variable', () => {
      const df = rDataFrameFunctions.DATA_FRAME({
        group: ['A', 'B', 'A', 'B'],
        value: [10, 20, 15, 25]
      });
      
      const result = rDataFrameFunctions.AGGREGATE(
        df, 
        ['group'], 
        (values) => values.reduce((sum, val) => sum + val, 0)
      );
      
      expect(result.nrow).toBe(2);
      expect(result.columns.group).toEqual(['A', 'B']);
      expect(result.columns.value).toEqual([25, 45]); // 10+15, 20+25
    });

    test('should aggregate by multiple grouping variables', () => {
      const df = rDataFrameFunctions.DATA_FRAME({
        type: ['X', 'Y', 'X', 'Y'],
        group: ['A', 'A', 'B', 'B'],
        value: [10, 20, 15, 25]
      });
      
      const result = rDataFrameFunctions.AGGREGATE(
        df,
        ['type', 'group'],
        (values) => values.length > 0 ? values[0] : null
      );
      
      expect(result.nrow).toBe(4);
      expect(result.columns.type).toEqual(['X', 'Y', 'X', 'Y']);
      expect(result.columns.group).toEqual(['A', 'A', 'B', 'B']);
      expect(result.columns.value).toEqual([10, 20, 15, 25]);
    });

    test('should handle na_rm parameter', () => {
      const df = rDataFrameFunctions.DATA_FRAME({
        group: ['A', 'A', 'B'],
        value: [10, null, 20]
      });
      
      const result = rDataFrameFunctions.AGGREGATE(
        df,
        ['group'],
        (values) => values.reduce((sum, val) => sum + (val || 0), 0),
        true // na_rm = true
      );
      
      expect(result.columns.value).toEqual([10, 20]);
    });
  });

  describe('Utility Functions', () => {
    describe('IS_DATA_FRAME', () => {
      test('should identify data frames', () => {
        expect(rDataFrameFunctions.IS_DATA_FRAME(sampleDF)).toBe(true);
        expect(rDataFrameFunctions.IS_DATA_FRAME([])).toBe(false);
        expect(rDataFrameFunctions.IS_DATA_FRAME({})).toBe(false);
        expect(rDataFrameFunctions.IS_DATA_FRAME(null)).toBe(false);
      });
    });

    describe('IS_LIST', () => {
      test('should identify lists', () => {
        const list = rDataFrameFunctions.LIST(1, 2, 3);
        
        expect(rDataFrameFunctions.IS_LIST(list)).toBe(true);
        expect(rDataFrameFunctions.IS_LIST([])).toBe(false);
        expect(rDataFrameFunctions.IS_LIST({})).toBe(false);
        expect(rDataFrameFunctions.IS_LIST(sampleDF)).toBe(false);
      });
    });

    describe('STR', () => {
      test('should describe data frame structure', () => {
        const result = rDataFrameFunctions.STR(sampleDF);
        
        expect(result).toContain('data.frame');
        expect(result).toContain('3 obs. of 3 variables');
        expect(result).toContain('$ name:');
        expect(result).toContain('$ age:');
        expect(result).toContain('$ score:');
      });

      test('should describe list structure', () => {
        const list = rDataFrameFunctions.LIST('x', [1, 2], 'y', 'hello');
        const result = rDataFrameFunctions.STR(list);
        
        expect(result).toContain('List of 2');
        expect(result).toContain('$ x: object');
        expect(result).toContain('$ y: string');
      });

      test('should describe array structure', () => {
        const result = rDataFrameFunctions.STR([1, 2, 3, 4, 5]);
        
        expect(result).toContain('number [1:5]');
        expect(result).toContain('1 2 3 4 5');
      });

      test('should handle long arrays', () => {
        const longArray = Array.from({length: 10}, (_, i) => i);
        const result = rDataFrameFunctions.STR(longArray);
        
        expect(result).toContain('...');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle null/undefined inputs gracefully', () => {
      expect(rDataFrameFunctions.NROW(null)).toBe(0);
      expect(rDataFrameFunctions.NCOL(undefined)).toBe(0);
      expect(rDataFrameFunctions.COLNAMES(null)).toEqual([]);
      expect(rDataFrameFunctions.SUBSET(null, () => true)).toBe(null);
      expect(rDataFrameFunctions.HEAD(null)).toBe(null);
      expect(rDataFrameFunctions.MELT(null)).toBe(null);
      expect(rDataFrameFunctions.MERGE(null, sampleDF)).toBe(null);
    });

    test('should handle invalid function arguments', () => {
      expect(rDataFrameFunctions.LAPPLY([1, 2, 3], null)).toBe(null);
      expect(rDataFrameFunctions.AGGREGATE(sampleDF, [], () => {})).toBe(null);
      expect(rDataFrameFunctions.ORDER(null)).toEqual([]);
      expect(rDataFrameFunctions.SORT(null)).toBe(null);
    });

    test('should handle empty data frames', () => {
      const emptyDF = rDataFrameFunctions.DATA_FRAME();
      
      expect(rDataFrameFunctions.HEAD(emptyDF)).not.toBe(null);
      expect(rDataFrameFunctions.TAIL(emptyDF)).not.toBe(null);
      expect(rDataFrameFunctions.SUBSET(emptyDF, () => true)).not.toBe(null);
    });

    test('should handle malformed data frames', () => {
      const malformed = { type: 'data.frame' }; // Missing required properties
      
      expect(rDataFrameFunctions.NROW(malformed)).toBe(0);
      expect(rDataFrameFunctions.NCOL(malformed)).toBe(0);
      expect(rDataFrameFunctions.COLNAMES(malformed)).toEqual([]);
    });
  });

  describe('Complex Data Operations', () => {
    test('should chain multiple operations', () => {
      // Create sample sales data
      const salesData = rDataFrameFunctions.DATA_FRAME({
        product: ['A', 'B', 'A', 'B', 'A', 'B'],
        region: ['North', 'North', 'South', 'South', 'North', 'South'],
        sales: [100, 150, 120, 180, 110, 160]
      });
      
      // Filter for North region only
      const northSales = rDataFrameFunctions.SUBSET(
        salesData, 
        (row) => row.region === 'North'
      );
      
      // Aggregate by product
      const aggregated = rDataFrameFunctions.AGGREGATE(
        northSales,
        ['product'],
        (values) => values.reduce((sum, val) => sum + val, 0)
      );
      
      expect(aggregated.nrow).toBe(2);
      expect(aggregated.columns.product).toEqual(['A', 'B']);
      expect(aggregated.columns.sales).toEqual([210, 150]); // 100+110, 150
    });

    test('should handle pivot-like operations', () => {
      const data = rDataFrameFunctions.DATA_FRAME({
        id: ['1', '2', '1', '2'],
        measure: ['height', 'height', 'weight', 'weight'],
        value: [170, 165, 70, 68]
      });
      
      // Melt and cast back
      const melted = rDataFrameFunctions.MELT(data, ['id']);
      expect(melted.nrow).toBe(8); // 4 original rows × 2 value columns
      
      // Cast back to wide format
      const cast = rDataFrameFunctions.CAST(data, 'id ~ measure');
      expect(cast.nrow).toBe(2);
      expect(rDataFrameFunctions.COLNAMES(cast)).toEqual(['id', 'height', 'weight']);
    });
  });

  describe('R Compatibility', () => {
    test('data frame behavior should match R conventions', () => {
      const df = rDataFrameFunctions.DATA_FRAME({
        x: [1, 2, 3],
        y: ['a', 'b', 'c']
      });
      
      // R-style row names (1-indexed as strings)
      expect(df.rowNames).toEqual(['1', '2', '3']);
      
      // Column access should work
      expect(df.columns.x).toEqual([1, 2, 3]);
      expect(df.columns.y).toEqual(['a', 'b', 'c']);
      
      // Dimensions
      expect(df.nrow).toBe(3);
      expect(df.ncol).toBe(2);
    });

    test('list behavior should match R conventions', () => {
      const list = rDataFrameFunctions.LIST('x', [1, 2], 'y', 'hello');
      
      expect(list.type).toBe('list');
      expect(list.names).toEqual(['x', 'y']);
      expect(list.elements[0]).toEqual([1, 2]);
      expect(list.elements[1]).toBe('hello');
    });

    test('merge behavior should match R join conventions', () => {
      const left = rDataFrameFunctions.DATA_FRAME({
        key: [1, 2],
        left_val: ['a', 'b']
      });
      
      const right = rDataFrameFunctions.DATA_FRAME({
        key: [1, 3],
        right_val: ['x', 'z']
      });
      
      // Inner join
      const inner = rDataFrameFunctions.MERGE(left, right, ['key']);
      expect(inner.nrow).toBe(1);
      expect(inner.columns.key).toEqual([1]);
      
      // Left join
      const leftJoin = rDataFrameFunctions.MERGE(left, right, ['key'], true, false);
      expect(leftJoin.nrow).toBe(2);
      expect(leftJoin.columns.right_val).toEqual(['x', null]);
    });
  });
});