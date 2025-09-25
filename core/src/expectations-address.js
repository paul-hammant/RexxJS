/*!
 * expectations-address v1.0.0 | (c) 2025 Paul Hammant | MIT License
 * @rexxjs-meta=EXPECTATIONS_ADDRESS_META
 */
/**
 * Plain English Expectation DSL ADDRESS Library for RexxJS
 * 
 * Parses natural language expectations like:
 *   {age} should be greater than 18
 *   {name} should contain "John"
 *   {items} should not be empty
 * 
 * Usage:
 *   REQUIRE "expectations-address"
 *   ADDRESS EXPECTATIONS
 *   "{age} should be greater than 18"
 *   LET result = expect expression="{name} should contain 'test'" context=data
 * 
 * Copyright (c) 2025 RexxJS Project
 * Licensed under the MIT License
 */

// Test counter functionality
function incrementTestCounter() {
  try {
    const fs = require('fs');
    const tempFile = '.rexxt-test-count.tmp';
    let count = 0;
    
    // Read existing count if file exists
    if (fs.existsSync(tempFile)) {
      const content = fs.readFileSync(tempFile, 'utf8').trim();
      count = parseInt(content) || 0;
    }
    
    // Increment and write back
    count++;
    fs.writeFileSync(tempFile, count.toString());
  } catch (error) {
    // Ignore errors - counting is non-critical
  }
}

// Custom ExpectationError class
class ExpectationError extends Error {
  constructor(message, actual, expected, matcher, negated, originalExpectation, sourceContext = null) {
    // Enhance message with source context if available
    let enhancedMessage = message;
    if (sourceContext && sourceContext.lineNumber && sourceContext.sourceLine) {
      let filename = '';
      if (sourceContext.sourceFilename) {
        // Extract just the filename from the full path
        const parts = sourceContext.sourceFilename.split(/[\/\\]/);
        const basename = parts[parts.length - 1];
        filename = `${basename}: `;
      }
      enhancedMessage += `\n    Rexx: ${sourceContext.sourceLine.trim()} (${filename}${sourceContext.lineNumber})`;
    }
    
    super(enhancedMessage);
    this.name = 'ExpectationError';
    this.actual = actual;
    this.expected = expected;
    this.matcher = matcher;
    this.negated = negated;
    this.originalExpectation = originalExpectation;
    this.sourceContext = sourceContext;
    
    // Enhanced stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ExpectationError);
    }
  }
  
  toString() {
    let result = `ExpectationError: ${this.message}\n`;
    result += `  Original: "${this.originalExpectation}"\n`;
    result += `  Actual:   ${this.formatValue(this.actual)}\n`;
    result += `  Expected: ${this.formatValue(this.expected)}\n`;
    
    // Add diff for objects/arrays
    if (this.shouldShowDiff()) {
      result += `  Diff:     ${this.generateDiff()}\n`;
    }
    
    return result;
  }
  
  formatValue(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }
  
  shouldShowDiff() {
    return (typeof this.actual === 'object' && typeof this.expected === 'object') ||
           (Array.isArray(this.actual) && Array.isArray(this.expected));
  }
  
  generateDiff() {
    if (Array.isArray(this.actual) && Array.isArray(this.expected)) {
      return this.generateArrayDiff();
    }
    if (typeof this.actual === 'object' && typeof this.expected === 'object') {
      return this.generateObjectDiff();
    }
    return '';
  }
  
  generateArrayDiff() {
    const diff = ['Differences:'];
    const maxLength = Math.max(this.actual.length, this.expected.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (i >= this.actual.length) {
        diff.push(`  - Index ${i}: ${this.formatValue(this.expected[i])}`);
      } else if (i >= this.expected.length) {
        diff.push(`  + Index ${i}: ${this.formatValue(this.actual[i])}`);
      } else if (this.actual[i] !== this.expected[i]) {
        diff.push(`  - Index ${i}: ${this.formatValue(this.expected[i])}`);
        diff.push(`  + Index ${i}: ${this.formatValue(this.actual[i])}`);
      }
    }
    
    return diff.length > 1 ? diff.join('\n') : 'No differences found';
  }
  
  generateObjectDiff() {
    const diff = ['Differences:'];
    const allKeys = new Set([...Object.keys(this.actual), ...Object.keys(this.expected)]);
    
    for (const key of allKeys) {
      if (!(key in this.actual)) {
        diff.push(`  - Missing key: "${key}": ${this.formatValue(this.expected[key])}`);
      } else if (!(key in this.expected)) {
        diff.push(`  + Extra key: "${key}": ${this.formatValue(this.actual[key])}`);
      } else if (this.actual[key] !== this.expected[key]) {
        diff.push(`  - "${key}": ${this.formatValue(this.expected[key])}`);
        diff.push(`  + "${key}": ${this.formatValue(this.actual[key])}`);
      }
    }
    
    return diff.length > 1 ? diff.join('\n') : 'No differences found';
  }
}

