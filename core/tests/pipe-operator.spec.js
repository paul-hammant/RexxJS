/**
 * Pipe Operator Tests
 *
 * Tests for the |> pipe operator implementation
 * Phase 1: Basic piping functionality
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { RexxInterpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('Pipe Operator (|>)', () => {
  let interpreter;
  let mockAddressSender;

  beforeEach(() => {
    mockAddressSender = {
      send: jest.fn().mockResolvedValue({}),
    };
    interpreter = new RexxInterpreter(mockAddressSender);
  });

  describe('Basic piping', () => {
    it('should pipe string to UPPER function', async () => {
      const script = `
        LET result = "hello" |> UPPER
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('result')).toBe('HELLO');
    });

    it('should pipe string to LOWER function', async () => {
      const script = `
        LET result = "WORLD" |> LOWER
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('result')).toBe('world');
    });

    it('should pipe string to LENGTH function', async () => {
      const script = `
        LET result = "hello" |> LENGTH
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('result')).toBe(5);
    });

    it('should pipe variable to function', async () => {
      const script = `
        LET text = "test"
        LET result = text |> UPPER
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('result')).toBe('TEST');
    });
  });

  describe('Multi-stage piping', () => {
    it('should chain multiple pipe operations', async () => {
      const script = `
        LET result = "hello world" |> UPPER |> LENGTH
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('result')).toBe(11);
    });

    it('should pipe through TRIM then UPPER', async () => {
      const script = `
        LET result = "  hello  " |> TRIM |> UPPER
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('result')).toBe('HELLO');
    });

    it('should pipe through three functions', async () => {
      const script = `
        LET result = "  test  " |> TRIM |> UPPER |> LENGTH
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('result')).toBe(4);
    });
  });

  describe('Piping with function arguments', () => {
    it('should pipe to function with additional arguments', async () => {
      const script = `
        LET result = "hello,world,test" |> SPLIT(",")
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      const result = interpreter.getVariable('result');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(result[0]).toBe('hello');
      expect(result[1]).toBe('world');
      expect(result[2]).toBe('test');
    });

    it('should pipe array to ARRAY_LENGTH', async () => {
      const script = `
        LET result = "a,b,c" |> SPLIT(",") |> ARRAY_LENGTH
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('result')).toBe(3);
    });

    it('should pipe to SUBSTR with position and length', async () => {
      const script = `
        LET result = "Hello World" |> SUBSTR(7, 5)
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('result')).toBe('World');
    });
  });

  describe('Complex piping scenarios', () => {
    it('should pipe through transformation chain', async () => {
      const script = `
        LET text = "  apple,banana,cherry  "
        LET result = text |> TRIM |> SPLIT(",") |> ARRAY_LENGTH
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('result')).toBe(3);
    });

    it('should work with mathematical operations before piping', async () => {
      const script = `
        LET num = 5 + 3
        LET result = num |> ABS
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('result')).toBe(8);
    });

    it('should allow piping expression results', async () => {
      const script = `
        LET result = (2 + 3) * 2 |> ABS
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('result')).toBe(10);
    });
  });

  describe('Edge cases', () => {
    it('should handle piping with spaces around operator', async () => {
      const script = `
        LET result = "test"  |>  UPPER
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('result')).toBe('TEST');
    });

    it('should preserve operator precedence', async () => {
      const script = `
        LET result = 5 + 3 |> ABS
      `;

      const commands = parse(script);
      await interpreter.run(commands);

      expect(interpreter.getVariable('result')).toBe(8);
    });
  });
});
