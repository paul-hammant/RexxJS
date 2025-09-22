/**
 * EXIT statement handling tests
 * Verifies proper termination behavior, exit codes, and exception handling
 */

const { TestRexxInterpreter } = require('../src/test-interpreter');
const { parse } = require('../src/parser');

describe('EXIT statement handling', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new TestRexxInterpreter({}, {}, {});
  });

  const run = async (code) => {
    const cmds = parse(code);
    return await interpreter.run(cmds, code);
  };

  describe('Basic EXIT functionality', () => {
    test('should terminate with default exit code 0', async () => {
      const code = `
        LET x = 42
        EXIT
        LET y = 99
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(interpreter.variables.get('x')).toBe(42);
      expect(interpreter.variables.get('y')).toBeUndefined(); // Should not execute after EXIT
    });

    test('should terminate with specified exit code', async () => {
      const code = `
        LET x = 42
        EXIT 5
        LET y = 99
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(5);
      expect(interpreter.variables.get('x')).toBe(42);
      expect(interpreter.variables.get('y')).toBeUndefined();
    });

    test('should handle variable as exit code', async () => {
      const code = `
        LET errorCode = 3
        EXIT errorCode
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(3);
    });

    test('should handle expression as exit code', async () => {
      const code = `
        LET base = 2
        EXIT base * 3 + 1
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(7);
    });

    test('should convert non-numeric exit codes to 0', async () => {
      const code = `
        EXIT "invalid"
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(0);
    });
  });

  describe('EXIT in control structures', () => {
    test('should terminate from within IF statement', async () => {
      const code = `
        LET x = 5
        IF x > 3 THEN
          LET y = 10
          EXIT 2
          LET z = 20
        ENDIF
        LET w = 30
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(2);
      expect(interpreter.variables.get('x')).toBe(5);
      expect(interpreter.variables.get('y')).toBe(10);
      expect(interpreter.variables.get('z')).toBeUndefined();
      expect(interpreter.variables.get('w')).toBeUndefined();
    });

    test('should terminate from within DO loop', async () => {
      const code = `
        LET count = 0
        DO i = 1 TO 10
          LET count = count + 1
          IF i = 3 THEN
            EXIT 1
          ENDIF
        END
        LET final = count
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(1);
      expect(interpreter.variables.get('count')).toBe(3);
      expect(interpreter.variables.get('final')).toBeUndefined();
    });

    test('should terminate from within SELECT statement', async () => {
      const code = `
        LET value = 2
        SELECT
          WHEN value = 1 THEN
            LET result = "one"
          WHEN value = 2 THEN
            LET result = "two"
            EXIT 4
          OTHERWISE
            LET result = "other"
        END
        LET after = "finished"
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(4);
      expect(interpreter.variables.get('result')).toBe("two");
      expect(interpreter.variables.get('after')).toBeUndefined();
    });
  });

  describe('EXIT in subroutines', () => {
    test('should terminate entire script from subroutine', async () => {
      const code = `
        LET x = 1
        CALL TestSub
        LET y = 2
        
        TestSub:
          LET z = 3
          EXIT 8
          LET w = 4
        RETURN
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(8);
      expect(interpreter.variables.get('x')).toBe(1);
      expect(interpreter.variables.get('y')).toBeUndefined();
      expect(interpreter.variables.get('z')).toBe(3);
      expect(interpreter.variables.get('w')).toBeUndefined();
    });

    test('should terminate from nested subroutine calls', async () => {
      const code = `
        LET main = 1
        CALL Level1
        LET after = 2
        
        Level1:
          LET level1 = 10
          CALL Level2
          LET level1after = 20
        RETURN
        
        Level2:
          LET level2 = 100
          EXIT 9
          LET level2after = 200
        RETURN
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(9);
      expect(interpreter.variables.get('main')).toBe(1);
      expect(interpreter.variables.get('level1')).toBe(10);
      expect(interpreter.variables.get('level2')).toBe(100);
      expect(interpreter.variables.get('after')).toBeUndefined();
      expect(interpreter.variables.get('level1after')).toBeUndefined();
      expect(interpreter.variables.get('level2after')).toBeUndefined();
    });
  });

  describe('EXIT exception mechanism', () => {
    test('should throw isExit exception that can be caught', async () => {
      const code = `
        LET x = 1
        EXIT 7
      `;

      try {
        // Directly call executeCommands to see the exception
        const cmds = parse(code);
        interpreter.sourceLines = code.split('\n');
        await interpreter.executeCommands(cmds);
        
        // Should not reach here
        fail('Expected EXIT to throw an exception');
      } catch (error) {
        expect(error.isExit).toBe(true);
        expect(error.exitCode).toBe(7);
        expect(error.message).toContain('Script terminated with EXIT 7');
      }
    });

    test('should handle EXIT exception at top level', async () => {
      const code = `
        LET before = "set"
        EXIT 42
        LET after = "not set"
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(42);
      expect(interpreter.variables.get('before')).toBe("set");
      expect(interpreter.variables.get('after')).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    test('should handle multiple EXIT statements (first one wins)', async () => {
      const code = `
        IF true THEN
          EXIT 1
        ENDIF
        EXIT 2
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(1);
    });

    test('should handle EXIT with floating point number', async () => {
      const code = `
        EXIT 3.7
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(3.7); // Preserves decimal value
    });

    test('should handle EXIT with negative number', async () => {
      const code = `
        EXIT -5
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(-5);
    });

    test('should handle EXIT with large number', async () => {
      const code = `
        EXIT 999999
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(999999);
    });

    test('should handle empty script with just EXIT', async () => {
      const code = `EXIT`;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(0);
    });
  });

  describe('EXIT vs RETURN behavior', () => {
    test('should differentiate EXIT from RETURN in main script', async () => {
      const codeExit = `
        LET x = 1
        EXIT 5
        LET y = 2
      `;

      const codeReturn = `
        LET x = 1
        RETURN 5
        LET y = 2
      `;

      const resultExit = await run(codeExit);
      const resultReturn = await run(codeReturn);

      // EXIT should terminate with exitCode
      expect(resultExit.terminated).toBe(true);
      expect(resultExit.exitCode).toBe(5);

      // RETURN in main script should also terminate but differently
      expect(resultReturn.terminated).toBe(true);
      // RETURN behavior may differ - this documents the current behavior
    });

    test('should terminate script even when called from subroutine (unlike RETURN)', async () => {
      const code = `
        LET main = 1
        CALL TestExit
        LET afterCall = 2
        
        TestExit:
          LET sub = 3
          EXIT 6
          LET afterExit = 4
        RETURN
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(6);
      expect(interpreter.variables.get('main')).toBe(1);
      expect(interpreter.variables.get('sub')).toBe(3);
      expect(interpreter.variables.get('afterCall')).toBeUndefined();
      expect(interpreter.variables.get('afterExit')).toBeUndefined();
    });
  });
});