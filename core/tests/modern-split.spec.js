const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('SPLIT vs MODERN_SPLIT', () => {
  it('should demonstrate SPLIT behavior with multiple spaces', async () => {
    const script = `
      LET text = "hello   world"
      LET parts = SPLIT string=text separator=" "
    `;
    const commands = parse(script);
    const interpreter = new Interpreter();
    await interpreter.run(commands);
    const parts = interpreter.getVariable('parts');
    expect(parts).toEqual(['hello', '', '', 'world']);
  });

  it('should split a string with multiple spaces using MODERN_SPLIT', async () => {
    const script = `
      LET text = "hello   world"
      LET parts = MODERN_SPLIT string=text separator=" "
    `;
    const commands = parse(script);
    const interpreter = new Interpreter();
    await interpreter.run(commands);
    const parts = interpreter.getVariable('parts');
    expect(parts).toEqual(['hello', 'world']);
  });

  it('should split a string with a different separator using MODERN_SPLIT', async () => {
    const script = `
      LET text = "a,,b,c"
      LET parts = MODERN_SPLIT string=text separator=","
    `;
    const commands = parse(script);
    const interpreter = new Interpreter();
    await interpreter.run(commands);
    const parts = interpreter.getVariable('parts');
    expect(parts).toEqual(['a', 'b', 'c']);
  });

  it('should handle splitting with an empty separator with MODERN_SPLIT', async () => {
    const script = `
      LET text = "hello"
      LET parts = MODERN_SPLIT string=text separator=""
    `;
    const commands = parse(script);
    const interpreter = new Interpreter();
    await interpreter.run(commands);
    const parts = interpreter.getVariable('parts');
    expect(parts).toEqual(['h', 'e', 'l', 'l', 'o']);
  });

  it('should split text with newlines using MODERN_SPLIT', async () => {
    const script = `
      LET multiline = "First line\\nSecond line\\nThird line"
      LET lines = MODERN_SPLIT string=multiline separator="\\n"
    `;
    const commands = parse(script);
    const interpreter = new Interpreter();
    await interpreter.run(commands);
    const lines = interpreter.getVariable('lines');
    expect(lines).toEqual(['First line', 'Second line', 'Third line']);
  });

  it('should access first element of MODERN_SPLIT result with bracket notation', async () => {
    const script = `
      LET text = "apple,banana,cherry"
      LET partz = MODERN_SPLIT string=text separator=","
      LET first_item = partz[0]
    `;
    const commands = parse(script);
    const interpreter = new Interpreter();
    await interpreter.run(commands);
    const firstItem = interpreter.getVariable('first_item');
    expect(firstItem).toBe('apple');
  });

  it('should demonstrate the array access issue with newline-split content', async () => {
    const script = `
      LET content = "MIT License\\nCopyright notice\\nPermission text"
      LET lines = MODERN_SPLIT string=content separator="\\n"
      LET first_line = lines[0]
      SAY "First line type:" TYPEOF(first_line)
      SAY "First line value:" first_line
    `;
    const commands = parse(script);
    const interpreter = new Interpreter();
    const result = await interpreter.run(commands);

    // Check what we actually get
    const lines = interpreter.getVariable('lines');
    const firstLine = interpreter.getVariable('first_line');

    console.log('MODERN_SPLIT result:', lines);
    console.log('Array access result:', firstLine);
    console.log('Type of first_line:', typeof firstLine);

    // This test should pass if array access works correctly
    expect(firstLine).toBe('MIT License');
  });

  it('should test the exact scenario from the dogfood test', async () => {
    const script = `
      LET license_content = "MIT License\\n\\nCopyright (c) 2025 Paul Hammant"
      LET license_lines = MODERN_SPLIT string=license_content separator="\\n"
      LET first_line = license_lines[0]
      LET first_line = STRIP(first_line)
    `;
    const commands = parse(script);
    const interpreter = new Interpreter();
    await interpreter.run(commands);

    const licenseLines = interpreter.getVariable('license_lines');
    const firstLine = interpreter.getVariable('first_line');

    console.log('License lines array:', licenseLines);
    console.log('First line result:', firstLine);
    console.log('First line type:', typeof firstLine);

    // This should work if the canonical approach is correct
    expect(Array.isArray(licenseLines)).toBe(true);
    expect(firstLine).toBe('MIT License');
  });
});
