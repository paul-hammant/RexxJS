/**
 * Classic Language Features Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('Classic Language Features', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new Interpreter();
  });

  describe('Arithmetic and String Operations', () => {
    it('should perform addition', async () => {
      const script = 'LET result = 10 + 5';
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('result')).toBe(15);
    });

    it('should perform subtraction', async () => {
      const script = 'LET result = 10 - 5';
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('result')).toBe(5);
    });

    it('should perform multiplication', async () => {
      const script = 'LET result = 10 * 5';
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('result')).toBe(50);
    });

    it('should perform division', async () => {
      const script = 'LET result = 10 / 5';
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('result')).toBe(2);
    });

    it('should perform string concatenation', async () => {
      const script = 'LET result = "hello" || " " || "world"';
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('result')).toBe('hello world');
    });
  });

  describe('Comparison Operators', () => {
    it('should handle equality', async () => {
      const script = 'IF 5 = 5 THEN\n LET result = 1\nELSE\n LET result = 0\nENDIF';
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('result')).toBe(1);
    });

    it('should handle inequality', async () => {
      const script = 'IF 5 > 10 THEN\n LET result = 0\nELSE\n LET result = 1\nENDIF';
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('result')).toBe(1);
    });

    it('should handle greater than', async () => {
      const script = 'IF 10 > 5 THEN\n LET result = 1\nELSE\n LET result = 0\nENDIF';
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('result')).toBe(1);
    });

    it('should handle less than', async () => {
      const script = 'IF 5 < 10 THEN\n LET result = 1\nELSE\n LET result = 0\nENDIF';
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('result')).toBe(1);
    });
  });

  describe('Control Flow', () => {
    it('should execute a SELECT statement correctly', async () => {
      const script = `
        LET value = "b"
        SELECT
          WHEN value = "a" THEN
            LET result = "A"
          WHEN value = "b" THEN
            LET result = "B"
          OTHERWISE
            LET result = "C"
        END
      `;
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('result')).toBe('B');
    });

    it('should execute a DO WHILE loop', async () => {
      const script = `
        LET i = 0
        DO WHILE i < 5
          LET i = i + 1
        END
      `;
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('i')).toBe(5);
    });
  });

  describe('Subroutines and Scope', () => {
    it('should call a subroutine with arguments and return a value', async () => {
      const script = `
        CALL add "5", "10"
        PULL sum
        EXIT

        add:
          LET a = ARG.1
          LET b = ARG.2
          LET result = (a * 1) + (b * 1)
          PUSH result
          RETURN
      `;
      await interpreter.run(parse(script));
      expect(Number(interpreter.getVariable('sum'))).toBe(15);
    });

    it('should demonstrate variable leakage from subroutines (documenting behavior)', async () => {
      const script = `
        CALL scope_test
        EXIT

        scope_test:
          LET local_var = "I am leaked"
          RETURN
      `;
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('local_var')).toBe('I am leaked');
    });

    it('should access global variables from within a subroutine', async () => {
      const script = `
        LET global_var = "I am global"
        CALL access_global
        PULL new_global
        EXIT

        access_global:
          LET message = global_var || " and I have been accessed"
          PUSH message
          RETURN
      `;
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('new_global')).toBe('I am global and I have been accessed');
    });
  });

  describe('Classic Algorithms', () => {
    it('should calculate factorial correctly', async () => {
      const script = `
        LET n = 5
        LET result = 1
        DO i = 1 TO n
          LET result = result * i
        END
      `;
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('result')).toBe(120);
    });
  });

  describe('Built-in Functions', () => {
    it('should use the LENGTH string function', async () => {
      const script = 'LET len = LENGTH string="hello"';
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('len')).toBe(5);
    });

    it('should use the SUBSTRING string function', async () => {
      const script = 'LET sub = SUBSTRING string="hello" start=2 length=3';
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('sub')).toBe('llo');
    });

    it('should use the MAX math function', async () => {
      const script = 'LET max_val = MAX a=10 b=20 c=5';
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('max_val')).toBe(20);
    });

    it('should use the MIN math function', async () => {
      const script = 'LET min_val = MIN a=10 b=20 c=5';
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('min_val')).toBe(5);
    });
  });
});
