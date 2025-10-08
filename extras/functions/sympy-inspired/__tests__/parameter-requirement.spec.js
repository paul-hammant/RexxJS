/**
 * Tests for sympy function parameter requirements
 */

describe('sympy Function Parameter Requirements', () => {
  let interpreter;
  let parse;

  beforeEach(async () => {
    // Use dynamic import for ESM module
    const modules = await import('../../../core/src/interpreter.js');
    const InterpreterClass = modules.Interpreter || modules.default;
    
    const parserModule = await import('../../../core/src/parser.js');
    parse = parserModule.parse || parserModule.default;
    
    interpreter = new InterpreterClass();
    
    // Load sympy functions
    const sympyFunctions = await import('./src/sympy-functions.js');
    if (sympyFunctions.SYMPY_FUNCTIONS_MAIN) {
      const funcs = sympyFunctions.SYMPY_FUNCTIONS_MAIN();
      Object.assign(interpreter.operations, funcs);
    }
  });

  test('SYMPY_SIMPLIFY without parameters should throw clear error', async () => {
    const script = `result = SYMPY_SIMPLIFY`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('SYMPY_SIMPLIFY function requires parameters');
  });

  test('SYMPY_EXPAND without parameters should throw clear error', async () => {
    const script = `result = SYMPY_EXPAND`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('SYMPY_EXPAND function requires parameters');
  });

  test('SYMPY_FACTOR without parameters should throw clear error', async () => {
    const script = `result = SYMPY_FACTOR`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('SYMPY_FACTOR function requires parameters');
  });

  test('SYMPY_SOLVE without parameters should throw clear error', async () => {
    const script = `result = SYMPY_SOLVE`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('SYMPY_SOLVE function requires parameters');
  });

  test('SYMPY_DIFF without parameters should throw clear error', async () => {
    const script = `result = SYMPY_DIFF`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('SYMPY_DIFF function requires parameters');
  });

  test('SYMPY_INTEGRATE without parameters should throw clear error', async () => {
    const script = `result = SYMPY_INTEGRATE`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('SYMPY_INTEGRATE function requires parameters');
  });

  test('SYMPY_LIMIT without parameters should throw clear error', async () => {
    const script = `result = SYMPY_LIMIT`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('SYMPY_LIMIT function requires parameters');
  });

  test('SYMPY_MATRIX without parameters should throw clear error', async () => {
    const script = `result = SYMPY_MATRIX`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('SYMPY_MATRIX function requires parameters');
  });
});