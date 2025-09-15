/**
 * Interpolation Config Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const {
  INTERPOLATION_PATTERNS,
  getCurrentPattern,
  setInterpolationPattern,
  resetToDefault,
  getAvailablePatterns,
  createCustomPattern
} = require('../src/interpolation-config');

describe('Interpolation Configuration', () => {
  beforeEach(() => {
    // Reset to default pattern before each test
    resetToDefault();
  });

  describe('Pattern Management', () => {
    test('should start with default RexxJS pattern', () => {
      const pattern = getCurrentPattern();
      expect(pattern.name).toBe('rexx');
      expect(pattern.startDelim).toBe('{');
      expect(pattern.endDelim).toBe('}');
    });

    test('should switch to handlebars pattern', () => {
      const pattern = setInterpolationPattern('handlebars');
      expect(pattern.name).toBe('handlebars');
      expect(pattern.startDelim).toBe('{{');
      expect(pattern.endDelim).toBe('}}');
      expect(getCurrentPattern()).toBe(pattern);
    });

    test('should switch to shell pattern', () => {
      const pattern = setInterpolationPattern('shell');
      expect(pattern.name).toBe('shell');
      expect(pattern.startDelim).toBe('${');
      expect(pattern.endDelim).toBe('}');
    });

    test('should switch to batch pattern', () => {
      const pattern = setInterpolationPattern('batch');
      expect(pattern.name).toBe('batch');
      expect(pattern.startDelim).toBe('%');
      expect(pattern.endDelim).toBe('%');
    });

    test('should switch to custom pattern', () => {
      const pattern = setInterpolationPattern('custom');
      expect(pattern.name).toBe('custom');
      expect(pattern.startDelim).toBe('$$');
      expect(pattern.endDelim).toBe('$$');
    });

    test('should switch to brackets pattern', () => {
      const pattern = setInterpolationPattern('brackets');
      expect(pattern.name).toBe('brackets');
      expect(pattern.startDelim).toBe('[');
      expect(pattern.endDelim).toBe(']');
    });

    test('should throw error for unknown pattern', () => {
      expect(() => {
        setInterpolationPattern('unknown');
      }).toThrow('Unknown interpolation pattern: unknown');
    });

    test('should reset to default', () => {
      setInterpolationPattern('handlebars');
      const resetPattern = resetToDefault();
      expect(resetPattern.name).toBe('rexx');
      expect(getCurrentPattern().name).toBe('rexx');
    });

    test('should return all available patterns', () => {
      const patterns = getAvailablePatterns();
      expect(patterns).toHaveProperty('rexx');
      expect(patterns).toHaveProperty('handlebars');
      expect(patterns).toHaveProperty('shell');
      expect(patterns).toHaveProperty('batch');
      expect(patterns).toHaveProperty('custom');
      expect(patterns).toHaveProperty('brackets');
    });
  });

  describe('Custom Pattern Creation', () => {
    test('should create custom pattern with simple delimiters', () => {
      const pattern = createCustomPattern('test', '<', '>');
      expect(pattern.name).toBe('test');
      expect(pattern.startDelim).toBe('<');
      expect(pattern.endDelim).toBe('>');
      expect(pattern.hasDelims('Hello <name>')).toBe(true);
      expect(pattern.hasDelims('Hello world')).toBe(false);
      expect(pattern.extractVar('<name>')).toBe('name');
    });

    test('should create custom pattern with complex delimiters', () => {
      const pattern = createCustomPattern('complex', '@@', '@@');
      expect(pattern.startDelim).toBe('@@');
      expect(pattern.endDelim).toBe('@@');
      expect(pattern.hasDelims('Hello @@name@@')).toBe(true);
      expect(pattern.extractVar('@@name@@')).toBe('name');
    });

    test('should handle regex special characters in delimiters', () => {
      const pattern = createCustomPattern('special', '{{', '}}');
      expect(pattern.startDelim).toBe('{{');
      expect(pattern.endDelim).toBe('}}');
      expect(pattern.hasDelims('Hello {{name}}')).toBe(true);
      expect(pattern.extractVar('{{name}}')).toBe('name');
    });
  });

  describe('Custom Pattern Object', () => {
    test('should accept valid custom pattern object', () => {
      const customPattern = {
        name: 'mypattern',
        regex: /#\{([^}]+)\}/g,
        startDelim: '#{',
        endDelim: '}',
        hasDelims: (str) => str.includes('#{'),
        extractVar: (match) => match.slice(2, -1)
      };

      const result = setInterpolationPattern(customPattern);
      expect(result.name).toBe('mypattern');
      expect(result.startDelim).toBe('#{');
      expect(getCurrentPattern()).toBe(result);
    });

    test('should throw error for invalid custom pattern object', () => {
      const invalidPattern = {
        name: 'invalid',
        regex: /#\{([^}]+)\}/g
        // missing required properties
      };

      expect(() => {
        setInterpolationPattern(invalidPattern);
      }).toThrow('Custom pattern missing required property');
    });

    test('should throw error for invalid pattern type', () => {
      expect(() => {
        setInterpolationPattern(123);
      }).toThrow('Pattern must be a string name or pattern object');
    });
  });

  describe('Pattern Functionality Tests', () => {
    test('should correctly identify delimiters for each pattern', () => {
      const testCases = [
        { pattern: 'rexx', text: 'Hello {name}', hasDelims: true },
        { pattern: 'rexx', text: 'Hello world', hasDelims: false },
        { pattern: 'handlebars', text: 'Hello {{name}}', hasDelims: true },
        { pattern: 'handlebars', text: 'Hello {name}', hasDelims: false },
        { pattern: 'shell', text: 'Hello ${name}', hasDelims: true },
        { pattern: 'shell', text: 'Hello $name', hasDelims: false },
        { pattern: 'batch', text: 'Hello %name%', hasDelims: true },
        { pattern: 'batch', text: 'Hello name', hasDelims: false },
        { pattern: 'custom', text: 'Hello $$name$$', hasDelims: true },
        { pattern: 'custom', text: 'Hello $name$', hasDelims: false },
        { pattern: 'brackets', text: 'Hello [name]', hasDelims: true },
        { pattern: 'brackets', text: 'Hello (name)', hasDelims: false }
      ];

      testCases.forEach(({ pattern: patternName, text, hasDelims }) => {
        const pattern = INTERPOLATION_PATTERNS[patternName];
        expect(pattern.hasDelims(text)).toBe(hasDelims);
      });
    });

    test('should correctly extract variables for each pattern', () => {
      const testCases = [
        { pattern: 'rexx', match: '{username}', expected: 'username' },
        { pattern: 'handlebars', match: '{{username}}', expected: 'username' },
        { pattern: 'shell', match: '${username}', expected: 'username' },
        { pattern: 'batch', match: '%username%', expected: 'username' },
        { pattern: 'custom', match: '$$username$$', expected: 'username' },
        { pattern: 'brackets', match: '[username]', expected: 'username' }
      ];

      testCases.forEach(({ pattern: patternName, match, expected }) => {
        const pattern = INTERPOLATION_PATTERNS[patternName];
        expect(pattern.extractVar(match)).toBe(expected);
      });
    });

    test('should correctly match regex patterns', () => {
      const testCases = [
        { pattern: 'rexx', text: 'Hello {first} and {second}', expectedMatches: ['{first}', '{second}'] },
        { pattern: 'handlebars', text: 'Hello {{first}} and {{second}}', expectedMatches: ['{{first}}', '{{second}}'] },
        { pattern: 'shell', text: 'Hello ${first} and ${second}', expectedMatches: ['${first}', '${second}'] },
        { pattern: 'batch', text: 'Hello %first% and %second%', expectedMatches: ['%first%', '%second%'] },
        { pattern: 'custom', text: 'Hello $$first$$ and $$second$$', expectedMatches: ['$$first$$', '$$second$$'] },
        { pattern: 'brackets', text: 'Hello [first] and [second]', expectedMatches: ['[first]', '[second]'] }
      ];

      testCases.forEach(({ pattern: patternName, text, expectedMatches }) => {
        const pattern = INTERPOLATION_PATTERNS[patternName];
        const matches = text.match(pattern.regex);
        expect(matches).toEqual(expectedMatches);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle nested delimiters correctly', () => {
      // RexxJS pattern should properly match balanced nested braces
      const rexxPattern = INTERPOLATION_PATTERNS.rexx;
      const text = 'Hello {user.{nested}}';
      const matches = text.match(rexxPattern.regex);
      expect(matches).toEqual(['{user.{nested}}']);
      expect(rexxPattern.extractVar(matches[0])).toBe('user.{nested}');
    });

    test('should handle empty variable names', () => {
      const pattern = INTERPOLATION_PATTERNS.rexx;
      const text = 'Hello {} world';
      const matches = text.match(pattern.regex);
      expect(matches).toEqual(['{}']);
      expect(pattern.extractVar(matches[0])).toBe('');
    });

    test('should handle complex variable names', () => {
      const pattern = INTERPOLATION_PATTERNS.rexx;
      const testCases = [
        { match: '{user.name}', expected: 'user.name' },
        { match: '{user_id}', expected: 'user_id' },
        { match: '{is_admin}', expected: 'is_admin' },
        { match: '{data[0]}', expected: 'data[0]' },
        { match: '{config.api.url}', expected: 'config.api.url' }
      ];

      testCases.forEach(({ match, expected }) => {
        expect(pattern.extractVar(match)).toBe(expected);
      });
    });

    test('should handle multiple occurrences of same variable', () => {
      const pattern = INTERPOLATION_PATTERNS.handlebars;
      const text = 'Hello {{name}}, welcome back {{name}}!';
      const matches = text.match(pattern.regex);
      expect(matches).toEqual(['{{name}}', '{{name}}']);
      expect(matches.map(m => pattern.extractVar(m))).toEqual(['name', 'name']);
    });
  });
});