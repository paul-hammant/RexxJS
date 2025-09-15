(function() {
'use strict';

/**
 * String and Expression Processing for REXX interpreter
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

const parseQuotedParts = function(expression) {
    const parts = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let parenCount = 0;

    for (let i = 0; i < expression.length; i++) {
        const char = expression[i];

        if (!inQuotes && (char === '"' || char === "'")) {
            inQuotes = true;
            quoteChar = char;
            current += char;
        } else if (inQuotes && char === quoteChar) {
            current += char;
            inQuotes = false;
            quoteChar = '';
        } else if (!inQuotes && char === '(') {
            parenCount++;
            current += char;
        } else if (!inQuotes && char === ')') {
            parenCount--;
            current += char;
        } else if (!inQuotes && char === ' ' && parenCount === 0) {
            if (current.trim()) {
                parts.push(current.trim());
                current = '';
            }
        } else {
            current += char;
        }
    }

    if (current.trim()) {
        parts.push(current.trim());
    }

    return parts;
}

const interpolateString = async function(template, resolveValueFn) {
    // Get current interpolation pattern configuration
    let pattern;
    try {
      // Try to load interpolation config (Node.js or browser)
      if (typeof require !== 'undefined') {
        pattern = require('./interpolation-config').getCurrentPattern();
      } else if (typeof window !== 'undefined' && window.InterpolationConfig) {
        pattern = window.InterpolationConfig.getCurrentPattern();
      } else {
        // Fallback to default RexxJS pattern if config not available
        pattern = {
          regex: /\{([^}]+)\}/g,
          hasDelims: (str) => str.includes('{'),
          extractVar: (match) => match.slice(1, -1)
        };
      }
    } catch (error) {
      // Fallback to default pattern if config loading fails
      pattern = {
        regex: /\{([^}]+)\}/g,
        hasDelims: (str) => str.includes('{'),
        extractVar: (match) => match.slice(1, -1)
      };
    }
    
    // Handle case where there are no interpolation patterns - just return the template
    if (!pattern.hasDelims(template)) {
      return template;
    }
    
    // Replace variables with resolved values using configurable pattern
    const interpolationPromises = [];
    const placeholders = [];
    
    // Find all variable patterns using current configuration
    const matches = template.match(pattern.regex);
    if (!matches) return template;
    
    // Collect all resolveValue promises  
    for (const match of matches) {
      const variableName = pattern.extractVar(match);
      placeholders.push(match);
      interpolationPromises.push(resolveValueFn(variableName));
    }
    
    // Wait for all variable resolutions
    const resolvedValues = await Promise.all(interpolationPromises);
    
    // Replace placeholders with resolved values
    let result = template;
    for (let i = 0; i < placeholders.length; i++) {
      const resolvedValue = resolvedValues[i];
      const variableName = pattern.extractVar(placeholders[i]);
      if (resolvedValue !== variableName) { // resolveValue returns original value if not found
        result = result.replace(placeholders[i], String(resolvedValue));
      }
    }
    
    return result;
}

const evaluateConcatenation = async function(expression, resolveValueFn) {
    // Split the expression by || operators while preserving quoted strings
    const parts = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < expression.length; i++) {
      const char = expression[i];
      const nextChar = expression[i + 1];
      
      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (inQuotes && char === quoteChar) {
        inQuotes = false;
        current += char;
        quoteChar = '';
      } else if (!inQuotes && char === '|' && nextChar === '|') {
        // Found || operator
        parts.push(current.trim());
        current = '';
        i++; // Skip the second |
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      parts.push(current.trim());
    }
    
    // Evaluate each part and concatenate the results
    const results = [];
    for (const part of parts) {
      if (part.startsWith('"') && part.endsWith('"')) {
        // Quoted string
        results.push(part.substring(1, part.length - 1));
      } else if (part.startsWith("'") && part.endsWith("'")) {
        // Single quoted string
        results.push(part.substring(1, part.length - 1));
      } else {
        // Variable reference or literal
        const resolved = await resolveValueFn(part);
        results.push(String(resolved));
      }
    }
    
    return results.join('');
}

// UMD pattern for both Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = { parseQuotedParts, interpolateString, evaluateConcatenation };
} else if (typeof window !== 'undefined') {
    // Browser environment - register in registry to avoid conflicts
    if (!window.rexxModuleRegistry) {
        window.rexxModuleRegistry = new Map();
    }
    if (!window.rexxModuleRegistry.has('stringProcessing')) {
        window.rexxModuleRegistry.set('stringProcessing', {
            parseQuotedParts,
            interpolateString,
            evaluateConcatenation
        });
    }
}

})(); // End IIFE


