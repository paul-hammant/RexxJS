/**
 * External CALL with one arg - verify PARSE ARG binding and SAY output
 */

const { RexxInterpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');
const path = require('path');
const fs = require('fs');

describe('External CALL with one arg - PARSE ARG binding', () => {
  let interpreter;
  let consoleSpy;
  let tempDir;
  let childPath;

  beforeEach(() => {
    const mockRpc = { send: jest.fn().mockResolvedValue('mock response') };
    interpreter = new RexxInterpreter(mockRpc);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    tempDir = path.join(__dirname, 'temp-external-scripts-onearg');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    childPath = path.join(tempDir, 'one-arg-child.rexx');
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

  test('binds first ARG and prints first element', async () => {
    // Child: prove execution, bind first arg and print first element
    const childScript = [
      'SAY "Hello from child script"',
      'PARSE ARG a',
      'SAY "Child first element: " || ARRAY_GET(a, 1)'
    ].join('\n');
    fs.writeFileSync(childPath, childScript);

    const mainScript = `
LET arr = ["first", "second"]
SAY "Before external call"
CALL "./tests/temp-external-scripts-onearg/one-arg-child.rexx" arr
SAY "After external call"
`;

    await interpreter.run(parse(mainScript));

    const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');
    expect(output).toEqual('Before external call\n' +
      'Hello from child script\n' +
      'Child first element: first\n' +
      'After external call');
  });
});
