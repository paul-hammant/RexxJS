/**
 * Tests for R math-stats function parameter requirements
 */

describe('R math-stats Function Parameter Requirements', () => {
  let interpreter;
  let parse;

  beforeEach(async () => {
    // Use dynamic import for ESM module
    const modules = await import('../../../../core/src/interpreter.js');
    const InterpreterClass = modules.Interpreter || modules.default;
    
    const parserModule = await import('../../../../core/src/parser.js');
    parse = parserModule.parse || parserModule.default;
    
    interpreter = new InterpreterClass();
    
    // Load R summary functions
    const rFunctions = await import('./src/r-summary-functions.js');
    if (rFunctions.R_SUMMARY_FUNCTIONS_MAIN) {
      const funcs = rFunctions.R_SUMMARY_FUNCTIONS_MAIN();
      Object.assign(interpreter.operations, funcs);
    }
  });

  test('R_MEAN without parameters should throw clear error', async () => {
    const script = `result = R_MEAN`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('R_MEAN function requires parameters');
  });

  test('R_MEDIAN without parameters should throw clear error', async () => {
    const script = `result = R_MEDIAN`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('R_MEDIAN function requires parameters');
  });

  test('R_SD without parameters should throw clear error', async () => {
    const script = `result = R_SD`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('R_SD function requires parameters');
  });

  test('R_VAR without parameters should throw clear error', async () => {
    const script = `result = R_VAR`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('R_VAR function requires parameters');
  });

  test('R_QUANTILE without parameters should throw clear error', async () => {
    const script = `result = R_QUANTILE`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('R_QUANTILE function requires parameters');
  });

  test('R_SUMMARY without parameters should throw clear error', async () => {
    const script = `result = R_SUMMARY`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('R_SUMMARY function requires parameters');
  });

  test('R_IQR without parameters should throw clear error', async () => {
    const script = `result = R_IQR`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('R_IQR function requires parameters');
  });

  test('R_MAD without parameters should throw clear error', async () => {
    const script = `result = R_MAD`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('R_MAD function requires parameters');
  });
});