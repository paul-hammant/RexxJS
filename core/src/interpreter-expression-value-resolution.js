(function() {
'use strict';

/**
 * Expression and Value Resolution for REXX interpreter
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
 * Handles core expression evaluation, value resolution, and condition evaluation
 * 
 * This module provides browser/Node.js compatible evaluation functions
 * that work with the interpreter's variable resolution and function calling systems.
 */

/**
 * Resolve values from various sources (literals, variables, expressions)
 * @param {*} value - Value to resolve (can be string, number, object, etc.)
 * @param {Function} variableGetFn - Function to get variable values (variable name -> value)
 * @param {Function} variableHasFn - Function to check if variable exists (variable name -> boolean)
 * @param {Function} evaluateExpressionFn - Function to evaluate expression objects
 * @param {Function} interpolateStringFn - Function to interpolate string templates
 * @param {Function} executeFunctionCallFn - Function to execute function calls
 * @param {Function} isLikelyFunctionNameFn - Function to check if name looks like function
 * @returns {Promise<*>} Resolved value
 */
async function resolveValue(value, variableGetFn, variableHasFn, evaluateExpressionFn, interpolateStringFn, executeFunctionCallFn, isLikelyFunctionNameFn) {
  // Handle expression objects
  if (typeof value === 'object' && value !== null && value.type) {
    if (value.type === 'INTERPOLATED_STRING') {
      return await interpolateStringFn(value.template);
    }
    if (value.type === 'HEREDOC_STRING') {
      // Auto-parse JSON if delimiter contains 'json' (case-insensitive)
      if (value.delimiter && value.delimiter.toLowerCase().includes('json')) {
        const content = value.content.trim();
        if ((content.startsWith('{') && content.endsWith('}')) ||
            (content.startsWith('[') && content.endsWith(']'))) {
          try {
            return JSON.parse(content);
          } catch (e) {
            // If JSON parsing fails, return as string
            return value.content;
          }
        }
      }
      return value.content;
    }
    return await evaluateExpressionFn(value);
  }
  
  // Handle numeric literals first
  if (typeof value === 'number') {
    return value;
  }
  
  // Handle quoted string literals - strip the quotes (including escaped quotes)
  if (typeof value === 'string') {
    if ((value.startsWith("'") && value.endsWith("'")) || 
        (value.startsWith('"') && value.endsWith('"'))) {
      let unquoted = value.substring(1, value.length - 1);
      // Process escape sequences
      unquoted = unquoted.replace(/\\n/g, '\n');
      unquoted = unquoted.replace(/\\t/g, '\t');
      unquoted = unquoted.replace(/\\r/g, '\r');
      unquoted = unquoted.replace(/\\\\/g, '\\');
      return unquoted;
    }
    // Handle escaped quotes
    if ((value.startsWith('\\"') && value.endsWith('\\"')) || 
        (value.startsWith("\\'") && value.endsWith("\\'"))) {
      return value.substring(2, value.length - 2);
    }
  }
  
  // Handle string literals that are actually numbers
  if (typeof value === 'string' && !isNaN(parseFloat(value)) && isFinite(value)) {
    return parseFloat(value);
  }
  
  // Handle simple array/object literals only - don't auto-parse complex JSON strings
  if (typeof value === 'string') {
    // Only parse empty arrays and objects, not complex JSON
    if (value === '[]') {
      return [];
    }
    if (value === '{}') {
      return {};
    }
  }
  
  // If value is a string that looks like a variable reference (e.g., "myVar.x")
  if (typeof value === 'string' && value.includes('.')) {
    const parts = value.split('.');
    const varName = parts[0];
    
    // Check if this is a variable reference
    if (variableHasFn(varName)) {
      let result = variableGetFn(varName);
      
      // Navigate through the property path
      for (let i = 1; i < parts.length; i++) {
        if (result && typeof result === 'object' && parts[i] in result) {
          result = result[parts[i]];
        } else {
          // If path doesn't exist, return original value
          return value;
        }
      }
      return result;
    }
  }
  
  // Check for simple variable references (no dots)
  if (typeof value === 'string' && variableHasFn(value)) {
    return variableGetFn(value);
  }
  
  // Check if the value looks like a function call
  if (typeof value === 'string' && value.match(/^[a-zA-Z_][a-zA-Z0-9_]*\s*\(/)) {
    try {
      // Import parseFunctionCall from parser
      let parseFunctionCall;
      if (typeof require !== 'undefined' && typeof module !== 'undefined') {
        // Node.js environment
        parseFunctionCall = require('./parser').parseFunctionCall;
      } else if (typeof window !== 'undefined' && window.parseFunctionCall) {
        // Browser environment
        parseFunctionCall = window.parseFunctionCall;
      }
      
      if (parseFunctionCall) {
        const funcCall = parseFunctionCall(value);
        if (funcCall) {
          // Execute the function call
          return await executeFunctionCallFn(funcCall);
        }
      }
    } catch (error) {
      // If function call parsing/execution fails, continue to return as literal
    }
  }
  
  // Return value as-is if not a variable reference or function call
  return value;
}

/**
 * Evaluate expression objects (LITERAL, VARIABLE, BINARY_OP, etc.)
 * @param {Object} expr - Expression object with type and relevant properties
 * @param {Function} resolveValueFn - Function to resolve values
 * @param {Function} variableGetFn - Function to get variable values
 * @param {Function} variableHasFn - Function to check if variable exists
 * @param {Function} interpolateStringFn - Function to interpolate strings
 * @param {Function} evaluateConcatenationFn - Function to evaluate concatenations
 * @param {Function} executeFunctionCallFn - Function to execute function calls
 * @param {Function} isLikelyFunctionNameFn - Function to check function names
 * @param {Function} isBuiltinFunctionFn - Function to check if function is built-in
 * @param {Function} getBuiltinFunctionFn - Function to get built-in function
 * @param {Function} callConvertParamsToArgsFn - Function to convert params to args
 * @param {Function} isNumericStringFn - Function to check if string is numeric
 * @returns {Promise<*>} Evaluated expression result
 */
async function evaluateExpression(expr, resolveValueFn, variableGetFn, variableHasFn, interpolateStringFn, evaluateConcatenationFn, executeFunctionCallFn, isLikelyFunctionNameFn, isBuiltinFunctionFn, getBuiltinFunctionFn, callConvertParamsToArgsFn, isNumericStringFn) {
  switch (expr.type) {
    case 'LITERAL':
      return expr.value;
      
    case 'ARRAY_LITERAL':
      return expr.value;
      
    case 'VARIABLE':
      const varName = expr.name || expr.value;
      
      // Special handling for REXX built-in variables - always check variables first
      const rexxSpecialVars = ['RC', 'ERRORTEXT', 'SIGL'];
      if (typeof varName === 'string' && rexxSpecialVars.includes(varName.toUpperCase())) {
        return await resolveValueFn(varName);
      }
      
      // Always check for variables first - this fixes loop variable resolution
      if (typeof varName === 'string' && variableHasFn(varName)) {
        return await resolveValueFn(varName);
      }
      
      // Only try function calls if it's not a defined variable and looks like a function
      if (typeof varName === 'string' && 
          varName.match(/^[a-zA-Z][a-zA-Z0-9_]*$/) &&
          isLikelyFunctionNameFn(varName)) {
        try {
          const functionCall = { command: varName, params: {} };
          return await executeFunctionCallFn(functionCall);
        } catch (e) {
          // If function call fails, fall back to resolveValue (treat as literal)
          return await resolveValueFn(varName);
        }
      }
      
      return await resolveValueFn(varName);
      
    case 'BINARY_OP':
      const leftValue = await evaluateExpression(expr.left, resolveValueFn, variableGetFn, variableHasFn, interpolateStringFn, evaluateConcatenationFn, executeFunctionCallFn, isLikelyFunctionNameFn, isBuiltinFunctionFn, getBuiltinFunctionFn, callConvertParamsToArgsFn, isNumericStringFn);
      const rightValue = await evaluateExpression(expr.right, resolveValueFn, variableGetFn, variableHasFn, interpolateStringFn, evaluateConcatenationFn, executeFunctionCallFn, isLikelyFunctionNameFn, isBuiltinFunctionFn, getBuiltinFunctionFn, callConvertParamsToArgsFn, isNumericStringFn);
      
      switch (expr.operator) {
        case '+':
          // In REXX, + should perform numeric addition when both operands are numeric
          // but fall back to JavaScript's default behavior for mixed types
          if (isNumericStringFn(leftValue) && isNumericStringFn(rightValue)) {
            const leftNum = typeof leftValue === 'number' ? leftValue : parseFloat(leftValue);
            const rightNum = typeof rightValue === 'number' ? rightValue : parseFloat(rightValue);
            return leftNum + rightNum;
          } else {
            // Let JavaScript handle string concatenation for non-numeric cases
            return leftValue + rightValue;
          }
        case '-':
          return leftValue - rightValue;
        case '*':
          return leftValue * rightValue;
        case '/':
          if (rightValue === 0) {
            throw new Error('Division by zero');
          }
          return leftValue / rightValue;
        case '//':
          if (rightValue === 0) {
            throw new Error('Division by zero in modulo operation');
          }
          return leftValue % rightValue;
        default:
          throw new Error(`Unknown operator: ${expr.operator}`);
      }
      
    case 'INTERPOLATED_STRING':
      return interpolateStringFn(expr.template);
      
    case 'FUNCTION_CALL':
      // For expressions, we handle built-in functions synchronously
      const method = expr.command.toUpperCase();
      if (isBuiltinFunctionFn(method)) {
        const resolvedParams = {};
        for (const [key, value] of Object.entries(expr.params)) {
          resolvedParams[key] = await resolveValueFn(value);
        }
        const builtInFunc = getBuiltinFunctionFn(method);
        const args = callConvertParamsToArgsFn(method, resolvedParams);
        return await builtInFunc(...args);
      } else {
        // Allow RPC function calls in expressions (like assignments)
        return await executeFunctionCallFn(expr);
      }
      
    case 'CONCATENATION':
      return await evaluateConcatenationFn(expr.value);

    case 'ARRAY_ACCESS':
      const array = await resolveValueFn(expr.variable);
      const index = await resolveValueFn(expr.index);

      if (Array.isArray(array)) {
        const numericIndex = Number(index);
        if (isNaN(numericIndex)) {
          throw new Error(`Array index must be a number, but got '${index}'`);
        }
        return array[numericIndex];
      } else if (typeof array === 'object' && array !== null) {
        return array[index];
      } else {
        throw new Error(`Variable '${expr.variable}' is not an array or object that can be accessed with brackets.`);
      }
      
    case 'HEREDOC_STRING':
      // Auto-parse JSON if delimiter contains 'json' (case-insensitive)
      if (expr.delimiter && expr.delimiter.toLowerCase().includes('json')) {
        const content = expr.content.trim();
        if ((content.startsWith('{') && content.endsWith('}')) ||
            (content.startsWith('[') && content.endsWith(']'))) {
          try {
            return JSON.parse(content);
          } catch (e) {
            // If JSON parsing fails, return as string
            return expr.content;
          }
        }
      }
      return expr.content;
      
    default:
      throw new Error(`Unknown expression type: ${expr.type}`);
  }
}

/**
 * Evaluate condition objects (COMPARISON, BOOLEAN)
 * @param {Object} condition - Condition object with type and relevant properties
 * @param {Function} resolveValueFn - Function to resolve values
 * @param {Function} compareValuesFn - Function to compare values
 * @param {Function} isTruthyFn - Function to check truthiness
 * @returns {Promise<boolean>} Condition evaluation result
 */
async function evaluateCondition(condition, resolveValueFn, compareValuesFn, isTruthyFn) {
  switch (condition.type) {
    case 'COMPARISON':
      const leftValue = await resolveValueFn(condition.left);
      const rightValue = await resolveValueFn(condition.right);
      
      switch (condition.operator) {
        case '>':
          return compareValuesFn(leftValue, rightValue) > 0;
        case '<':
          return compareValuesFn(leftValue, rightValue) < 0;
        case '>=':
          return compareValuesFn(leftValue, rightValue) >= 0;
        case '<=':
          return compareValuesFn(leftValue, rightValue) <= 0;
        case '=':
        case '==':
          return compareValuesFn(leftValue, rightValue) === 0;
        case '\\=':
        case '!=':
        case '<>':
        case '¬=':
        case '><':
          return compareValuesFn(leftValue, rightValue) !== 0;
        default:
          throw new Error(`Unknown comparison operator: ${condition.operator}`);
      }
      
    case 'BOOLEAN':
      const value = await resolveValueFn(condition.expression);
      return isTruthyFn(value);
      
    default:
      throw new Error(`Unknown condition type: ${condition.type}`);
  }
}

// UMD pattern for both Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = { 
        resolveValue,
        evaluateExpression,
        evaluateCondition
    };
} else if (typeof window !== 'undefined') {
    // Browser environment - register in registry to avoid conflicts
    if (!window.rexxModuleRegistry) {
        window.rexxModuleRegistry = new Map();
    }
    if (!window.rexxModuleRegistry.has('expressionValue')) {
        window.rexxModuleRegistry.set('expressionValue', {
            resolveValue,
            evaluateExpression,
            evaluateCondition
        });
    }
}

})(); // End IIFE