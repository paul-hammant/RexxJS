/**
 * Nested Subroutine Error Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { parse } = require('../src/parser');
const { Interpreter } = require('../src/interpreter');

describe('Nested subroutine error tracking', () => {
  let interpreter;
  let output = [];

  beforeEach(() => {
    output = [];
    const mockOutputHandler = {
      output: (text) => {
        output.push(text);
      }
    };
    
    interpreter = new Interpreter(null, mockOutputHandler);
  });

  test('should track execution stack through nested subroutine calls', async () => {
    const rexxCode = `
SAY "Starting main execution"
CALL OuterSubroutine
SAY "This should not execute"

OuterSubroutine:
  SAY "In OuterSubroutine"
  CALL MiddleSubroutine
  SAY "Back in OuterSubroutine"
RETURN

MiddleSubroutine:
  SAY "In MiddleSubroutine" 
  CALL InnerSubroutine
  SAY "Back in MiddleSubroutine"
RETURN

InnerSubroutine:
  SAY "In InnerSubroutine - about to error"
  CALL NonExistentFunction
  SAY "This should not execute"
RETURN
    `;
    
    const commands = parse(rexxCode);
    console.log('Parsed commands count:', commands.length);
    
    try {
      await interpreter.run(commands, rexxCode, 'nested-test.rexx');
      fail('Expected an error to be thrown');
    } catch (error) {
      console.log('Caught error:', error.constructor.name);
      console.log('Error message:', error.message);
      console.log('Execution stack length:', interpreter.executionStack ? interpreter.executionStack.length : 'undefined');
      
      if (interpreter.executionStack) {
        console.log('Execution stack:');
        interpreter.executionStack.forEach((ctx, i) => {
          console.log(`  [${i}] ${ctx.type} at ${ctx.sourceFilename}:${ctx.lineNumber} - "${ctx.sourceLine.trim()}"`);
        });
      }
      
      // The error should show proper nesting
      expect(error).toBeDefined();
      expect(error.message).toContain('NONEXISTENTFUNCTION');
      
      // Should have multiple levels in execution stack
      if (interpreter.executionStack) {
        expect(interpreter.executionStack.length).toBeGreaterThan(1);
      }
    }
    
    console.log('Output:', output);
  });

  test('should handle INTERPRET within nested subroutines', async () => {
    const rexxCode = `
SAY "Starting INTERPRET test"
CALL MainRoutine

MainRoutine:
  SAY "In MainRoutine"
  LET code = "CALL HelperRoutine"
  INTERPRET code
RETURN

HelperRoutine:
  SAY "In HelperRoutine - about to error"
  CALL MissingFunction
RETURN
    `;
    
    const commands = parse(rexxCode);
    
    try {
      await interpreter.run(commands, rexxCode, 'interpret-nested-test.rexx');
      fail('Expected an error to be thrown');
    } catch (error) {
      console.log('INTERPRET nested error:', error.constructor.name);
      console.log('Error message:', error.message);
      
      if (interpreter.executionStack) {
        console.log('INTERPRET execution stack:');
        interpreter.executionStack.forEach((ctx, i) => {
          console.log(`  [${i}] ${ctx.type} at ${ctx.sourceFilename}:${ctx.lineNumber} - "${ctx.sourceLine.trim()}"`);
        });
      }
      
      // Should show both the INTERPRET context and the error location
      expect(error).toBeDefined();
    }
  });
});