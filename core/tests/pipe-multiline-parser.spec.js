/**
 * Pipe Operator - Multi-line Parser Tests
 * Tests the line continuation feature for |> operator
 */

const { parse } = require('../src/parser');

describe('Pipe Multi-line Parser', () => {
  describe('Line Continuation', () => {
    test('should merge lines starting with |>', () => {
      const script = `
        LET x = "hello"
          |> UPPER
      `;

      const commands = parse(script);
      expect(commands).toHaveLength(1);
      expect(commands[0].type).toBe('ASSIGNMENT');
      expect(commands[0].expression.type).toBe('PIPE_OP');
    });

    test('should handle 3-stage multi-line pipe', () => {
      const script = `
        LET x = "test"
          |> UPPER
          |> REVERSE
          |> LENGTH
      `;

      const commands = parse(script);
      expect(commands).toHaveLength(1);

      // Check it's a nested pipe structure
      let expr = commands[0].expression;
      expect(expr.type).toBe('PIPE_OP');

      // Pipes are right-associative, so we have nested PIPE_OP nodes
      while (expr.type === 'PIPE_OP') {
        expect(expr.left).toBeDefined();
        expect(expr.right).toBeDefined();
        expr = expr.left;
      }
    });

    test('should handle multi-line with function arguments', () => {
      const script = `
        LET x = "a,b,c"
          |> SPLIT(",")
          |> ARRAY_LENGTH
      `;

      const commands = parse(script);
      expect(commands).toHaveLength(1);
      expect(commands[0].expression.type).toBe('PIPE_OP');
    });

    test('should not merge lines without |>', () => {
      const script = `
        LET x = "hello"
        LET y = "world"
      `;

      const commands = parse(script);
      expect(commands).toHaveLength(2);
      expect(commands[0].variable).toBe('x');
      expect(commands[1].variable).toBe('y');
    });

    test('should handle single-line pipe (no continuation)', () => {
      const script = 'LET x = "hello" |> UPPER';

      const commands = parse(script);
      expect(commands).toHaveLength(1);
      expect(commands[0].expression.type).toBe('PIPE_OP');
    });

    test('should handle empty lines between pipe stages', () => {
      const script = `
        LET x = "test"

          |> UPPER

          |> LENGTH
      `;

      const commands = parse(script);
      expect(commands).toHaveLength(1);
      expect(commands[0].expression.type).toBe('PIPE_OP');
    });

    test('should handle indented continuation lines', () => {
      const script = `
        LET result = "hello world"
            |> TRIM
            |> UPPER
      `;

      const commands = parse(script);
      expect(commands).toHaveLength(1);
      expect(commands[0].expression.type).toBe('PIPE_OP');
    });

    test('should work with functions in pipes', () => {
      const script = `
        LET x = "hello world test"
          |> UPPER
          |> TRIM
      `;

      const commands = parse(script);
      expect(commands).toHaveLength(1);
      expect(commands[0].expression.type).toBe('PIPE_OP');
      // Right side of pipe can be a function call or variable reference
      expect(commands[0].expression.right).toBeDefined();
    });

    test('should handle very long pipe chains', () => {
      const script = `
        LET x = "test"
          |> UPPER
          |> REVERSE
          |> LOWER
          |> UPPER
          |> REVERSE
          |> LENGTH
      `;

      const commands = parse(script);
      expect(commands).toHaveLength(1);
      expect(commands[0].expression.type).toBe('PIPE_OP');
    });

    test('should preserve original line for single-line pipes', () => {
      const script = 'LET x = "hi" |> UPPER';

      const commands = parse(script);
      expect(commands[0].originalLine).toContain('|>');
      expect(commands[0].originalLine).toContain('UPPER');
    });
  });

  describe('Mixed Syntax', () => {
    test('should handle multi-line pipes mixed with regular statements', () => {
      const script = `
        LET a = "hello"
        LET b = a
          |> UPPER
          |> LENGTH
        LET c = 42
      `;

      const commands = parse(script);
      expect(commands).toHaveLength(3);
      expect(commands[0].variable).toBe('a');
      expect(commands[1].variable).toBe('b');
      expect(commands[1].expression.type).toBe('PIPE_OP');
      expect(commands[2].variable).toBe('c');
    });

    test('should handle arithmetic before multi-line pipe', () => {
      const script = `
        LET x = 5 + 3
          |> ABS
          |> MATH_SQRT
      `;

      const commands = parse(script);
      expect(commands).toHaveLength(1);
      expect(commands[0].expression.type).toBe('PIPE_OP');
    });

    test('should handle variable reference in multi-line pipe', () => {
      const script = `
        LET nums = [1, 2, 3]
        LET sum = nums
          |> ARRAY_SUM
      `;

      const commands = parse(script);
      expect(commands).toHaveLength(2);
      expect(commands[1].expression.type).toBe('PIPE_OP');
      expect(commands[1].expression.left.type).toBe('VARIABLE');
      expect(commands[1].expression.left.name).toBe('nums');
    });
  });

  describe('Edge Cases', () => {
    test('should handle pipe at start of line with no leading whitespace', () => {
      const script = `
LET x = "test"
|> UPPER
      `;

      const commands = parse(script);
      expect(commands).toHaveLength(1);
      expect(commands[0].expression.type).toBe('PIPE_OP');
    });

    test('should handle inline comments with pipes', () => {
      const script = `
        LET x = "test" |> UPPER  -- comment here
      `;

      const commands = parse(script);
      expect(commands).toHaveLength(1);
      expect(commands[0].expression.type).toBe('PIPE_OP');
    });

    test('should not break on |> inside string literals', () => {
      const script = 'LET x = "arrow |> here"';

      const commands = parse(script);
      expect(commands).toHaveLength(1);
      // String literals are stored as value, not expression
      expect(commands[0].value).toBe('arrow |> here');
      expect(commands[0].isQuotedString).toBe(true);
    });

    test('should handle multiple assignments with pipes', () => {
      const script = `
        LET x = "a" |> UPPER
        LET y = "b"
          |> UPPER
          |> REVERSE
      `;

      const commands = parse(script);
      expect(commands).toHaveLength(2);
      expect(commands[0].expression.type).toBe('PIPE_OP');
      expect(commands[1].expression.type).toBe('PIPE_OP');
    });
  });
});
