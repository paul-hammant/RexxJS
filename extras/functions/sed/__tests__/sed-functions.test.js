const { Interpreter } = require('../../../../core/src/interpreter');
const { parse } = require('../../../../core/src/parser');
const path = require('path');

describe('Sed Functions (@extras)', () => {
  let interpreter;

  beforeEach(async () => {
    interpreter = new Interpreter();
    // Load sed functions module using absolute path
    const sedFunctionsPath = path.join(__dirname, '../src/sed-functions.js');
    await interpreter.run(parse(`REQUIRE "${sedFunctionsPath}"`));
  });

  describe('SED - Basic Substitution', () => {
    it('should perform simple substitution', async () => {
      const script = `
        LET result = SED(input="hello world", commands="s/world/universe/")
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toBe('hello universe');
    });

    it('should perform global substitution', async () => {
      const script = `
        LET result = SED(input="foo foo foo", commands="s/foo/bar/g")
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toBe('bar bar bar');
    });

    it('should handle multiline text', async () => {
      const script = `
        LET input = "line1\\nline2\\nline3"
        LET result = SED(input=input, commands="s/line/LINE/")
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toBe('LINE1\nLINE2\nLINE3');
    });

    it('should handle array input', async () => {
      const script = `
        LET input = ["hello world", "goodbye world"]
        LET result = SED(input=input, commands="s/world/universe/")
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(['hello universe', 'goodbye universe']);
    });

    it('should handle alternative delimiters', async () => {
      const script = `
        LET result = SED(input="path/to/file", commands="s#/#-#g")
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toBe('path-to-file');
    });
  });

  describe('SED - Multiple Commands', () => {
    it('should apply multiple commands in sequence', async () => {
      const script = `
        LET commands = ["s/hello/hi/", "s/world/there/"]
        LET result = SED(input="hello world", commands=commands)
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toBe('hi there');
    });

    it('should chain transformations correctly', async () => {
      const script = `
        LET commands = ["s/a/b/", "s/b/c/", "s/c/d/"]
        LET result = SED(input="a", commands=commands)
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toBe('d');
    });
  });

  describe('SED - Regex Features', () => {
    it('should support regex patterns', async () => {
      const script = `
        LET result = SED(input="test123", commands="s/[0-9]+/XXX/")
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toBe('testXXX');
    });

    it('should support capture groups', async () => {
      const script = `
        LET result = SED(input="John Doe", commands="s/(\\\\w+) (\\\\w+)/$2, $1/")
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toBe('Doe, John');
    });

    it('should handle special characters', async () => {
      const script = `
        LET result = SED(input="a.b.c", commands="s/\\\\./:/g")
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toBe('a:b:c');
    });
  });

  describe('SED - Options', () => {
    it('should return array when returnArray is true', async () => {
      const script = `
        LET result = SED(input="line1\\nline2", commands="s/line/LINE/", returnArray=true)
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(['LINE1', 'LINE2']);
    });
  });

  describe('SED_SUBSTITUTE - Convenience Function', () => {
    it('should perform basic substitution', async () => {
      const script = `
        LET result = SED_SUBSTITUTE(input="hello world", pattern="world", replacement="universe")
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toBe('hello universe');
    });

    it('should support global flag', async () => {
      const script = `
        LET result = SED_SUBSTITUTE(input="foo foo foo", pattern="foo", replacement="bar", global=true)
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toBe('bar bar bar');
    });

    it('should support case insensitive flag', async () => {
      const script = `
        LET result = SED_SUBSTITUTE(input="Hello HELLO hello", pattern="hello", replacement="hi", global=true, caseInsensitive=true)
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toBe('hi hi hi');
    });

    it('should support custom delimiter', async () => {
      const script = `
        LET result = SED_SUBSTITUTE(input="a/b/c", pattern="/", replacement="-", global=true, delimiter="#")
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toBe('a-b-c');
    });

    it('should work with array input', async () => {
      const script = `
        LET input = ["line1", "line2", "line3"]
        LET result = SED_SUBSTITUTE(input=input, pattern="line", replacement="LINE", global=true)
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(['LINE1', 'LINE2', 'LINE3']);
    });
  });

  describe('SED - Error Handling', () => {
    it('should throw error for invalid sed command', async () => {
      const script = `
        LET result = SED(input="test", commands="invalid command")
      `;
      await expect(interpreter.run(parse(script))).rejects.toThrow();
    });

    it('should handle empty input gracefully', async () => {
      const script = `
        LET result = SED(input="", commands="s/a/b/")
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toBe('');
    });

    it('should handle no matches gracefully', async () => {
      const script = `
        LET result = SED(input="hello", commands="s/goodbye/hi/")
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toBe('hello');
    });
  });

  describe('SED - Real World Use Cases', () => {
    it('should sanitize file paths', async () => {
      const script = `
        LET path = "/path/to/file.txt"
        LET result = SED(input=path, commands="s#/#_#g")
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toBe('_path_to_file.txt');
    });

    it('should normalize whitespace', async () => {
      const script = `
        LET text = "hello    world"
        LET result = SED(input=text, commands="s/  +/ /g")
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toBe('hello world');
    });

    it('should remove comments from code', async () => {
      const script = `
        LET code = "var x = 5; // comment"
        LET result = SED(input=code, commands="s#//.*$##")
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toBe('var x = 5; ');
    });

    it('should convert CSV to TSV', async () => {
      const script = `
        LET csv = "a,b,c\\nd,e,f"
        LET result = SED(input=csv, commands="s/,/\\\\t/g")
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toBe('a\tb\tc\nd\te\tf');
    });

    it('should mask sensitive data', async () => {
      const script = `
        LET text = "SSN: 123-45-6789"
        LET result = SED(input=text, commands="s/[0-9]{3}-[0-9]{2}-[0-9]{4}/XXX-XX-XXXX/")
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toBe('SSN: XXX-XX-XXXX');
    });
  });
});
