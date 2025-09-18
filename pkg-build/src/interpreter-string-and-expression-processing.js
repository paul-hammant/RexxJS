(function() {
'use strict';

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
    // Handle case where there are no interpolation patterns - just return the template
    if (!template.includes('{')) {
      return template;
    }
    
    // Replace {variableName} with variable values
    const interpolationPromises = [];
    const placeholders = [];
    
    // Find all {variableName} patterns
    const matches = template.match(/\{([^}]+)\}/g);
    if (!matches) return template;
    
    // Collect all resolveValue promises  
    for (const match of matches) {
      const variableName = match.slice(1, -1); // Remove { }
      placeholders.push(match);
      interpolationPromises.push(resolveValueFn(variableName));
    }
    
    // Wait for all variable resolutions
    const resolvedValues = await Promise.all(interpolationPromises);
    
    // Replace placeholders with resolved values
    let result = template;
    for (let i = 0; i < placeholders.length; i++) {
      const resolvedValue = resolvedValues[i];
      const variableName = placeholders[i].slice(1, -1);
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


