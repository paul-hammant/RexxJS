/**
 * Tests for sed function parameter requirements
 */

describe('sed Function Parameter Requirements', () => {
  let interpreter;
  let parse;

  beforeEach(async () => {
    // Use dynamic import for ESM module
    const modules = await import('../../../core/src/interpreter.js');
    const InterpreterClass = modules.Interpreter || modules.default;
    
    const parserModule = await import('../../../core/src/parser.js');
    parse = parserModule.parse || parserModule.default;
    
    interpreter = new InterpreterClass();
    
    // Load sed functions
    const sedFunctions = await import('./src/sed-functions.js');
    if (sedFunctions.SED_FUNCTIONS_MAIN) {
      const funcs = sedFunctions.SED_FUNCTIONS_MAIN();
      Object.assign(interpreter.operations, funcs);
    }
  });

  test('SED without parameters should throw clear error', async () => {
    const script = `result = SED`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('SED function requires parameters');
  });

  test('SED_SUBSTITUTE without parameters should throw clear error', async () => {
    const script = `result = SED_SUBSTITUTE`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('SED_SUBSTITUTE function requires parameters');
  });

  test('SED_DELETE without parameters should throw clear error', async () => {
    const script = `result = SED_DELETE`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('SED_DELETE function requires parameters');
  });

  test('SED_INSERT without parameters should throw clear error', async () => {
    const script = `result = SED_INSERT`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('SED_INSERT function requires parameters');
  });

  test('SED_APPEND without parameters should throw clear error', async () => {
    const script = `result = SED_APPEND`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('SED_APPEND function requires parameters');
  });

  test('SED_PRINT without parameters should throw clear error', async () => {
    const script = `result = SED_PRINT`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('SED_PRINT function requires parameters');
  });

  test('SED_TRANSLATE without parameters should throw clear error', async () => {
    const script = `result = SED_TRANSLATE`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('SED_TRANSLATE function requires parameters');
  });
});