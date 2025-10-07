const { Interpreter } = require('../../../../core/src/interpreter');
const { parse } = require('../../../../core/src/parser');
const path = require('path');

describe('Diff Functions (@extras)', () => {
  let interpreter;

  beforeEach(async () => {
    interpreter = new Interpreter();
    // Load diff functions module using absolute path
    const diffFunctionsPath = path.join(__dirname, '../src/diff-functions.js');
    await interpreter.run(parse(`REQUIRE "${diffFunctionsPath}"`));
  });

  describe('DIFF', () => {
    it('should return unified diff format by default', async () => {
      const script = `
        LET old = "line1\\nline2\\nline3"
        LET new = "line1\\nline2 modified\\nline3"
        LET result = DIFF(text1=old, text2=new)
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(typeof result).toBe('string');
      expect(result).toContain('---');
      expect(result).toContain('+++');
      expect(result).toContain('-line2');
      expect(result).toContain('+line2 modified');
    });

    it('should return line diff format', async () => {
      const script = `
        LET old = "line1\\nline2\\nline3"
        LET new = "line1\\nline2 modified\\nline3"
        LET result = DIFF(text1=old, text2=new, format="lines")
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(Array.isArray(result)).toBe(true);
      expect(result.some(part => part.value && part.value.includes('line2 modified'))).toBe(true);
    });

    it('should return word diff format', async () => {
      const script = `
        LET old = "hello world"
        LET new = "hello earth"
        LET result = DIFF(text1=old, text2=new, format="words")
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(Array.isArray(result)).toBe(true);
      const removed = result.find(part => part.removed);
      const added = result.find(part => part.added);
      expect(removed.value).toContain('world');
      expect(added.value).toContain('earth');
    });

    it('should return character diff format', async () => {
      const script = `
        LET old = "hello"
        LET new = "hallo"
        LET result = DIFF(text1=old, text2=new, format="chars")
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(Array.isArray(result)).toBe(true);
      const removed = result.find(part => part.removed);
      const added = result.find(part => part.added);
      expect(removed.value).toBe('e');
      expect(added.value).toBe('a');
    });

    it('should return JSON format', async () => {
      const script = `
        LET old = "line1\\nline2"
        LET new = "line1\\nline3"
        LET result = DIFF(text1=old, text2=new, format="json")
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('added');
      expect(result[0]).toHaveProperty('removed');
      expect(result[0]).toHaveProperty('value');
    });

    it('should return summary format', async () => {
      const script = `
        LET old = "line1\\nline2\\nline3"
        LET new = "line1\\nline2 modified\\nline3\\nline4"
        LET result = DIFF(text1=old, text2=new, format="summary")
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toHaveProperty('added');
      expect(result).toHaveProperty('removed');
      expect(result).toHaveProperty('unchanged');
      expect(result).toHaveProperty('total');
      expect(result.added).toBeGreaterThan(0);
      expect(result.removed).toBeGreaterThan(0);
    });

    it('should handle array inputs', async () => {
      const script = `
        LET old = ["line1", "line2", "line3"]
        LET new = ["line1", "line2 modified", "line3"]
        LET result = DIFF(text1=old, text2=new, format="lines")
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(Array.isArray(result)).toBe(true);
      expect(result.some(part => part.value && part.value.includes('line2 modified'))).toBe(true);
    });

    it('should support custom filenames in patch', async () => {
      const script = `
        LET old = "hello"
        LET new = "world"
        LET result = DIFF(text1=old, text2=new, format="patch", filename1="old.txt", filename2="new.txt")
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toContain('old.txt');
      expect(result).toContain('new.txt');
    });
  });

  describe('DIFF_APPLY', () => {
    it('should apply a unified diff patch', async () => {
      const script = `
        LET original = "line1\\nline2\\nline3"
        LET modified = "line1\\nline2 changed\\nline3"
        LET patch = DIFF(text1=original, text2=modified, format="patch")
        LET result = DIFF_APPLY(text=original, patch=patch)
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toContain('line2 changed');
      expect(result).toContain('line1');
      expect(result).toContain('line3');
    });

    it('should throw error for invalid patch', async () => {
      const script = `
        LET result = DIFF_APPLY(text="hello", patch="invalid patch")
      `;
      await expect(interpreter.run(parse(script))).rejects.toThrow();
    });
  });

  describe('DIFF_PATCH', () => {
    it('should create structured patch object', async () => {
      const script = `
        LET old = "line1\\nline2\\nline3"
        LET new = "line1\\nline2 modified\\nline3"
        LET result = DIFF_PATCH(text1=old, text2=new)
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('hunks');
      expect(Array.isArray(result.hunks)).toBe(true);
    });

    it('should support custom filenames', async () => {
      const script = `
        LET old = "hello"
        LET new = "world"
        LET result = DIFF_PATCH(text1=old, text2=new, filename1="a.txt", filename2="b.txt")
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result.oldFileName).toBe('a.txt');
      expect(result.newFileName).toBe('b.txt');
    });
  });
});
