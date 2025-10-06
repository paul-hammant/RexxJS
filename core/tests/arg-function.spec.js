/**
 * ARG() Function Tests - Classic REXX Argument Access
 * Tests for the ARG() built-in function following classic REXX semantics
 *
 * ARG() function provides idiomatic REXX argument access:
 * - ARG() returns argument count
 * - ARG(n) returns nth argument
 * - ARG(n, 'E') checks if argument exists
 * - ARG(n, 'O') checks if argument was omitted
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('ARG() Function', () => {
  describe('ARG() - Argument Count', () => {
    test('returns 0 when no arguments', async () => {
      const i = new Interpreter();
      i.argv = [];
      const c = parse('LET count = ARG()');
      await i.run(c);
      expect(i.getVariable('count')).toBe(0);
    });

    test('returns correct count with 3 arguments', async () => {
      const i = new Interpreter();
      i.argv = ['first', 'second', 'third'];
      const c = parse('LET count = ARG()');
      await i.run(c);
      expect(i.getVariable('count')).toBe(3);
    });

    test('returns count of 5 arguments', async () => {
      const i = new Interpreter();
      const args = [];
      for (let j = 1; j <= 5; j++) {
        args.push(`arg${j}`);
      }
      i.argv = args;
      const c = parse('LET count = ARG()');
      await i.run(c);
      expect(i.getVariable('count')).toBe(5);
    });
  });

  describe('ARG(n) - Get Argument by Index', () => {
    test('returns first argument', async () => {
      const i = new Interpreter();
      i.argv = ['hello', 'world', 'test'];
      const c = parse('LET first = ARG(1)');
      await i.run(c);
      expect(i.getVariable('first')).toBe('hello');
    });

    test('returns second argument', async () => {
      const i = new Interpreter();
      i.argv = ['hello', 'world', 'test'];
      const c = parse('LET second = ARG(2)');
      await i.run(c);
      expect(i.getVariable('second')).toBe('world');
    });

    test('returns empty string for non-existent argument', async () => {
      const i = new Interpreter();
      i.argv = ['hello', 'world'];
      const c = parse('LET missing = ARG(5)');
      await i.run(c);
      expect(i.getVariable('missing')).toBe('');
    });

    test('handles empty string arguments', async () => {
      const i = new Interpreter();
      i.argv = ['first', '', 'third'];
      const c = parse('LET empty = ARG(2)');
      await i.run(c);
      expect(i.getVariable('empty')).toBe('');
    });

    test('handles argument with spaces', async () => {
      const i = new Interpreter();
      i.argv = ['hello world test'];
      const c = parse('LET arg = ARG(1)');
      await i.run(c);
      expect(i.getVariable('arg')).toBe('hello world test');
    });
  });

  describe('ARG(n, "E") - Existence Check', () => {
    test('returns 1 when argument exists', async () => {
      const i = new Interpreter();
      i.argv = ['hello', 'world', 'test'];
      const c = parse('LET exists = ARG(2, "E")');
      await i.run(c);
      expect(i.getVariable('exists')).toBe(1);
    });

    test('returns 0 when argument does not exist', async () => {
      const i = new Interpreter();
      i.argv = ['hello', 'world'];
      const c = parse('LET exists = ARG(5, "E")');
      await i.run(c);
      expect(i.getVariable('exists')).toBe(0);
    });

    test('returns 1 for empty string argument (it exists)', async () => {
      const i = new Interpreter();
      i.argv = ['hello', ''];
      const c = parse('LET exists = ARG(2, "E")');
      await i.run(c);
      expect(i.getVariable('exists')).toBe(1);
    });
  });

  describe('ARG(n, "O") - Omission Check', () => {
    test('returns 1 for omitted argument (empty string)', async () => {
      const i = new Interpreter();
      i.argv = ['hello', '', 'world'];
      const c = parse('LET omitted = ARG(2, "O")');
      await i.run(c);
      expect(i.getVariable('omitted')).toBe(1);
    });

    test('returns 0 for provided argument', async () => {
      const i = new Interpreter();
      i.argv = ['hello', 'world'];
      const c = parse('LET omitted = ARG(1, "O")');
      await i.run(c);
      expect(i.getVariable('omitted')).toBe(0);
    });

    test('returns 0 for non-existent argument', async () => {
      const i = new Interpreter();
      i.argv = ['hello', 'world'];
      const c = parse('LET omitted = ARG(5, "O")');
      await i.run(c);
      expect(i.getVariable('omitted')).toBe(0);
    });
  });

  describe('ARG() Practical Use Cases', () => {
    test('iterate through all arguments', async () => {
      const i = new Interpreter();
      i.argv = ['a', 'b', 'c'];
      const c = parse(`
        LET count = ARG()
        LET result = ""
        DO i = 1 TO count
          LET arg = ARG(i)
          LET result = result || arg
        END
      `);
      await i.run(c);
      expect(i.getVariable('result')).toBe('abc');
    });

    test('get first and last argument', async () => {
      const i = new Interpreter();
      i.argv = ['hello', 'world', 'test'];
      const c = parse(`
        LET total = ARG()
        LET first = ARG(1)
        LET last = ARG(total)
      `);
      await i.run(c);
      expect(i.getVariable('total')).toBe(3);
      expect(i.getVariable('first')).toBe('hello');
      expect(i.getVariable('last')).toBe('test');
    });
  });
});