function getB(actual, expected) {
    //console.log("eq test " + actual + " " + typeof actual);
    return actual === expected;
}

// Matcher library with flexible phrase recognition
const MATCHERS = {
  // Equality matchers
  equality: {
    phrases: ['be', 'equal', 'be equal to', 'be exactly', 'equals', 'be equal', 'equal to'],
    test: (actual, expected) => getB(actual, expected),
    message: (actual, expected, negated) => {
      const actualType = typeof actual;
      const expectedType = typeof expected;
      return negated ? `${expected} not expected, but encountered`
                     : `${expected} (${expectedType}) expected, but ${actual} (${actualType}) encountered`;
    }
  },
  
  // Comparison matchers
  greaterThan: {
    phrases: ['be greater than', 'be more than', 'be higher than', 'exceed'],
    test: (actual, expected) => Number(actual) > Number(expected),
    message: (actual, expected, negated) =>
      negated ? `a number not greater than ${expected} expected, but ${actual} encountered`
              : `a number greater than ${expected} expected, but ${actual} encountered`
  },
  
  lessThan: {
    phrases: ['be less than', 'be fewer than', 'be lower than', 'be under'],
    test: (actual, expected) => Number(actual) < Number(expected),
    message: (actual, expected, negated) =>
      negated ? `a number not less than ${expected} expected, but ${actual} encountered`
              : `a number less than ${expected} expected, but ${actual} encountered`
  },
  
  greaterThanOrEqual: {
    phrases: ['be at least', 'be greater than or equal to', 'be >= ', 'be gte'],
    test: (actual, expected) => Number(actual) >= Number(expected),
    message: (actual, expected, negated) =>
      negated ? `a number not greater than or equal to ${expected} expected, but ${actual} encountered`
              : `a number greater than or equal to ${expected} expected, but ${actual} encountered`
  },
  
  lessThanOrEqual: {
    phrases: ['be at most', 'be less than or equal to', 'be <= ', 'be lte'],
    test: (actual, expected) => Number(actual) <= Number(expected),
    message: (actual, expected, negated) =>
      negated ? `a number not less than or equal to ${expected} expected, but ${actual} encountered`
              : `a number less than or equal to ${expected} expected, but ${actual} encountered`
  },
  
  // Contains/Includes matchers
  contain: {
    phrases: ['contain', 'include', 'have', 'contains', 'includes'],
    test: (actual, expected) => {
      if (typeof actual === 'string') return actual.includes(expected);
      if (Array.isArray(actual)) return actual.includes(expected);
      if (typeof actual === 'object' && actual !== null) {
        return Object.values(actual).includes(expected) || 
               Object.keys(actual).includes(expected);
      }
      return false;
    },
    message: (actual, expected, negated) =>
      negated ? `something that does not contain ${expected} expected, but ${actual} encountered`
              : `something that contains ${expected} expected, but ${actual} encountered`
  },

  haveAllOf: {
    phrases: ['have all of', 'contain all of'],
    test: (actual, expected) => {
      if (!Array.isArray(actual) || !Array.isArray(expected)) return false;
      return expected.every(item => actual.includes(item));
    },
    message: (actual, expected, negated) =>
      negated ? `an array not containing all of ${JSON.stringify(expected)} expected, but ${JSON.stringify(actual)} encountered`
              : `an array containing all of ${JSON.stringify(expected)} expected, but ${JSON.stringify(actual)} encountered`
  },

  haveAnyOf: {
    phrases: ['have any of', 'contain any of'],
    test: (actual, expected) => {
      if (!Array.isArray(actual) || !Array.isArray(expected)) return false;
      return expected.some(item => actual.includes(item));
    },
    message: (actual, expected, negated) =>
      negated ? `an array not containing any of ${JSON.stringify(expected)} expected, but ${JSON.stringify(actual)} encountered`
              : `an array containing any of ${JSON.stringify(expected)} expected, but ${JSON.stringify(actual)} encountered`
  },

  haveNoneOf: {
    phrases: ['have none of', 'contain none of'],
    test: (actual, expected) => {
      if (!Array.isArray(actual) || !Array.isArray(expected)) return false;
      return !expected.some(item => actual.includes(item));
    },
    message: (actual, expected, negated) =>
      negated ? `an array containing one of ${JSON.stringify(expected)} expected, but ${JSON.stringify(actual)} encountered`
              : `an array containing none of ${JSON.stringify(expected)} expected, but ${JSON.stringify(actual)} encountered`
  },

  haveProperty: {
    phrases: ['have property', 'have key'],
    test: (actual, expected) => {
      if (typeof actual !== 'object' || actual === null) return false;
      return Object.prototype.hasOwnProperty.call(actual, expected);
    },
    message: (actual, expected, negated) =>
      negated ? `an object without property "${expected}" expected, but encountered`
              : `an object with property "${expected}" expected, but encountered`
  },
  
  // String matchers
  startWith: {
    phrases: ['start with', 'begin with', 'starts with', 'begins with'],
    test: (actual, expected) => String(actual).startsWith(expected),
    message: (actual, expected, negated) =>
      negated ? `a string not starting with "${expected}" expected, but "${actual}" encountered`
              : `a string starting with "${expected}" expected, but "${actual}" encountered`
  },
  
  endWith: {
    phrases: ['end with', 'ends with', 'finish with', 'finishes with'],
    test: (actual, expected) => String(actual).endsWith(expected),
    message: (actual, expected, negated) =>
      negated ? `a string not ending with "${expected}" expected, but "${actual}" encountered`
              : `a string ending with "${expected}" expected, but "${actual}" encountered`
  },
  
  match: {
    phrases: ['match', 'matches'],
    test: (actual, expected) => {
      const regex = expected instanceof RegExp ? expected : new RegExp(expected);
      return regex.test(String(actual));
    },
    message: (actual, expected, negated) =>
      negated ? `a string not matching ${expected} expected, but "${actual}" encountered`
              : `a string matching ${expected} expected, but "${actual}" encountered`
  },

  beUppercase: {
    phrases: ['be uppercase', 'be in uppercase'],
    test: (actual) => typeof actual === 'string' && actual.length > 0 && actual === actual.toUpperCase(),
    message: (actual, expected, negated) =>
      negated ? `a non-uppercase string expected, but "${actual}" encountered`
              : `an uppercase string expected, but "${actual}" encountered`
  },

  beLowercase: {
    phrases: ['be lowercase', 'be in lowercase'],
    test: (actual) => typeof actual === 'string' && actual.length > 0 && actual === actual.toLowerCase(),
    message: (actual, expected, negated) =>
      negated ? `a non-lowercase string expected, but "${actual}" encountered`
              : `a lowercase string expected, but "${actual}" encountered`
  },

  haveWords: {
    phrases: ['have words', 'have number of words'],
    test: (actual, expected) => {
      if (typeof actual !== 'string') return false;
      if (actual.trim() === '') return Number(expected) === 0;
      return actual.trim().split(/\s+/).length === Number(expected);
    },
    message: (actual, expected, negated) => {
      const wordCount = (typeof actual === 'string' && actual.trim() !== '') ? actual.trim().split(/\s+/).length : 0;
      return negated ? `a string not having ${expected} words expected, but "${actual}" encountered`
                     : `a string with ${expected} words expected, but ${wordCount} encountered`
    }
  },
  
  // Type checking matchers
  beNumber: {
    phrases: ['be a number', 'be number', 'be numeric'],
    test: (actual) => typeof actual === 'number' && !isNaN(actual),
    message: (actual, expected, negated) =>
      negated ? `not a number expected, but ${typeof actual} encountered`
              : `a number expected, but ${typeof actual} encountered`
  },
  
  beString: {
    phrases: ['be a string', 'be string'],
    test: (actual) => typeof actual === 'string',
    message: (actual, expected, negated) =>
      negated ? `not a string expected, but ${typeof actual} encountered`
              : `a string expected, but ${typeof actual} encountered`
  },
  
  beArray: {
    phrases: ['be an array', 'be array'],
    test: (actual) => Array.isArray(actual),
    message: (actual, expected, negated) =>
      negated ? `not an array expected, but ${typeof actual} encountered`
              : `an array expected, but ${typeof actual} encountered`
  },
  
  beObject: {
    phrases: ['be an object', 'be object'],
    test: (actual) => typeof actual === 'object' && actual !== null && !Array.isArray(actual),
    message: (actual, expected, negated) =>
      negated ? `not an object expected, but ${typeof actual} encountered`
              : `an object expected, but ${typeof actual} encountered`
  },
  
  beFunction: {
    phrases: ['be a function', 'be function'],
    test: (actual) => typeof actual === 'function',
    message: (actual, expected, negated) =>
      negated ? `not a function expected, but ${typeof actual} encountered`
              : `a function expected, but ${typeof actual} encountered`
  },
  
  // Special value matchers
  beNull: {
    phrases: ['be null'],
    test: (actual) => actual === null,
    message: (actual, expected, negated) =>
      negated ? `not null expected, but null encountered`
              : `null expected, but ${actual} encountered`
  },
  
  beUndefined: {
    phrases: ['be undefined'],
    test: (actual) => actual === undefined,
    message: (actual, expected, negated) =>
      negated ? `not undefined expected, but undefined encountered`
              : `undefined expected, but ${actual} encountered`
  },
  
  beDefined: {
    phrases: ['be defined'],
    test: (actual) => actual !== undefined,
    message: (actual, expected, negated) =>
      negated ? `undefined expected, but was defined`
              : `a defined value expected, but was undefined`
  },
  
  beTruthy: {
    phrases: ['be truthy', 'be true'],
    test: (actual) => !!actual,
    message: (actual, expected, negated) =>
      negated ? `a falsy value expected, but was truthy`
              : `a truthy value expected, but was falsy`
  },
  
  beFalsy: {
    phrases: ['be falsy', 'be false'],
    test: (actual) => !actual,
    message: (actual, expected, negated) =>
      negated ? `a truthy value expected, but was falsy`
              : `a falsy value expected, but was truthy`
  },
  
  // Length/Size matchers
  haveLength: {
    phrases: ['have length', 'have size', 'have a length of', 'have a size of'],
    test: (actual, expected) => {
      const length = actual?.length ?? (typeof actual === 'object' ? Object.keys(actual).length : 0);
      return length === Number(expected);
    },
    message: (actual, expected, negated) => {
      const actualLength = actual?.length ?? (typeof actual === 'object' ? Object.keys(actual).length : 0);
      return negated ? `something not of length ${expected} expected, but it was`
                     : `something of length ${expected} expected, but length ${actualLength} encountered`
    }
  },
  
  beEmpty: {
    phrases: ['be empty'],
    test: (actual) => {
      if (typeof actual === 'string' || Array.isArray(actual)) return actual.length === 0;
      if (typeof actual === 'object' && actual !== null) return Object.keys(actual).length === 0;
      return false;
    },
    message: (actual, expected, negated) =>
      negated ? `a non-empty value expected, but an empty value was encountered`
              : `an empty value expected, but a non-empty value was encountered`
  },
  
  // Range matchers
  beBetween: {
    phrases: ['be between', 'be within range', 'be from'],
    test: (actual, min, max) => {
      const num = Number(actual);
      return num >= Number(min) && num <= Number(max);
    },
    message: (actual, min, max, negated) =>
      negated ? `a number not between ${min} and ${max} expected, but ${actual} encountered`
              : `a number between ${min} and ${max} expected, but ${actual} encountered`
  },

  beWithin: {
    phrases: ['be within'], // The parser handles the full phrase
    test: (actual, expected) => {
      const [tolerance, value] = expected;
      return Math.abs(actual - value) <= tolerance;
    },
    message: (actual, expected, negated) => {
      const [tolerance, value] = expected;
      return negated ? `a number not within ${tolerance} of ${value} expected, but ${actual} encountered`
                     : `a number within ${tolerance} of ${value} expected, but ${actual} encountered`
    }
  },
};

