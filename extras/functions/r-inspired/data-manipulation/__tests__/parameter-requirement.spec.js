/**
 * Tests for R data-manipulation function parameter requirements
 */

describe('R data-manipulation Function Parameter Requirements', () => {
  let interpreter;
  let parse;

  beforeEach(async () => {
    // Use dynamic import for ESM module
    const modules = await import('../../../../core/src/interpreter.js');
    const InterpreterClass = modules.Interpreter || modules.default;
    
    const parserModule = await import('../../../../core/src/parser.js');
    parse = parserModule.parse || parserModule.default;
    
    interpreter = new InterpreterClass();
    
    // Load R set functions
    const rFunctions = await import('./src/r-set-functions.js');
    if (rFunctions.R_SET_FUNCTIONS_MAIN) {
      const funcs = rFunctions.R_SET_FUNCTIONS_MAIN();
      Object.assign(interpreter.operations, funcs);
    }
  });

  test('R_UNION without parameters should throw clear error', async () => {
    const script = `result = R_UNION`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('R_UNION function requires parameters');
  });

  test('R_INTERSECT without parameters should throw clear error', async () => {
    const script = `result = R_INTERSECT`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('R_INTERSECT function requires parameters');
  });

  test('R_SETDIFF without parameters should throw clear error', async () => {
    const script = `result = R_SETDIFF`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('R_SETDIFF function requires parameters');
  });

  test('R_SETEQUAL without parameters should throw clear error', async () => {
    const script = `result = R_SETEQUAL`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('R_SETEQUAL function requires parameters');
  });

  test('R_IS_ELEMENT without parameters should throw clear error', async () => {
    const script = `result = R_IS_ELEMENT`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('R_IS_ELEMENT function requires parameters');
  });

  test('R_UNIQUE without parameters should throw clear error', async () => {
    const script = `result = R_UNIQUE`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('R_UNIQUE function requires parameters');
  });

  test('R_DUPLICATED without parameters should throw clear error', async () => {
    const script = `result = R_DUPLICATED`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('R_DUPLICATED function requires parameters');
  });

  test('R_ANYDUP without parameters should throw clear error', async () => {
    const script = `result = R_ANYDUP`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('R_ANYDUP function requires parameters');
  });
});