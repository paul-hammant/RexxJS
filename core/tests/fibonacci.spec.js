/**
 * Fibonacci Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('Rexx Fibonacci Test', () => {
  it('should calculate the 10th Fibonacci number correctly', async () => {
    const script = `
      LET n = 10
      LET a = 0
      LET b = 1
      if n = 0 THEN
        LET fib_10 = a
      ELSE
        DO i = 2 TO n
          LET c = a + b
          LET a = b
          LET b = c
        END
        LET fib_10 = b
      ENDIF
    `;

    const commands = parse(script);
    const interpreter = new Interpreter();
    await interpreter.run(commands);

    const result = interpreter.getVariable('fib_10');
    expect(result).toBe(55);
  });
});