// Parser class for natural language expectations
class ExpectationParser {
  constructor() {
    // Updated regex to handle nested braces in JSON objects
    this.expectationPattern = /^{(.+?)}\s+should\s+(not\s+)?(.+)$/i;
  }
  
  parse(expectation) {
    const trimmed = expectation.trim();
    
    // Check if this follows the {variable} format or simplified REXX format
    if (trimmed.startsWith('{')) {
      return this.parseWithBraces(trimmed, expectation);
    } else {
      return this.parseWithoutBraces(trimmed, expectation);
    }
  }
  
  parseWithBraces(trimmed, expectation) {
    // Find the matching closing brace for the variable
    let braceCount = 0;
    let variableEnd = -1;
    
    for (let i = 0; i < trimmed.length; i++) {
      if (trimmed[i] === '{') braceCount++;
      else if (trimmed[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          variableEnd = i;
          break;
        }
      }
    }
    
    if (variableEnd === -1) {
      throw new Error(`Invalid expectation format: "${expectation}". Unmatched braces.`);
    }
    
    const variableName = trimmed.slice(1, variableEnd);
    const remainder = trimmed.slice(variableEnd + 1).trim();
    
    const shouldMatch = remainder.match(/^should\s+(not\s+)?(.+)$/i);
    if (!shouldMatch) {
      throw new Error(`Invalid expectation format: "${expectation}". Expected "should" after variable.`);
    }
    
    const negated = !!shouldMatch[1];
    const matcherAndExpected = shouldMatch[2].trim();
    
    const { matcher, expected } = this.parseMatcherAndExpected(matcherAndExpected);
    
    return {
      variableName,
      matcher,
      expected,
      negated,
      originalExpectation: expectation
    };
  }
  
