/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const { rApplyStringFunctions } = require('../r-apply-string-functions.js');

describe('R Apply Family & String Processing Functions', () => {
  // Apply Family Functions
  describe('SAPPLY', () => {
    test('should apply function to each element of vector', () => {
      expect(rApplyStringFunctions.SAPPLY([1, 2, 3], 'LENGTH')).toEqual([1, 1, 1]);
      expect(rApplyStringFunctions.SAPPLY(['a', 'bb', 'ccc'], 'LENGTH')).toEqual([1, 2, 3]);
      expect(rApplyStringFunctions.SAPPLY([1, -2, 3], 'ABS')).toEqual([1, 2, 3]);
    });

    test('should handle single values', () => {
      expect(rApplyStringFunctions.SAPPLY('hello', 'LENGTH')).toEqual([5]);
      expect(rApplyStringFunctions.SAPPLY(42, 'ABS')).toEqual([42]);
    });

    test('should handle string functions', () => {
      expect(rApplyStringFunctions.SAPPLY(['hello', 'WORLD'], 'TOUPPER')).toEqual(['HELLO', 'WORLD']);
      expect(rApplyStringFunctions.SAPPLY(['Hello', 'WORLD'], 'TOLOWER')).toEqual(['hello', 'world']);
    });

    test('should handle empty input', () => {
      expect(rApplyStringFunctions.SAPPLY([], 'LENGTH')).toEqual([]);
    });

    test('should handle unknown functions gracefully', () => {
      expect(rApplyStringFunctions.SAPPLY([1, 2], 'UNKNOWN_FUNC')).toEqual([]);
    });
  });

  describe('LAPPLY', () => {
    test('should apply function to list elements', () => {
      const result = rApplyStringFunctions.LAPPLY([[1, 2], [3, 4, 5]], 'LENGTH');
      expect(result).toEqual([2, 3]);
    });

    test('should handle nested arrays', () => {
      const result = rApplyStringFunctions.LAPPLY([['a', 'b'], ['c']], 'LENGTH');
      expect(result).toEqual([2, 1]);
    });

    test('should handle empty list', () => {
      expect(rApplyStringFunctions.LAPPLY([], 'LENGTH')).toEqual([]);
    });
  });

  describe('MAPPLY', () => {
    test('should apply function to multiple vectors element-wise', () => {
      const result = rApplyStringFunctions.MAPPLY('PLUS', [1, 2, 3], [4, 5, 6]);
      expect(result).toEqual([5, 7, 9]);
    });

    test('should handle different vector lengths', () => {
      const result = rApplyStringFunctions.MAPPLY('PLUS', [1, 2], [3, 4, 5]);
      expect(result).toEqual([4, 6, 6]); // Recycling shorter vector: 1+3=4, 2+4=6, 1+5=6
    });

    test('should handle paste operations', () => {
      const result = rApplyStringFunctions.MAPPLY('PASTE', ['a', 'b'], ['1', '2']);
      expect(result).toEqual(['a 1', 'b 2']);
    });

    test('should handle empty vectors', () => {
      expect(rApplyStringFunctions.MAPPLY('PLUS', [], [])).toEqual([]);
    });
  });

  // String Length and Character Functions
  describe('NCHAR', () => {
    test('should return character count', () => {
      expect(rApplyStringFunctions.NCHAR('hello')).toBe(5);
      expect(rApplyStringFunctions.NCHAR('')).toBe(0);
      expect(rApplyStringFunctions.NCHAR('a')).toBe(1);
    });

    test('should handle arrays of strings', () => {
      expect(rApplyStringFunctions.NCHAR(['hello', 'world'])).toEqual([5, 5]);
      expect(rApplyStringFunctions.NCHAR(['a', 'bb', 'ccc'])).toEqual([1, 2, 3]);
    });

    test('should handle numbers', () => {
      expect(rApplyStringFunctions.NCHAR(123)).toBe(3);
      expect(rApplyStringFunctions.NCHAR(0)).toBe(1);
    });
  });

  describe('TOUPPER', () => {
    test('should convert to uppercase', () => {
      expect(rApplyStringFunctions.TOUPPER('hello')).toBe('HELLO');
      expect(rApplyStringFunctions.TOUPPER('Hello World')).toBe('HELLO WORLD');
      expect(rApplyStringFunctions.TOUPPER('123abc')).toBe('123ABC');
    });

    test('should handle arrays', () => {
      expect(rApplyStringFunctions.TOUPPER(['hello', 'world'])).toEqual(['HELLO', 'WORLD']);
    });

    test('should handle empty string', () => {
      expect(rApplyStringFunctions.TOUPPER('')).toBe('');
    });
  });

  describe('TOLOWER', () => {
    test('should convert to lowercase', () => {
      expect(rApplyStringFunctions.TOLOWER('HELLO')).toBe('hello');
      expect(rApplyStringFunctions.TOLOWER('Hello World')).toBe('hello world');
      expect(rApplyStringFunctions.TOLOWER('123ABC')).toBe('123abc');
    });

    test('should handle arrays', () => {
      expect(rApplyStringFunctions.TOLOWER(['HELLO', 'WORLD'])).toEqual(['hello', 'world']);
    });

    test('should handle empty string', () => {
      expect(rApplyStringFunctions.TOLOWER('')).toBe('');
    });
  });

  // Substring Functions
  describe('SUBSTR', () => {
    test('should extract substring by position and length', () => {
      expect(rApplyStringFunctions.SUBSTR('hello', 1, 3)).toBe('hel');
      expect(rApplyStringFunctions.SUBSTR('world', 2, 2)).toBe('or');
      expect(rApplyStringFunctions.SUBSTR('test', 1, 10)).toBe('test');
    });

    test('should handle 1-based indexing', () => {
      expect(rApplyStringFunctions.SUBSTR('hello', 1, 1)).toBe('h');
      expect(rApplyStringFunctions.SUBSTR('hello', 5, 1)).toBe('o');
    });

    test('should handle out-of-bounds', () => {
      expect(rApplyStringFunctions.SUBSTR('hello', 10, 5)).toBe('');
      expect(rApplyStringFunctions.SUBSTR('hello', 1, 0)).toBe('');
    });
  });

  describe('SUBSTRING', () => {
    test('should extract substring from start to end', () => {
      expect(rApplyStringFunctions.SUBSTRING('hello', 1, 3)).toBe('hel');
      expect(rApplyStringFunctions.SUBSTRING('world', 2, 4)).toBe('orl');
    });

    test('should handle default end position', () => {
      expect(rApplyStringFunctions.SUBSTRING('hello', 3)).toBe('llo');
      expect(rApplyStringFunctions.SUBSTRING('world', 1)).toBe('world');
    });

    test('should handle edge cases', () => {
      expect(rApplyStringFunctions.SUBSTRING('hello', 10)).toBe('');
      expect(rApplyStringFunctions.SUBSTRING('', 1)).toBe('');
    });
  });

  // String Concatenation
  describe('PASTE', () => {
    test('should concatenate with spaces', () => {
      expect(rApplyStringFunctions.PASTE('a', 'b')).toBe('a b');
      expect(rApplyStringFunctions.PASTE('hello', 'world')).toBe('hello world');
      expect(rApplyStringFunctions.PASTE('1', '2', '3')).toBe('1 2 3');
    });

    test('should handle arrays', () => {
      expect(rApplyStringFunctions.PASTE(['a', 'b'], ['1', '2'])).toEqual(['a 1', 'b 2']);
      expect(rApplyStringFunctions.PASTE(['x'], ['1', '2', '3'])).toEqual(['x 1', 'x 2', 'x 3']);
    });

    test('should handle single argument', () => {
      expect(rApplyStringFunctions.PASTE('hello')).toBe('hello');
      expect(rApplyStringFunctions.PASTE(['a', 'b', 'c'])).toBe('a b c');
    });
  });

  describe('PASTE0', () => {
    test('should concatenate without spaces', () => {
      expect(rApplyStringFunctions.PASTE0('a', 'b')).toBe('ab');
      expect(rApplyStringFunctions.PASTE0('hello', 'world')).toBe('helloworld');
      expect(rApplyStringFunctions.PASTE0('1', '2', '3')).toBe('123');
    });

    test('should handle arrays', () => {
      expect(rApplyStringFunctions.PASTE0(['a', 'b'], ['1', '2'])).toEqual(['a1', 'b2']);
    });
  });

  // Pattern Matching
  describe('GREP', () => {
    test('should find matching strings', () => {
      expect(rApplyStringFunctions.GREP('a', ['apple', 'banana', 'cherry'])).toEqual(['apple', 'banana']);
      expect(rApplyStringFunctions.GREP('test', ['test1', 'other', 'testing'])).toEqual(['test1', 'testing']);
    });

    test('should return indices when value=false', () => {
      expect(rApplyStringFunctions.GREP('a', ['apple', 'banana', 'cherry'], false)).toEqual([0, 1]);
    });

    test('should handle case sensitivity', () => {
      expect(rApplyStringFunctions.GREP('A', ['apple', 'APPLE'])).toEqual(['APPLE']);
    });

    test('should handle no matches', () => {
      expect(rApplyStringFunctions.GREP('xyz', ['apple', 'banana'])).toEqual([]);
    });
  });

  describe('GREPL', () => {
    test('should return logical vector', () => {
      expect(rApplyStringFunctions.GREPL('a', ['apple', 'banana', 'cherry'])).toEqual([true, true, false]);
      expect(rApplyStringFunctions.GREPL('test', ['test1', 'other', 'testing'])).toEqual([true, false, true]);
    });

    test('should handle empty pattern', () => {
      expect(rApplyStringFunctions.GREPL('', ['a', 'b'])).toEqual([true, true]);
    });
  });

  describe('GSUB', () => {
    test('should replace all occurrences', () => {
      expect(rApplyStringFunctions.GSUB('a', 'X', 'banana')).toBe('bXnXnX');
      expect(rApplyStringFunctions.GSUB('test', 'exam', 'test123test')).toBe('exam123exam');
    });

    test('should handle arrays', () => {
      expect(rApplyStringFunctions.GSUB('a', 'X', ['apple', 'banana'])).toEqual(['Xpple', 'bXnXnX']);
    });

    test('should handle no matches', () => {
      expect(rApplyStringFunctions.GSUB('xyz', 'ABC', 'hello')).toBe('hello');
    });
  });

  describe('SUB', () => {
    test('should replace first occurrence only', () => {
      expect(rApplyStringFunctions.SUB('a', 'X', 'banana')).toBe('bXnana');
      expect(rApplyStringFunctions.SUB('test', 'exam', 'test123test')).toBe('exam123test');
    });

    test('should handle arrays', () => {
      expect(rApplyStringFunctions.SUB('a', 'X', ['apple', 'banana'])).toEqual(['Xpple', 'bXnana']);
    });
  });

  // String Utilities
  describe('STRSPLIT', () => {
    test('should split strings', () => {
      expect(rApplyStringFunctions.STRSPLIT('a,b,c', ',')).toEqual(['a', 'b', 'c']);
      expect(rApplyStringFunctions.STRSPLIT('hello world', ' ')).toEqual(['hello', 'world']);
    });

    test('should handle empty delimiter', () => {
      expect(rApplyStringFunctions.STRSPLIT('abc', '')).toEqual(['a', 'b', 'c']);
    });

    test('should handle no delimiter found', () => {
      expect(rApplyStringFunctions.STRSPLIT('hello', ',')).toEqual(['hello']);
    });
  });

  describe('SPRINTF', () => {
    test('should format strings with %s', () => {
      expect(rApplyStringFunctions.SPRINTF('Hello %s', 'world')).toBe('Hello world');
      expect(rApplyStringFunctions.SPRINTF('%s and %s', 'cats', 'dogs')).toBe('cats and dogs');
    });

    test('should format numbers with %d', () => {
      expect(rApplyStringFunctions.SPRINTF('Number: %d', 42)).toBe('Number: 42');
      expect(rApplyStringFunctions.SPRINTF('%d + %d = %d', 2, 3, 5)).toBe('2 + 3 = 5');
    });

    test('should handle missing arguments', () => {
      expect(rApplyStringFunctions.SPRINTF('Hello %s', undefined)).toBe('Hello undefined');
    });
  });

  describe('TRIMWS', () => {
    test('should trim whitespace', () => {
      expect(rApplyStringFunctions.TRIMWS('  hello  ')).toBe('hello');
      expect(rApplyStringFunctions.TRIMWS('\t world \n')).toBe('world');
    });

    test('should handle arrays', () => {
      expect(rApplyStringFunctions.TRIMWS(['  a  ', '  b  '])).toEqual(['a', 'b']);
    });

    test('should handle strings without whitespace', () => {
      expect(rApplyStringFunctions.TRIMWS('hello')).toBe('hello');
    });
  });

  describe('STARTSWITH', () => {
    test('should check string starts', () => {
      expect(rApplyStringFunctions.STARTSWITH('hello', 'he')).toBe(true);
      expect(rApplyStringFunctions.STARTSWITH('world', 'he')).toBe(false);
    });

    test('should handle arrays', () => {
      expect(rApplyStringFunctions.STARTSWITH(['hello', 'help', 'world'], 'he')).toEqual([true, true, false]);
    });

    test('should handle empty prefix', () => {
      expect(rApplyStringFunctions.STARTSWITH('hello', '')).toBe(true);
    });
  });

  describe('ENDSWITH', () => {
    test('should check string ends', () => {
      expect(rApplyStringFunctions.ENDSWITH('hello', 'lo')).toBe(true);
      expect(rApplyStringFunctions.ENDSWITH('world', 'lo')).toBe(false);
    });

    test('should handle arrays', () => {
      expect(rApplyStringFunctions.ENDSWITH(['hello', 'jello', 'world'], 'lo')).toEqual([true, true, false]);
    });

    test('should handle empty suffix', () => {
      expect(rApplyStringFunctions.ENDSWITH('hello', '')).toBe(true);
    });
  });

  // Type Conversion
  describe('AS_CHARACTER', () => {
    test('should convert to string', () => {
      expect(rApplyStringFunctions.AS_CHARACTER(123)).toBe('123');
      expect(rApplyStringFunctions.AS_CHARACTER(true)).toBe('true');
      expect(rApplyStringFunctions.AS_CHARACTER(null)).toBe('null');
    });

    test('should handle arrays', () => {
      expect(rApplyStringFunctions.AS_CHARACTER([1, 2, 3])).toEqual(['1', '2', '3']);
    });
  });

  describe('AS_NUMERIC', () => {
    test('should convert to numbers', () => {
      expect(rApplyStringFunctions.AS_NUMERIC('123')).toBe(123);
      expect(rApplyStringFunctions.AS_NUMERIC('3.14')).toBe(3.14);
      expect(rApplyStringFunctions.AS_NUMERIC('hello')).toBeNaN();
    });

    test('should handle arrays', () => {
      expect(rApplyStringFunctions.AS_NUMERIC(['1', '2', '3'])).toEqual([1, 2, 3]);
    });

    test('should handle boolean conversion', () => {
      expect(rApplyStringFunctions.AS_NUMERIC('true')).toBe(1);
      expect(rApplyStringFunctions.AS_NUMERIC('false')).toBe(0);
    });
  });

  // Text Analysis
  describe('WORD_COUNT', () => {
    test('should count words', () => {
      expect(rApplyStringFunctions.WORD_COUNT('hello world')).toBe(2);
      expect(rApplyStringFunctions.WORD_COUNT('one two three four')).toBe(4);
      expect(rApplyStringFunctions.WORD_COUNT('')).toBe(0);
    });

    test('should handle multiple spaces', () => {
      expect(rApplyStringFunctions.WORD_COUNT('hello    world')).toBe(2);
      expect(rApplyStringFunctions.WORD_COUNT('  hello  world  ')).toBe(2);
    });

    test('should handle arrays', () => {
      expect(rApplyStringFunctions.WORD_COUNT(['hello world', 'test'])).toEqual([2, 1]);
    });
  });

  describe('CHACOUNT', () => {
    test('should count specific characters', () => {
      expect(rApplyStringFunctions.CHACOUNT('hello', 'l')).toBe(2);
      expect(rApplyStringFunctions.CHACOUNT('banana', 'a')).toBe(3);
      expect(rApplyStringFunctions.CHACOUNT('test', 'x')).toBe(0);
    });

    test('should handle arrays', () => {
      expect(rApplyStringFunctions.CHACOUNT(['hello', 'world'], 'l')).toEqual([2, 1]);
    });
  });

  describe('STPAD', () => {
    test('should pad strings', () => {
      expect(rApplyStringFunctions.STPAD('hello', 10)).toBe('     hello');
      expect(rApplyStringFunctions.STPAD('test', 8, '0')).toBe('0000test');
    });

    test('should handle right padding', () => {
      expect(rApplyStringFunctions.STPAD('hello', 10, ' ', 'right')).toBe('hello     ');
    });

    test('should handle center padding', () => {
      const result = rApplyStringFunctions.STPAD('hi', 6, ' ', 'center');
      expect(result.length).toBe(6);
      expect(result.includes('hi')).toBe(true);
    });

    test('should handle strings already at target length', () => {
      expect(rApplyStringFunctions.STPAD('hello', 5)).toBe('hello');
      expect(rApplyStringFunctions.STPAD('hello', 3)).toBe('hello'); // Don't truncate
    });
  });

  // Edge Cases and Error Handling
  describe('Error Handling', () => {
    test('should handle null/undefined inputs gracefully', () => {
      expect(rApplyStringFunctions.NCHAR(null)).toBe(4); // "null"
      expect(rApplyStringFunctions.TOUPPER(undefined)).toBe('UNDEFINED');
      expect(rApplyStringFunctions.PASTE(null, undefined)).toBe('null undefined');
    });

    test('should handle empty arrays', () => {
      expect(rApplyStringFunctions.SAPPLY([], 'LENGTH')).toEqual([]);
      expect(rApplyStringFunctions.TOUPPER([])).toEqual([]);
      expect(rApplyStringFunctions.GREP('test', [])).toEqual([]);
    });

    test('should handle mixed types in arrays', () => {
      expect(rApplyStringFunctions.AS_CHARACTER([1, 'hello', true])).toEqual(['1', 'hello', 'true']);
      expect(rApplyStringFunctions.NCHAR([123, 'test'])).toEqual([3, 4]);
    });
  });

  // R Compatibility Tests
  describe('R Compatibility', () => {
    test('SAPPLY should behave like R sapply', () => {
      // R: sapply(c("a", "bb", "ccc"), nchar) -> c(1, 2, 3)
      expect(rApplyStringFunctions.SAPPLY(['a', 'bb', 'ccc'], 'NCHAR')).toEqual([1, 2, 3]);
    });

    test('PASTE should behave like R paste', () => {
      // R: paste(c("a", "b"), c("1", "2")) -> c("a 1", "b 2")
      expect(rApplyStringFunctions.PASTE(['a', 'b'], ['1', '2'])).toEqual(['a 1', 'b 2']);
    });

    test('SUBSTR should use 1-based indexing like R', () => {
      // R: substr("hello", 2, 4) -> "ell"
      expect(rApplyStringFunctions.SUBSTR('hello', 2, 3)).toBe('ell');
    });

    test('GREP should return values by default like R', () => {
      // R: grep("a", c("apple", "banana", "cherry"), value=TRUE) -> c("apple", "banana")
      expect(rApplyStringFunctions.GREP('a', ['apple', 'banana', 'cherry'])).toEqual(['apple', 'banana']);
    });
  });
});