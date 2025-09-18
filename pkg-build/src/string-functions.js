/**
 * String manipulation functions for REXX interpreter
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

const stringFunctions = {
  'UPPER': (str) => {
    if (typeof str !== 'string') str = String(str);
    return str.toUpperCase();
  },

  'LOWER': (str) => {
    if (typeof str !== 'string') str = String(str);
    return str.toLowerCase();
  },

  'LENGTH': (str) => {
    if (typeof str !== 'string') str = String(str);
    return str.length;
  },

  'SUBSTR': (str, start, length) => {
    if (typeof str !== 'string') str = String(str);
    const startPos = Math.max(0, (parseInt(start) || 1) - 1); // Convert 1-based to 0-based
    if (length === undefined) {
      return str.substring(startPos);
    } else {
      const len = parseInt(length) || 0;
      return str.substring(startPos, startPos + len);
    }
  },

  'TRIM': (string) => {
    try {
      return String(string).trim();
    } catch (e) {
      return '';
    }
  },
  
  'TRIM_START': (string) => {
    try {
      return String(string).trimStart();
    } catch (e) {
      return '';
    }
  },
  
  'TRIM_END': (string) => {
    try {
      return String(string).trimEnd();
    } catch (e) {
      return '';
    }
  },
  
  'STRIP': (string, option = 'BOTH', character = ' ') => {
    try {
      const str = String(string);
      const char = String(character);
      const opt = String(option).toUpperCase();
      
      // Escape special regex characters
      const escapedChar = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      switch (opt) {
        case 'LEADING':
        case 'L':
          return str.replace(new RegExp(`^[${escapedChar}]+`), '');
        case 'TRAILING':  
        case 'T':
          return str.replace(new RegExp(`[${escapedChar}]+$`), '');
        case 'BOTH':
        case 'B':
        default:
          return str.replace(new RegExp(`^[${escapedChar}]+|[${escapedChar}]+$`, 'g'), '');
      }
    } catch (e) {
      return '';
    }
  },
  
  'REVERSE': (string) => {
    try {
      return String(string).split('').reverse().join('');
    } catch (e) {
      return '';
    }
  },
  
  'SPACE': (string, n = 1, pad = ' ') => {
    try {
      const str = String(string).trim();
      let count = parseInt(n);
      // Handle NaN, undefined, null cases - default to 1
      if (isNaN(count)) count = 1;
      // Handle negative values - make them 0
      count = Math.max(0, count);
      
      const padChar = String(pad);
      
      // Split by any whitespace, filter out empty strings
      const words = str.split(/\s+/).filter(word => word.length > 0);
      
      // If no words, return empty string
      if (words.length === 0) return '';
      
      // Join with specified padding (or no padding if count is 0)
      return words.join(count === 0 ? '' : padChar.repeat(count));
    } catch (e) {
      return '';
    }
  },

  'WORD': (string, n) => {
    try {
      const str = String(string).trim();
      let wordNum = parseInt(n);
      
      // Handle NaN case - default to 1
      if (isNaN(wordNum)) wordNum = 1;
      
      if (wordNum < 1) return '';
      
      // Split by whitespace and filter out empty strings
      const words = str.split(/\s+/).filter(word => word.length > 0);
      
      // Return the nth word (1-based index)
      if (wordNum <= words.length) {
        return words[wordNum - 1];
      }
      
      return '';
    } catch (e) {
      return '';
    }
  },
  
  'WORDS': (string) => {
    try {
      const str = String(string).trim();
      
      if (str === '') return 0;
      
      // Split by whitespace and filter out empty strings
      const words = str.split(/\s+/).filter(word => word.length > 0);
      
      return words.length;
    } catch (e) {
      return 0;
    }
  },
  
  'WORDPOS': (phrase, string, start = 1) => {
    try {
      const phraseStr = String(phrase).trim();
      const str = String(string).trim();
      const startPos = Math.max(1, parseInt(start) || 1);
      
      if (phraseStr === '' || str === '') return 0;
      
      // Split both phrase and string into words
      const phraseWords = phraseStr.split(/\s+/).filter(word => word.length > 0);
      const stringWords = str.split(/\s+/).filter(word => word.length > 0);
      
      if (phraseWords.length === 0 || stringWords.length === 0) return 0;
      
      // Search starting from the specified position (1-based)
      for (let i = startPos - 1; i <= stringWords.length - phraseWords.length; i++) {
        let match = true;
        
        // Check if all words in phrase match at this position
        for (let j = 0; j < phraseWords.length; j++) {
          if (stringWords[i + j] !== phraseWords[j]) {
            match = false;
            break;
          }
        }
        
        if (match) {
          return i + 1; // Convert back to 1-based index
        }
      }
      
      return 0; // Not found
    } catch (e) {
      return 0;
    }
  },
  
  'DELWORD': (string, start, length = null) => {
    try {
      const str = String(string).trim();
      let startPos = parseInt(start);
      if (isNaN(startPos)) startPos = 1;
      
      if (str === '' || startPos < 1) return str;
      
      // Split into words
      const words = str.split(/\s+/).filter(word => word.length > 0);
      
      if (startPos > words.length) return str;
      
      // Determine how many words to delete
      let deleteCount;
      if (length === null || length === undefined) {
        // Delete all words from start to end
        deleteCount = words.length - startPos + 1;
      } else {
        deleteCount = Math.max(0, parseInt(length) || 0);
      }
      
      // Remove the specified words
      const result = [...words];
      result.splice(startPos - 1, deleteCount);
      
      return result.join(' ');
    } catch (e) {
      return '';
    }
  },
  
  'SUBWORD': (string, start, length = null) => {
    try {
      const str = String(string).trim();
      let startPos = parseInt(start);
      if (isNaN(startPos)) startPos = 1;
      
      if (str === '' || startPos < 1) return '';
      
      // Split into words
      const words = str.split(/\s+/).filter(word => word.length > 0);
      
      if (startPos > words.length) return '';
      
      // Determine how many words to extract
      let extractCount;
      if (length === null || length === undefined) {
        // Extract all words from start to end
        extractCount = words.length - startPos + 1;
      } else {
        extractCount = Math.max(0, parseInt(length) || 0);
      }
      
      // Extract the specified words
      const result = words.slice(startPos - 1, startPos - 1 + extractCount);
      
      return result.join(' ');
    } catch (e) {
      return '';
    }
  },

  'INDEXOF': (string, searchString, fromIndex = 0) => {
    try {
      const str = String(string);
      const search = String(searchString);
      const from = parseInt(fromIndex) || 0;
      return str.indexOf(search, from);
    } catch (e) {
      return -1;
    }
  },
  
  'INCLUDES': (string, searchString) => {
    try {
      const str = String(string);
      const search = String(searchString);
      return str.includes(search);
    } catch (e) {
      return false;
    }
  },
  
  'STARTS_WITH': (string, searchString) => {
    try {
      const str = String(string);
      const search = String(searchString);
      return str.startsWith(search);
    } catch (e) {
      return false;
    }
  },
  
  'ENDS_WITH': (string, searchString) => {
    try {
      const str = String(string);
      const search = String(searchString);
      return str.endsWith(search);
    } catch (e) {
      return false;
    }
  },

  'REPEAT': (string, count) => {
    try {
      const str = String(string);
      const num = Math.max(0, parseInt(count) || 0);
      return str.repeat(num);
    } catch (e) {
      return '';
    }
  },
  
  'COPIES': (string, count) => {
    try {
      const str = String(string);
      const num = Math.max(0, parseInt(count) || 0);
      return str.repeat(num);
    } catch (e) {
      return '';
    }
  },
  
  'PAD_START': (string, targetLength, padString = ' ') => {
    try {
      const str = String(string);
      const length = parseInt(targetLength) || 0;
      const pad = String(padString);
      return str.padStart(length, pad);
    } catch (e) {
      return String(string);
    }
  },
  
  'PAD_END': (string, targetLength, padString = ' ') => {
    try {
      const str = String(string);
      const length = parseInt(targetLength) || 0;
      const pad = String(padString);
      return str.padEnd(length, pad);
    } catch (e) {
      return String(string);
    }
  },

  'TRANSLATE': (string, outputTable = '', inputTable = '') => {
    try {
      const str = String(string);
      const outTable = String(outputTable);
      const inTable = String(inputTable);
      
      // If no tables provided, convert to uppercase (classic Rexx default)
      if (outTable === '' && inTable === '') {
        return str.toUpperCase();
      }
      
      // If only output table provided, use lowercase alphabet as input table
      if (inTable === '' && outTable !== '') {
        const defaultInput = 'abcdefghijklmnopqrstuvwxyz';
        return translateString(str, outTable, defaultInput);
      }
      
      // Both tables provided
      return translateString(str, outTable, inTable);
      
      function translateString(text, out, inp) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const index = inp.indexOf(char);
          if (index !== -1 && index < out.length) {
            result += out[index];
          } else {
            result += char; // Character not in input table, keep as is
          }
        }
        return result;
      }
    } catch (e) {
      return '';
    }
  },
  
  'VERIFY': (string, reference, option = 'NOMATCH', start = 1) => {
    try {
      const str = String(string);
      const ref = String(reference);
      const opt = String(option).toUpperCase();
      const startPos = Math.max(1, parseInt(start) || 1);
      
      // Convert to 0-based index for JavaScript
      const startIndex = startPos - 1;
      
      if (startIndex >= str.length) return 0;
      
      const isMatch = opt === 'MATCH' || opt === 'M';
      
      for (let i = startIndex; i < str.length; i++) {
        const char = str[i];
        const foundInRef = ref.indexOf(char) !== -1;
        
        if (isMatch) {
          // Looking for first character that IS in reference
          if (foundInRef) {
            return i + 1; // Convert back to 1-based index
          }
        } else {
          // Looking for first character that is NOT in reference (default)
          if (!foundInRef) {
            return i + 1; // Convert back to 1-based index
          }
        }
      }
      
      // No matching character found
      return 0;
    } catch (e) {
      return 0;
    }
  },
  
  'SUBSTRING': (string, start, length) => {
    try {
      const str = String(string);
      const startPos = parseInt(start) || 0;
      if (length !== undefined && length !== null) {
        const len = parseInt(length);
        return str.substring(startPos, startPos + len);
      }
      return str.substring(startPos);
    } catch (e) {
      return '';
    }
  },
  
  'SLUG': (string) => {
    try {
      return String(string)
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    } catch (e) {
      return '';
    }
  }

  //TODO insert more here

};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { stringFunctions };
} else if (typeof window !== 'undefined') {
  window.stringFunctions = stringFunctions;
}
