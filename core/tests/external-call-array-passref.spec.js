/**
 * External CALL array pass-by-reference/value smoke tests
 */

const { RexxInterpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');
const path = require('path');
const fs = require('fs');

describe('External CALL array pass-by semantics', () => {
  let interpreter;
  let consoleSpy;
  let tempDir;
  let childPath;

  beforeEach(() => {
    const mockRpc = { send: jest.fn().mockResolvedValue('mock response') };
    interpreter = new RexxInterpreter(mockRpc);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    tempDir = path.join(__dirname, 'temp-external-scripts-array');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    childPath = path.join(tempDir, 'array-mutator.rexx');
  });

  afterEach(() => {
    if (consoleSpy) consoleSpy.mockRestore();
    try {
      if (fs.existsSync(childPath)) fs.unlinkSync(childPath);
      if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
    } catch (_) {
      // ignore
    }
  });

  const writeChild = () => {
    const childScript = [
      'PARSE ARG a',
      'SAY "Child before: " || ARRAY_GET(a, 1)',
      'LET a = ARRAY_SET(a, 1, "MUTATED_ARRAY")',
      'SAY "Child after: " || ARRAY_GET(a, 1)'
    ].join('\n');
    fs.writeFileSync(childPath, childScript);
  };

  test('pass-by-reference without COPY', async () => {
    writeChild();
    const script = `
LET arr = ["original", "second"]
SAY "Parent before: " || ARRAY_GET(arr, 1)
CALL "./tests/temp-external-scripts-array/array-mutator.rexx" arr
SAY "Parent after: " || ARRAY_GET(arr, 1)
`;
    await interpreter.run(parse(script));
    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toEqual(
      'Parent before: original\n' +
      'Child before: original\n' +
      'Child after: MUTATED_ARRAY\n' +
      'Parent after: MUTATED_ARRAY'
    );
  });

  test('pass-by-value with COPY', async () => {
    writeChild();
    const script = `
LET arr = ["original", "second"]
SAY "Parent before: " || ARRAY_GET(arr, 1)
CALL "./tests/temp-external-scripts-array/array-mutator.rexx" COPY(arr)
SAY "Parent after: " || ARRAY_GET(arr, 1)
`;
    await interpreter.run(parse(script));
    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toEqual(
      'Parent before: original\n' +
      'Child before: original\n' +
      'Child after: MUTATED_ARRAY\n' +
      'Parent after: original'
    );
  });
});

