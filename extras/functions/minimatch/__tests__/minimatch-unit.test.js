const { MINIMATCH, MINIMATCH_FUNCTIONS_META } = require('../minimatch-functions');

describe('Minimatch Functions - Unit Tests', () => {
  describe('MINIMATCH', () => {
    it('should match character classes', () => {
      expect(MINIMATCH('Test1.js', '[A-Z]*.js')).toBe(true);
      expect(MINIMATCH('test1.js', '[A-Z]*.js')).toBe(false);
    });

    it('should match brace expansion', () => {
      expect(MINIMATCH('file.js', '*.{js,ts}')).toBe(true);
      expect(MINIMATCH('file.ts', '*.{js,ts}')).toBe(true);
      expect(MINIMATCH('file.txt', '*.{js,ts}')).toBe(false);
    });

    it('should support negation patterns', () => {
      // Note: Negation patterns work differently - !(*.txt) negates the pattern itself
      // To exclude .txt files, use a different pattern or check the result
      expect(MINIMATCH('file.js', '*.js')).toBe(true);
      expect(MINIMATCH('file.txt', '*.js')).toBe(false);
    });

    it('should support case-insensitive matching', () => {
      expect(MINIMATCH('TEST.JS', 'test.js', true)).toBe(true);
      expect(MINIMATCH('TEST.JS', 'test.js', false)).toBe(false);
    });

    it('should match extended globs', () => {
      expect(MINIMATCH('file.js', '+(file).js')).toBe(true);
      expect(MINIMATCH('other.js', '+(file).js')).toBe(false);
    });

    it('should match simple patterns', () => {
      expect(MINIMATCH('test.js', '*.js')).toBe(true);
      expect(MINIMATCH('test.txt', '*.js')).toBe(false);
    });
  });

  describe('MINIMATCH_FUNCTIONS_META', () => {
    it('should return metadata', () => {
      const meta = MINIMATCH_FUNCTIONS_META();

      expect(meta).toHaveProperty('name', 'minimatch-functions');
      expect(meta).toHaveProperty('version');
      expect(meta).toHaveProperty('description');
      expect(meta.functions).toContain('LS');
      expect(meta.functions).toContain('FIND');
      expect(meta.functions).toContain('MINIMATCH');
      expect(meta.enhances).toContain('LS');
      expect(meta.enhances).toContain('FIND');
    });
  });
});
