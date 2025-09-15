/**
 * INTERPRET CALL Dynamic Subroutine Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { RexxInterpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('INTERPRET CALL Dynamic Subroutine Calls', () => {
  let interpreter;
  let mockRpc;

  beforeEach(() => {
    mockRpc = {
      send: jest.fn().mockResolvedValue('mock response')
    };
    interpreter = new RexxInterpreter(mockRpc);
  });

  test('INTERPRET CALL now works', async () => {
    // Inline REXX script that tests INTERPRET CALL functionality
    const rexxScript = `
      TestSubroutine:
        SAY "TestSubroutine was executed"
        LET call_counter = call_counter + 1
      RETURN
      
      LET call_counter = 0

      -- call it once
      CALL TestSubroutine

      -- call it a second time      
      LET subname = "TestSubroutine"
      INTERPRET "CALL " || subname
    `;

    // Parse and execute the REXX script
      await interpreter.run(parse(rexxScript));

    expect(interpreter.getVariable('call_counter')).toBe(2);
  });

  test('will fail - CALL (variable) syntax not yet supported', async () => {
    // Test modern REXX syntax: CALL (variable) 
    const rexxScript = `
      TestSubroutine:
        SAY "TestSubroutine was executed via CALL (variable)"
        LET call_counter = call_counter + 1
      RETURN
      
      LET call_counter = 0

      -- call it once directly
      CALL TestSubroutine

      -- call it a second time using modern REXX syntax
      LET subname = "TestSubroutine"
      CALL (subname)
    `;

    // Parse and execute the REXX script
    await interpreter.run(parse(rexxScript));

    expect(interpreter.getVariable('call_counter')).toBe(2);
  });

});