  parseWithoutBraces(trimmed, expectation) {
    // For REXX ADDRESS context: parse "variable should [not] matcher expected"
    // Split on first occurrence of " should "
    const shouldIndex = trimmed.search(/\s+should\s+/i);
    if (shouldIndex === -1) {
      throw new Error(`Invalid expectation format: "${expectation}". Expected "should" keyword.`);
    }
    
    const variableName = trimmed.slice(0, shouldIndex).trim();
    const remainder = trimmed.slice(shouldIndex).trim();
    
    const shouldMatch = remainder.match(/^should\s+(not\s+)?(.+)$/i);
    if (!shouldMatch) {
      throw new Error(`Invalid expectation format: "${expectation}". Expected "should" after variable.`);
    }
    
    const negated = !!shouldMatch[1];
    const matcherAndExpected = shouldMatch[2].trim();
    
    const { matcher, expected } = this.parseMatcherAndExpected(matcherAndExpected);
    
    return {
      variableName,
      matcher,
      expected,
      negated,
      originalExpectation: expectation
    };
  }
  
  
  parseMatcherAndExpected(input) {
    // Handle special cases first
    if (input.toLowerCase().includes(' and ')) {
      return this.parseBetweenMatcher(input);
    }
    
    // Only route "be within X of Y" patterns to parseWithinMatcher
    if (input.toLowerCase().match(/^be within .+ of .+$/i)) {
      return this.parseWithinMatcher(input);
    }
    
    // Try to find matching matcher (collect all phrases and sort by length descending)
    const allPhrases = [];
    for (const [key, matcher] of Object.entries(MATCHERS)) {
      for (const phrase of matcher.phrases) {
        allPhrases.push({ key, matcher, phrase });
      }
    }
    // Sort by phrase length descending to match longer phrases first
    allPhrases.sort((a, b) => b.phrase.length - a.phrase.length);
    
    for (const {key, matcher, phrase} of allPhrases) {
      if (input.toLowerCase().startsWith(phrase.toLowerCase())) {
        let expected = input.slice(phrase.length).trim();
        
        // Handle cases where there's no expected value (like "be empty", "be null")
        if (!expected && ['beEmpty', 'beNull', 'beUndefined', 'beDefined', 'beTruthy', 'beFalsy', 'beUppercase', 'beLowercase'].includes(key)) {
          expected = null;
        }
        
        // Parse the expected value
        if (expected) {
          expected = this.parseValue(expected);
        }
        
        return {
          matcher: { key, def: matcher },
          expected
        };
      }
    }
    
    throw new Error(`Unknown matcher: "${input}". See https://rexxjs.org/testing/expectations/unknown-matcher/ for supported matchers.`);
  }
  
