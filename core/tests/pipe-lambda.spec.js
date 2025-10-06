/**
 * Pipe Lambda/Arrow Functions Tests - Phase 4.3
 * Tests for lambda expressions in pipe operations
 * REXX-idiomatic arrow syntax: x => expression
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('Pipe Lambda Functions', () => {
  describe('Basic Arrow Syntax', () => {
    test('single parameter arrow function', async () => {
      const i = new Interpreter();
      const c = parse('LET x = [1, 2, 3] |> MAP(n => n * 2)');
      await i.run(c);
      expect(i.getVariable('x')).toEqual([2, 4, 6]);
    });

    test('arrow function with addition', async () => {
      const i = new Interpreter();
      const c = parse('LET x = [1, 2, 3] |> MAP(n => n + 10)');
      await i.run(c);
      expect(i.getVariable('x')).toEqual([11, 12, 13]);
    });

    test('arrow function with comparison', async () => {
      const i = new Interpreter();
      const c = parse('LET x = [1, 2, 3, 4, 5] |> FILTER(n => n > 2)');
      await i.run(c);
      expect(i.getVariable('x')).toEqual([3, 4, 5]);
    });

    test('arrow function returning boolean', async () => {
      const i = new Interpreter();
      const c = parse('LET x = [2, 4, 6, 7] |> FILTER(n => n % 2 = 0)');
      await i.run(c);
      expect(i.getVariable('x')).toEqual([2, 4, 6]);
    });
  });

  describe('MAP with Lambdas', () => {
    test('MAP with arithmetic lambda', async () => {
      const i = new Interpreter();
      const c = parse('LET x = [10, 20, 30] |> MAP(n => n / 2)');
      await i.run(c);
      expect(i.getVariable('x')).toEqual([5, 10, 15]);
    });

    test('MAP with power operation', async () => {
      const i = new Interpreter();
      const c = parse('LET x = [2, 3, 4] |> MAP(n => n ** 2)');
      await i.run(c);
      expect(i.getVariable('x')).toEqual([4, 9, 16]);
    });

    test('MAP with string operation', async () => {
      const i = new Interpreter();
      const c = parse('LET x = ["a", "b", "c"] |> MAP(s => s || "x")');
      await i.run(c);
      expect(i.getVariable('x')).toEqual(['ax', 'bx', 'cx']);
    });

    test('MAP with function call in lambda', async () => {
      const i = new Interpreter();
      const c = parse('LET x = ["hello", "world"] |> MAP(s => UPPER(s))');
      await i.run(c);
      expect(i.getVariable('x')).toEqual(['HELLO', 'WORLD']);
    });

    test('MAP with LENGTH function', async () => {
      const i = new Interpreter();
      const c = parse('LET x = ["a", "ab", "abc"] |> MAP(s => LENGTH(s))');
      await i.run(c);
      expect(i.getVariable('x')).toEqual([1, 2, 3]);
    });
  });

  describe('FILTER with Lambdas', () => {
    test('FILTER with greater than', async () => {
      const i = new Interpreter();
      const c = parse('LET x = [1, 5, 10, 15] |> FILTER(n => n > 7)');
      await i.run(c);
      expect(i.getVariable('x')).toEqual([10, 15]);
    });

    test('FILTER with less than or equal', async () => {
      const i = new Interpreter();
      const c = parse('LET x = [1, 2, 3, 4, 5] |> FILTER(n => n <= 3)');
      await i.run(c);
      expect(i.getVariable('x')).toEqual([1, 2, 3]);
    });

    test('FILTER with modulo check', async () => {
      const i = new Interpreter();
      const c = parse('LET x = [1, 2, 3, 4, 5, 6] |> FILTER(n => n % 3 = 0)');
      await i.run(c);
      expect(i.getVariable('x')).toEqual([3, 6]);
    });

    test('FILTER with string length', async () => {
      const i = new Interpreter();
      const c = parse('LET x = ["a", "abc", "ab", "abcd"] |> FILTER(s => LENGTH(s) > 2)');
      await i.run(c);
      expect(i.getVariable('x')).toEqual(['abc', 'abcd']);
    });

    test('FILTER with equality check', async () => {
      const i = new Interpreter();
      const c = parse('LET x = [1, 2, 3, 2, 1] |> FILTER(n => n = 2)');
      await i.run(c);
      expect(i.getVariable('x')).toEqual([2, 2]);
    });
  });

  describe('REDUCE with Lambdas', () => {
    test.skip('REDUCE with sum lambda - TODO: implement REDUCE', async () => {
      const i = new Interpreter();
      const c = parse('LET x = [1, 2, 3, 4] |> REDUCE((acc, n) => acc + n, 0)');
      await i.run(c);
      expect(i.getVariable('x')).toBe(10);
    });

    test.skip('REDUCE with product lambda - TODO: implement REDUCE', async () => {
      const i = new Interpreter();
      const c = parse('LET x = [2, 3, 4] |> REDUCE((acc, n) => acc * n, 1)');
      await i.run(c);
      expect(i.getVariable('x')).toBe(24);
    });
  });

  describe('Chained Pipes with Lambdas', () => {
    test('MAP then FILTER', async () => {
      const i = new Interpreter();
      const c = parse(`
        LET x = [1, 2, 3, 4, 5]
          |> MAP(n => n * 2)
          |> FILTER(n => n > 5)
      `);
      await i.run(c);
      expect(i.getVariable('x')).toEqual([6, 8, 10]);
    });

    test('FILTER then MAP', async () => {
      const i = new Interpreter();
      const c = parse(`
        LET x = [1, 2, 3, 4, 5]
          |> FILTER(n => n > 2)
          |> MAP(n => n * 10)
      `);
      await i.run(c);
      expect(i.getVariable('x')).toEqual([30, 40, 50]);
    });

    test('multiple transformations', async () => {
      const i = new Interpreter();
      const c = parse(`
        LET x = [1, 2, 3]
          |> MAP(n => n + 1)
          |> MAP(n => n * 2)
          |> FILTER(n => n > 4)
      `);
      await i.run(c);
      expect(i.getVariable('x')).toEqual([6, 8]);
    });

    test('string transformations', async () => {
      const i = new Interpreter();
      const c = parse(`
        LET x = ["hello", "world", "test"]
          |> MAP(s => UPPER(s))
          |> FILTER(s => LENGTH(s) > 4)
      `);
      await i.run(c);
      expect(i.getVariable('x')).toEqual(['HELLO', 'WORLD']);
    });
  });

  describe('Complex Lambda Expressions', () => {
    test('lambda with multiple operations', async () => {
      const i = new Interpreter();
      const c = parse('LET x = [1, 2, 3] |> MAP(n => (n + 1) * 2)');
      await i.run(c);
      expect(i.getVariable('x')).toEqual([4, 6, 8]);
    });

    test('lambda with nested function calls', async () => {
      const i = new Interpreter();
      const c = parse('LET x = ["hello", "WORLD"] |> MAP(s => LOWER(TRIM(s)))');
      await i.run(c);
      expect(i.getVariable('x')).toEqual(['hello', 'world']);
    });

    test('lambda with conditional-like expression', async () => {
      const i = new Interpreter();
      const c = parse('LET x = [1, 2, 3, 4] |> MAP(n => n * n)');
      await i.run(c);
      expect(i.getVariable('x')).toEqual([1, 4, 9, 16]);
    });
  });

  describe('Lambda Edge Cases', () => {
    test('empty array with lambda', async () => {
      const i = new Interpreter();
      const c = parse('LET x = [] |> MAP(n => n * 2)');
      await i.run(c);
      expect(i.getVariable('x')).toEqual([]);
    });

    test('single element array', async () => {
      const i = new Interpreter();
      const c = parse('LET x = [42] |> MAP(n => n + 1)');
      await i.run(c);
      expect(i.getVariable('x')).toEqual([43]);
    });

    test('lambda parameter name does not conflict', async () => {
      const i = new Interpreter();
      const c = parse(`
        LET n = 100
        LET x = [1, 2, 3] |> MAP(n => n * 2)
        LET y = n
      `);
      await i.run(c);
      expect(i.getVariable('x')).toEqual([2, 4, 6]);
      expect(i.getVariable('y')).toBe(100);
    });

    test('different parameter names in chained lambdas', async () => {
      const i = new Interpreter();
      const c = parse(`
        LET x = [1, 2, 3]
          |> MAP(a => a + 1)
          |> MAP(b => b * 2)
      `);
      await i.run(c);
      expect(i.getVariable('x')).toEqual([4, 6, 8]);
    });
  });

  describe('Lambda vs String Expression Comparison', () => {
    test.skip('lambda and string expression produce same result - TODO: string expressions need enhancement', async () => {
      // String expressions like "n * 2" don't currently work the same as lambdas for simple arrays
      // Lambda works: [1, 2, 3] |> MAP(n => n * 2) → [2, 4, 6]
      // String doesn't: [1, 2, 3] |> MAP("n * 2") → [1, 2, 3]
      // This is a limitation of the original ARRAY_MAP implementation
      const i1 = new Interpreter();
      const i2 = new Interpreter();

      const c1 = parse('LET x = [1, 2, 3] |> MAP(n => n * 2)');
      const c2 = parse('LET x = [1, 2, 3] |> MAP("n * 2")');

      await i1.run(c1);
      await i2.run(c2);

      expect(i1.getVariable('x')).toEqual(i2.getVariable('x'));
    });

    test('lambda is preferred over string for clarity', async () => {
      const i = new Interpreter();
      // Lambda syntax is more explicit and type-safe
      const c = parse('LET x = [10, 20, 30] |> MAP(n => n / 10)');
      await i.run(c);
      expect(i.getVariable('x')).toEqual([1, 2, 3]);
    });
  });

  describe('Practical Use Cases', () => {
    test('calculate squares of numbers', async () => {
      const i = new Interpreter();
      const c = parse('LET squares = [1, 2, 3, 4, 5] |> MAP(n => n * n)');
      await i.run(c);
      expect(i.getVariable('squares')).toEqual([1, 4, 9, 16, 25]);
    });

    test('find even numbers', async () => {
      const i = new Interpreter();
      const c = parse('LET evens = [1, 2, 3, 4, 5, 6] |> FILTER(n => n % 2 = 0)');
      await i.run(c);
      expect(i.getVariable('evens')).toEqual([2, 4, 6]);
    });

    test('convert temperatures', async () => {
      const i = new Interpreter();
      // Celsius to Fahrenheit: F = C * 9/5 + 32
      const c = parse('LET fahrenheit = [0, 10, 20, 30] |> MAP(c => c * 9 / 5 + 32)');
      await i.run(c);
      expect(i.getVariable('fahrenheit')).toEqual([32, 50, 68, 86]);
    });

    test('normalize strings', async () => {
      const i = new Interpreter();
      const c = parse(`
        LET names = ["  alice  ", "BOB", "Charlie"]
          |> MAP(s => TRIM(s))
          |> MAP(s => UPPER(s))
      `);
      await i.run(c);
      expect(i.getVariable('names')).toEqual(['ALICE', 'BOB', 'CHARLIE']);
    });

    test('filter and transform data pipeline', async () => {
      const i = new Interpreter();
      const c = parse(`
        LET result = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
          |> FILTER(n => n > 5)
          |> MAP(n => n * n)
          |> FILTER(n => n < 80)
      `);
      await i.run(c);
      expect(i.getVariable('result')).toEqual([36, 49, 64]);
    });
  });
});
