const { parse } = require('../src/parser');
const { Interpreter } = require('../src/interpreter');

describe('Array Access Workarounds', () => {
  let interpreter;
  let output;

  beforeEach(() => {
    output = [];
    const outputHandler = {
      output: (content) => output.push(content),
      write: (content) => output.push(content),
      writeLine: (content) => output.push(content),
      writeError: (content) => output.push(`ERROR: ${content}`)
    };
    
    interpreter = new Interpreter();
    interpreter.outputHandler = outputHandler;
  });

  describe('Bracket Syntax Rejection', () => {
    test('should reject simple array bracket access with helpful error', async () => {
      const rexxCode = `
        LET arr = ["first", "second", "third"]
        LET x = arr[1]
        SAY x
      `;
      
      await expect(async () => {
        const commands = parse(rexxCode);
        await interpreter.run(commands);
      }).rejects.toThrow(/Array access syntax 'arr\[1\]' is not supported in expressions/);
    });

    test('should reject object property array access with helpful error', async () => {
      const rexxCode = `
        LET obj = {"items": ["a", "b", "c"]}
        LET x = obj.items[2]
        SAY x
      `;
      
      await expect(async () => {
        const commands = parse(rexxCode);
        await interpreter.run(commands);
      }).rejects.toThrow(/Array access syntax 'obj\.items\[2\]' is not supported in expressions/);
    });

    test('should suggest ARRAY_GET alternative', async () => {
      const rexxCode = `LET x = arr[1]`;
      
      await expect(async () => {
        parse(rexxCode);
      }).rejects.toThrow(/Use ARRAY_GET\(arr, 1\) for REXX 1-based indexing instead/);
    });
  });

  describe('Dot Notation Workaround', () => {
    test('should access array elements using JavaScript 0-based dot notation', async () => {
      const rexxCode = `
        LET arr = ["first", "second", "third"]
        LET x = arr.0
        SAY x
      `;
      
      const commands = parse(rexxCode);
      await interpreter.run(commands);
      
      expect(output[0]).toBe("first");
    });

    test('should access simple object properties with dot notation', async () => {
      const rexxCode = `
        LET obj = {"name": "test", "value": 42}
        LET x = obj.name
        SAY x
      `;
      
      const commands = parse(rexxCode);
      await interpreter.run(commands);
      
      expect(output[0]).toBe("test");
    });
  });

  describe('Array Access Alternatives', () => {
    test('should allow array literals in expressions', async () => {
      const rexxCode = `
        LET arr = ["first", "second", "third"]
        SAY "Array created successfully"
      `;
      
      const commands = parse(rexxCode);
      await interpreter.run(commands);
      
      expect(output[0]).toBe("Array created successfully");
    });

    test('should work with variable array access through dot notation', async () => {
      const rexxCode = `
        LET arr = ["a", "b", "c", "d", "e"]
        LET x = arr.2
        LET y = arr.4
        SAY x
        SAY y
      `;
      
      const commands = parse(rexxCode);
      await interpreter.run(commands);
      
      expect(output[0]).toBe("c");
      expect(output[1]).toBe("e");
    });
  });
});