  parseBetweenMatcher(input) {
    const betweenMatch = input.match(/^be between (.+?) and (.+?)$/i);
    if (betweenMatch) {
      return {
        matcher: { key: 'beBetween', def: MATCHERS.beBetween },
        expected: [this.parseValue(betweenMatch[1]), this.parseValue(betweenMatch[2])]
      };
    }
    
    throw new Error(`Invalid between syntax: "${input}"`);
  }
  
  parseWithinMatcher(input) {
    const withinMatch = input.match(/^be within (.+?) of (.+?)$/i);
    if (withinMatch) {
      return {
        matcher: { key: 'beWithin', def: MATCHERS.beWithin },
        expected: [this.parseValue(withinMatch[1]), this.parseValue(withinMatch[2])]
      };
    }
    
    throw new Error(`Invalid within syntax: "${input}"`);
  }
  
  parseValue(valueStr) {
    const trimmed = valueStr.trim();
    
    // Handle quoted strings
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }
    
    // Handle arrays
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        return JSON.parse(trimmed);
      } catch (e) {
        throw new Error(`Invalid array syntax: "${trimmed}"`);
      }
    }
    
    // Handle objects
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        return JSON.parse(trimmed);
      } catch (e) {
        throw new Error(`Invalid object syntax: "${trimmed}"`);
      }
    }
    
    // Handle regex
    if (trimmed.startsWith('/') && trimmed.lastIndexOf('/') > 0) {
      const lastSlash = trimmed.lastIndexOf('/');
      const pattern = trimmed.slice(1, lastSlash);
      const flags = trimmed.slice(lastSlash + 1);
      return new RegExp(pattern, flags);
    }
    
    // Handle numbers
    if (!isNaN(trimmed) && !isNaN(parseFloat(trimmed))) {
      return parseFloat(trimmed);
    }
    
    // Handle booleans
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;
    if (trimmed.toLowerCase() === 'null') return null;
    if (trimmed.toLowerCase() === 'undefined') return undefined;
    
    // Return as string
    return trimmed;
  }
  
  resolveValue(expression, context) {
    // Handle literal values in braces
    if (expression.includes('{') && expression.includes('}')) {
      // Extract the content inside braces
      const braceMatch = expression.match(/^{(.+)}$/);
      if (braceMatch) {
        expression = braceMatch[1];
      }
    }
    
    // Try to parse as literal JSON first
    if (expression.startsWith('[') || expression.startsWith('{') || 
        expression.startsWith('"') || expression.startsWith("'")) {
      try {
        return this.parseValue(expression);
      } catch (e) {
        // Fall through to context resolution
      }
    }
    
    // Handle numbers and simple literals
    if (!isNaN(expression) && !isNaN(parseFloat(expression))) {
      return parseFloat(expression);
    }
    if (expression === 'true') return true;
    if (expression === 'false') return false;
    if (expression === 'null') return null;
    if (expression === 'undefined') return undefined;
    
    // Resolve from context
    const result = this.resolveFromContext(expression, context);
    
    // If result is undefined, provide helpful message about unsupported expressions
    if (result === undefined && /[+\-*/()%]|\w+\s*\(/.test(expression)) {
      throw new Error(`Complex expressions like "${expression}" are not supported in expectations. Use simple variable names, property access (obj.prop), or literal values instead.`);
    }
    
    return result;
  }
  
  resolveFromContext(path, context) {
    if (!context || typeof context !== 'object') {
      // If no context and path looks like a simple value, try to parse it
      if (typeof path === 'string' && !path.includes('.')) {
        try {
          return this.parseValue(path);
        } catch (e) {
          return path; // Return as string literal
        }
      }
      return undefined;
    }
    
    const keys = path.split('.');
    let value = context;
    
    for (const key of keys) {
      if (value == null) return undefined;
      // global var lookup here
      value = value[key];
    }
    
    return value;
  }
}

