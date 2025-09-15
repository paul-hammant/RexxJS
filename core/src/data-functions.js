/**
 * Data processing and transformation functions for REXX interpreter
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

const dataFunctions = {
  'CSV_TO_JSON': (csvStr, delimiter = ',', hasHeader = true) => {
    try {
      const lines = String(csvStr).split('\n').filter(line => line.trim());
      if (lines.length === 0) return '[]';
      
      const hasHeaderBool = String(hasHeader).toLowerCase() === 'true';
      const delim = String(delimiter);
      
      if (!hasHeaderBool) {
        // Generate column names like col0, col1, etc.
        const firstLine = lines[0].split(delim);
        const headers = firstLine.map((_, index) => `col${index}`);
        const data = lines.map(line => {
          const values = line.split(delim);
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });
        return JSON.stringify(data);
      }
      
      const headers = lines[0].split(delim).map(h => h.trim());
      const data = lines.slice(1).map(line => {
        const values = line.split(delim);
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] ? values[index].trim() : '';
        });
        return row;
      });
      
      return JSON.stringify(data);
    } catch (e) {
      return '[]';
    }
  },
  
  'JSON_TO_CSV': (jsonStr, delimiter = ',') => {
    try {
      const data = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      if (!Array.isArray(data) || data.length === 0) return '';
      
      const delim = String(delimiter);
      const headers = Object.keys(data[0]);
      
      const csvLines = [headers.join(delim)];
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header] || '';
          // Escape values containing delimiter or quotes
          return String(value).includes(delim) || String(value).includes('"') 
            ? `"${String(value).replace(/"/g, '""')}"` 
            : String(value);
        });
        csvLines.push(values.join(delim));
      });
      
      return csvLines.join('\n');
    } catch (e) {
      return '';
    }
  },
  
  'XML_TO_JSON': (xmlStr) => {
    try {
      // Simple XML to JSON converter (basic implementation)
      const xmlString = String(xmlStr).trim();
      
      // This is a simplified parser - for production use, you'd want a proper XML parser
      const parseXML = (xml) => {
        const result = {};
        
        // Remove XML declaration and comments
        const cleanXml = xml.replace(/<\?xml.*?\?>/g, '').replace(/<!--.*?-->/g, '').trim();
        
        // Simple tag matching
        const tagRegex = /<(\w+)(?:\s+[^>]*)?>(.*?)<\/\1>/gs;
        let match;
        
        while ((match = tagRegex.exec(cleanXml)) !== null) {
          const tagName = match[1];
          const content = match[2].trim();
          
          if (content.includes('<')) {
            result[tagName] = parseXML(content);
          } else {
            result[tagName] = content;
          }
        }
        
        return Object.keys(result).length > 0 ? result : xmlString;
      };
      
      return parseXML(xmlString);
    } catch (e) {
      return {};
    }
  },
  
  'DATA_FILTER': (dataStr, filterKey, filterValue) => {
    try {
      const data = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
      if (!Array.isArray(data)) return '[]';
      
      const filtered = data.filter(item => {
        if (typeof item !== 'object' || item === null) return false;
        return item[String(filterKey)] === filterValue;
      });
      
      return JSON.stringify(filtered);
    } catch (e) {
      return '[]';
    }
  },
  
  'DATA_SORT': (dataStr, sortKey, ascending = true) => {
    try {
      const data = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
      if (!Array.isArray(data)) return '[]';
      
      const isAscending = String(ascending).toLowerCase() === 'true';
      
      const sorted = [...data].sort((a, b) => {
        const aVal = a[String(sortKey)];
        const bVal = b[String(sortKey)];
        
        if (aVal < bVal) return isAscending ? -1 : 1;
        if (aVal > bVal) return isAscending ? 1 : -1;
        return 0;
      });
      
      return JSON.stringify(sorted);
    } catch (e) {
      return dataStr;
    }
  },
  
  'DATA_GROUP_BY': (dataStr, groupKey) => {
    try {
      const data = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
      if (!Array.isArray(data)) return '{}';
      
      const grouped = {};
      
      data.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          const keyValue = item[String(groupKey)];
          if (!grouped[keyValue]) {
            grouped[keyValue] = [];
          }
          grouped[keyValue].push(item);
        }
      });
      
      return JSON.stringify(grouped);
    } catch (e) {
      return '{}';
    }
  }

  //TODO insert more data processing functions here

};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { dataFunctions };
} else if (typeof window !== 'undefined') {
  window.dataFunctions = dataFunctions;
}