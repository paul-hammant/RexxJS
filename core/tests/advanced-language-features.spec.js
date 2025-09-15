/**
 * Advanced Language Features Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('Advanced Language Features', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new Interpreter();
  });

  describe('Advanced Error Handling', () => {
    it('should handle SIGNAL ON ERROR within a subroutine', async () => {
      const script = `
        CALL error_trigger
        EXIT

        error_trigger:
          SIGNAL ON ERROR NAME ErrorHandler
          LET result = 10 / 0
          EXIT

        ErrorHandler:
          LET error_handled = "YES"
          RETURN
      `;
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('error_handled')).toBe('YES');
    });

    it('should throw a runtime error if not handled by SIGNAL ON ERROR', async () => {
      const script = 'LET result = 10 / 0';
      await expect(interpreter.run(parse(script))).rejects.toThrow('Division by zero');
    });

    // it('should handle errors in a loop', async () => {
    //   const script = `
    //     SIGNAL ON ERROR NAME LoopErrorHandler
    //     LET count = 0
    //     DO i = 1 TO 5
    //       LET count = count + 1
    //       IF i = 3 THEN
    //         LET result = 10 / 0
    //       ENDIF
    //     END
    //     EXIT

    //     LoopErrorHandler:
    //       LET error_in_loop = "YES"
    //       LET loop_counter_at_error = count
    //       RETURN
    //   `;
    //   await interpreter.run(parse(script));
    //   expect(interpreter.getVariable('error_in_loop')).toBe('YES');
    //   expect(interpreter.getVariable('loop_counter_at_error')).toBe(3);
    // });
  });

  describe('Complex Control Flow', () => {
    it('should handle deeply nested control structures', async () => {
      const script = `
        LET outer_condition = 1
        LET final_result = ""
        IF outer_condition = 1 THEN
          LET select_value = "loop"
          SELECT
            WHEN select_value = "no_loop" THEN
              LET final_result = "no loop"
            WHEN select_value = "loop" THEN
              LET i = 0
              DO WHILE i < 3
                LET final_result = final_result || i
                LET i = i + 1
              END
            OTHERWISE
              LET final_result = "other"
          END
        ELSE
          LET final_result = "outer else"
        ENDIF
      `;
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('final_result')).toBe('012');
    });
  });

  describe('Data Type Coercion', () => {
    it('should coerce numeric strings to numbers in arithmetic operations', async () => {
      const script = `
        LET s = "10"
        LET result = s + 5
      `;
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('result')).toBe(15);
    });

    it('should throw an error when using non-numeric strings in arithmetic', async () => {
      const script = 'LET result = "hello" + 5';
      await expect(interpreter.run(parse(script))).rejects.toThrow();
    });
  });

  describe('Built-in Functions Stress Tests', () => {
    it('should handle empty strings in string functions', async () => {
      const script = 'LET result = LENGTH string=""';
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('result')).toBe(0);
    });

    it('should handle large numbers in math functions', async () => {
      const script = 'LET result = MAX a=1e100 b=2e100';
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('result')).toBe(2e100);
    });

    it('should handle invalid parameter types gracefully', async () => {
      const script = 'LET result = LENGTH string=123';
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('result')).toBe(3);
    });
  });

  describe('Stateful Script Simulation', () => {
    it('should run a simple text adventure game script', async () => {
      const script = `
        LET location = "start"
        LET inventory = ""

        CALL process_command "go north"
        CALL process_command "get key"
        CALL process_command "go south"
        CALL process_command "unlock door"
        EXIT

        process_command:
          LET cmd = ARG.1
          IF cmd = "go north" THEN
            LET location = "north_room"
          ELSE
            IF cmd = "get key" THEN
              IF location = "north_room" THEN
                LET inventory = inventory || "key,"
              ENDIF
            ELSE
              IF cmd = "go south" THEN
                LET location = "start"
              ELSE
                IF cmd = "unlock door" THEN
                  IF location = "start" THEN
                    IF inventory = "key," THEN
                      LET door_unlocked = "YES"
                    ENDIF
                  ENDIF
                ENDIF
              ENDIF
            ENDIF
          ENDIF
          RETURN
      `;
      await interpreter.run(parse(script));

      expect(interpreter.getVariable('location')).toBe('start');
      expect(interpreter.getVariable('inventory')).toBe('key,');
      expect(interpreter.getVariable('door_unlocked')).toBe('YES');
    });
  });
});
