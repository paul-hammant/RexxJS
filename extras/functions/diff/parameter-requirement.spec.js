/**
 * Tests for diff function parameter requirements
 */

describe('diff Function Parameter Requirements', () => {
  let interpreter;
  let parse;

  beforeEach(async () => {
    // Use dynamic import for ESM module
    const modules = await import('../../../core/src/interpreter.js');
    const InterpreterClass = modules.Interpreter || modules.default;
    
    const parserModule = await import('../../../core/src/parser.js');
    parse = parserModule.parse || parserModule.default;
    
    interpreter = new InterpreterClass();
    
    // Load diff functions
    const diffFunctions = await import('./src/diff-functions.js');
    if (diffFunctions.DIFF_FUNCTIONS_MAIN) {
      const funcs = diffFunctions.DIFF_FUNCTIONS_MAIN();
      Object.assign(interpreter.operations, funcs);
    }
  });

  test('DIFF without parameters should throw clear error', async () => {
    const script = `result = DIFF`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('DIFF function requires parameters');
  });

  test('DIFF_LINES without parameters should throw clear error', async () => {
    const script = `result = DIFF_LINES`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('DIFF_LINES function requires parameters');
  });

  test('DIFF_WORDS without parameters should throw clear error', async () => {
    const script = `result = DIFF_WORDS`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('DIFF_WORDS function requires parameters');
  });

  test('DIFF_CHARS without parameters should throw clear error', async () => {
    const script = `result = DIFF_CHARS`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('DIFF_CHARS function requires parameters');
  });

  test('DIFF_UNIFIED without parameters should throw clear error', async () => {
    const script = `result = DIFF_UNIFIED`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('DIFF_UNIFIED function requires parameters');
  });

  test('DIFF_PATCH without parameters should throw clear error', async () => {
    const script = `result = DIFF_PATCH`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('DIFF_PATCH function requires parameters');
  });

  test('DIFF_APPLY without parameters should throw clear error', async () => {
    const script = `result = DIFF_APPLY`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('DIFF_APPLY function requires parameters');
  });
});