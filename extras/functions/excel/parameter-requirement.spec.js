/**
 * Tests for Excel function parameter requirements
 */

describe('Excel Function Parameter Requirements', () => {
  let interpreter;
  let parse;

  beforeEach(() => {
    // Use require for CommonJS module
    const { Interpreter } = require('../../../core/src/interpreter.js');
    const { parse: parseFunc } = require('../../../core/src/parser.js');
    
    parse = parseFunc;
    interpreter = new Interpreter();
    
    // Load Excel functions
    const excelFunctions = require('./src/excel-functions.js');
    // Remove metadata functions and only add actual Excel functions
    const actualFunctions = { ...excelFunctions };
    delete actualFunctions.EXCEL_FUNCTIONS_MAIN;
    Object.assign(interpreter.operations, actualFunctions);
  });

  test('VLOOKUP without parameters should throw clear error', async () => {
    const script = `result = VLOOKUP()`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('VLOOKUP function requires parameters');
  });

  test('ROUND without parameters should work (no metadata set)', async () => {
    // ROUND doesn't have requiresParameters metadata, so it will execute and return default value
    const script = `result = ROUND`;
    
    await expect(interpreter.run(parse(script))).resolves.not.toThrow();
  });

  test('SUM function not available in Excel library', async () => {
    const script = `result = SUM`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('Function SUM is not available');
  });

  test('IF function not available in Excel library', async () => {
    const script = `result = IF`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('Function IF is not available');
  });

  test('TODAY without parameters should work (parameterless function)', async () => {
    const script = `result = TODAY\nSAY result`;
    
    // TODAY should work without parameters
    await expect(interpreter.run(parse(script))).resolves.not.toThrow();
  });

  test('EXCEL_NOW without parameters should work (parameterless function)', async () => {
    const script = `result = EXCEL_NOW\nSAY result`;
    
    // EXCEL_NOW should work without parameters
    await expect(interpreter.run(parse(script))).resolves.not.toThrow();
  });

  test('CONCATENATE without parameters should work (no metadata set)', async () => {
    // CONCATENATE doesn't have requiresParameters metadata, so it will execute and return default value
    const script = `result = CONCATENATE`;
    
    await expect(interpreter.run(parse(script))).resolves.not.toThrow();
  });
});