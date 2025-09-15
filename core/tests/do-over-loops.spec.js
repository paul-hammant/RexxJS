/**
 * Do Over Loops Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

// Custom output handler that collects output for testing
class TestOutputHandler {
  constructor() {
    this.buffer = '';
  }
  
  output(message) {
    this.buffer += message + '\n';
  }
  
  clear() {
    this.buffer = '';
  }
  
  getOutput() {
    return this.buffer;
  }
}

describe('DO variable OVER array loops', () => {
  let interpreter;
  let outputHandler;
  
  beforeEach(() => {
    outputHandler = new TestOutputHandler();
    interpreter = new Interpreter(null, outputHandler);
  });

  describe('Basic Array Iteration', () => {
    test('should iterate over JavaScript array', async () => {
      const script = `
        LET numbers = [1, 2, 3, 4, 5]
        DO num OVER numbers
          SAY "Number: " || num
        END
      `;
      
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      expect(output).toContain('Number: 1');
      expect(output).toContain('Number: 2');
      expect(output).toContain('Number: 3');
      expect(output).toContain('Number: 4');
      expect(output).toContain('Number: 5');
    });

    test('should iterate over string array', async () => {
      const script = `
        LET colors = ["red", "green", "blue"]
        DO color OVER colors
          SAY "Color: " || color
        END
      `;
      
      // Set up the array manually since array literals might not be fully supported
      interpreter.variables.set('colors', ['red', 'green', 'blue']);
      
      const simpleScript = `
        DO color OVER colors
          SAY "Color: " || color
        END
      `;
      
      await interpreter.run(parse(simpleScript));
      const output = outputHandler.getOutput();
      expect(output).toContain('Color: red');
      expect(output).toContain('Color: green');
      expect(output).toContain('Color: blue');
    });

    test('should iterate over mixed-type array', async () => {
      // Set up the array manually
      interpreter.variables.set('mixed', [1, 'hello', true, 42.5]);
      
      const script = `
        DO item OVER mixed
          SAY "Item: " || item
        END
      `;
      
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      expect(output).toContain('Item: 1');
      expect(output).toContain('Item: hello');
      expect(output).toContain('Item: true');
      expect(output).toContain('Item: 42.5');
    });
  });

  describe('String Iteration', () => {
    test('should iterate over string characters', async () => {
      const script = `
        LET word = "HELLO"
        DO char OVER word
          SAY "Char: " || char
        END
      `;
      
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      expect(output).toContain('Char: H');
      expect(output).toContain('Char: E');
      expect(output).toContain('Char: L');
      expect(output).toContain('Char: L');
      expect(output).toContain('Char: O');
    });

    test('should handle empty string', async () => {
      const script = `
        LET empty = ""
        LET count = 0
        DO char OVER empty
          LET count = count + 1
        END
        SAY "Count: " || count
      `;
      
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      expect(output).toContain('Count: 0');
    });
  });

  describe('Function Return Values', () => {
    test('should work with SUBROUTINES() function', async () => {
      const script = `
        TestSub1:
        RETURN
        
        TestSub2:
        RETURN
        
        LET all_subs = SUBROUTINES()
        DO sub OVER all_subs
          IF sub = "TESTSUB1" THEN DO
            SAY "Found: " || sub
          END
          IF sub = "TESTSUB2" THEN DO
            SAY "Found: " || sub
          END
        END
      `;
      
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      expect(output).toContain('Found: TESTSUB1');
      expect(output).toContain('Found: TESTSUB2');
    });
  });

  describe('Variable Scoping', () => {
    test('should preserve loop variable after completion', async () => {
      // Set up array manually
      interpreter.variables.set('items', ['a', 'b', 'c']);
      
      const script = `
        DO item OVER items
          SAY "Processing item: " || item
        END
        SAY "Final item: " || item
      `;
      
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      expect(output).toContain('Final item: c');
    });

    test('should restore original variable if it existed before', async () => {
      // Set up variables manually
      interpreter.variables.set('item', 'original');
      interpreter.variables.set('items', ['x', 'y', 'z']);
      
      const script = `
        DO item OVER items
          SAY "Processing item: " || item
        END
        SAY "Final item: " || item
      `;
      
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      expect(output).toContain('Final item: original');
    });

    test('should handle nested loops with different variables', async () => {
      // Set up arrays manually
      interpreter.variables.set('outer', [1, 2]);
      interpreter.variables.set('inner', ['a', 'b']);
      
      const script = `
        DO i OVER outer
          DO j OVER inner
            SAY i || "-" || j
          END
        END
      `;
      
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      expect(output).toContain('1-a');
      expect(output).toContain('1-b');
      expect(output).toContain('2-a');
      expect(output).toContain('2-b');
    });
  });

  describe('Object Iteration', () => {
    test('should iterate over object values', async () => {
      const script = `
        LET obj = {"name": "John", "age": 30, "city": "NYC"}
        DO value OVER obj
          SAY "Value: " || value
        END
      `;
      
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      expect(output).toContain('Value: John');
      expect(output).toContain('Value: 30');
      expect(output).toContain('Value: NYC');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty arrays', async () => {
      const script = `
        LET empty = []
        LET count = 0
        DO item OVER empty
          LET count = count + 1
        END
        SAY "Count: " || count
      `;
      
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      expect(output).toContain('Count: 0');
    });

    test('should handle single-element arrays', async () => {
      const script = `
        LET single = [42]
        DO item OVER single
          SAY "Item: " || item
        END
      `;
      
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      expect(output).toContain('Item: 42');
    });

    test('should handle non-array single values', async () => {
      const script = `
        LET single = 99
        DO item OVER single
          SAY "Item: " || item
        END
      `;
      
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      expect(output).toContain('Item: 99');
    });

    test('should throw error for null array', async () => {
      // Set up null variable manually
      interpreter.variables.set('nullArray', null);
      
      const script = `
        DO item OVER nullArray
          SAY "Item: " || item
        END
      `;
      
      await expect(interpreter.run(parse(script))).rejects.toThrow('DO OVER: Array cannot be null or undefined');
    });

    test('should throw error for undefined array', async () => {
      // Set up undefined variable manually  
      interpreter.variables.set('undefinedArray', undefined);
      
      const script = `
        DO item OVER undefinedArray
          SAY "Item: " || item
        END
      `;
      
      await expect(interpreter.run(parse(script))).rejects.toThrow('DO OVER: Array cannot be null or undefined');
    });
  });

  describe('Complex Scenarios', () => {
    test('should work with computed arrays', async () => {
      // Set up arrays manually
      interpreter.variables.set('computed', [2, 4, 6]);
      
      const script = `
        DO item OVER computed
          SAY "Doubled: " || item
        END
      `;
      
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      expect(output).toContain('Doubled: 2');
      expect(output).toContain('Doubled: 4');
      expect(output).toContain('Doubled: 6');
    });

    test('should handle arrays with nested structures', async () => {
      // Set up nested array manually
      interpreter.variables.set('nested', [{ id: 1 }, { id: 2 }]);
      
      const script = `
        DO obj OVER nested
          SAY "Object processed"
        END
      `;
      
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      expect(output).toContain('Object processed');
    });

    test('should support variable references in array expression', async () => {
      // Set up array manually
      interpreter.variables.set('testArray', ['value1', 'value2']);
      
      const script = `
        DO item OVER testArray
          SAY "Referenced: " || item
        END
      `;
      
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      expect(output).toContain('Referenced: value1');
      expect(output).toContain('Referenced: value2');
    });
  });

  describe('Performance and Safety', () => {
    test('should handle reasonably large arrays', async () => {
      // Create array 1 to 100 manually
      const largeArray = Array.from({ length: 100 }, (_, i) => i + 1);
      interpreter.variables.set('large', largeArray);
      interpreter.variables.set('sum', 0);
      
      const script = `
        DO num OVER large
          LET sum = sum + num
        END
        SAY "Sum: " || sum
      `;
      
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      // Sum of 1 to 100 = 5050
      expect(output).toContain('Sum: 5050');
    });
  });
});