// Create a contained expectations engine to avoid any global scope issues
const ExpectationsEngine = {
  executeExpectation(expression, context = {}, sourceContext = null) {
    const parser = new ExpectationParser();
    
    try {
      const parsed = parser.parse(expression);
      const actual = parser.resolveValue(parsed.variableName, context);
      
      let testResult;
      let expected = parsed.expected;
      
      // Handle special cases for matchers that need multiple arguments
      if (parsed.matcher.key === 'beBetween') {
        testResult = parsed.matcher.def.test(actual, expected[0], expected[1]);
      } else if (parsed.matcher.key === 'beWithin') {
        testResult = parsed.matcher.def.test(actual, expected);
      } else {
        testResult = parsed.matcher.def.test(actual, expected);
      }
      
      const shouldPass = parsed.negated ? !testResult : testResult;
      
      if (!shouldPass) {
        let message;
        if (parsed.matcher.key === 'beBetween') {
          message = parsed.matcher.def.message(actual, expected[0], expected[1], parsed.negated);
        } else {
          message = parsed.matcher.def.message(actual, expected, parsed.negated);
        }
        
        throw new ExpectationError(
          message,
          actual,
          expected,
          parsed.matcher.key,
          parsed.negated,
          parsed.originalExpectation,
          sourceContext
        );
      }
      
      // Count this successful expectation execution for rexxt
      this.incrementExpectationCount();
      
      // Helper function to format values for display
      const formatValue = (value) => {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (typeof value === 'string') return `"${value}"`;
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      };
      
      // Get detailed expectation info for success messages
      const expectationInfo = `"${expression}" → and was`;
      
      // Check if we should show passing expectations (only if flag is set)
      let shouldShowPassing = false;
      if (sourceContext && sourceContext.interpreter && sourceContext.interpreter.testOptions) {
        shouldShowPassing = sourceContext.interpreter.testOptions.showPassingExpectations;
      }
      
      // Only output success message if flag is set
      if (shouldShowPassing) {
        console.log(`  ✓ ${expectationInfo}`);
      }
      
      return {
        success: true,
        message: shouldShowPassing ? `Expectation passed: ${expectationInfo}` : '',
        actual,
        expected,
        matcher: parsed.matcher.key,
        negated: parsed.negated,
        expectationText: expression
      };
      
    } catch (error) {
      if (error instanceof ExpectationError) {
        throw error;
      }
      
      // Wrap parsing errors
      throw new Error(`Expectation parsing failed: ${error.message}`);
    }
  },

  // Execute multi-line expectations (from HEREDOC or multi-line ADDRESS EXPECTATIONS)
  executeMultiLineExpectations(multiLineExpectations, context = {}, sourceContext = null) {
    const lines = multiLineExpectations.split('\n');
    const results = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('/*') || trimmedLine.startsWith('//')) {
        continue;
      }
      
      // Process each line that contains "should" as a separate expectation
      if (trimmedLine.includes('should')) {
        try {
          // Note: executeExpectation already calls incrementExpectationCount
          const result = this.executeExpectation(trimmedLine, context, sourceContext);
          results.push(result);
        } catch (error) {
          // Re-throw the first error to maintain failure semantics
          throw error;
        }
      }
    }
    
    // Don't increment counter here - each executeExpectation call already did
    
    // Return a summary result
    return {
      success: true,
      message: `${results.length} expectations completed`,
      results: results,
      count: results.length
    };
  },

  // Execute expectations with MATCHING pattern for filtering lines
  executeMatchingPatternExpectations(multiLineInput, matchingPattern, context = {}, sourceContext = null) {
    const lines = multiLineInput.split('\n');
    const results = [];
    
    // Create regex from the pattern
    let regex;
    try {
      regex = new RegExp(matchingPattern);
    } catch (error) {
      throw new Error(`Invalid regex pattern "${matchingPattern}": ${error.message}`);
    }
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('/*') || trimmedLine.startsWith('//')) {
        continue;
      }
      
      // Apply the regex pattern to filter lines
      if (regex.test(line)) {
        // Extract expectation content (remove the matched prefix)
        const match = regex.exec(line);
        let expectationLine = line;
        
        // If the pattern has capture groups, use the first capture group as the expectation
        if (match && match.length > 1) {
          expectationLine = match[1];
        } else {
          // Otherwise, remove the matched portion and trim
          expectationLine = line.replace(regex, '').trim();
        }
        
        // Process the line if it contains "should" as a separate expectation
        if (expectationLine.includes('should')) {
          try {
            // Note: executeExpectation already calls incrementExpectationCount
            const result = this.executeExpectation(expectationLine, context, sourceContext);
            results.push(result);
          } catch (error) {
            // Re-throw the first error to maintain failure semantics
            throw error;
          }
        }
      }
    }
    
    // Return a summary result
    return {
      success: true,
      message: `${results.length} expectations completed with pattern matching`,
      results: results,
      count: results.length,
      pattern: matchingPattern
    };
  },

  // Increment expectation counter for rexxt test runner
  incrementExpectationCount() {
    if (typeof require !== 'undefined') {
      // Node.js environment only (not browser)
      const fs = require('fs');
      const path = require('path');
      
      try {
        const counterFile = path.join(process.cwd(), '.rexxt-expectations-count.tmp');
        let count = 0;
        
        // Read existing count if file exists
        if (fs.existsSync(counterFile)) {
          const content = fs.readFileSync(counterFile, 'utf8').trim();
          count = parseInt(content) || 0;
        }
        
        // Increment and write back
        count++;
        fs.writeFileSync(counterFile, count.toString());
      } catch (error) {
        // Silently ignore file errors - counting is optional
      }
    }
  }
};

