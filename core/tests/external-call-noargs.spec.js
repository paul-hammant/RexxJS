/**
 * External CALL without args - SAY output propagation smoke test
 */

const { RexxInterpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');
const path = require('path');
const fs = require('fs');

describe('External CALL without args - SAY output', () => {
  let interpreter;
  let consoleSpy;
  let tempDir;
  let childPath;

  beforeEach(() => {
    const mockRpc = { send: jest.fn().mockResolvedValue('mock response') };
    interpreter = new RexxInterpreter(mockRpc);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    tempDir = path.join(__dirname, 'temp-external-scripts-noargs');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    childPath = path.join(tempDir, 'no-arg-child.rexx');
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

  test('captures SAY output from child script', async () => {
    fs.writeFileSync(childPath, 'SAY "Hello from child"');

    const mainScript = `
SAY "Before external call"
CALL "./tests/temp-external-scripts-noargs/no-arg-child.rexx"
SAY "After external call"
`;

    await interpreter.run(parse(mainScript));

    const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');
    expect(output).toContain('Before external call');
    expect(output).toContain('Hello from child');
    expect(output).toContain('After external call');
  });
});
