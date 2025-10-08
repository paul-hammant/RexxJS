/**
 * Tests for jq-wasm function parameter requirements
 */

describe('jq-wasm Function Parameter Requirements', () => {
  let interpreter;
  let parse;

  beforeEach(async () => {
    // Use dynamic import for ESM module
    const modules = await import('../../../core/src/interpreter.js');
    const InterpreterClass = modules.Interpreter || modules.default;
    
    const parserModule = await import('../../../core/src/parser.js');
    parse = parserModule.parse || parserModule.default;
    
    interpreter = new InterpreterClass();
    
    // Load jq-wasm functions
    const jqWasmFunctions = await import('./src/jq-wasm-functions.js');
    if (jqWasmFunctions.JQ_WASM_FUNCTIONS_MAIN) {
      const funcs = jqWasmFunctions.JQ_WASM_FUNCTIONS_MAIN();
      Object.assign(interpreter.operations, funcs);
    }
  });

  test('JQ_WASM_QUERY without parameters should throw clear error', async () => {
    const script = `result = JQ_WASM_QUERY`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('JQ_WASM_QUERY function requires parameters');
  });

  test('JQ_WASM_RAW without parameters should throw clear error', async () => {
    const script = `result = JQ_WASM_RAW`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('JQ_WASM_RAW function requires parameters');
  });

  test('JQ_WASM_KEYS without parameters should throw clear error', async () => {
    const script = `result = JQ_WASM_KEYS`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('JQ_WASM_KEYS function requires parameters');
  });

  test('JQ_WASM_VALUES without parameters should throw clear error', async () => {
    const script = `result = JQ_WASM_VALUES`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('JQ_WASM_VALUES function requires parameters');
  });

  test('JQ_WASM_LENGTH without parameters should throw clear error', async () => {
    const script = `result = JQ_WASM_LENGTH`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('JQ_WASM_LENGTH function requires parameters');
  });

  test('JQ_WASM_TYPE without parameters should throw clear error', async () => {
    const script = `result = JQ_WASM_TYPE`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('JQ_WASM_TYPE function requires parameters');
  });

  test('JQ_WASM_MAP without parameters should throw clear error', async () => {
    const script = `result = JQ_WASM_MAP`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('JQ_WASM_MAP function requires parameters');
  });

  test('JQ_WASM_SELECT without parameters should throw clear error', async () => {
    const script = `result = JQ_WASM_SELECT`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('JQ_WASM_SELECT function requires parameters');
  });
});