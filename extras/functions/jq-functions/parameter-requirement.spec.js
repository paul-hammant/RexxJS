/**
 * Tests for jq function parameter requirements
 */

describe('jq Function Parameter Requirements', () => {
  let interpreter;
  let parse;

  beforeEach(async () => {
    // Use dynamic import for ESM module
    const modules = await import('../../../core/src/interpreter.js');
    const InterpreterClass = modules.Interpreter || modules.default;
    
    const parserModule = await import('../../../core/src/parser.js');
    parse = parserModule.parse || parserModule.default;
    
    interpreter = new InterpreterClass();
    
    // Load jq functions
    const jqFunctions = await import('./src/jq-functions.js');
    if (jqFunctions.JQ_FUNCTIONS_MAIN) {
      const funcs = jqFunctions.JQ_FUNCTIONS_MAIN();
      Object.assign(interpreter.operations, funcs);
    }
  });

  test('JQ_QUERY without parameters should throw clear error', async () => {
    const script = `result = JQ_QUERY`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('JQ_QUERY function requires parameters');
  });

  test('JQ_RAW without parameters should throw clear error', async () => {
    const script = `result = JQ_RAW`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('JQ_RAW function requires parameters');
  });

  test('JQ_KEYS without parameters should throw clear error', async () => {
    const script = `result = JQ_KEYS`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('JQ_KEYS function requires parameters');
  });

  test('JQ_VALUES without parameters should throw clear error', async () => {
    const script = `result = JQ_VALUES`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('JQ_VALUES function requires parameters');
  });

  test('JQ_LENGTH without parameters should throw clear error', async () => {
    const script = `result = JQ_LENGTH`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('JQ_LENGTH function requires parameters');
  });

  test('JQ_TYPE without parameters should throw clear error', async () => {
    const script = `result = JQ_TYPE`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('JQ_TYPE function requires parameters');
  });

  test('JQ_MAP without parameters should throw clear error', async () => {
    const script = `result = JQ_MAP`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('JQ_MAP function requires parameters');
  });

  test('JQ_SELECT without parameters should throw clear error', async () => {
    const script = `result = JQ_SELECT`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('JQ_SELECT function requires parameters');
  });
});