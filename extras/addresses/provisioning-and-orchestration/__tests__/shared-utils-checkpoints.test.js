const {
  parseKeyValueString,
  parseCheckpointOutput,
  parseEnhancedCheckpointOutput,
  wrapScriptWithCheckpoints,
  formatStatus,
} = require('../shared-utils');

describe('shared-utils checkpoint helpers', () => {
  test('parseKeyValueString parses comma-separated key=value pairs', () => {
    const parsed = parseKeyValueString('a=1,b=test,c=42');
    expect(parsed.a).toBe('1');
    expect(parsed.b).toBe('test');
    expect(parsed.c).toBe('42');
  });

  test('parseCheckpointOutput returns split lines', () => {
    const output = "line1\nline2\nline3";
    const lines = parseCheckpointOutput(output);
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('line1');
    expect(lines[1]).toBe('line2');
    expect(lines[2]).toBe('line3');
  });

  test('parseEnhancedCheckpointOutput returns split lines', () => {
    const output = "line1\nline2\nline3";
    const lines = parseEnhancedCheckpointOutput(output);
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('line1');
    expect(lines[1]).toBe('line2');
    expect(lines[2]).toBe('line3');
  });

  test('wrapScriptWithCheckpoints returns script unchanged', () => {
    const script = "SAY 'Hello'";
    const wrapped = wrapScriptWithCheckpoints(script);
    expect(wrapped).toBe(script);
  });

  test('formatStatus formats consistently', () => {
    const txt = formatStatus('podman', 2, 10, 'moderate');
    expect(txt).toBe('podman | containers: 2/10 | security: moderate');
  });
});

