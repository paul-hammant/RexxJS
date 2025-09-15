/**
 * Single Parameter Function Tests - Parentheses vs No Parentheses
 * Tests that all single-parameter functions work both with and without parentheses
 * using the RexxInterpreter
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { parse } = require('../src/parser');
const { RexxInterpreter } = require('../src/interpreter');

describe('Single Parameter Functions - Parentheses Compatibility', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new RexxInterpreter();
  });
  
  describe('String Functions - Single Parameter', () => {
    
    describe('UPPER function', () => {
      test('should work with parentheses', async () => {
        const script = `
          LET x = UPPER("hello")
          LET y = UPPER("HelloWorld")
          LET z = UPPER("123abc")
          LET empty = UPPER("")
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe('HELLO');
        expect(interpreter.getVariable('y')).toBe('HELLOWORLD');
        expect(interpreter.getVariable('z')).toBe('123ABC');
        expect(interpreter.getVariable('empty')).toBe('');
      });
      
      test('should work without parentheses', async () => {
        const script = `
          LET str1 = "hello"
          LET str2 = "HelloWorld"
          LET str3 = "123abc"
          LET str4 = ""
          LET x = UPPER str1
          LET y = UPPER str2
          LET z = UPPER str3
          LET empty = UPPER str4
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe('HELLO');
        expect(interpreter.getVariable('y')).toBe('HELLOWORLD');
        expect(interpreter.getVariable('z')).toBe('123ABC');
        expect(interpreter.getVariable('empty')).toBe('');
      });
    });

    describe('LOWER function', () => {
      test('should work with parentheses', async () => {
        const script = `
          LET x = LOWER("HELLO")
          LET y = LOWER("HelloWorld")
          LET z = LOWER("123ABC")
          LET empty = LOWER("")
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe('hello');
        expect(interpreter.getVariable('y')).toBe('helloworld');
        expect(interpreter.getVariable('z')).toBe('123abc');
        expect(interpreter.getVariable('empty')).toBe('');
      });
      
      test('should work without parentheses', async () => {
        const script = `
          LET str1 = "HELLO"
          LET str2 = "HelloWorld"
          LET str3 = "123ABC"
          LET str4 = ""
          LET x = LOWER str1
          LET y = LOWER str2
          LET z = LOWER str3
          LET empty = LOWER str4
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe('hello');
        expect(interpreter.getVariable('y')).toBe('helloworld');
        expect(interpreter.getVariable('z')).toBe('123abc');
        expect(interpreter.getVariable('empty')).toBe('');
      });
    });

    describe('LENGTH function', () => {
      test('should work with parentheses', async () => {
        const script = `
          LET x = LENGTH("hello")
          LET y = LENGTH("HelloWorld")
          LET z = LENGTH("")
          LET num = LENGTH("123")
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe(5);
        expect(interpreter.getVariable('y')).toBe(10);
        expect(interpreter.getVariable('z')).toBe(0);
        expect(interpreter.getVariable('num')).toBe(3);
      });
      
      test('should work without parentheses', async () => {
        const script = `
          LET str1 = "hello"
          LET str2 = "HelloWorld"
          LET str3 = ""
          LET str4 = "123"
          LET x = LENGTH str1
          LET y = LENGTH str2
          LET z = LENGTH str3
          LET num = LENGTH str4
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe(5);
        expect(interpreter.getVariable('y')).toBe(10);
        expect(interpreter.getVariable('z')).toBe(0);
        expect(interpreter.getVariable('num')).toBe(3);
      });
    });

    describe('TRIM function', () => {
      test('should work with parentheses', async () => {
        const script = `
          LET x = TRIM("  hello  ")
          LET y = TRIM("hello")
          LET z = TRIM("test")
          LET empty = TRIM("")
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe('hello');
        expect(interpreter.getVariable('y')).toBe('hello');
        expect(interpreter.getVariable('z')).toBe('test');
        expect(interpreter.getVariable('empty')).toBe('');
      });
      
      test('should work without parentheses', async () => {
        const script = `
          LET str1 = "  hello  "
          LET str2 = "hello"
          LET str3 = "   test   "
          LET str4 = ""
          LET x = TRIM str1
          LET y = TRIM str2
          LET z = TRIM str3
          LET empty = TRIM str4
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe('hello');
        expect(interpreter.getVariable('y')).toBe('hello');
        expect(interpreter.getVariable('z')).toBe('test');
        expect(interpreter.getVariable('empty')).toBe('');
      });
    });

    describe('REVERSE function', () => {
      test('should work with parentheses', async () => {
        const script = `
          LET x = REVERSE("hello")
          LET y = REVERSE("12345")
          LET z = REVERSE("a")
          LET empty = REVERSE("")
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe('olleh');
        expect(interpreter.getVariable('y')).toBe('54321');
        expect(interpreter.getVariable('z')).toBe('a');
        expect(interpreter.getVariable('empty')).toBe('');
      });
      
      test('should work without parentheses', async () => {
        const script = `
          LET str1 = "hello"
          LET str2 = "12345"
          LET str3 = "a"
          LET str4 = ""
          LET x = REVERSE str1
          LET y = REVERSE str2
          LET z = REVERSE str3
          LET empty = REVERSE str4
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe('olleh');
        expect(interpreter.getVariable('y')).toBe('54321');
        expect(interpreter.getVariable('z')).toBe('a');
        expect(interpreter.getVariable('empty')).toBe('');
      });
    });

    describe('WORDS function', () => {
      test('should work with parentheses', async () => {
        const script = `
          LET x = WORDS("helloworld")
          LET y = WORDS("onetwothreefour")
          LET z = WORDS("spacedout")
          LET empty = WORDS("")
          LET single = WORDS("single")
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe(1);
        expect(interpreter.getVariable('y')).toBe(1);
        expect(interpreter.getVariable('z')).toBe(1);
        expect(interpreter.getVariable('empty')).toBe(0);
        expect(interpreter.getVariable('single')).toBe(1);
      });
      
      test('should work without parentheses', async () => {
        const script = `
          LET str1 = "helloworld"
          LET str2 = "onetwothreefour"
          LET str3 = "spacedout"
          LET str4 = ""
          LET str5 = "single"
          LET x = WORDS str1
          LET y = WORDS str2
          LET z = WORDS str3
          LET empty = WORDS str4
          LET single = WORDS str5
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe(1);
        expect(interpreter.getVariable('y')).toBe(1);
        expect(interpreter.getVariable('z')).toBe(1);
        expect(interpreter.getVariable('empty')).toBe(0);
        expect(interpreter.getVariable('single')).toBe(1);
      });
    });

    describe('SLUG function', () => {
      test('should work with parentheses', async () => {
        const script = `
          LET x = SLUG("HelloWorld!")
          LET y = SLUG("Test_String-123")
          LET z = SLUG("MultipleSpaces")
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe('helloworld');
        expect(interpreter.getVariable('y')).toBe('test-string-123');
        expect(interpreter.getVariable('z')).toBe('multiplespaces');
      });
      
      test('should work without parentheses', async () => {
        const script = `
          LET str1 = "HelloWorld!"
          LET str2 = "Test_String-123"
          LET str3 = "MultipleSpaces"
          LET x = SLUG str1
          LET y = SLUG str2
          LET z = SLUG str3
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe('helloworld');
        expect(interpreter.getVariable('y')).toBe('test-string-123');
        expect(interpreter.getVariable('z')).toBe('multiplespaces');
      });
    });
  });

  describe('Math Functions - Single Parameter', () => {
    
    describe('ABS function', () => {
      test('should work with parentheses', async () => {
        const script = `
          LET x = ABS(-5)
          LET y = ABS(5)
          LET z = ABS(-3.14)
          LET zero = ABS(0)
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe(5);
        expect(interpreter.getVariable('y')).toBe(5);
        expect(interpreter.getVariable('z')).toBe(3.14);
        expect(interpreter.getVariable('zero')).toBe(0);
      });
      
      test('should work without parentheses', async () => {
        const script = `
          LET num1 = -5
          LET num2 = 5
          LET num3 = -3.14
          LET num4 = 0
          LET x = ABS num1
          LET y = ABS num2
          LET z = ABS num3
          LET zero = ABS num4
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe(5);
        expect(interpreter.getVariable('y')).toBe(5);
        expect(interpreter.getVariable('z')).toBe(3.14);
        expect(interpreter.getVariable('zero')).toBe(0);
      });
    });

    describe('MATH_ABS function', () => {
      test('should work with parentheses', async () => {
        const script = `
          LET x = MATH_ABS(-5)
          LET y = MATH_ABS(5)
          LET z = MATH_ABS(-3.14)
          LET zero = MATH_ABS(0)
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe(5);
        expect(interpreter.getVariable('y')).toBe(5);
        expect(interpreter.getVariable('z')).toBe(3.14);
        expect(interpreter.getVariable('zero')).toBe(0);
      });
      
      test('should work without parentheses', async () => {
        const script = `
          LET num1 = -5
          LET num2 = 5
          LET num3 = -3.14
          LET num4 = 0
          LET x = MATH_ABS num1
          LET y = MATH_ABS num2
          LET z = MATH_ABS num3
          LET zero = MATH_ABS num4
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe(5);
        expect(interpreter.getVariable('y')).toBe(5);
        expect(interpreter.getVariable('z')).toBe(3.14);
        expect(interpreter.getVariable('zero')).toBe(0);
      });
    });

    describe('MATH_CEIL function', () => {
      test('should work with parentheses', async () => {
        const script = `
          LET x = MATH_CEIL(4.2)
          LET y = MATH_CEIL(4.8)
          LET z = MATH_CEIL(-4.2)
          LET int = MATH_CEIL(5)
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe(5);
        expect(interpreter.getVariable('y')).toBe(5);
        expect(interpreter.getVariable('z')).toBe(-4);
        expect(interpreter.getVariable('int')).toBe(5);
      });
      
      test('should work without parentheses', async () => {
        const script = `
          LET num1 = 4.2
          LET num2 = 4.8
          LET num3 = -4.2
          LET num4 = 5
          LET x = MATH_CEIL num1
          LET y = MATH_CEIL num2
          LET z = MATH_CEIL num3
          LET int = MATH_CEIL num4
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe(5);
        expect(interpreter.getVariable('y')).toBe(5);
        expect(interpreter.getVariable('z')).toBe(-4);
        expect(interpreter.getVariable('int')).toBe(5);
      });
    });

    describe('MATH_FLOOR function', () => {
      test('should work with parentheses', async () => {
        const script = `
          LET x = MATH_FLOOR(4.2)
          LET y = MATH_FLOOR(4.8)
          LET z = MATH_FLOOR(-4.2)
          LET int = MATH_FLOOR(5)
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe(4);
        expect(interpreter.getVariable('y')).toBe(4);
        expect(interpreter.getVariable('z')).toBe(-5);
        expect(interpreter.getVariable('int')).toBe(5);
      });
      
      test('should work without parentheses', async () => {
        const script = `
          LET num1 = 4.2
          LET num2 = 4.8
          LET num3 = -4.2
          LET num4 = 5
          LET x = MATH_FLOOR num1
          LET y = MATH_FLOOR num2
          LET z = MATH_FLOOR num3
          LET int = MATH_FLOOR num4
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe(4);
        expect(interpreter.getVariable('y')).toBe(4);
        expect(interpreter.getVariable('z')).toBe(-5);
        expect(interpreter.getVariable('int')).toBe(5);
      });
    });

    describe('MATH_SQRT function', () => {
      test('should work with parentheses', async () => {
        const script = `
          LET x = MATH_SQRT(9)
          LET y = MATH_SQRT(16)
          LET z = MATH_SQRT(2)
          LET zero = MATH_SQRT(0)
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe(3);
        expect(interpreter.getVariable('y')).toBe(4);
        expect(interpreter.getVariable('z')).toBeCloseTo(1.414, 3);
        expect(interpreter.getVariable('zero')).toBe(0);
      });
      
      test('should work without parentheses', async () => {
        const script = `
          LET num1 = 9
          LET num2 = 16
          LET num3 = 2
          LET num4 = 0
          LET x = MATH_SQRT num1
          LET y = MATH_SQRT num2
          LET z = MATH_SQRT num3
          LET zero = MATH_SQRT num4
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe(3);
        expect(interpreter.getVariable('y')).toBe(4);
        expect(interpreter.getVariable('z')).toBeCloseTo(1.414, 3);
        expect(interpreter.getVariable('zero')).toBe(0);
      });
    });

    describe('MATH_FACTORIAL function', () => {
      test('should work with parentheses', async () => {
        const script = `
          LET x = MATH_FACTORIAL(0)
          LET y = MATH_FACTORIAL(1)
          LET z = MATH_FACTORIAL(5)
          LET w = MATH_FACTORIAL(3)
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe(1);
        expect(interpreter.getVariable('y')).toBe(1);
        expect(interpreter.getVariable('z')).toBe(120);
        expect(interpreter.getVariable('w')).toBe(6);
      });
      
      test('should work without parentheses', async () => {
        const script = `
          LET num1 = 0
          LET num2 = 1
          LET num3 = 5
          LET num4 = 3
          LET x = MATH_FACTORIAL num1
          LET y = MATH_FACTORIAL num2
          LET z = MATH_FACTORIAL num3
          LET w = MATH_FACTORIAL num4
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe(1);
        expect(interpreter.getVariable('y')).toBe(1);
        expect(interpreter.getVariable('z')).toBe(120);
        expect(interpreter.getVariable('w')).toBe(6);
      });
    });
  });

  describe('Type Conversion and Error Handling', () => {
    describe('String functions with non-string input', () => {
      test('should convert numbers to strings with parentheses', async () => {
        const script = `
          LET x = UPPER(123)
          LET y = LENGTH(42)
          LET z = REVERSE(123)
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe('123');
        expect(interpreter.getVariable('y')).toBe(2);
        expect(interpreter.getVariable('z')).toBe('321');
      });

      test('should convert numbers to strings without parentheses', async () => {
        const script = `
          LET num1 = 123
          LET num2 = 42
          LET num3 = 123
          LET x = UPPER num1
          LET y = LENGTH num2
          LET z = REVERSE num3
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe('123');
        expect(interpreter.getVariable('y')).toBe(2);
        expect(interpreter.getVariable('z')).toBe('321');
      });
    });

    describe('Math functions with string input', () => {
      test('should parse string numbers with parentheses', async () => {
        const script = `
          LET x = ABS("-5")
          LET y = MATH_CEIL("4.2")
          LET z = MATH_FLOOR("4.8")
          LET w = MATH_SQRT("9")
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe(5);
        expect(interpreter.getVariable('y')).toBe(5);
        expect(interpreter.getVariable('z')).toBe(4);
        expect(interpreter.getVariable('w')).toBe(3);
      });

      test('should parse string numbers without parentheses', async () => {
        const script = `
          LET str1 = "-5"
          LET str2 = "4.2"
          LET str3 = "4.8"
          LET str4 = "9"
          LET x = ABS str1
          LET y = MATH_CEIL str2
          LET z = MATH_FLOOR str3
          LET w = MATH_SQRT str4
        `;
        
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('x')).toBe(5);
        expect(interpreter.getVariable('y')).toBe(5);
        expect(interpreter.getVariable('z')).toBe(4);
        expect(interpreter.getVariable('w')).toBe(3);
      });
    });
  });

  describe('Edge Cases', () => {
    test('empty string handling with parentheses', async () => {
      const script = `
        LET x = UPPER("")
        LET y = LOWER("")
        LET z = LENGTH("")
        LET w = TRIM("")
        LET v = REVERSE("")
        LET u = WORDS("")
      `;
      
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('x')).toBe('');
      expect(interpreter.getVariable('y')).toBe('');
      expect(interpreter.getVariable('z')).toBe(0);
      expect(interpreter.getVariable('w')).toBe('');
      expect(interpreter.getVariable('v')).toBe('');
      expect(interpreter.getVariable('u')).toBe(0);
    });

    test('empty string handling without parentheses', async () => {
      const script = `
        LET empty = ""
        LET x = UPPER empty
        LET y = LOWER empty
        LET z = LENGTH empty
        LET w = TRIM empty
        LET v = REVERSE empty
        LET u = WORDS empty
      `;
      
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('x')).toBe('');
      expect(interpreter.getVariable('y')).toBe('');
      expect(interpreter.getVariable('z')).toBe(0);
      expect(interpreter.getVariable('w')).toBe('');
      expect(interpreter.getVariable('v')).toBe('');
      expect(interpreter.getVariable('u')).toBe(0);
    });

    test('zero and negative number handling with parentheses', async () => {
      const script = `
        LET x = ABS(0)
        LET y = ABS(-0)
        LET z = MATH_SQRT(0)
        LET w = MATH_FACTORIAL(0)
      `;
      
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('x')).toBe(0);
      expect(interpreter.getVariable('y')).toBe(0);
      expect(interpreter.getVariable('z')).toBe(0);
      expect(interpreter.getVariable('w')).toBe(1);
    });

    test('zero and negative number handling without parentheses', async () => {
      const script = `
        LET zero = 0
        LET negzero = -0
        LET x = ABS zero
        LET y = ABS negzero
        LET z = MATH_SQRT zero
        LET w = MATH_FACTORIAL zero
      `;
      
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('x')).toBe(0);
      expect(interpreter.getVariable('y')).toBe(0);
      expect(interpreter.getVariable('z')).toBe(0);
      expect(interpreter.getVariable('w')).toBe(1);
    });

    test('whitespace handling in strings with parentheses', async () => {
      const script = `
        LET x = UPPER("")
        LET y = LENGTH("")
        LET z = TRIM("")
        LET w = WORDS("")
      `;
      
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('x')).toBe('');
      expect(interpreter.getVariable('y')).toBe(0);
      expect(interpreter.getVariable('z')).toBe('');
      expect(interpreter.getVariable('w')).toBe(0);
    });

    test('whitespace handling in strings without parentheses', async () => {
      const script = `
        LET spaces = ""
        LET x = UPPER spaces
        LET y = LENGTH spaces
        LET z = TRIM spaces
        LET w = WORDS spaces
      `;
      
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('x')).toBe('');
      expect(interpreter.getVariable('y')).toBe(0);
      expect(interpreter.getVariable('z')).toBe('');
      expect(interpreter.getVariable('w')).toBe(0);
    });
  });
});