// ADDRESS target metadata function
function EXPECTATIONS_ADDRESS_META() {
  return {
    type: 'address-target',
    name: 'Plain English Expectations Service',
    version: '1.0.0',
    description: 'Natural language expectation DSL for testing and validation',
    provides: {
      addressTarget: 'expectations',
      commandSupport: true,
      methodSupport: true
    },
    dependencies: {},
    loaded: true,
    requirements: {
      environment: 'universal'
    }
  };
}

// ADDRESS target handler function
function ADDRESS_EXPECTATIONS_HANDLER(commandOrMethod, params = {}, sourceContext = null) {
  try {
    // Handle method-call style first (when params are provided or known method names)
    if (params && (params.expression || params.expectation || params.context)) {
      // Definitely method-call style
      const result = ExpectationsEngine.executeExpectation(params.expression || params.expectation, params.context || {}, sourceContext);
      
      // Check if we should show passing expectations (only if flag is set)
      let shouldShowPassing = false;
      if (sourceContext && sourceContext.interpreter && sourceContext.interpreter.testOptions) {
        shouldShowPassing = sourceContext.interpreter.testOptions.showPassingExpectations;
      }
      
      return Promise.resolve({
        operation: 'EXPECTATION',
        success: true,
        result: result,
        message: shouldShowPassing ? `Expectation passed: ${result.message || 'method call'}` : '',
        timestamp: new Date().toISOString()
      });
    }
    
    // Handle known method names  
    let resultPromise;
    switch (commandOrMethod.toLowerCase()) {
      case 'test_count':
        // Special command to increment test counter
        incrementTestCounter();
        return Promise.resolve({
          operation: 'TEST_COUNT',
          success: true,
          result: null,
          message: 'Test counted',
          timestamp: new Date().toISOString()
        });
      case 'expect':
      case 'test':
      case 'check':
        resultPromise = Promise.resolve(ExpectationsEngine.executeExpectation(params.expression || params.expectation, params.context || {}, sourceContext));
        break;
        
      case 'execute':
        // Handle REXX ADDRESS calls that get parsed as method calls
        if (params && params.command) {
          resultPromise = Promise.resolve(ExpectationsEngine.executeExpectation(params.command, {}, sourceContext));
        } else {
          throw new Error('execute method requires command parameter');
        }
        break;
        
      case 'status':
        resultPromise = Promise.resolve({
          service: 'expectations',
          version: '1.0.0',
          available: true,
          methods: ['expect', 'test', 'check', 'status'],
          matchers: Object.keys(MATCHERS),
          timestamp: new Date().toISOString(),
          success: true
        });
        break;
        
      default:
        // Try to interpret as command-string style expectation
        if (typeof commandOrMethod === 'string' && commandOrMethod.includes('should')) {
          // Handle multi-line expectations (from HEREDOC or multi-line ADDRESS EXPECTATIONS)
          if (commandOrMethod.includes('\n')) {
            resultPromise = Promise.resolve(ExpectationsEngine.executeMultiLineExpectations(commandOrMethod, params, sourceContext));
          } else {
            // Single-line expectation
            resultPromise = Promise.resolve(ExpectationsEngine.executeExpectation(commandOrMethod, params, sourceContext));
          }
        } else if (typeof commandOrMethod === 'string' && params && params._addressMatchingPattern) {
          // Handle MATCHING pattern for multi-line expectations
          resultPromise = Promise.resolve(ExpectationsEngine.executeMatchingPatternExpectations(commandOrMethod, params._addressMatchingPattern, params, sourceContext));
        } else {
          throw new Error(`Unknown method or invalid expectation: "${commandOrMethod}"`);
        }
        break;
    }
    
    return resultPromise.then(result => {
      // Check if we should show passing expectations (only if flag is set)
      let shouldShowPassing = false;
      if (sourceContext && sourceContext.interpreter && sourceContext.interpreter.testOptions) {
        shouldShowPassing = sourceContext.interpreter.testOptions.showPassingExpectations;
      }
      
      return {
        operation: 'EXPECTATION',
        success: true,
        result: result,
        message: result.message,
        timestamp: new Date().toISOString()
      };
    }).catch(error => {
      return {
        operation: 'EXPECTATION',
        success: false,
        error: error.message,
        errorType: error.name,
        actual: error.actual,
        expected: error.expected,
        matcher: error.matcher,
        negated: error.negated,
        originalExpectation: error.originalExpectation,
        message: `Expectation failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    });
    
  } catch (error) {
    // In REXX ADDRESS context, expectation failures should terminate script execution
    // We detect REXX context by checking:
    // 1. params is null or an object with variables (direct ADDRESS command call)
    // 2. methodOrCommand is 'execute' with command parameter (parsed ADDRESS call)
    const isRexxAddressCall = (params === null || (params && typeof params === 'object' && !params.expression && !params.expectation)) ||
                              (commandOrMethod && commandOrMethod.toLowerCase() === 'execute' && params && params.command);
    
    if (isRexxAddressCall && error.name === 'ExpectationError') {
      // In REXX, ADDRESS failures should set return codes but not terminate execution
      // Return error information that the interpreter can use to set RC
      // For CLI execution, we want to terminate the script.
      // Throwing the error will allow the top-level catch in cli.js to handle it.
      error.message = `EXPECTATIONS.execute: ${error.message}`;
      throw error;
    }
    
    // For other contexts (API calls), return error object
    return Promise.resolve({
      operation: 'EXPECTATION',
      success: false,
      error: error.message,
      errorType: error.name,
      actual: error.actual,
      expected: error.expected,
      matcher: error.matcher,
      negated: error.negated,
      originalExpectation: error.originalExpectation,
      message: `Handler error: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
}

// METHOD definitions for RexxJS integration
const ADDRESS_EXPECTATIONS_METHODS = {
  expect: {
    description: "Execute plain English expectation",
    params: ["expression", "context"],
    returns: "expectation result"
  },
  test: {
    description: "Alias for expect",
    params: ["expression", "context"], 
    returns: "expectation result"
  },
  check: {
    description: "Alias for expect",
    params: ["expression", "context"],
    returns: "expectation result"
  },
  status: {
    description: "Get expectation service status",
    params: [],
    returns: "service information"
  }
};

// Export for global scope (only what REXX interpreter needs)
// The expect function should NOT be global - it's used internally by ADDRESS_EXPECTATIONS_HANDLER

if (typeof window !== 'undefined') {
  // Browser environment
  window.EXPECTATIONS_ADDRESS_META = EXPECTATIONS_ADDRESS_META;
  window.ADDRESS_EXPECTATIONS_HANDLER = ADDRESS_EXPECTATIONS_HANDLER;
  window.ADDRESS_EXPECTATIONS_METHODS = ADDRESS_EXPECTATIONS_METHODS;
  window.ExpectationError = ExpectationError;
} else if (typeof global !== 'undefined') {
  // Node.js environment  
  global.EXPECTATIONS_ADDRESS_META = EXPECTATIONS_ADDRESS_META;
  global.ADDRESS_EXPECTATIONS_HANDLER = ADDRESS_EXPECTATIONS_HANDLER;
  global.ADDRESS_EXPECTATIONS_METHODS = ADDRESS_EXPECTATIONS_METHODS;
  global.ExpectationError = ExpectationError;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ExpectationError,
    EXPECTATIONS_ADDRESS_META,
    ADDRESS_EXPECTATIONS_HANDLER,
    ADDRESS_EXPECTATIONS_METHODS
  };
}