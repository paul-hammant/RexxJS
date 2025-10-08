/**
 * Tests for numpy function parameter requirements
 */

describe('numpy Function Parameter Requirements', () => {
  let interpreter;
  let parse;

  beforeEach(async () => {
    // Use dynamic import for ESM module
    const modules = await import('../../../core/src/interpreter.js');
    const InterpreterClass = modules.Interpreter || modules.default;
    
    const parserModule = await import('../../../core/src/parser.js');
    parse = parserModule.parse || parserModule.default;
    
    interpreter = new InterpreterClass();
    
    // Load numpy functions
    const numpyFunctions = await import('./numpy.js');
    if (numpyFunctions.NUMPY_FUNCTIONS_MAIN) {
      const funcs = numpyFunctions.NUMPY_FUNCTIONS_MAIN();
      Object.assign(interpreter.operations, funcs);
    }
  });

  test('NUMPY_ARRAY without parameters should throw clear error', async () => {
    const script = `result = NUMPY_ARRAY`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('NUMPY_ARRAY function requires parameters');
  });

  test('NUMPY_ZEROS without parameters should throw clear error', async () => {
    const script = `result = NUMPY_ZEROS`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('NUMPY_ZEROS function requires parameters');
  });

  test('NUMPY_ONES without parameters should throw clear error', async () => {
    const script = `result = NUMPY_ONES`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('NUMPY_ONES function requires parameters');
  });

  test('NUMPY_ARANGE without parameters should throw clear error', async () => {
    const script = `result = NUMPY_ARANGE`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('NUMPY_ARANGE function requires parameters');
  });

  test('NUMPY_LINSPACE without parameters should throw clear error', async () => {
    const script = `result = NUMPY_LINSPACE`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('NUMPY_LINSPACE function requires parameters');
  });

  test('NUMPY_DOT without parameters should throw clear error', async () => {
    const script = `result = NUMPY_DOT`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('NUMPY_DOT function requires parameters');
  });

  test('NUMPY_MATMUL without parameters should throw clear error', async () => {
    const script = `result = NUMPY_MATMUL`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('NUMPY_MATMUL function requires parameters');
  });

  test('NUMPY_TRANSPOSE without parameters should throw clear error', async () => {
    const script = `result = NUMPY_TRANSPOSE`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('NUMPY_TRANSPOSE function requires parameters');
  });

  test('NUMPY_RESHAPE without parameters should throw clear error', async () => {
    const script = `result = NUMPY_RESHAPE`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('NUMPY_RESHAPE function requires parameters');
  });

  test('NUMPY_SUM without parameters should throw clear error', async () => {
    const script = `result = NUMPY_SUM`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('NUMPY_SUM function requires parameters');
  });

  test('NUMPY_MEAN without parameters should throw clear error', async () => {
    const script = `result = NUMPY_MEAN`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('NUMPY_MEAN function requires parameters');
  });

  test('NUMPY_STD without parameters should throw clear error', async () => {
    const script = `result = NUMPY_STD`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('NUMPY_STD function requires parameters');
  });
});