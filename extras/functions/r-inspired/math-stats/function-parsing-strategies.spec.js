/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Test cases for function parsing strategies
 */

const {
  getFunctionParsingStrategy,
  shouldParseAsFunction,
  isFunctionCallExpression
} = require('../../../../../core/src/function-parsing-strategies');

describe('Function Parsing Strategies', () => {
  
  describe('getFunctionParsingStrategy', () => {
    test('should return FUNCTION_CALL for math functions', () => {
      expect(getFunctionParsingStrategy('MAX')).toBe('FUNCTION_CALL');
      expect(getFunctionParsingStrategy('MIN')).toBe('FUNCTION_CALL');
      expect(getFunctionParsingStrategy('ABS')).toBe('FUNCTION_CALL');
      expect(getFunctionParsingStrategy('MATH_MAX')).toBe('FUNCTION_CALL');
      expect(getFunctionParsingStrategy('MATH_MIN')).toBe('FUNCTION_CALL');
    });

    test('should return FUNCTION_CALL for R statistical functions', () => {
      expect(getFunctionParsingStrategy('MAX')).toBe('FUNCTION_CALL');
      expect(getFunctionParsingStrategy('MIN')).toBe('FUNCTION_CALL');
      expect(getFunctionParsingStrategy('R_MEDIAN')).toBe('FUNCTION_CALL');
      expect(getFunctionParsingStrategy('R_LENGTH')).toBe('FUNCTION_CALL');
      expect(getFunctionParsingStrategy('MEAN')).toBe('FUNCTION_CALL');
    });

    test('should return FUNCTION_CALL for string functions', () => {
      expect(getFunctionParsingStrategy('UPPER')).toBe('FUNCTION_CALL');
      expect(getFunctionParsingStrategy('LOWER')).toBe('FUNCTION_CALL');
      expect(getFunctionParsingStrategy('LENGTH')).toBe('FUNCTION_CALL');
      expect(getFunctionParsingStrategy('SUBSTR')).toBe('FUNCTION_CALL');
    });

    test('should return FUNCTION_CALL for array functions', () => {
      expect(getFunctionParsingStrategy('ARRAY_SUM')).toBe('FUNCTION_CALL');
      expect(getFunctionParsingStrategy('ARRAY_AVERAGE')).toBe('FUNCTION_CALL');
      expect(getFunctionParsingStrategy('ARRAY_LENGTH')).toBe('FUNCTION_CALL');
    });

    test('should return FUNCTION_CALL for JSON functions', () => {
      expect(getFunctionParsingStrategy('JSON_PARSE')).toBe('FUNCTION_CALL');
      expect(getFunctionParsingStrategy('JSON_STRINGIFY')).toBe('FUNCTION_CALL');
      expect(getFunctionParsingStrategy('JSONL_PARSE')).toBe('FUNCTION_CALL');
    });

    test('should return DEFAULT strategy for unknown functions', () => {
      expect(getFunctionParsingStrategy('UNKNOWN_FUNCTION')).toBe('AUTO_DETECT');
      expect(getFunctionParsingStrategy('CUSTOM_FUNC')).toBe('AUTO_DETECT');
    });

    test('should be case insensitive', () => {
      expect(getFunctionParsingStrategy('max')).toBe('FUNCTION_CALL');
      expect(getFunctionParsingStrategy('Max')).toBe('FUNCTION_CALL');
      expect(getFunctionParsingStrategy('MAX')).toBe('FUNCTION_CALL');
    });
  });

  describe('shouldParseAsFunction', () => {
    test('should return true for functions with FUNCTION_CALL strategy', () => {
      expect(shouldParseAsFunction('MAX')).toBe(true);
      expect(shouldParseAsFunction('MAX')).toBe(true);
      expect(shouldParseAsFunction('MEAN')).toBe(true);
      expect(shouldParseAsFunction('JSON_PARSE')).toBe(true);
    });

    test('should return false for unknown functions with AUTO_DETECT strategy', () => {
      expect(shouldParseAsFunction('UNKNOWN_FUNCTION')).toBe(false);
    });
  });

  describe('isFunctionCallExpression', () => {
    test('should detect function calls with parentheses', () => {
      expect(isFunctionCallExpression('MAX(1,2,3)')).toBe(true);
      expect(isFunctionCallExpression('MAX(data)')).toBe(true);
      expect(isFunctionCallExpression('JSON_PARSE(jsonStr)')).toBe(true);
    });

    test('should detect function calls with named parameters', () => {
      expect(isFunctionCallExpression('MAX values="1,2,3"')).toBe(true);
      expect(isFunctionCallExpression('MIN values="10,25,8,30,12"')).toBe(true);
      expect(isFunctionCallExpression('ABS value=-15')).toBe(true);
      expect(isFunctionCallExpression('MAX x="[1,2,3,4,5]"')).toBe(true);
      expect(isFunctionCallExpression('MEAN x="[1,2,3,4,5]"')).toBe(true);
    });

    test('should detect function calls with spaces around parentheses', () => {
      expect(isFunctionCallExpression('MAX (1,2,3)')).toBe(true);
      expect(isFunctionCallExpression('JSON_PARSE ( jsonStr )')).toBe(true);
    });

    test('should not detect non-function expressions', () => {
      expect(isFunctionCallExpression('"hello world"')).toBe(false);
      expect(isFunctionCallExpression('variable1')).toBe(false);
      expect(isFunctionCallExpression('123')).toBe(false);
      expect(isFunctionCallExpression('variable1 variable2')).toBe(false);
    });

    test('should not detect unknown function patterns', () => {
      expect(isFunctionCallExpression('UNKNOWN_FUNC param=value')).toBe(false);
      expect(isFunctionCallExpression('CUSTOM_FUNC(args)')).toBe(false);
    });

    test('should handle various whitespace patterns', () => {
      expect(isFunctionCallExpression('MAX  values="1,2,3"')).toBe(true);
      expect(isFunctionCallExpression('MIN\tvalues="data"')).toBe(true);
    });

    test('should return false for non-string inputs', () => {
      expect(isFunctionCallExpression(null)).toBe(false);
      expect(isFunctionCallExpression(undefined)).toBe(false);
      expect(isFunctionCallExpression(123)).toBe(false);
      expect(isFunctionCallExpression({})).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle function names with underscores and numbers', () => {
      expect(shouldParseAsFunction('MAX')).toBe(true);
      expect(shouldParseAsFunction('MATH_SIN')).toBe(true);
      expect(isFunctionCallExpression('MAX x="data"')).toBe(true);
      expect(isFunctionCallExpression('MEAN x="data"')).toBe(true);
    });

    test('should handle mixed case in expressions', () => {
      expect(isFunctionCallExpression('max values="1,2,3"')).toBe(true);
      expect(isFunctionCallExpression('Min Values="data"')).toBe(true);
    });
  });
});